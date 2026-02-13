const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const fs = require('fs');
const path = require('path');
const initSchema = require('./database/schema');
const queries = require('./database/queries');
const db = require('./database/db');
const taskService = require('./services/taskService');
const xpService = require('./services/xpService');
const analyticsService = require('./services/analyticsService');
const profileService = require('./services/profileService');

let mainWindow;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function normalizeHex(value, fallback) {
  if (typeof value !== 'string') return fallback;
  let hex = value.trim();
  if (!hex) return fallback;
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return fallback;
  return hex;
}

function clampNumber(value, fallback, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function normalizeTime(value, fallback) {
  if (typeof value !== 'string') return fallback;
  return /^\d{2}:\d{2}$/.test(value) ? value : fallback;
}

function buildReportHtml({
  profile,
  stats,
  settings,
  tasksActive,
  tasksDone,
  dailyStats,
  topSides,
  nearestDeadlines
}) {
  const now = new Date();
  const exportDate = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const xp = stats?.xp || 0;
  const level = stats?.level || 0;
  const streak = stats?.streak || 0;
  const levelStep = settings?.level_step || 100;
  const xpPerTask = settings?.xp_per_task || 10;
  const xpInLevel = xp % levelStep;
  const xpRemaining = (levelStep - xpInLevel) % levelStep;

  const tasksActiveRows = tasksActive
    .map(
      (task) => `
        <tr>
          <td>${escapeHtml(task.side || '-')}</td>
          <td>${escapeHtml(task.title)}</td>
          <td>${escapeHtml(task.detail || '-')}</td>
          <td>${formatDate(task.deadline)}</td>
        </tr>
      `
    )
    .join('');

  const tasksDoneRows = tasksDone
    .slice(0, 5)
    .map(
      (task) => `
        <tr>
          <td>${escapeHtml(task.side || '-')}</td>
          <td>${escapeHtml(task.title)}</td>
          <td>${formatDate(task.deadline)}</td>
        </tr>
      `
    )
    .join('');

  const dailyRows = dailyStats
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.date)}</td>
          <td>${row.tasks_completed}</td>
          <td>${row.xp_earned}</td>
        </tr>
      `
    )
    .join('');

  const topSideRows = topSides
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.side)}</td>
          <td>${item.count}</td>
        </tr>
      `
    )
    .join('');

  const deadlineRows = nearestDeadlines
    .map(
      (task) => `
        <tr>
          <td>${escapeHtml(task.title)}</td>
          <td>${escapeHtml(task.side || '-')}</td>
          <td>${formatDate(task.deadline)}</td>
        </tr>
      `
    )
    .join('');

  return `
  <!DOCTYPE html>
  <html lang="id">
  <head>
    <meta charset="utf-8" />
    <title>Streakly Report</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Segoe UI", Arial, sans-serif; margin: 32px; color: #0f172a; }
      h1 { font-size: 22px; margin: 0 0 6px; }
      h2 { font-size: 16px; margin: 24px 0 8px; color: #1e293b; }
      .meta { color: #475569; font-size: 12px; margin-bottom: 18px; }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
      .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #ffffff; }
      .card-title { font-size: 12px; color: #64748b; margin-bottom: 6px; }
      .card-value { font-size: 18px; font-weight: 600; }
      .split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border-bottom: 1px solid #e2e8f0; padding: 8px 6px; text-align: left; }
      th { background: #f8fafc; color: #475569; font-weight: 600; }
      .muted { color: #64748b; font-size: 12px; }
    </style>
  </head>
  <body>
    <h1>Laporan Produktivitas</h1>
    <div class="meta">Nama: ${escapeHtml(profile?.name || 'Pengguna')} • Tanggal export: ${exportDate} • Periode: 30 hari terakhir</div>

    <div class="grid">
      <div class="card">
        <div class="card-title">Total XP</div>
        <div class="card-value">XP ${xp}</div>
      </div>
      <div class="card">
        <div class="card-title">Level</div>
        <div class="card-value">${level}</div>
      </div>
      <div class="card">
        <div class="card-title">Streak</div>
        <div class="card-value">🔥 ${streak}</div>
      </div>
      <div class="card">
        <div class="card-title">Task Aktif</div>
        <div class="card-value">${tasksActive.length}</div>
      </div>
      <div class="card">
        <div class="card-title">Task Selesai</div>
        <div class="card-value">${tasksDone.length}</div>
      </div>
      <div class="card">
        <div class="card-title">XP ke Level Berikutnya</div>
        <div class="card-value">${xpRemaining}</div>
      </div>
    </div>

    <h2>Ringkasan Pengaturan</h2>
    <div class="split">
      <div class="card">
        <div class="card-title">XP per task</div>
        <div class="card-value">${xpPerTask}</div>
      </div>
      <div class="card">
        <div class="card-title">XP per level</div>
        <div class="card-value">${levelStep}</div>
      </div>
    </div>

    <h2>Task Aktif</h2>
    <table>
      <thead>
        <tr>
          <th>Side</th>
          <th>Judul</th>
          <th>Detail</th>
          <th>Deadline</th>
        </tr>
      </thead>
      <tbody>
        ${tasksActiveRows || `<tr><td colspan="4" class="muted">Tidak ada task aktif.</td></tr>`}
      </tbody>
    </table>

    <h2>Task Selesai Terbaru</h2>
    <table>
      <thead>
        <tr>
          <th>Side</th>
          <th>Judul</th>
          <th>Deadline</th>
        </tr>
      </thead>
      <tbody>
        ${tasksDoneRows || `<tr><td colspan="3" class="muted">Belum ada task selesai.</td></tr>`}
      </tbody>
    </table>

    <h2>Top Side</h2>
    <table>
      <thead>
        <tr>
          <th>Side</th>
          <th>Jumlah Task</th>
        </tr>
      </thead>
      <tbody>
        ${topSideRows || `<tr><td colspan="2" class="muted">Belum ada data side.</td></tr>`}
      </tbody>
    </table>

    <h2>Deadline Terdekat</h2>
    <table>
      <thead>
        <tr>
          <th>Judul</th>
          <th>Side</th>
          <th>Deadline</th>
        </tr>
      </thead>
      <tbody>
        ${deadlineRows || `<tr><td colspan="3" class="muted">Tidak ada deadline.</td></tr>`}
      </tbody>
    </table>

    <h2>Ringkasan 30 Hari Terakhir</h2>
    <table>
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>Task Selesai</th>
          <th>XP</th>
        </tr>
      </thead>
      <tbody>
        ${dailyRows || `<tr><td colspan="3" class="muted">Belum ada data harian.</td></tr>`}
      </tbody>
    </table>
  </body>
  </html>
  `;
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = Math.max(1100, Math.floor(width * 0.9));
  const windowHeight = Math.max(700, Math.floor(height * 0.9));
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('ui/index.html');
  mainWindow.setTitle('Streakly');
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  app.setName('Streakly');
  await initSchema();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* ================= IPC ================= */

