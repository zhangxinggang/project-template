import http from 'http';
import https from 'https';
import querystring from 'querystring';
import url from 'url';

interface RequestOptions {
  url?: string;
  headers?: Record<string, string | number>;
  method?: string;
  encoding?: BufferEncoding;
  isBuffer?: boolean;
  json?: boolean;
  data?: string | Buffer | Record<string, unknown>;
  hostname?: string;
  port?: string | number;
  path?: string;
  auth?: string;
}

class Request {
  constructor(options: string | RequestOptions) {
    return new Promise((resolve, reject) => {
      const opts: RequestOptions = {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'get',
        encoding: 'utf8',
        isBuffer: false,
        json: true,
      };
      if (typeof options === 'string') {
        opts.url = options;
      } else {
        Object.assign(opts, options);
      }
      if (opts.data) {
        if ((opts.method || 'get').toLowerCase() === 'get') {
          const query =
            typeof opts.data === 'string'
              ? opts.data
              : querystring.stringify(opts.data as Record<string, string | number | boolean>);
          opts.url = `${opts.url}?${query}`;
        } else {
          opts.data = JSON.stringify(opts.data);
          if (opts.headers) {
            opts.headers['Content-Length'] = Buffer.from(opts.data).length;
          }
        }
      }
      const urlObj = url.parse(opts.url || '');
      urlObj.protocol = urlObj.protocol || 'http:';
      const htp = NKGlobal.config.services.httpServer.protocols[urlObj.protocol.split(':')[0]];
      urlObj.hostname = urlObj.hostname || 'localhost';
      urlObj.port = urlObj.port || String(htp.port);
      const assignKeys: Array<keyof RequestOptions> = ['hostname', 'port', 'path', 'auth'];
      assignKeys.map((item) => {
        const value = urlObj[item];
        if (value) {
          if (item === 'hostname') {
            opts.hostname = value;
          } else if (item === 'port') {
            opts.port = value;
          } else if (item === 'path') {
            opts.path = value;
          } else if (item === 'auth') {
            opts.auth = value;
          }
        }
      });

      delete opts.url;
      const requestOptions: http.RequestOptions = {
        ...opts,
      };
      const req = (urlObj.protocol === 'http:' ? http : https).request(requestOptions, (res) => {
        const body: Buffer[] = [];
        let size = 0;
        res.on('data', (chunk: Buffer) => {
          body.push(chunk);
          size += chunk.length;
        });
        res.on('end', () => {
          let result: unknown = '';
          if (opts.isBuffer) {
            result = Buffer.concat(body, size);
          } else {
            const buffer = Buffer.alloc(size);
            for (let i = 0, pos = 0, l = body.length; i < l; i++) {
              const chunk = body[i];
              chunk.copy(buffer, pos);
              pos += chunk.length;
            }
            result = buffer.toString(opts.encoding);
            if (opts.json && typeof result === 'string') {
              try {
                result = JSON.parse(result);
              } catch (e) {
                reject(new Error(String(result)));
                return;
              }
            }
          }
          resolve(result);
        });
      });
      req.on('error', reject);
      if ((opts.method || 'get').toLowerCase() !== 'get' && opts.data) {
        req.write(opts.data);
      }
      req.end();
    });
  }
}

export = Request;
