export interface RouteDirConfig {
  rootDir: string;
  rootPath: string;
  auth?: boolean;
  ignore?: string | string[];
  ext?: string;
}

export interface HttpRouteDirConfig extends RouteDirConfig {
  index?: string | false;
}

export interface HttpProtocolConfig {
  start?: boolean;
  port?: number;
  key?: {
    path?: string;
    value?: string;
  };
  cert?: {
    path?: string;
    value?: string;
  };
}

export interface HttpSecurityConfig {
  secret: string;
  tokenExpiresIn: string;
  noAuthorityRoutes: string[];
}

export interface HttpRoutesConfig {
  dynamicRouteDirs: HttpRouteDirConfig[];
  mountRouteDirs: HttpRouteDirConfig[];
  staticDirs: HttpRouteDirConfig[];
  proxyRoutes: Record<string, string | ProxyRouteOption>;
}

export interface ProxyRouteOption {
  target: string;
  auth?: boolean;
  [key: string]: unknown;
}

export interface MailServerConfig {
  auth?: {
    user?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface MailerConfig {
  start: boolean;
  defaultRecipients: string[];
  server: string;
  [key: string]: string | boolean | string[] | MailServerConfig | undefined;
}

export interface RtmpAuthConfig {
  publish?: boolean;
  play?: boolean;
  secret?: string;
}

export interface RtmpServerConfig {
  start: boolean;
  port: number;
  chunk_size?: number;
  gop_cache?: boolean;
  ping?: number;
  ping_timeout?: number;
  auth?: RtmpAuthConfig;
  [key: string]: unknown;
}

export interface VideoCameraConfig {
  deviceName?: string;
  streamUrl?: string;
  tempLive?: boolean;
  [key: string]: unknown;
}

export interface HttpServerConfig {
  start: boolean;
  protocols: {
    http?: HttpProtocolConfig;
    https?: HttpProtocolConfig;
  };
  security: HttpSecurityConfig;
  bodyparser: HttpBodyParserConfig;
  routes: HttpRoutesConfig;
}

export interface HttpBodyParserConfig {
  multipart?: boolean;
  formidable?: {
    maxFileSize?: number;
    uploadDir?: string;
    keepExtensions?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface BasicServiceConfig {
  start: boolean;
  [key: string]: unknown;
}

export interface PortServiceConfig extends BasicServiceConfig {
  port: number;
}

export interface AutoRunTaskConfig {
  start: boolean;
  rootDirs: string[];
}

export interface LoggerConfig {
  start: boolean;
  rootDir: string;
}

export interface CommunicationConfig {
  mailer?: MailerConfig;
}

export interface ProjectConfig {
  name: string;
  favIcon: string;
}

export interface VideoConfig {
  camera?: VideoCameraConfig;
}

export type ServiceConfig =
  | BasicServiceConfig
  | PortServiceConfig
  | HttpServerConfig
  | RtmpServerConfig;

export interface RuntimeConfig {
  services: {
    rtmpServer: RtmpServerConfig;
    rtspServer: PortServiceConfig;
    tcpServer: PortServiceConfig;
    udpServer: PortServiceConfig;
    httpServer: HttpServerConfig;
    [key: string]: ServiceConfig;
  };
  requireAlias: Record<string, string>;
  autoRunTask: AutoRunTaskConfig;
  logger: LoggerConfig;
  communication: CommunicationConfig;
  project: ProjectConfig;
  video?: VideoConfig;
  httpServerPath?: string;
  [key: string]: unknown;
}