function ipcHandle(channel, handler) {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      const data = await handler(event, ...args);
      return { ok: true, data };
    } catch (err) {
      console.error(err);
      return { ok: false, error: { message: err?.message || 'Unknown error' } };
    }
  });
}

ipcHandle('add-task', async (event, { title, deadline, side, detail, status, category }) => {
  return await taskService.addTask(title, deadline, side, detail, status, category);
});

ipcHandle('get-tasks', async (event, params) => {
  return await taskService.getTasks(params);
});

ipcHandle('complete-task', async (event, id) => {
  return await taskService.completeTask(id);
});

ipcHandle('update-task', async (event, { id, title, deadline, side, detail, status, category }) => {
  return await taskService.updateTask(id, title, deadline, side, detail, status, category);
});

ipcHandle('delete-task', async (event, id) => {
  return await taskService.deleteTask(id);
});

ipcHandle('get-stats', async () => {
  return await xpService.getStats();
});

ipcHandle('get-30days', async () => {
  return await analyticsService.getLast30Days();
});

ipcHandle('get-profile', async () => {
  return await profileService.getProfile();
});

ipcHandle('update-profile', async (event, { name, avatar, email }) => {
  return await profileService.updateProfile(name, avatar, email);
});

ipcHandle('get-settings', async () => {
  return await queries.ensureSettingsRow();
});

