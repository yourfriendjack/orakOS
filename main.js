const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// El proceso de GPU se cae en este entorno; se corre por software en vez
// de arriesgar un crash — no cambia cómo se ve, solo cómo se dibuja.
app.disableHardwareAcceleration();

const INDEX_PATH = path.join(__dirname, 'index.html');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0d0906',
    title: 'orakOS',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(INDEX_PATH);

  // Recarga sola cada vez que el archivo cambia — para poder seguir
  // editando desde afuera sin tener que cerrar y volver a abrir la ventana.
  let reloadTimer = null;
  fs.watch(INDEX_PATH, () => {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => {
      if (!win.isDestroyed()) win.loadFile(INDEX_PATH);
    }, 200);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
