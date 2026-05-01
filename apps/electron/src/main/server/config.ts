import path from 'path';
import { getAppConfig, getAPPRootPath, getUserPath } from '../../utils';

const appConf = getAppConfig();
const { server = {} } = appConf;
const { httpPort = 8081, httpsPort, upload = {} } = server;

const config = {
  services: {
    httpServer: {
      protocols: {
        http: {
          start: true,
          port: httpPort,
        },
        https: {
          start: httpsPort ? true : false,
          port: httpsPort,
        },
      },
      bodyparser: {
        multipart: true,
        formidable: {
          maxFileSize: upload.maxFileSize,
          uploadDir: getUserPath(),
          keepExtensions: true,
        },
      },
      routes: {
        dynamicRouteDirs: [
          {
            rootDir: path.join(getAPPRootPath(), './server'),
            rootPath: 'api',
            auth: false,
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
  autoRunTask: {
    start: true,
    rootDirs: [],
  },
  logger: {
    start: true,
    rootDir: path.join(process.cwd(), '/logs'),
  },
};

export = config;
