const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => process.versions.electron,
  // Add safe IPC channels here if needed in the future
});
