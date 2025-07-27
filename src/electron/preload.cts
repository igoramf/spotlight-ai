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
  moveWindow: (dx: number, dy: number): Promise<void> => {
    return ipcRenderer.invoke('move-window', dx, dy);
  },
  saveAudioRecording: (audioData: ArrayBuffer, filename: string): Promise<{ success: boolean; filePath: string }> => {
    return ipcRenderer.invoke('save-audio-recording', audioData, filename);
  },
  // Live API functions
  startLiveTranscription: (): Promise<{ sessionId: string; success: boolean }> => {
    return ipcRenderer.invoke('start-live-transcription');
  },
  stopLiveTranscription: (sessionId: string): Promise<{ success: boolean }> => {
    return ipcRenderer.invoke('stop-live-transcription', sessionId);
  },
  sendAudioChunk: (pcmData: string): Promise<{ success: boolean }> => {
    return ipcRenderer.invoke('send-audio-chunk', pcmData);
  },
  onTranscriptionUpdate: (callback: Function) => {
    ipcRenderer.on('transcription-update', (_event, result) => callback(result));
  },
  removeTranscriptionListener: () => {
    ipcRenderer.removeAllListeners('transcription-update');
  },
});
