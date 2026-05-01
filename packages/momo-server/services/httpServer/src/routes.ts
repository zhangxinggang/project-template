import fs from 'fs';
import glob from 'glob';
import { createProxyMiddleware } from 'http-proxy-middleware';
import koaConnect from 'koa-connect';
import Router from 'koa-router';
import send from 'koa-send';
import _ from 'lodash';
import methods from 'methods';
import { join, normalizeSafe, parse, toUnix } from 'upath';
import url from 'url';
import type { HttpRouteDirConfig, HttpRoutesConfig } from '../../../types/runtime-config';
import authority = require('./authority');

interface DynamicCtx {
  method: string;
  url: string;
  path: string;
  request: {
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
  };
  response: {
    body?: unknown;
  };
  throw: (status: number, error: Error) => never;
  formatSuccess: (data?: unknown, status?: number, message?: string) => void;
  formatError: (status?: unknown, message?: string) => void;
  [key: string]: unknown;
}

type Next = () => Promise<void>;
type Middleware = (ctx: DynamicCtx, next: Next) => Promise<void>;

interface AppLike {
  use: (middleware: unknown) => void;
}

type RouteHandler = (ctx: DynamicCtx, next?: Next) => Promise<void> | void;
type ControllerMethodMap = Record<string, RouteHandler | RouteHandler[]>;
type ControllerExports = Record<string, RouteHandler | RouteHandler[] | ControllerMethodMap>;

const isRouteHandlerArray = (value: unknown): value is RouteHandler[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'function');
};

type ProxyKoaContext = Parameters<ReturnType<typeof koaConnect>>[0];
type SendKoaContext = Parameters<typeof send>[0];
type SendOptions = NonNullable<Parameters<typeof send>[2]>;

interface RouteStackItem {
  methods: string[];
  regexp: RegExp;
  nkr_params?: {
    rootDir: string;
    rootPath: string;
  };
}

interface RouteLike {
  routes: () => Middleware;
  nkr_auth?: boolean;
  stack: RouteStackItem[];
  [key: string]: unknown;
}

interface RouterOptions {
  routes?: RouteLike[];
  proxyRoutes?: HttpRoutesConfig['proxyRoutes'];
  staticDirs?: HttpRouteDirConfig[];
  mountRouteDirs?: HttpRouteDirConfig[];
  dynamicRouteDirs?: HttpRouteDirConfig[];
  [key: string]: unknown;
}
const defaultStr = {
  notFound: 'Not Found!',
};
const { verifyToken } = authority;

class Routers {
  public routes: RouteLike[];
  public proxyRoutes?: HttpRoutesConfig['proxyRoutes'];
  public staticDirs?: HttpRouteDirConfig[];
  public mountRouteDirs?: HttpRouteDirConfig[];
  public dynamicRouteDirs?: HttpRouteDirConfig[];

