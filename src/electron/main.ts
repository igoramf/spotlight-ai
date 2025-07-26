import { app, BrowserWindow, globalShortcut, screen, ipcMain, nativeImage, desktopCapturer } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { isDev } from './util.js';
import fs from 'fs';
import { WebSocketServer } from 'ws';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let contentProtectionEnabled: boolean = true;
let wss: WebSocketServer | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

// Initialize Gemini client
function initializeGemini() {
  // Try different environment variable formats
  const apiKey = process.env.VITE_GEMINI_API_KEY || 
                 process.env.GEMINI_API_KEY || 
                 process.env.GOOGLE_API_KEY;
  
  console.log('Initializing Gemini with API key:', apiKey ? 'Found' : 'Not found');
  
  if (apiKey) {
    try {
      geminiClient = new GoogleGenerativeAI(apiKey);
      console.log('Gemini client initialized successfully');
    } catch (error) {
      console.error('Error initializing Gemini client:', error);
    }
  } else {
    console.warn('No Gemini API key found. Please check your .env file.');
    console.warn('Expected environment variables: VITE_GEMINI_API_KEY, GEMINI_API_KEY, or GOOGLE_API_KEY');
  }
}

// Setup WebSocket server for real-time transcription
function setupWebSocketServer() {
  wss = new WebSocketServer({ port: 8080 });
  console.log('WebSocket server started on port 8080');

  wss.on('connection', (ws) => {
    console.log('Client connected to transcription WebSocket');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'audio-chunk') {
          // Process audio chunk for transcription
          await handleAudioTranscription(ws, data.audioData, data.mimeType);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Error processing audio chunk'
        }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from transcription WebSocket');
    });
  });
}

async function handleAudioTranscription(ws: any, audioBase64: string, mimeType: string) {
  if (!geminiClient) {
    console.error('Gemini client not initialized - attempting to reinitialize...');
    initializeGemini();
    
    if (!geminiClient) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Gemini client not available. Please check API key configuration.'
      }));
      return;
    }
  }

  try {
    console.log('Processing audio transcription...');
    
    ws.send(JSON.stringify({
      type: 'transcription-status',
      status: 'processing'
    }));

    const model = geminiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const audioData = {
      inlineData: {
        data: audioBase64,
        mimeType: mimeType,
      },
    };

    const prompt = `Transcreva o áudio fornecido para texto em pt-BR. 
    Forneça apenas a transcrição do que foi falado, sem comentários adicionais.
    Se não houver fala audível, responda apenas "..." 
    Mantenha a formatação natural da fala com pontuação apropriada.`;
    
    const result = await model.generateContent([prompt, audioData]);
    const response = await result.response;
    const transcription = response.text().trim();

    console.log('Transcription result:', transcription);

    // Send transcription result back to client
    ws.send(JSON.stringify({
      type: 'transcription-result',
      transcription: transcription,
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    console.error('Error in Gemini transcription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    ws.send(JSON.stringify({
      type: 'error',
      message: `Transcription failed: ${errorMessage}`
    }));
  }
}

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
    
    // Ensure recordings directory exists
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
  // Initialize Gemini and WebSocket server
  console.log('App ready - initializing services...');
  initializeGemini();
  setupWebSocketServer();

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;

  const windowWidth = 800;
  const windowHeight = 465;

  mainWindow = new BrowserWindow({
    x: Math.floor((screenWidth - windowWidth) / 2),
    y: 0,
    frame: false,
    width: windowWidth,
    height: windowHeight,
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
  if (wss) {
    wss.close();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
