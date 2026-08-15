const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// El proceso de GPU se cae en este entorno; se corre por software en vez
// de arriesgar un crash — no cambia cómo se ve, solo cómo se dibuja.
app.disableHardwareAcceleration();

const INDEX_PATH = path.join(__dirname, 'index.html');
const PRELOAD_PATH = path.join(__dirname, 'preload.js');

// Dónde viven los archivos reales de las apps instaladas — notas como .txt,
// dibujos como .png, algo que Jack puede abrir con cualquier otro programa.
const DATA_DIR = path.join(app.getPath('userData'), 'orak-data');
const NOTES_DIR = path.join(DATA_DIR, 'notas');
const CANVAS_DIR = path.join(DATA_DIR, 'pintura');
fs.mkdirSync(NOTES_DIR, { recursive: true });
fs.mkdirSync(CANVAS_DIR, { recursive: true });

function safeId(id) {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, '_');
}

ipcMain.handle('orak:readNote', (event, id) => {
  try { return fs.readFileSync(path.join(NOTES_DIR, safeId(id) + '.txt'), 'utf8'); }
  catch (e) { return ''; }
});
ipcMain.handle('orak:writeNote', (event, id, content) => {
  fs.writeFileSync(path.join(NOTES_DIR, safeId(id) + '.txt'), content, 'utf8');
});
ipcMain.handle('orak:readCanvas', (event, id) => {
  try { return 'data:image/png;base64,' + fs.readFileSync(path.join(CANVAS_DIR, safeId(id) + '.png')).toString('base64'); }
  catch (e) { return null; }
});
ipcMain.handle('orak:writeCanvas', (event, id, dataUrl) => {
  const base64 = String(dataUrl).replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(path.join(CANVAS_DIR, safeId(id) + '.png'), Buffer.from(base64, 'base64'));
});

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
      preload: PRELOAD_PATH,
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
