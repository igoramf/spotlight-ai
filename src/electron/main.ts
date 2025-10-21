import { app, BrowserWindow, globalShortcut, screen, ipcMain, nativeImage, desktopCapturer } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { isDev } from './util.js';
import fs from 'fs';
import { LiveTranscriptionManager } from './liveTranscription.js';
import { OpenAILiveTranscriptionManager } from './openaiLiveTranscription.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let contentProtectionEnabled: boolean = true;
let transcriptionManager: LiveTranscriptionManager | null = null;
let openaiTranscriptionManager: OpenAILiveTranscriptionManager | null = null;

function initializeTranscription() {
  transcriptionManager = new LiveTranscriptionManager();
  console.log('Live transcription manager initialized');
}

function initializeOpenAITranscription() {
  openaiTranscriptionManager = new OpenAILiveTranscriptionManager();
  console.log('OpenAI Live transcription manager initialized');
}

// Usar OpenAI por padrão
ipcMain.handle('start-live-transcription', async (event) => {
  try {
    if (!openaiTranscriptionManager) {
      initializeOpenAITranscription();
    }

    const sessionId = await openaiTranscriptionManager!.startSession();

    // Registrar callback para este renderer process
    openaiTranscriptionManager!.registerCallback(sessionId, (result) => {
      event.sender.send('transcription-update', result);
    });

    return { sessionId, success: true };
  } catch (error) {
    console.error('Error starting OpenAI live transcription:', error);
    throw error;
  }
});

// Versão Gemini (comentada)
// ipcMain.handle('start-live-transcription', async (event) => {
//   try {
//     if (!transcriptionManager) {
//       initializeTranscription();
//     }

//     const sessionId = await transcriptionManager!.startSession();

//     // Registrar callback para este renderer process
//     transcriptionManager!.registerCallback(sessionId, (result) => {
//       event.sender.send('transcription-update', result);
//     });

//     return { sessionId, success: true };
//   } catch (error) {
//     console.error('Error starting live transcription:', error);
//     throw error;
//   }
// });

ipcMain.handle('stop-live-transcription', async (event, sessionId: string) => {
  try {
    if (openaiTranscriptionManager) {
      openaiTranscriptionManager.removeCallback(sessionId);
    }
    // Versão Gemini (comentada)
    // if (transcriptionManager) {
    //   transcriptionManager.removeCallback(sessionId);
    // }

    return { success: true };
  } catch (error) {
    console.error('Error stopping live transcription:', error);
    throw error;
  }
});

ipcMain.handle('send-audio-chunk', async (event, pcmData: string) => {
  try {
    if (openaiTranscriptionManager) {
      openaiTranscriptionManager.sendAudioChunk(pcmData);
    }
    // if (transcriptionManager) {
    //   transcriptionManager.sendAudioChunk(pcmData);
    // }
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
  
  // Optimize: Reduce resolution by 50% for faster processing
  const targetWidth = Math.floor(width * 0.5);
  const targetHeight = Math.floor(height * 0.5);

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: targetWidth, height: targetHeight },
  });

  if (!sources.length) {
    throw new Error('No screen sources found');
  }

  const screenshotJpegBuffer = sources[0].thumbnail.toJPEG(80);
  const base64 = screenshotJpegBuffer.toString('base64');
  return `data:image/jpeg;base64,${base64}`;
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

// Custom Prompts Storage
const getCustomPromptsPath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'custom-prompts.json');
};

ipcMain.handle('save-custom-prompt', async (_event, prompt: string) => {
  try {
    const promptsPath = getCustomPromptsPath();
    const promptsData = {
      customPrompt: prompt,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(promptsPath, JSON.stringify(promptsData, null, 2));
    
    return { success: true };
  } catch (error) {
    console.error('Error saving custom prompt:', error);
    throw error;
  }
});

ipcMain.handle('load-custom-prompt', async (_event) => {
  try {
    const promptsPath = getCustomPromptsPath();
    
    if (!fs.existsSync(promptsPath)) {
      return { success: true, prompt: '', exists: false };
    }
    
    const promptsData = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
    
    return { 
      success: true, 
      prompt: promptsData.customPrompt || '', 
      exists: true,
      lastUpdated: promptsData.lastUpdated 
    };
  } catch (error) {
    console.error('Error loading custom prompt:', error);
    return { success: true, prompt: '', exists: false };
  }
});

ipcMain.handle('delete-custom-prompt', async (_event) => {
  try {
    const promptsPath = getCustomPromptsPath();
    
    if (fs.existsSync(promptsPath)) {
      fs.unlinkSync(promptsPath);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting custom prompt:', error);
    throw error;
  }
});

ipcMain.handle('quit-app', async (_event) => {
  try {
    app.quit();
  } catch (error) {
    console.error('Error quitting app:', error);
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
  initializeOpenAITranscription();

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
  if (openaiTranscriptionManager) {
    openaiTranscriptionManager.close();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

