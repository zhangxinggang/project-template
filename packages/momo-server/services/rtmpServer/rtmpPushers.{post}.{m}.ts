import _ from 'lodash';
import path from 'path';
import coreCtx = require('./core_ctx');

const moment: (input?: unknown) => { format: (formatStr: string) => string } = require('moment');

interface Sender {
  req: {
    protocol: string;
    headers: Record<string, string>;
  };
  success: (data: unknown) => void;
}

interface PublisherInfo {
  id: string;
  startTime: string;
  inBytes: number;
  outBytes: number;
  m3u8Path?: string;
  onlines: number;
  transType: string;
  ip?: string;
  audio: Record<string, unknown> | null;
  video: Record<string, unknown> | null;
  path?: string;
}

interface RtmpSessionStat {
  id: string;
  appname: string;
  isStarting: boolean;
  isPublishing: boolean;
  publishStreamPath: string;
  playStreamPath: string;
  connectCmdObj: {
    tcUrl: string;
  };
  m3u8Path?: string;
  startTime: number | Date | string;
  audioCodec: number;
  audioCodecName: string;
  audioProfileName: string;
  audioSamplerate: number;
  audioChannels: number;
  videoCodec: number;
  videoCodecName: string;
  videoWidth: number;
  videoHeight: number;
  videoProfileName: string;
  videoLevel: number;
  videoFps: number;
  socket: {
    bytesRead: number;
    bytesWritten: number;
    remoteAddress?: string;
  };
  constructor: {
    name?: string;
  };
}

module.exports = function (sender: Sender): void {
  /**
     * [getStreams description]
     * @return {[object]}
     * {
           "test.flv":{
                "publisher":{
                    "id":"dtr1nHNAm",
                    "startTime":"2019-01-10T08:20:00.899Z",
                    "bytes":42792207,
                    "ip":"::ffff:127.0.0.1",
                    "audio":null,
                    "video":{
                        "codec":"Sorenson-H263",
                        "width":1280,
                        "height":720,
                        "profile":"",
                        "level":0,
                        "fps":10
                    }
                }
            }
       }
     */
  const httpServerPath = String(NKGlobal.config.httpServerPath || '');
  const formLiveParam = require(path.join(httpServerPath, 'servers/video/formLiveParam.js'));
  const pushers: Record<string, { publisher: PublisherInfo | null }> = {};
  const sessionMap = (coreCtx as unknown as { sessions: Map<string, RtmpSessionStat> }).sessions;
  sessionMap.forEach((session) => {
    if (session.isStarting) {
      const regRes = /\/(.*)\/(.*)/gi.exec(session.publishStreamPath || session.playStreamPath);
      if (regRes === null) return;
      const reg = new RegExp(session.appname, 'g');
      const name = session.publishStreamPath.replace(reg, '').replace(/\//g, '');
      const playPath = `${session.connectCmdObj.tcUrl}/${name}`;
      if (!_.get(pushers, [playPath])) {
        _.set(pushers, [playPath], {
          publisher: null,
        });
      }
      //m3u8閸︽澘娼?
      if (!session.m3u8Path && session.isPublishing) {
        const currentStream: Record<string, unknown> = {
          deviceName: session.id,
          streamUrl: playPath,
        };
        Object.assign(currentStream, NKGlobal.config.video?.camera || {});
        const m3u8Path = `${sender.req.protocol}://${sender.req.headers.host}${formLiveParam.liveAddr(currentStream)}`;
        currentStream.tempLive = true;
        const LiveStream = require(path.join(httpServerPath, 'servers/video/liveStream.js'));
        const tempStream = new LiveStream(currentStream);
        tempStream.start();
        session.m3u8Path = m3u8Path;
      }
      switch (true) {
        case session.isPublishing: {
          _.set(pushers, [playPath, 'publisher'], {
            id: session.id,
            startTime: moment(session.startTime).format('YYYY-MM-DD HH:mm:ss'),
            inBytes: session.socket.bytesRead,
            outBytes: session.socket.bytesWritten,
            m3u8Path: session.m3u8Path,
            onlines: 0,
            transType: 'tcp',
            ip: session.socket.remoteAddress,
            audio:
              session.audioCodec > 0
                ? {
                    codec: session.audioCodecName,
                    profile: session.audioProfileName,
                    samplerate: session.audioSamplerate,
                    channels: session.audioChannels,
                  }
                : null,
            video:
              session.videoCodec > 0
                ? {
                    codec: session.videoCodecName,
                    width: session.videoWidth,
                    height: session.videoHeight,
                    profile: session.videoProfileName,
                    level: session.videoLevel,
                    fps: session.videoFps,
                  }
                : null,
          });
          break;
        }
        case !!session.playStreamPath: {
          if (session.constructor.name && pushers[playPath]['publisher']) {
            pushers[playPath].publisher!.onlines++;
          }
        }
      }
    }
  });
  const result: {
    total: number;
    rows: PublisherInfo[];
  } = {
    total: 0,
    rows: [],
  };
  for (const key in pushers) {
    if (pushers[key].publisher) {
      pushers[key].publisher.path = key;
      result.total++;
      result.rows.push(pushers[key].publisher as PublisherInfo);
    }
  }
  sender.success(result);
};
