const { app, BrowserWindow } = require('electron');
const path = require('node:path');

const isMac = process.platform === 'darwin';

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0c0c0c',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  const devServerURL = process.env.ELECTRON_START_URL;
  if (devServerURL) {
    window.loadURL(devServerURL);
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexHtml = path.join(__dirname, '../dist/afrika/index.html');
    window.loadFile(indexHtml);
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});
