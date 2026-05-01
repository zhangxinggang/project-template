import { app, BrowserWindow, dialog } from 'electron';
import { join } from 'path';
import { registerIpcHandlers } from '../business/ipc';
import { buildMenu } from '../business/system/menu';
import { getAppConfig, getAPPRootPath, getStaticPath } from '../utils';
import { STATIC_FOLDER_NAME } from '../utils/constant';
import './server';

const rootPath = getAPPRootPath();
let mainWindow: BrowserWindow | null = null;
const isMac = process.platform === 'darwin';
const appConf = getAppConfig();
const { loadURL, openDevTools, closeConfirm, browserWindow = {} } = appConf;

function createWindow(): void {
  const getWebPreferences = () => {
    return {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      ...browserWindow.browserWindow,
    };
  };
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'ELE',
    icon: join(getStaticPath(), 'favicon.ico'),
    ...browserWindow,
    webPreferences: getWebPreferences(),
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        webPreferences: getWebPreferences(),
      },
    };
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  if (loadURL) {
    mainWindow.loadURL(loadURL);
  } else {
    mainWindow.loadFile(join(rootPath, `${STATIC_FOLDER_NAME}/index.html`));
  }
  if (openDevTools) {
    mainWindow.webContents.openDevTools({ mode: 'right' });
  }
  mainWindow.on('close', async (event) => {
    if (!mainWindow || !closeConfirm) return;
    event?.preventDefault();
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['取消', '确认关闭'],
      defaultId: 0,
      cancelId: 0,
      title: '确认关闭',
      message: '确定要关闭吗?',
    });
    if (result.response === 1) {
      mainWindow = null;
      app.quit();
    }
  });
}
app.commandLine.appendSwitch('lang', 'zh-CN');
app.whenReady().then(() => {
  // initDb();
  registerIpcHandlers();
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      if (!mainWindow) return;
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    });
  }
});
app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});
