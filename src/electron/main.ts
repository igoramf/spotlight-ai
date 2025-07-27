import { app, BrowserWindow, globalShortcut, screen, ipcMain, nativeImage, desktopCapturer } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { isDev } from './util.js';
import fs from 'fs';
import { LiveTranscriptionManager } from './liveTranscription.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let contentProtectionEnabled: boolean = true;
let transcriptionManager: LiveTranscriptionManager | null = null;

// Inicializar gerenciador de transcrição
function initializeTranscription() {
  transcriptionManager = new LiveTranscriptionManager();
  console.log('Live transcription manager initialized');
}

ipcMain.handle('start-live-transcription', async (event) => {
  try {
    if (!transcriptionManager) {
      initializeTranscription();
    }
    
    const sessionId = await transcriptionManager!.startSession();
    
    // Registrar callback para este renderer process
    transcriptionManager!.registerCallback(sessionId, (result) => {
      event.sender.send('transcription-update', result);
    });
    
    return { sessionId, success: true };
  } catch (error) {
    console.error('Error starting live transcription:', error);
    throw error;
  }
});

ipcMain.handle('stop-live-transcription', async (event, sessionId: string) => {
  try {
    if (transcriptionManager) {
      transcriptionManager.removeCallback(sessionId);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error stopping live transcription:', error);
    throw error;
  }
});

ipcMain.handle('send-audio-chunk', async (event, pcmData: string) => {
  try {
    if (transcriptionManager) {
      transcriptionManager.sendAudioChunk(pcmData);
    }
    return { success: true };
  } catch (error) {
    console.error('Error sending audio chunk:', error);
    throw error;
  }
});

ipcMain.handle('set-content-protection', (_event, flag: boolean) => {
  contentProtectionEnabled = Boolean(flag);
  if (mainWindow) {
    mainWindow.setContentProtection(contentProtectionEnabled);
  }
  return contentProtectionEnabled;
});

ipcMain.handle('get-content-protection-status', () => {
  return contentProtectionEnabled;
});

ipcMain.handle('take-screenshot', async () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width, height },
  });

  if (!sources.length) {
    throw new Error('No screen sources found');
  }

  const screenshotPngBuffer = sources[0].thumbnail.toPNG();
  const base64 = screenshotPngBuffer.toString('base64');
  return `data:image/png;base64,${base64}`;
});

ipcMain.handle('move-window', (_event, dx: number = 0, dy: number = 0) => {
  if (mainWindow) {
    const bounds = mainWindow.getBounds();
    mainWindow.setBounds({ ...bounds, x: bounds.x + dx, y: bounds.y + dy });
  }
});

ipcMain.handle('save-audio-recording', async (_event, audioData: ArrayBuffer, filename: string) => {
  try {
    const recordingsDir = path.join(process.cwd(), 'recordings');
    
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }
    
    const filePath = path.join(recordingsDir, filename);
    const buffer = Buffer.from(audioData);
    
    fs.writeFileSync(filePath, buffer);
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving audio recording:', error);
    throw error;
  }
});

function registerMoveShortcuts(win: BrowserWindow) {
  const step = 50;

  globalShortcut.register('Control+Right', () => {
    const bounds = win.getBounds();
    win.setBounds({ ...bounds, x: bounds.x + step });
  });

  globalShortcut.register('Control+Left', () => {
    const bounds = win.getBounds();
    win.setBounds({ ...bounds, x: bounds.x - step });
  });
}

app.on('ready', () => {
  console.log('App ready - initializing services...');
  initializeTranscription();

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const windowWidth = 1400;
  const windowHeight = 900;

  mainWindow = new BrowserWindow({
    x: Math.floor((screenWidth - windowWidth) / 2),
    y: 30,
    frame: false,
    width: windowWidth,
    height: windowHeight,
    minWidth: 1200,
    minHeight: 700,
    maxWidth: Math.floor(screenWidth * 0.98),
    maxHeight: Math.floor(screenHeight * 0.95),
    resizable: true,
    titleBarStyle: 'hidden',
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  if (isDev()) {
    mainWindow.loadURL('http://localhost:5123');
  } else {
    const indexPath = path.join(__dirname, '../dist-react/index.html');
    mainWindow.loadFile(indexPath);
  }

  globalShortcut.register('Control+X', () => {
    if (!mainWindow) return;
    const visible = mainWindow.isVisible();
    if (visible) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  registerMoveShortcuts(mainWindow);

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log('Console:', level, message);
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (transcriptionManager) {
    transcriptionManager.close();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

