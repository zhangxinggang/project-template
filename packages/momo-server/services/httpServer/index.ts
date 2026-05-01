import fs from 'fs';
import http from 'http';
import https from 'http2';
import Koa from 'koa';
import { koaBody } from 'koa-body';
import compress from 'koa-compress';
import favicon from 'koa-favicon';
import helmet from 'koa-helmet';
import cors from 'koa2-cors';
import zlib from 'zlib';
import type { HttpServerConfig } from '../../types/runtime-config';
import { certificate, private_pkcs1 } from './src/diffieHellman';
import Routers = require('./src/routes');

const app = new Koa();
app.env = process.env.NODE_ENV || 'production';

class HttpServer {
  private readonly config: Partial<HttpServerConfig>;

  constructor(config: Partial<HttpServerConfig>) {
    this.config = config;
  }

  start(callback?: () => void): boolean | void {
    if (!this.config.start) {
      callback?.();
      return false;
    }
    // app.context.onerror = errorHandler;
    if (NKGlobal.config.project) {
      app.use(favicon(NKGlobal.config.project.favIcon));
    }
    const routes = new Routers({ ...(this.config.routes || {}) });
    const bodyParserOptions = this.config.bodyparser || {};
    app
      .use(
        compress({
          filter: (contentType: string) => {
            return /text/i.test(contentType);
          },
          threshold: 2048,
          flush: zlib.constants.Z_SYNC_FLUSH,
        }),
      )
      .use(koaBody(bodyParserOptions))
      .use(helmet())
      .use(cors());
    app.use(routes.standardResponse);
    routes.loadProxyRoutes();
    routes.loadMountRoutes();
    routes.loadDynamicRoutes();
    routes.loadStaticRoutes();
    routes.routeExistCheck(app);
    routes.routeAuthCheck(app);
    routes.routeIntercept();
    const confHttp = this.config.protocols.http;
    const confHttps = this.config.protocols.https;
    const services: Array<Promise<void>> = [];
    if (confHttp && confHttp.start) {
      services.push(
        new Promise<void>((resolve) => {
          http.createServer(app.callback()).listen(confHttp.port, () => {
            console.info(`[httpServer] started at port ${confHttp.port}`);
            resolve();
          });
        }),
      );
    }
    if (confHttps && confHttps.start) {
      services.push(
        new Promise<void>((resolve) => {
          if (!confHttps.key) {
            confHttps.key = {};
          }
          if (!confHttps.cert) {
            confHttps.cert = {};
          }
          const options = {
            key:
              confHttps.key.value ||
              (confHttps.key.path && fs.readFileSync(confHttps.key.path)) ||
              private_pkcs1,
            cert:
              confHttps.cert.value ||
              (confHttps.cert.path && fs.readFileSync(confHttps.cert.path)) ||
              certificate,
          };
          https.createSecureServer(options, app.callback()).listen(confHttps.port, () => {
            console.info(`[httpsServer] started at port ${confHttps.port}`);
            resolve();
          });
        }),
      );
    }
    Promise.all(services).then(() => {
      console.info(`httpServer info : PID:${process.pid}  NODE_ENV : ${app.env}`);
      callback?.();
    });
  }
}

export = HttpServer;
