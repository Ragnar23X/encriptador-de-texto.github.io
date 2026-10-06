'use strict';
const { app, BrowserWindow, session } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const allowedFiles = new Set(['index.html', 'style.css', 'script.js'].map(name => pathToFileURL(path.join(root, name)).href));
let window;
function createWindow() {
  window = new BrowserWindow({
    width: 1040, height: 860, minWidth: 380, minHeight: 560,
    title: 'Vault', backgroundColor: '#0b0e14', autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true, sandbox: true,
      webSecurity: true, allowRunningInsecureContent: false,
      spellcheck: false, partition: 'vault-memory'
    }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  window.on('closed', () => { window = null; });
  window.loadFile(path.join(root, 'index.html'));
}
app.whenReady().then(() => {
  const isolatedSession = session.fromPartition('vault-memory');
  isolatedSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  isolatedSession.setPermissionCheckHandler(() => false);
  isolatedSession.webRequest.onBeforeRequest((details, callback) => {
    callback({ cancel: !allowedFiles.has(details.url) });
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
