import dgram, { RemoteInfo, Socket } from 'dgram';
import type { PortServiceConfig } from '../../types/runtime-config';

class UdpServer {
  private readonly udpServer: PortServiceConfig;
  private server?: Socket;

  constructor(udpServer: PortServiceConfig) {
    this.udpServer = udpServer;
  }

  start(callback?: () => void): void {
    if (this.udpServer && this.udpServer.start) {
      this.server = dgram.createSocket('udp4');
      this.server.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
        console.log(`客户端发送的数据:${msg}`);
        // 回发确认
        this.server?.send(msg, 0, msg.length, rinfo.port, rinfo.address);
      });
      const udpPort = this.udpServer.port || 41234;
      this.server.on('listening', () => {
        console.info(`[udpServer] started at port ${udpPort}`);
        callback?.();
      });
      this.server.bind(udpPort, 'localhost');
      return;
    }
    callback?.();
  }
}

export = UdpServer;
