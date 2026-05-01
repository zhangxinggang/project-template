import { app } from 'electron';
import path from 'path';
import { CONFIG_FILE, STATIC_FOLDER_NAME } from './constant';

export const isDev = () => {
  return process.env.NODE_ENV === 'development';
};

export const getAPPRootPath = () => {
  if (isDev()) {
    return path.join(__dirname, `../../../`);
  } else {
    return process.cwd();
  }
};

export const getStaticPath = () => {
  const rootPath = getAPPRootPath();
  if (isDev()) {
    return path.join(__dirname, rootPath, STATIC_FOLDER_NAME);
  } else {
    return path.join(rootPath, STATIC_FOLDER_NAME);
  }
};

type IElectronPath =
  | 'home'
  | 'appData'
  | 'assets'
  | 'userData'
  | 'sessionData'
  | 'temp'
  | 'exe'
  | 'module'
  | 'desktop'
  | 'documents'
  | 'downloads'
  | 'music'
  | 'pictures'
  | 'videos'
  | 'recent'
  | 'logs'
  | 'crashDumps';

export const getUserPath = (folder?: IElectronPath) => {
  const userFolder = folder || 'userData';
  return path.join(app.getPath(userFolder), 'userData');
};

export const getAppConfig = () => {
  const rootPath = getAPPRootPath();
  const appConfPath = path.join(rootPath, CONFIG_FILE);
  return require(appConfPath);
};
