const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  addTask: (data) => ipcRenderer.invoke('add-task', data),
  getTasks: (params) => ipcRenderer.invoke('get-tasks', params),
  completeTask: (id) => ipcRenderer.invoke('complete-task', id),
  updateTask: (data) => ipcRenderer.invoke('update-task', data),
  deleteTask: (id) => ipcRenderer.invoke('delete-task', id),
  getStats: () => ipcRenderer.invoke('get-stats'),
  get30Days: () => ipcRenderer.invoke('get-30days'),
  getProfile: () => ipcRenderer.invoke('get-profile'),
  updateProfile: (data) => ipcRenderer.invoke('update-profile', data),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (data) => ipcRenderer.invoke('update-settings', data),
  resetData: () => ipcRenderer.invoke('reset-data'),
  backupDatabase: () => ipcRenderer.invoke('backup-db'),
  restoreDatabase: () => ipcRenderer.invoke('restore-db'),
  exportPdf: () => ipcRenderer.invoke('export-pdf')
});
