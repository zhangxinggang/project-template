import type { MailServerConfig } from '../../types/runtime-config';

/**
 * @global
 * @namespace 閫氳
 */
/**
 * @constructor
 * @name "Communication"
 * @description 閭欢鍙戦€?
 * @memberof 閫氳
 * @param {string} from 鍙戦€佸ご鍚嶇О
 * @param {string|Array} to 鏀跺埌鐭俊鐨勯偖绠?
 * @param {string} subject 閭欢涓婚
 * @param {string} [text] 鏂囨湰
 * @param {string} [html] html
 * @param {Array} [attachments] 闄勪欢 [{filename:'',path:''}]
 * @return {object} <pre>
	杩斿洖閭欢鍙戦€佹垚鍔熶俊鎭細
	{
		{
			accepted: [ 'xxx@163.com' ],
			rejected: [],
			envelopeTime: 7190,
			messageTime: 4125,
			messageSize: 328,
			response: '250 OK: queued as.',
			envelope:{
				from: 'xxx@qq.com', 
				to: [ 'xxx@163.com' ]
			},
			messageId: '<xxxx@qq.com>' 
		}
	}
 */
const nodemailer: {
  createTransport: (config: MailServerConfig) => {
    sendMail: (options: MailOptions, cb: (err: Error | null, info?: unknown) => void) => void;
  };
} = require('nodemailer');

interface MailOptions {
  from?: string;
  to?: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  attachments?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

type SendMailCallback = (err: Error | null, info?: unknown) => void;

class Communication {
  sendMail(options: MailOptions, cb?: SendMailCallback): void {
    NKGlobal.config.communication = NKGlobal.config.communication || {
      mailer: {
        start: false,
        defaultRecipients: [],
        server: '',
      },
    };
    const mailer = NKGlobal.config.communication.mailer;
    const mailConf = (mailer?.[mailer.server] || {}) as MailServerConfig;
    const transport = nodemailer.createTransport(mailConf);
    const sender = mailConf.auth?.user || '';
    options.from = options.from || sender;
    options.from = `${options.from}<${sender}>`;
    transport.sendMail(options, function (err, info) {
      if (typeof cb === 'function') {
        if (err) {
          cb(err);
        } else {
          cb(null, info);
        }
      }
    });
  }
}

export = Communication;
