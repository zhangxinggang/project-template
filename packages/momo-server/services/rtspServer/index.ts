import { EventEmitter } from 'events';
import net, { Server, Socket } from 'net';
import type { PortServiceConfig } from '../../types/runtime-config';
import RTSPSession = require('./rtsp-session');
import context = require('./core_ctx');

interface SessionLike {
  type: 'pusher' | 'player';
  path: string;
  sendVideo?: (rtpBuf: Buffer) => void;
  sendVideoControl?: (rtpBuf: Buffer) => void;
  sendAudio?: (rtpBuf: Buffer) => void;
  sendAudioControl?: (rtpBuf: Buffer) => void;
}

class RtspServer extends EventEmitter {
  private readonly rtspServer: PortServiceConfig;
  private readonly pushSessions: Record<string, SessionLike>;
  private readonly playSessions: Record<string, SessionLike[]>;
  private readonly server: Server;

  constructor(rtspServer: PortServiceConfig) {
    super();
    this.rtspServer = rtspServer;
    this.pushSessions = {};
    this.playSessions = {};
    this.server = net.createServer();
    this.server
      .on('connection', (socket) => {
        new RTSPSession(socket as Socket, this);
      })
      .on('error', (err) => {
        console.error('rtsp server error:', err);
      })
      .on('listening', async () => {
        console.info(`[rtspServer] started at port ${rtspServer.port || 554}`);
      });
  }

  start(callback?: () => void): void {
    if (this.rtspServer && this.rtspServer.start) {
      this.server.listen(this.rtspServer.port || 554, () => {
        callback?.();
      });
      this.stats();
    } else {
      callback?.();
    }
  }

  stats(): void {
    (context as { server: unknown }).server = this;
  }

  addSession(session: SessionLike): void {
    if (session.type === 'pusher') {
      this.pushSessions[session.path] = session;
    } else if (session.type === 'player') {
      let playSessions = this.playSessions[session.path];
      if (!playSessions) {
        playSessions = [];
        this.playSessions[session.path] = playSessions;
      }
      if (playSessions.indexOf(session) < 0) {
        playSessions.push(session);
      }
    }
  }

  removeSession(session: SessionLike): void {
    if (session.type === 'pusher') {
      delete this.pushSessions[session.path];
    } else if (session.type === 'player') {
      const playSessions = this.playSessions[session.path];
      if (playSessions && playSessions.length > 0) {
        const idx = playSessions.indexOf(session);
        if (idx >= 0) {
          playSessions.splice(idx, 1);
        }
      }
    }
  }
}

export = RtspServer;
