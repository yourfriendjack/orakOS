const { contextBridge, ipcRenderer } = require('electron');

// Puente seguro entre la ventana (sandboxed, sin Node) y el proceso principal
// (que sí puede tocar el disco de verdad) — solo expone estas cuatro
// funciones puntuales, nada de acceso genérico al sistema de archivos.
contextBridge.exposeInMainWorld('orakFS', {
  readNote: (id) => ipcRenderer.invoke('orak:readNote', id),
  writeNote: (id, content) => ipcRenderer.invoke('orak:writeNote', id, content),
  readCanvas: (id) => ipcRenderer.invoke('orak:readCanvas', id),
  writeCanvas: (id, dataUrl) => ipcRenderer.invoke('orak:writeCanvas', id, dataUrl),
});
