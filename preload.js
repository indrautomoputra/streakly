const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  addTask: (data) => ipcRenderer.invoke('add-task', data),
  getTasks: (params) => ipcRenderer.invoke('get-tasks', params),
  completeTask: (id) => ipcRenderer.invoke('complete-task', id),
  updateTask: (data) => ipcRenderer.invoke('update-task', data),
  deleteTask: (id) => ipcRenderer.invoke('delete-task', id),
  getProjects: () => ipcRenderer.invoke('get-projects'),
  getClients: () => ipcRenderer.invoke('get-clients'),
  getUsers: () => ipcRenderer.invoke('get-users'),
  getWorkspaces: () => ipcRenderer.invoke('get-workspaces'),
  getStats: () => ipcRenderer.invoke('get-stats'),
  get30Days: () => ipcRenderer.invoke('get-30days'),
  getProfile: () => ipcRenderer.invoke('get-profile'),
  updateProfile: (data) => ipcRenderer.invoke('update-profile', data),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (data) => ipcRenderer.invoke('update-settings', data),
  resetData: () => ipcRenderer.invoke('reset-data'),
  backupDatabase: () => ipcRenderer.invoke('backup-db'),
  restoreDatabase: () => ipcRenderer.invoke('restore-db'),
  getRuntimeInfo: () => ipcRenderer.invoke('get-runtime-info'),
  exportPdf: () => ipcRenderer.invoke('export-pdf'),
  exportRegistrationPdf: (payload) => ipcRenderer.invoke('export-registration-pdf', payload),
  exportRegistrationExcel: (payload) => ipcRenderer.invoke('export-registration-excel', payload)
});
