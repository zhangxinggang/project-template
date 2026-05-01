import path from 'path';
import type { RuntimeConfig } from './types/runtime-config';

const config: RuntimeConfig = {
  services: {
    rtmpServer: {
      start: false,
      port: 1935,
      chunk_size: 60000,
      gop_cache: true,
      ping: 60,
      ping_timeout: 30,
    },
    rtspServer: {
      start: false,
      port: 554,
    },
    tcpServer: {
      start: false,
      port: 8087,
    },
    udpServer: {
      start: false,
      port: 41234,
    },
    httpServer: {
      start: true,
      protocols: {
        http: {
          start: true,
          port: 8081,
        },
        https: {
          start: true,
          port: 8080,
        },
      },
      security: {
        secret: 'zxgNK',
        tokenExpiresIn: '8h',
        noAuthorityRoutes: ['/dynamic/*', '/mount/**', '/public/**'],
      },
      bodyparser: {
        multipart: true,
        formidable: {
          maxFileSize: 1000 * 1024 * 1024,
          uploadDir: path.join(__dirname, './uploads'),
          keepExtensions: true,
        },
      },
      routes: {
        dynamicRouteDirs: [
          {
            rootDir: path.join(__dirname, './demo/dynamicRouter'),
            rootPath: 'dynamic',
          },
        ],
        mountRouteDirs: [
          {
            rootDir: path.join(__dirname, './demo/mountRouter'),
            rootPath: 'mount',
          },
        ],
        staticDirs: [
          {
            rootDir: path.join(__dirname, './demo/static/public'),
            rootPath: 'public',
            auth: false,
          },
          {
            rootDir: path.join(__dirname, './demo/static/private'),
            rootPath: 'private',
          },
        ],
        proxyRoutes: {
          '/NKWeather': {
            target: 'http://wthrcdn.etouch.cn/weather_mini',
            pathRewrite: {
              '^/NKWeather': '',
            },
            changeOrigin: true,
            secure: false,
            auth: false,
          },
        },
      },
    },
  },
  requireAlias: {
    NK: path.join(__dirname, './services/utils'),
    NKH: path.join(__dirname, './services/httpServer/src'),
  },
  autoRunTask: {
    start: true,
    rootDirs: [path.join(__dirname, './demo/autoRunTask')],
  },
  logger: {
    start: true,
    rootDir: path.join(process.cwd(), '/logs'),
  },
  communication: {
    mailer: {
      start: true,
      defaultRecipients: ['540752013@qq.com'],
      server: 'wangyi163',
      tengxun: {
        host: 'smtp.qq.com',
        secureConnection: true,
        port: 465,
        auth: {
          user: process.env.mailer_user,
          pass: process.env.mailer_pass,
        },
      },
      wangyi163: {
        host: 'smtp.163.com',
        secureConnection: true,
        port: 465,
        auth: {
          user: process.env.mailer_user,
          pass: process.env.mailer_pass,
        },
      },
      wangyi126: {
        host: 'smtp.126.com',
        secureConnection: true,
        port: 465,
        auth: {
          user: process.env.mailer_user,
          pass: process.env.mailer_pass,
        },
      },
    },
  },
  project: {
    name: 'nk',
    favIcon: path.join(__dirname, './services/server/view/favIcon.ico'),
  },
};

export = config;
