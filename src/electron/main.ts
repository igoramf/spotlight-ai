import { app, BrowserWindow, globalShortcut, screen, ipcMain, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { isDev } from './util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let contentProtectionEnabled: boolean = true;

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
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
