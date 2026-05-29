const { app, BrowserWindow } = require('electron');
const path = require('path');

function startBackendServer() {
  try {
    require(path.join(__dirname, 'Backend', 'server.js'));
  } catch (err) {
    console.error('Unable to start backend server:', err);
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'Frontend', 'dashboard.html'));
  mainWindow.webContents.openDevTools({ mode: 'right' });
}

app.whenReady().then(() => {
  startBackendServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
