import jwt from 'jsonwebtoken';
import minimatch from 'minimatch';
import cookies = require('./cookies');

type JwtPayload = Record<string, unknown>;
type NextFn = () => Promise<void>;

interface KoaLikeContext {
  request: {
    url: string;
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
  };
  headers: Record<string, string | string[] | undefined>;
  cookies: {
    get: (name: string) => string | undefined;
  };
  session?: {
    userInfo?: JwtPayload | string;
    [key: string]: unknown;
  };
  throw: (status: number, error: Error) => never;
}

const getToken = (payload: JwtPayload, options: jwt.SignOptions = {}): string => {
  const security = NKGlobal.config.services.httpServer.security;
  const signOptions: jwt.SignOptions = Object.assign(
    { expiresIn: security.tokenExpiresIn },
    options,
  );
  return jwt.sign(payload, security.secret, signOptions);
};

const getTempToken = (): string => {
  const security = NKGlobal.config.services.httpServer.security;
  return jwt.sign({ isTemp: true }, security.secret, { expiresIn: '60s' });
};

const verifyToken = async (ctx: KoaLikeContext, next: NextFn): Promise<void> => {
  const httpServer = NKGlobal.config.services.httpServer;
  const reqUrl = ctx.request.url;
  const security = httpServer.security;
  const noAuth = security.noAuthorityRoutes.some((item: string) => minimatch(reqUrl, item));

  if (noAuth) {
    await next();
    return;
  }

  const headerToken = ctx.headers[cookies.token];
  const tokenFromHeader = Array.isArray(headerToken) ? headerToken[0] : headerToken;
  const token =
    (ctx.request.body?.access_token as string | undefined) ||
    (ctx.request.query?.access_token as string | undefined) ||
    tokenFromHeader ||
    ctx.cookies.get(cookies.token);

  if (!token) {
    ctx.throw(403, new Error('No token provider!'));
  }

  try {
    const payload = await jwt.verify(token, security.secret);
    if (!ctx.session) {
      ctx.session = {};
    }
    if (!ctx.session.userInfo) {
      ctx.session.userInfo = payload as JwtPayload | string;
    }
    await next();
  } catch (_err) {
    ctx.throw(403, new Error('Token error!'));
  }
};

export = {
  getToken,
  getTempToken,
  verifyToken,
};
