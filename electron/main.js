const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

const PROJECT_FILTER = [{ name: 'RPG Dungeon Desk Project', extensions: ['rpgworld'] }];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#141210',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'app', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('close', (e) => {
    // Let the renderer flush an autosave before closing.
    if (mainWindow && !mainWindow._readyToClose) {
      e.preventDefault();
      mainWindow.webContents.send('app:before-quit');
      setTimeout(() => {
        if (mainWindow) {
          mainWindow._readyToClose = true;
          mainWindow.close();
        }
      }, 250);
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function send(channel, ...args) {
  if (mainWindow) mainWindow.webContents.send(channel, ...args);
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New Project', accelerator: 'CmdOrCtrl+N', click: () => send('menu:new-project') },
        { label: 'Open Project…', accelerator: 'CmdOrCtrl+O', click: () => send('menu:open-project') },
        { type: 'separator' },
        { label: 'Save Project', accelerator: 'CmdOrCtrl+S', click: () => send('menu:save-project') },
        { label: 'Save Project As…', accelerator: 'CmdOrCtrl+Shift+S', click: () => send('menu:save-project-as') },
        { type: 'separator' },
        { label: 'Export Current Map as PNG…', accelerator: 'CmdOrCtrl+E', click: () => send('menu:export-png') },
        { label: 'Export Codex as HTML…', click: () => send('menu:export-codex') },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => send('menu:undo') },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', click: () => send('menu:redo') },
        { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About RPG Dungeon Desk',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'RPG Dungeon Desk',
              detail: `Version ${app.getVersion()}\n\nAn RPG map maker and world builder.\nCreate world maps, towns, dungeons — and the lore behind them.`
            });
          }
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ---------------- IPC: project files ---------------- */

ipcMain.handle('project:save', async (_e, { filePath, data, suggestedName }) => {
  let target = filePath;
  if (!target) {
    const res = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Project',
      defaultPath: (suggestedName || 'My World') + '.rpgworld',
      filters: PROJECT_FILTER
    });
    if (res.canceled || !res.filePath) return { canceled: true };
    target = res.filePath;
  }
  try {
    fs.writeFileSync(target, data, 'utf8');
    return { canceled: false, filePath: target };
  } catch (err) {
    return { canceled: true, error: String(err) };
  }
});

ipcMain.handle('project:saveAs', async (_e, { data, suggestedName }) => {
  const res = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Project As',
    defaultPath: (suggestedName || 'My World') + '.rpgworld',
    filters: PROJECT_FILTER
  });
  if (res.canceled || !res.filePath) return { canceled: true };
  try {
    fs.writeFileSync(res.filePath, data, 'utf8');
    return { canceled: false, filePath: res.filePath };
  } catch (err) {
    return { canceled: true, error: String(err) };
  }
});

ipcMain.handle('project:open', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Project',
    filters: PROJECT_FILTER,
    properties: ['openFile']
  });
  if (res.canceled || !res.filePaths.length) return { canceled: true };
  try {
    const data = fs.readFileSync(res.filePaths[0], 'utf8');
    return { canceled: false, filePath: res.filePaths[0], data };
  } catch (err) {
    return { canceled: true, error: String(err) };
  }
});

/* ---------------- IPC: exports ---------------- */

ipcMain.handle('export:file', async (_e, { defaultName, dataBase64, dataText, filters }) => {
  const res = await dialog.showSaveDialog(mainWindow, {
    title: 'Export',
    defaultPath: defaultName,
    filters: filters || [{ name: 'All Files', extensions: ['*'] }]
  });
  if (res.canceled || !res.filePath) return { canceled: true };
  try {
    if (dataBase64 != null) {
      fs.writeFileSync(res.filePath, Buffer.from(dataBase64, 'base64'));
    } else {
      fs.writeFileSync(res.filePath, dataText || '', 'utf8');
    }
    return { canceled: false, filePath: res.filePath };
  } catch (err) {
    return { canceled: true, error: String(err) };
  }
});

ipcMain.on('shell:showItem', (_e, p) => { if (p) shell.showItemInFolder(p); });

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