  constructor(options?: RouterOptions) {
    const normalized = options || {};
    normalized.routes = [];
    this.routes = [];
    Object.assign(this, normalized);
  }
  formatterRootPath(item: HttpRouteDirConfig): void {
    typeof item.auth == 'undefined' && (item.auth = true);
    item.rootPath = normalizeSafe('/' + item.rootPath + '/');
    item.rootPath = item.rootPath.replace(/\/\//g, '/');
    item.rootDir = join(item.rootDir);
  }
  routeExistCheck(app: AppLike): void {
    app.use(async (ctx: DynamicCtx, next: Next) => {
      let exist = this.routes.some((item) => {
        return item.stack.some((rt: RouteStackItem) => {
          let paramMethods = rt.methods.map((item) => item.toLocaleUpperCase());
          if (paramMethods.includes(ctx.method) && rt.regexp.test(url.parse(ctx.url).pathname)) {
            if (!rt.nkr_params) {
              return true;
            } else {
              let filePath = join(
                rt.nkr_params.rootDir,
                normalizeSafe(decodeURIComponent(ctx.path).replace(rt.nkr_params.rootPath, '/')),
              );
              try {
                fs.accessSync(filePath);
                return true;
              } catch (e) {}
            }
          }
        });
      });
      if (exist) {
        await next();
      } else {
        ctx.throw(404, new Error(defaultStr.notFound));
      }
    });
  }
  routeAuthCheck(app: AppLike): void {
    this.routes.map((item) => {
      !item.nkr_auth && app.use(item.routes());
    });
    app.use(verifyToken);
    this.routes.map((item) => {
      item.nkr_auth && app.use(item.routes());
    });
  }
  loadProxyRoutes(): void {
    this.proxyRoutes = this.proxyRoutes || {};
    Object.keys(this.proxyRoutes).forEach((item) => {
      let options = this.proxyRoutes[item];
      if (typeof options == 'string') {
        options = { target: options };
      }
      let regexp = new RegExp('^' + item + '[/|?]{1}' + '|^' + item + '$');
      typeof options.auth == 'undefined' && (options.auth = true);
      let routes = () => {
        return async function (ctx: DynamicCtx, next: Next): Promise<void> {
          if (regexp.test(url.parse(ctx.url).pathname)) {
            const proxyOptions = {
              ...options,
              auth: undefined,
            };
            await koaConnect(createProxyMiddleware(item, proxyOptions))(
              ctx as unknown as ProxyKoaContext,
              next,
            );
          } else {
            await next();
          }
        };
      };
      let router: RouteLike = {
        routes: routes,
        nkr_auth: options.auth,
        stack: [
          {
            methods,
            regexp,
          },
        ],
      };
      this.routes.push(router);
    });
  }
  loadStaticRoutes(): void {
    this.staticDirs = this.staticDirs || [];
    this.staticDirs.map((item) => {
      this.formatterRootPath(item);
      let methods = ['HEAD', 'GET'];
      let routes = () => {
        let opts = Object.assign({}, item) as HttpRouteDirConfig & {
          root?: string;
        };
        opts.root = opts.rootDir;
        if (opts.index !== false) opts.index = opts.index || 'index.html';
        return async function staticServe(ctx: DynamicCtx, next: Next): Promise<void> {
          let done = false;
          if (methods.includes(ctx.method)) {
            try {
              done = await send(
                ctx as unknown as SendKoaContext,
                normalizeSafe(ctx.path.replace(opts.rootPath, '/')),
                opts as SendOptions,
              );
            } catch (err: unknown) {
              if ((err as { status?: number }).status !== 404) {
                throw err;
              }
            }
          }
          if (!done) {
            await next();
          }
        };
      };
      let router: RouteLike = {
        routes: routes,
        nkr_auth: item.auth,
        stack: [
          {
            methods: methods,
            regexp: new RegExp('^' + item.rootPath),
            nkr_params: item,
          },
        ],
      };
      this.routes.push(router);
    });
  }
  loadMountRoutes(): void {
    this.mountRouteDirs = this.mountRouteDirs || [];
    this.mountRouteDirs.map((item) => {
      this.formatterRootPath(item);
      glob.sync(join(item.rootDir, '/**/*.js'), { ignore: item.ignore }).map((file) => {
        const controllers = require(file) as ControllerExports;
        _.forOwn(controllers, (value: unknown, key: string) => {
          const prefix = join(item.rootPath, parse(file).name);
          const router = new Router();
          router['nkr_auth'] = item.auth;
          router.prefix(prefix);
          let handlers = value;
          if (_.isFunction(handlers)) handlers = [handlers];
          if (isRouteHandlerArray(handlers)) {
            router.get(key, ...handlers);
          } else if (_.isPlainObject(handlers)) {
            _.forOwn(handlers as ControllerMethodMap, (funcs: unknown, method: string) => {
              if (_.isFunction(funcs)) funcs = [funcs];
              if (!isRouteHandlerArray(funcs)) {
                return;
              }
              (
                router as unknown as Record<string, (path: string, ...args: RouteHandler[]) => void>
              )[method](key, ...funcs);
            });
          }
          router.stack.length > 0 && this.routes.push(router);
        });
      });
    });
  }
  loadDynamicRoutes(): void {
    this.dynamicRouteDirs = this.dynamicRouteDirs || [];
    this.dynamicRouteDirs.map((item) => {
      this.formatterRootPath(item);
      const router = new Router();
      router['nkr_auth'] = item.auth;
      glob.sync(join(item.rootDir, '/**/*.{m}.*js'), { ignore: item.ignore }).map((filterRoute) => {
        let routeType = (filterRoute.match(/\{(.+?)\}/g) || []).filter((type) => type != '{m}');
        if (routeType.length > 1) {
          console.error(new Error(filterRoute + ',file name error,only allowed tow "{*}" format!'));
        } else {
          !routeType[0] && (routeType[0] = '{get}');
          let method = routeType[0].replace(/\{|\}/g, '');
          let purifyRoute = normalizeSafe(
            toUnix(filterRoute)
              .replace(toUnix(item.rootDir), '/')
              .replace(/\.\{(.+?)\}|\.js/g, ''),
          );
          let combinedRoute = join(item.rootPath || '', purifyRoute, item.ext || '');
          (
            router as unknown as Record<
              string,
              (path: string, handler: (ctx: DynamicCtx) => Promise<void>) => void
            >
          )[method](combinedRoute, async (ctx: DynamicCtx) => {
            try {
              let result = await new Promise<unknown>((resolve, reject) => {
                ctx.success = resolve;
                ctx.error = reject;
                require(filterRoute)(ctx);
              });
              ctx.formatSuccess(result);
            } catch (err) {
              ctx.formatError(err);
            }
          });
        }
      });
      router.stack.length > 0 && this.routes.push(router);
    });
  }
  routeIntercept(): void {
    const router = new Router();
    router.all('*', (ctx) => {
      ctx.throw(404, new Error(defaultStr.notFound));
      // ctx.formatError([404,defaultStr.notFound])
    });
  }
  async standardResponse(ctx: DynamicCtx, next: () => Promise<void>): Promise<void> {
    const res = (ctx: DynamicCtx, data: unknown = [], status?: number, msg?: string): void => {
      let returnInfo = {
        data,
        meta: {
          status,
          msg,
        },
      };
      ctx.response.body = returnInfo;
    };
    const success = (ctx: DynamicCtx, data: unknown, status = 200, message = 'success'): void => {
      res(ctx, data, status, message);
    };
    const error = (ctx: DynamicCtx, status?: unknown, message?: string): void => {
      let eStatus = 400;
      let eMessage = null;
      const checkIsArray = (data: unknown): data is [number, string] => {
        return Object.prototype.toString.call(data) == '[object Array]';
      };
      const checkIsError = (data: unknown): data is Error => {
        return Object.prototype.toString.call(data) == '[object Error]';
      };
      const checkIsObject = (data: unknown): data is Record<string, unknown> => {
        return Object.prototype.toString.call(data) == '[object Object]';
      };
      if (checkIsArray(status)) {
        eStatus = status[0];
        eMessage = status[1];
      } else if (checkIsError(status)) {
        eMessage = status;
      } else if (checkIsObject(status)) {
        eStatus = typeof status['status'] === 'number' ? status['status'] : eStatus;
        eMessage = status['message'];
      } else {
        if (!message) {
          eMessage = status;
        } else {
          eStatus = typeof status === 'number' ? status : eStatus;
          eMessage = message || 'error';
        }
      }
      if (typeof eMessage == 'string') {
        eMessage = new Error(eMessage);
      }
      console.log(eStatus, eMessage);
      ctx.throw(eStatus, eMessage);
    };
    ctx.formatSuccess = success.bind(null, ctx);
    ctx.formatError = error.bind(null, ctx);
    await next();
  }
}

export = Routers;