ipcHandle('update-settings', async (event, payload) => {
  const current = await queries.ensureSettingsRow();
  const merged = { ...current, ...(payload || {}) };
  const sanitized = {
    accent: normalizeHex(merged.accent, current.accent),
    accent_secondary: normalizeHex(merged.accent_secondary, current.accent_secondary),
    bg_primary: normalizeHex(merged.bg_primary, current.bg_primary),
    bg_secondary: normalizeHex(merged.bg_secondary, current.bg_secondary),
    bg_elevated: normalizeHex(merged.bg_elevated, current.bg_elevated),
    text_primary: normalizeHex(merged.text_primary, current.text_primary),
    text_muted: normalizeHex(merged.text_muted, current.text_muted),
    border: normalizeHex(merged.border, current.border),
    glow_intensity: clampNumber(merged.glow_intensity, current.glow_intensity, 0.08, 0.5),
    reminder_enabled: merged.reminder_enabled ? 1 : 0,
    reminder_time: normalizeTime(merged.reminder_time, current.reminder_time),
    xp_per_task: clampNumber(merged.xp_per_task, current.xp_per_task, 1, 1000),
    level_step: clampNumber(merged.level_step, current.level_step, 10, 10000),
    zoom_level: clampNumber(merged.zoom_level, current.zoom_level, 100, 150),
    glass_enabled: merged.glass_enabled ? 1 : 0
  };
  return await queries.updateSettings(sanitized);
});

ipcHandle('reset-data', async () => {
  return await queries.resetProductivityData();
});

ipcHandle('backup-db', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Backup Database',
    defaultPath: `streakly-backup-${Date.now()}.db`,
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  });
  if (canceled || !filePath) return false;
  const safePath = filePath.replace(/'/g, "''");
  await queries.run(`VACUUM INTO '${safePath}'`);
  return true;
});

ipcHandle('restore-db', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Restore Database',
    properties: ['openFile'],
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  });
  if (canceled || !filePaths || !filePaths[0]) return false;
  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  const dbPath = db.dbPath || path.join(__dirname, 'streakly.db');
  await fs.promises.copyFile(filePaths[0], dbPath);
  app.relaunch();
  app.exit(0);
  return true;
});

ipcHandle('export-pdf', async (event) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export PDF',
    defaultPath: 'streakly-report.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (canceled || !filePath) return false;
  const profile = await queries.ensureProfileRow();
  const stats = await queries.ensureStatsRow();
  const settings = await queries.ensureSettingsRow();
  const tasks = await queries.getTasks();
  const dailyStats = await queries.getLast30Days();

  const tasksActive = tasks.filter((task) => !task.done);
  const tasksDone = tasks.filter((task) => task.done);
  const sideCount = tasks.reduce((acc, task) => {
    const key = task.side || '';
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topSides = Object.entries(sideCount)
    .map(([side, count]) => ({ side, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const nearestDeadlines = tasksActive
    .filter((task) => task.deadline)
    .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''))
    .slice(0, 3);

  const html = buildReportHtml({
    profile,
    stats,
    settings,
    tasksActive,
    tasksDone,
    dailyStats,
    topSides,
    nearestDeadlines
  });

  const reportWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  await reportWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  const pdf = await reportWindow.webContents.printToPDF({
    pageSize: 'A4',
    printBackground: true
  });
  await fs.promises.writeFile(filePath, pdf);
  reportWindow.close();
  return true;
});
