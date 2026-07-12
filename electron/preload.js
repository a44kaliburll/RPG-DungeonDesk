const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desk', {
  isElectron: true,
  saveProject: (opts) => ipcRenderer.invoke('project:save', opts),
  saveProjectAs: (opts) => ipcRenderer.invoke('project:saveAs', opts),
  openProject: () => ipcRenderer.invoke('project:open'),
  exportFile: (opts) => ipcRenderer.invoke('export:file', opts),
  showItemInFolder: (p) => ipcRenderer.send('shell:showItem', p),
  onMenu: (handler) => {
    const channels = [
      'menu:new-project', 'menu:open-project', 'menu:save-project', 'menu:save-project-as',
      'menu:export-png', 'menu:export-codex', 'menu:undo', 'menu:redo', 'app:before-quit'
    ];
    channels.forEach((ch) => ipcRenderer.on(ch, () => handler(ch)));
  }
});
