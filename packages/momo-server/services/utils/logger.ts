/// <reference path="../../types/global.d.ts" />
import { configure, getLogger } from 'log4js';
import path from 'path';
import type {
  CommunicationConfig,
  LoggerConfig,
  MailerConfig,
  MailServerConfig,
} from '../../types/runtime-config';

interface LoggerRuntimeConfig {
  logger?: LoggerConfig;
  communication?: CommunicationConfig;
}

interface AppenderConfig {
  type: string;
  [key: string]: unknown;
}

interface CategoryConfig {
  appenders: string[];
  level: string;
}

class Logger {
  private logger: LoggerConfig;
  private mailer?: MailServerConfig & { defaultRecipients?: string[] };

  constructor(config: LoggerRuntimeConfig) {
    config.logger = config.logger || { start: false, rootDir: '' };
    config.communication = config.communication || {};
    this.logger = config.logger;
    let mailer = (config.communication.mailer || {}) as MailerConfig & {
      start?: boolean;
      server?: string;
      defaultRecipients?: string[];
    };
    mailer.start &&
      (this.mailer = (mailer[mailer.server || ''] || {}) as MailServerConfig) &&
      (this.mailer.defaultRecipients = mailer.defaultRecipients);
  }
  init(): void {
    if (this.logger.start == false) {
      return;
    }
    //缁狙冨焼閿涙瓌FF閵嗕笚ATAL閵嗕笒RROR閵嗕箘ARN閵嗕浮NFO閵嗕笍EBUG閵嗕竸LL
    let appenders: Record<string, AppenderConfig> = {
      stdout: {
        type: 'console',
        // layout: {
        // 	type: 'pattern',
        // 	pattern: '%r %p %c - %m%n'
        // }
      },
    };
    let categories: Record<string, CategoryConfig> = {
      default: {
        appenders: ['stdout', 'info'],
        level: 'info',
      },
    };
    let levels: Array<'debug' | 'info' | 'error'> = ['debug', 'info', 'error'];
    levels.map((item) => {
      appenders[`${item}`] = {
        type: 'dateFile',
        filename: path.join(this.logger.rootDir, item, item),
        pattern: 'yyyy-MM-dd.log',
        alwaysIncludePattern: true,
        compress: false,
        encoding: 'utf-8',
      };
      categories[`${item}`] = {
        appenders: ['stdout', item],
        level: item,
      };
    });
    if (this.mailer) {
      appenders.mailer = {
        type: '@log4js-node/smtp',
        recipients: this.mailer.defaultRecipients,
        transport: 'SMTP',
        subject: `[notice] ${(NKGlobal.config.project && NKGlobal.config.project.name) || 'NK'}`,
        sender: this.mailer.auth?.user,
        SMTP: this.mailer,
      };
      categories.mailer = {
        appenders: ['mailer'],
        level: 'error',
      };
    }
    configure({
      appenders: appenders,
      categories: categories,
    });
    let consoleLog = getLogger('info');
    let error = getLogger('error');
    let debug = getLogger('debug');
    console.error = error.error.bind(error);
    console.warn = consoleLog.warn.bind(consoleLog);
    console.log = consoleLog.info.bind(consoleLog);
    console.info = consoleLog.info.bind(consoleLog);
    console.debug = debug.debug.bind(debug);
    if (this.mailer) {
      console.info('[Email] reminder service started');
      let mailLog = getLogger('mailer');
      console.mail = mailLog.error.bind(mailLog);
    } else {
      console.mail = function () {
        console.error('[Email] please open reminder service,config->communication->mailer->start');
      };
    }
  }
}

export = Logger;
