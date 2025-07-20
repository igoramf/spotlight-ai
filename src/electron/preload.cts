import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  setContentProtection: (flag: boolean): Promise<boolean> => {
    return ipcRenderer.invoke('set-content-protection', flag);
  },
  getContentProtectionStatus: (): Promise<boolean> => {
    return ipcRenderer.invoke('get-content-protection-status');
  },
  takeScreenshot: async (): Promise<string> => {
    return ipcRenderer.invoke('take-screenshot');
  },
});
