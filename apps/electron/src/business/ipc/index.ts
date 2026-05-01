import { ipcMain } from 'electron';

export function registerIpcHandlers(): void {
  ipcMain.handle('delete-library', (_event, id: number) => {
    return 0;
  });

  ipcMain.handle('clear-all-data', (event) => {
    event.sender.send('comics-updated');
  });
}
