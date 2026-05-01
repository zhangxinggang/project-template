import { contextBridge, ipcRenderer } from 'electron';

const api = {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel, callback) => {
    const handler = (event, ...args): void => callback(...args);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type Api = typeof api;
