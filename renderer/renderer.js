let chartInstance = null;
let editingTaskId = null;
let pendingAvatarData = null;
let currentProfile = { name: 'Raka Pratama', avatar: null };
let currentLevel = 0;
let currentSettings = {
  accent: '#7367f0',
  accent_secondary: '#9f87ff',
  bg_primary: '#f4f5fb',
  bg_secondary: '#eef0f7',
  bg_elevated: '#ffffff',
  text_primary: '#3a3541',
  text_muted: '#6f6b7d',
  border: '#e4e6ef',
  glow_intensity: 0.14,
  reminder_enabled: 0,
  reminder_time: '09:00',
  xp_per_task: 10,
  level_step: 100,
  zoom_level: 100,
  glass_enabled: 0
};
let reminderTimer = null;
let lastReminderDate = null;
let lastReminderKey = null;
const REMINDER_STORAGE_KEY = 'streakly_reminders';
let reminders = {};
let isSubmittingTask = false;
const TASK_PAGE_SIZE = 50;
let taskOffset = 0;
let taskHasMore = true;
let taskSearchQuery = '';
let calendarViewDate = new Date();
let cachedTasks = [];
let cachedDailyStats = [];
let cachedStats = {};
let lastMotivationKey = '';
const CATEGORY_STORAGE_KEY = 'streakly_categories';
const CATEGORY_TUTORIAL_KEY = 'streakly_category_tutorial';
const defaultAvatar =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%237367f0'/><stop offset='100%' stop-color='%239f87ff'/></linearGradient></defs><rect width='80' height='80' rx='40' fill='url(%23g)'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Segoe UI, Arial' font-size='30' fill='white'>R</text></svg>";

const DEFAULT_CATEGORIES = [
  { name: 'Urgent', color: '#6f67ff', icon: '⚡', label: 'Urgent - Ungu' },
  { name: 'Normal', color: '#46b3c5', icon: '✅', label: 'Normal - Hijau Tosca' },
  { name: 'Meeting', color: '#ff9a62', icon: '📌', label: 'Meeting - Oranye' },
  { name: 'Deadline', color: '#ef4444', icon: '⏰', label: 'Deadline - Merah' },
  { name: 'Personal', color: '#7c9cff', icon: '🏠', label: 'Personal - Biru' }
];

async function unwrap(promise, fallback) {
  const response = await promise;
  if (!response || response.ok !== true) {
    console.error(response?.error?.message || 'IPC error');
    return fallback;
  }
  return response.data;
}

function normalizeHex(value) {
  if (!value) return '#7367f0';
  let hex = value.trim();
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex.slice(0, 7);
}

function hexToRgb(hex) {
  const value = normalizeHex(hex).replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return { r, g, b };
}

function lightenHex(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const to = (v) => Math.round(v + (255 - v) * amount);
  const toHex = (v) => v.toString(16).padStart(2, '0');
  return `#${toHex(to(r))}${toHex(to(g))}${toHex(to(b))}`;
}

function rgbaFromHex(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

function formatShortDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loadCategories() {
  try {
    const raw = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) return [...DEFAULT_CATEGORIES];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return [...DEFAULT_CATEGORIES];
    return parsed.map((item) => ({
      name: String(item.name || '').trim() || 'General',
      color: normalizeHex(item.color || '#6f67ff'),
      icon: item.icon || '📌',
      label: item.label || `${item.name} - ${item.color}`
    }));
  } catch (err) {
    return [...DEFAULT_CATEGORIES];
  }
}

function saveCategories(list) {
  window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(list || []));
}

function getCategoryColor(name, list) {
  const categories = list || loadCategories();
  const target = categories.find(
    (item) => String(item.name || '').toLowerCase() === String(name || '').toLowerCase()
  );
  return target?.color || '#6f67ff';
}

function renderCategoryLegend(list) {
  const legend = document.getElementById('categoryLegend');
  if (!legend) return;
  const categories = list || loadCategories();
  legend.innerHTML = categories
    .map(
      (item) => `
        <div class="category-pill">
          <span style="background:${item.color}"></span>
          ${escapeHtml(item.label || item.name)}
        </div>
      `
    )
    .join('');
}

function populateCategorySelects(list) {
  const categories = list || loadCategories();
  const selects = [document.getElementById('category'), document.getElementById('calendarQuickCategory')]
    .filter(Boolean);
  selects.forEach((select) => {
    select.innerHTML = categories
      .map(
        (item) => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`
      )
      .join('');
    select.value = getDefaultCategoryName(categories);
  });
}

function renderCategoryList(list) {
  const container = document.getElementById('categoryList');
  if (!container) return;
  container.innerHTML = list
    .map(
      (item, index) => `
        <div class="category-item" draggable="true" data-index="${index}" title="Seret untuk mengurutkan">
          <div class="category-item-main">
            <span class="category-color" style="background:${item.color}"></span>
            <div>
              <div class="category-item-title">${escapeHtml(item.icon)} ${escapeHtml(item.name)}</div>
              <div class="settings-subtitle">${escapeHtml(item.label || '')}</div>
            </div>
          </div>
          <div class="category-item-actions">
            <button class="btn-ghost btn-compact" data-category-remove="${index}" title="Hapus kategori">Hapus</button>
          </div>
        </div>
      `
    )
    .join('');
}

function getDefaultCategoryName(list) {
  const categories = list || loadCategories();
  return categories[0]?.name || 'General';
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function isTaskDone(task) {
  return (
    task.done === 1 ||
    task.done === '1' ||
    task.done === true ||
    task.done === 'true' ||
    Number(task.done) === 1
  );
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callWithRetry(action, retries = 2, delayMs = 250) {
  let lastError = 'Terjadi kesalahan saat menyimpan task.';
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await action();
    if (response?.ok) return response.data;
    lastError = response?.error?.message || lastError;
    if (attempt < retries) {
      await sleep(delayMs * (attempt + 1));
    }
  }
  throw new Error(lastError);
}

function setTaskError(message) {
  const error = document.getElementById('taskError');
  if (!error) return;
  error.textContent = message;
  error.classList.remove('is-hidden');
}

function clearTaskError() {
  const error = document.getElementById('taskError');
  if (!error) return;
  error.textContent = '';
  error.classList.add('is-hidden');
}

function filterTasks(tasks, query) {
  if (!query) return tasks;
  const keyword = query.toLowerCase();
  return tasks.filter((task) => {
    const title = String(task.title || '').toLowerCase();
    const side = String(task.side || '').toLowerCase();
    const detail = String(task.detail || '').toLowerCase();
    const status = String(task.status || '').toLowerCase();
    const category = String(task.category || '').toLowerCase();
    return (
      title.includes(keyword) ||
      side.includes(keyword) ||
      detail.includes(keyword) ||
      status.includes(keyword) ||
      category.includes(keyword)
    );
  });
}

function applyThemeFromSettings(settings) {
  const accent = normalizeHex(settings.accent);
  const accent2 = settings.accent_secondary
    ? normalizeHex(settings.accent_secondary)
    : lightenHex(accent, 0.18);
  const bgPrimary = normalizeHex(settings.bg_primary || '#f4f5fb');
  const bgSecondary = normalizeHex(settings.bg_secondary || '#eef0f7');
  const bgElevated = normalizeHex(settings.bg_elevated || '#ffffff');
  const textPrimary = normalizeHex(settings.text_primary || '#3a3541');
  const textMuted = normalizeHex(settings.text_muted || '#6f6b7d');
  const border = normalizeHex(settings.border || '#e4e6ef');
  const gradient1 = lightenHex(bgSecondary, 0.06);
  const gradient2 = bgSecondary;
  const gradient3 = bgPrimary;
  const glowStrength = Math.min(
    0.5,
    Math.max(0.08, Number(settings.glow_intensity) || 0.14)
  );
  const rgb = hexToRgb(accent);
  const surfaceRgb = hexToRgb(bgElevated);
  const root = document.documentElement;
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-2', accent2);
  root.style.setProperty('--accent-primary', accent);
  root.style.setProperty('--accent-secondary', accent2);
  root.style.setProperty('--bg-primary', bgPrimary);
  root.style.setProperty('--bg-secondary', bgSecondary);
  root.style.setProperty('--bg-elevated', bgElevated);
  root.style.setProperty('--bg-card', bgElevated);
  root.style.setProperty('--text-primary', textPrimary);
  root.style.setProperty('--text-muted', textMuted);
  root.style.setProperty('--border', border);
  root.style.setProperty('--bg-gradient-1', gradient1);
  root.style.setProperty('--bg-gradient-2', gradient2);
  root.style.setProperty('--bg-gradient-3', gradient3);
  root.style.setProperty('--glow', `0 0 24px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glowStrength})`);
  root.style.setProperty('--surface-base', `${surfaceRgb.r} ${surfaceRgb.g} ${surfaceRgb.b}`);
}

function applyDisplayPreferences(settings) {
  const zoom = Number(settings.zoom_level) || 100;
  document.body.style.zoom = `${zoom}%`;
  const opacity = settings.glass_enabled ? 0.85 : 1;
  document.documentElement.style.setProperty('--surface-opacity', String(opacity));
  document.body.classList.toggle('glass-on', Boolean(settings.glass_enabled));
}

function hydrateSettingsForm(settings) {
  const accentInput = document.getElementById('accentInput');
  const accentSecondaryInput = document.getElementById('accentSecondaryInput');
  const bgPrimaryInput = document.getElementById('bgPrimaryInput');
  const bgSecondaryInput = document.getElementById('bgSecondaryInput');
  const bgElevatedInput = document.getElementById('bgElevatedInput');
  const textPrimaryInput = document.getElementById('textPrimaryInput');
  const textMutedInput = document.getElementById('textMutedInput');
  const borderInput = document.getElementById('borderInput');
  const glowInput = document.getElementById('glowInput');
  const glowValue = document.getElementById('glowValue');
  const xpPerTask = document.getElementById('xpPerTask');
  const levelStep = document.getElementById('levelStep');
  const zoomSelect = document.getElementById('zoomSelect');
  const glassToggle = document.getElementById('glassToggle');

  if (accentInput) accentInput.value = normalizeHex(settings.accent);
  if (accentSecondaryInput) {
    accentSecondaryInput.value = normalizeHex(
      settings.accent_secondary || lightenHex(settings.accent, 0.18)
    );
  }
  if (bgPrimaryInput) bgPrimaryInput.value = normalizeHex(settings.bg_primary || '#f4f5fb');
  if (bgSecondaryInput) bgSecondaryInput.value = normalizeHex(settings.bg_secondary || '#eef0f7');
  if (bgElevatedInput) bgElevatedInput.value = normalizeHex(settings.bg_elevated || '#ffffff');
  if (textPrimaryInput) textPrimaryInput.value = normalizeHex(settings.text_primary || '#3a3541');
  if (textMutedInput) textMutedInput.value = normalizeHex(settings.text_muted || '#6f6b7d');
  if (borderInput) borderInput.value = normalizeHex(settings.border || '#e4e6ef');
  if (glowInput) glowInput.value = Number(settings.glow_intensity || 0.14).toFixed(2);
  if (glowValue) glowValue.textContent = Number(settings.glow_intensity || 0.14).toFixed(2);
  if (xpPerTask) xpPerTask.value = settings.xp_per_task || 10;
  if (levelStep) levelStep.value = settings.level_step || 100;
  if (zoomSelect) zoomSelect.value = String(settings.zoom_level || 100);
  if (glassToggle) glassToggle.checked = Boolean(settings.glass_enabled);
}

function loadReminders() {
  try {
    const raw = window.localStorage.getItem(REMINDER_STORAGE_KEY);
    reminders = raw ? JSON.parse(raw) : {};
  } catch (err) {
    reminders = {};
  }
  return reminders;
}

function saveReminders() {
  window.localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(reminders || {}));
}

function ensureLegacyReminder(settings) {
  if (!settings.reminder_enabled || !settings.reminder_time) return;
  const today = new Date().toISOString().split('T')[0];
  if (!reminders[today]) {
    reminders[today] = settings.reminder_time;
    saveReminders();
  }
}

function updateCalendarReminderIndicators() {
  const days = document.querySelectorAll('.panel-day[data-reminder-date]');
  days.forEach((day) => {
    const date = day.getAttribute('data-reminder-date');
    const icon = day.querySelector('.panel-reminder');
    if (!icon || !date) return;
    icon.classList.toggle('is-hidden', !reminders[date]);
  });
}

function scheduleReminder() {
  if (reminderTimer) {
    clearInterval(reminderTimer);
    reminderTimer = null;
  }
  reminderTimer = setInterval(() => {
    checkReminder();
  }, 60000);
  checkReminder();
}

function checkReminder() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const timeValue = reminders[today];
  if (!timeValue) return;
  const current = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
  if (current !== timeValue) return;
  const key = `${today}-${timeValue}`;
  if (lastReminderKey === key) return;
  lastReminderKey = key;
  lastReminderDate = today;
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('Waktunya fokus', { body: 'Yuk selesaikan satu task hari ini.' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('Waktunya fokus', { body: 'Yuk selesaikan satu task hari ini.' });
        }
      });
    }
  }
}

async function loadSettings() {
  const settings = await unwrap(window.api.getSettings(), null);
  const safe = {
    ...currentSettings,
    ...(settings || {})
  };
  safe.accent = normalizeHex(safe.accent);
  safe.accent_secondary = safe.accent_secondary
    ? normalizeHex(safe.accent_secondary)
    : lightenHex(safe.accent, 0.18);
  safe.bg_primary = normalizeHex(safe.bg_primary || '#f4f5fb');
  safe.bg_secondary = normalizeHex(safe.bg_secondary || '#eef0f7');
  safe.bg_elevated = normalizeHex(safe.bg_elevated || '#ffffff');
  safe.text_primary = normalizeHex(safe.text_primary || '#3a3541');
  safe.text_muted = normalizeHex(safe.text_muted || '#6f6b7d');
  safe.border = normalizeHex(safe.border || '#e4e6ef');
  safe.glow_intensity = Number(safe.glow_intensity) || 0.14;
  safe.reminder_enabled = safe.reminder_enabled ? 1 : 0;
  safe.reminder_time = safe.reminder_time || '09:00';
  safe.xp_per_task = Number(safe.xp_per_task) || 10;
  safe.level_step = Number(safe.level_step) || 100;
  safe.zoom_level = Number(safe.zoom_level) || 100;
  safe.glass_enabled = safe.glass_enabled ? 1 : 0;
  currentSettings = safe;
  applyThemeFromSettings(safe);
  applyDisplayPreferences(safe);
  hydrateSettingsForm(safe);
  loadReminders();
  ensureLegacyReminder(safe);
  updateCalendarReminderIndicators();
  scheduleReminder();
  return safe;
}

function setupSettings() {
  loadSettings().then(() => refreshAll());
  const accentInput = document.getElementById('accentInput');
  const accentSecondaryInput = document.getElementById('accentSecondaryInput');
  const bgPrimaryInput = document.getElementById('bgPrimaryInput');
  const bgSecondaryInput = document.getElementById('bgSecondaryInput');
  const bgElevatedInput = document.getElementById('bgElevatedInput');
  const textPrimaryInput = document.getElementById('textPrimaryInput');
  const textMutedInput = document.getElementById('textMutedInput');
  const borderInput = document.getElementById('borderInput');
  const glowInput = document.getElementById('glowInput');
  const glowValue = document.getElementById('glowValue');
  const zoomSelect = document.getElementById('zoomSelect');
  const glassToggle = document.getElementById('glassToggle');
  const saveButton = document.getElementById('settingsSave');
  const resetButton = document.getElementById('resetData');
  const backupButton = document.getElementById('backupData');
  const restoreButton = document.getElementById('restoreData');
  const exportButton = document.getElementById('exportPdf');
  const paletteGrid = document.getElementById('paletteGrid');
  const themeToggle = document.getElementById('themeToggle');
  const themePanel = document.getElementById('themePanel');
  const settingsTabs = document.querySelectorAll('[data-settings-tab]');
  const settingsPanels = document.querySelectorAll('[data-settings-panel]');

  const palettes = {
    materio: {
      accent: '#7367f0',
      accent_secondary: '#9f87ff',
      bg_primary: '#f4f5fb',
      bg_secondary: '#eef0f7',
      bg_elevated: '#ffffff',
      text_primary: '#3a3541',
      text_muted: '#6f6b7d',
      border: '#e4e6ef',
      glow_intensity: 0.14
    },
    forest: {
      accent: '#65d48f',
      accent_secondary: '#3fbf9b',
      bg_primary: '#0f1b16',
      bg_secondary: '#152822',
      bg_elevated: '#1c352c',
      text_primary: '#e3f6ef',
      text_muted: '#9dc7b6',
      border: '#22372e',
      glow_intensity: 0.16
    },
    sunset: {
      accent: '#ff9a62',
      accent_secondary: '#ff6f91',
      bg_primary: '#1a1412',
      bg_secondary: '#2a1c1a',
      bg_elevated: '#3a2420',
      text_primary: '#ffece3',
      text_muted: '#e0b8a7',
      border: '#3b2a24',
      glow_intensity: 0.2
    },
    ocean: {
      accent: '#5cb8ff',
      accent_secondary: '#5fe0d3',
      bg_primary: '#0f1623',
      bg_secondary: '#142033',
      bg_elevated: '#1a2941',
      text_primary: '#e6f2ff',
      text_muted: '#a7bdd6',
      border: '#1f2f46',
      glow_intensity: 0.18
    },
    lavender: {
      accent: '#b395ff',
      accent_secondary: '#8fd3ff',
      bg_primary: '#161421',
      bg_secondary: '#221f33',
      bg_elevated: '#2c2844',
      text_primary: '#f1edff',
      text_muted: '#b7a8d7',
      border: '#302a4a',
      glow_intensity: 0.17
    }
  };

  const buildThemePayload = () => ({
    accent: normalizeHex(accentInput?.value || currentSettings.accent),
    accent_secondary: normalizeHex(
      accentSecondaryInput?.value || currentSettings.accent_secondary
    ),
    bg_primary: normalizeHex(bgPrimaryInput?.value || currentSettings.bg_primary),
    bg_secondary: normalizeHex(bgSecondaryInput?.value || currentSettings.bg_secondary),
    bg_elevated: normalizeHex(bgElevatedInput?.value || currentSettings.bg_elevated),
    text_primary: normalizeHex(textPrimaryInput?.value || currentSettings.text_primary),
    text_muted: normalizeHex(textMutedInput?.value || currentSettings.text_muted),
    border: normalizeHex(borderInput?.value || currentSettings.border),
    glow_intensity: Number(glowInput?.value || currentSettings.glow_intensity || 0.14)
  });

  const previewTheme = () => {
    const payload = buildThemePayload();
    if (glowValue) glowValue.textContent = Number(payload.glow_intensity || 0.14).toFixed(2);
    applyThemeFromSettings({ ...currentSettings, ...payload });
  };

  const applyPaletteToInputs = (palette) => {
    if (!palette) return;
    if (accentInput) accentInput.value = normalizeHex(palette.accent);
    if (accentSecondaryInput) accentSecondaryInput.value = normalizeHex(palette.accent_secondary);
    if (bgPrimaryInput) bgPrimaryInput.value = normalizeHex(palette.bg_primary);
    if (bgSecondaryInput) bgSecondaryInput.value = normalizeHex(palette.bg_secondary);
    if (bgElevatedInput) bgElevatedInput.value = normalizeHex(palette.bg_elevated);
    if (textPrimaryInput) textPrimaryInput.value = normalizeHex(palette.text_primary);
    if (textMutedInput) textMutedInput.value = normalizeHex(palette.text_muted);
    if (borderInput) borderInput.value = normalizeHex(palette.border);
    if (glowInput) glowInput.value = String(palette.glow_intensity ?? 0.14);
    if (glowValue) glowValue.textContent = Number(palette.glow_intensity ?? 0.14).toFixed(2);
    applyThemeFromSettings({ ...currentSettings, ...palette });
  };

  if (paletteGrid) {
    paletteGrid.addEventListener('click', (event) => {
      const button = event.target.closest('[data-palette]');
      if (!button) return;
      const key = button.getAttribute('data-palette');
      const palette = key ? palettes[key] : null;
      if (!palette) return;
      paletteGrid.querySelectorAll('.palette-card').forEach((item) => {
        item.classList.toggle('active', item === button);
      });
      applyPaletteToInputs(palette);
    });
  }

  if (accentInput) {
    accentInput.addEventListener('input', () => {
      previewTheme();
    });
  }

  if (accentSecondaryInput) {
    accentSecondaryInput.addEventListener('input', () => {
      previewTheme();
    });
  }

  if (bgPrimaryInput) {
    bgPrimaryInput.addEventListener('input', () => {
      previewTheme();
    });
  }

  if (bgSecondaryInput) {
    bgSecondaryInput.addEventListener('input', () => {
      previewTheme();
    });
  }

  if (bgElevatedInput) {
    bgElevatedInput.addEventListener('input', () => {
      previewTheme();
    });
  }

  if (textPrimaryInput) {
    textPrimaryInput.addEventListener('input', () => {
      previewTheme();
    });
  }

  if (textMutedInput) {
    textMutedInput.addEventListener('input', () => {
      previewTheme();
    });
  }

  if (borderInput) {
    borderInput.addEventListener('input', () => {
      previewTheme();
    });
  }

  if (glowInput) {
    glowInput.addEventListener('input', () => {
      previewTheme();
    });
  }

  if (zoomSelect) {
    zoomSelect.addEventListener('change', () => {
      const zoomValue = Number(zoomSelect.value || 100);
      applyDisplayPreferences({ ...currentSettings, zoom_level: zoomValue, glass_enabled: glassToggle?.checked ? 1 : 0 });
    });
  }

  if (glassToggle) {
    glassToggle.addEventListener('change', () => {
      applyDisplayPreferences({ ...currentSettings, zoom_level: Number(zoomSelect?.value || currentSettings.zoom_level || 100), glass_enabled: glassToggle.checked ? 1 : 0 });
    });
  }

  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      const themePayload = buildThemePayload();
      const zoomValue = Number(zoomSelect?.value || currentSettings.zoom_level || 100);
      const glassEnabled = glassToggle?.checked ? 1 : 0;

      const payload = {
        ...themePayload,
        xp_per_task: currentSettings.xp_per_task,
        level_step: currentSettings.level_step,
        zoom_level: zoomValue,
        glass_enabled: glassEnabled
      };

      await unwrap(window.api.updateSettings(payload), null);
      await loadSettings();
      await refreshAll();
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', async () => {
      const confirmed = window.confirm(
        'Reset data akan menghapus semua task, streak, dan statistik. Lanjutkan?'
      );
      if (!confirmed) return;
      await unwrap(window.api.resetData(), false);
      await refreshAll();
    });
  }

  if (backupButton) {
    backupButton.addEventListener('click', async () => {
      const ok = await unwrap(window.api.backupDatabase(), false);
      if (ok) window.alert('Backup berhasil disimpan.');
    });
  }

  if (restoreButton) {
    restoreButton.addEventListener('click', async () => {
      const confirmed = window.confirm(
        'Restore akan mengganti database saat ini dan aplikasi akan restart. Lanjutkan?'
      );
      if (!confirmed) return;
      await unwrap(window.api.restoreDatabase(), false);
    });
  }

  if (exportButton) {
    exportButton.addEventListener('click', async () => {
      const ok = await unwrap(window.api.exportPdf(), false);
      if (ok) window.alert('PDF berhasil diexport.');
    });
  }

  if (themeToggle && themePanel) {
    themeToggle.addEventListener('click', () => {
      themePanel.classList.toggle('is-hidden');
    });
  }

  const applyHashTab = () => {
    const hash = window.location.hash.replace('#', '');
    if (!hash.startsWith('settings/')) return;
    const target = hash.split('/')[1];
    if (!target) return;
    settingsTabs.forEach((tab) => {
      tab.classList.toggle('is-active', tab.getAttribute('data-settings-tab') === target);
    });
    settingsPanels.forEach((panel) => {
      panel.classList.toggle(
        'is-active',
        panel.getAttribute('data-settings-panel') === target
      );
    });
  };

  if (settingsTabs.length) {
    settingsTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-settings-tab');
        if (target) {
          window.location.hash = `settings/${target}`;
        }
        settingsTabs.forEach((item) => {
          item.classList.toggle('is-active', item === tab);
        });
        settingsPanels.forEach((panel) => {
          panel.classList.toggle('is-active', panel.getAttribute('data-settings-panel') === target);
        });
      });
    });
    applyHashTab();
    window.addEventListener('hashchange', applyHashTab);
  }

  const settingsLinks = document.querySelectorAll('[data-settings-link]');
  settingsLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const target = link.getAttribute('data-settings-link');
      if (!target) return;
      window.location.hash = `settings/${target}`;
      applyHashTab();
    });
  });
}

function setupCategoryManager() {
  const tutorial = document.getElementById('categoryTutorial');
  const tutorialClose = document.getElementById('categoryTutorialClose');
  const nameInput = document.getElementById('categoryNameInput');
  const colorInput = document.getElementById('categoryColorInput');
  const addButton = document.getElementById('categoryAddButton');
  const listContainer = document.getElementById('categoryList');
  const templateButtons = document.querySelectorAll('[data-category-template]');

  let categories = loadCategories();
  populateCategorySelects(categories);
  renderCategoryLegend(categories);
  renderCategoryList(categories);

  const tutorialSeen = window.localStorage.getItem(CATEGORY_TUTORIAL_KEY) === '1';
  if (tutorial) tutorial.classList.toggle('is-hidden', tutorialSeen);
  if (tutorialClose) {
    tutorialClose.addEventListener('click', () => {
      window.localStorage.setItem(CATEGORY_TUTORIAL_KEY, '1');
      if (tutorial) tutorial.classList.add('is-hidden');
    });
  }

  const updateCategories = (next) => {
    categories = next;
    saveCategories(categories);
    populateCategorySelects(categories);
    renderCategoryLegend(categories);
    renderCategoryList(categories);
    renderMonthCalendar(cachedTasks);
  };

  if (addButton && nameInput && colorInput) {
    addButton.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name) return;
      const color = normalizeHex(colorInput.value || '#6f67ff');
      const exists = categories.some(
        (item) => item.name.toLowerCase() === name.toLowerCase()
      );
      if (exists) return;
      const next = [
        ...categories,
        { name, color, icon: '🏷️', label: `${name}` }
      ];
      updateCategories(next);
      nameInput.value = '';
    });
  }

  templateButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const template = button.getAttribute('data-category-template');
      const presets =
        template === 'office'
          ? [
              { name: 'Meeting', color: '#ff9a62', icon: '📌', label: 'Meeting - Oranye' },
              { name: 'Deadline', color: '#ef4444', icon: '⏰', label: 'Deadline - Merah' },
              { name: 'Normal', color: '#46b3c5', icon: '✅', label: 'Normal - Hijau Tosca' }
            ]
          : [
              { name: 'Personal', color: '#7c9cff', icon: '🏠', label: 'Personal - Biru' },
              { name: 'Health', color: '#22c55e', icon: '💪', label: 'Health - Hijau' }
            ];
      const merged = [...categories];
      presets.forEach((preset) => {
        if (!merged.some((item) => item.name.toLowerCase() === preset.name.toLowerCase())) {
          merged.push(preset);
        }
      });
      updateCategories(merged);
    });
  });

  if (listContainer) {
    let dragIndex = null;
    listContainer.addEventListener('dragstart', (event) => {
      const item = event.target.closest('.category-item');
      if (!item) return;
      dragIndex = Number(item.dataset.index);
      event.dataTransfer.effectAllowed = 'move';
    });
    listContainer.addEventListener('dragover', (event) => {
      event.preventDefault();
    });
    listContainer.addEventListener('drop', (event) => {
      event.preventDefault();
      const item = event.target.closest('.category-item');
      if (!item) return;
      const targetIndex = Number(item.dataset.index);
      if (Number.isNaN(dragIndex) || Number.isNaN(targetIndex) || dragIndex === targetIndex) return;
      const next = [...categories];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      updateCategories(next);
      dragIndex = null;
    });
    listContainer.addEventListener('click', (event) => {
      const button = event.target.closest('[data-category-remove]');
      if (!button) return;
      const index = Number(button.getAttribute('data-category-remove'));
      if (Number.isNaN(index)) return;
      const next = categories.filter((_, i) => i !== index);
      updateCategories(next.length ? next : [...DEFAULT_CATEGORIES]);
    });
  }
}

function setupTopbar() {
  const searchToggle = document.getElementById('searchToggle');
  const searchDropdown = document.getElementById('searchDropdown');
  const searchInput = document.getElementById('searchInput');
  if (searchToggle && searchDropdown) {
    searchToggle.addEventListener('click', () => {
      searchDropdown.classList.toggle('is-hidden');
      if (!searchDropdown.classList.contains('is-hidden')) {
        searchInput?.focus();
      }
    });
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (searchDropdown.contains(target) || searchToggle.contains(target)) return;
      searchDropdown.classList.add('is-hidden');
    });
  }
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      taskSearchQuery = searchInput.value.trim();
      refreshAll();
    });
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        searchInput.value = '';
        taskSearchQuery = '';
        refreshAll();
        searchDropdown?.classList.add('is-hidden');
      }
    });
  }
}

function setupReminderCalendar() {
  const modal = document.getElementById('reminderModal');
  const dateInput = document.getElementById('reminderDateInput');
  const timeInput = document.getElementById('reminderTimeInput');
  const saveButton = document.getElementById('reminderSave');
  const removeButton = document.getElementById('reminderRemove');
  if (!modal || !dateInput || !timeInput) return;
  const backdrop = modal.querySelector('[data-close="reminder"]');

  const openModal = (date) => {
    dateInput.value = date || new Date().toISOString().split('T')[0];
    timeInput.value = reminders[dateInput.value] || currentSettings.reminder_time || '09:00';
    modal.classList.remove('is-hidden');
  };

  const closeModal = () => {
    modal.classList.add('is-hidden');
  };

  if (backdrop) backdrop.addEventListener('click', closeModal);

  document.querySelectorAll('.panel-day[data-reminder-date]').forEach((day) => {
    day.addEventListener('click', () => {
      const date = day.getAttribute('data-reminder-date');
      if (date) openModal(date);
    });
  });

  if (saveButton) {
    saveButton.addEventListener('click', () => {
      const dateValue = dateInput.value;
      const timeValue = timeInput.value || '09:00';
      if (!dateValue) return;
      reminders[dateValue] = timeValue;
      saveReminders();
      updateCalendarReminderIndicators();
      scheduleReminder();
      closeModal();
    });
  }

  if (removeButton) {
    removeButton.addEventListener('click', () => {
      const dateValue = dateInput.value;
      if (!dateValue) return;
      delete reminders[dateValue];
      saveReminders();
      updateCalendarReminderIndicators();
      scheduleReminder();
      closeModal();
    });
  }
}

async function loadTasks(options = {}) {
  const { append = false } = options;
  const container = document.getElementById('tasks');
  if (!container) return;
  if (!append) {
    container.innerHTML = '';
    taskOffset = 0;
    taskHasMore = true;
  }
  const baseTasks = taskSearchQuery
    ? await unwrap(window.api.getTasks(), [])
    : await unwrap(
        window.api.getTasks({ limit: TASK_PAGE_SIZE, offset: taskOffset }),
        []
      );
  const tasks = filterTasks(baseTasks, taskSearchQuery);

  if (!tasks.length) {
    container.innerHTML = `
      <div class="task-item">
        <div class="task-main">
          <div class="task-title">Belum ada task yang cocok</div>
          <div class="task-detail">Coba kata kunci lain atau tambah task baru.</div>
        </div>
      </div>
    `;
  }

  tasks.forEach((task) => {
    const div = document.createElement('div');
    div.className = 'task-item';
    const main = document.createElement('div');
    main.className = 'task-main';
    const title = document.createElement('div');
    title.className = 'task-title';
    const meta = document.createElement('div');
    meta.className = 'task-meta';
    const actions = document.createElement('div');
    actions.className = 'task-actions';
    title.textContent = task.title;
    const isDone = isTaskDone(task);
    const rawStatus = typeof task.status === 'string' ? task.status.trim() : '';
    const statusLabel = isDone ? '✅ Selesai' : rawStatus ? `🧭 ${rawStatus}` : '⏳ Berjalan';
    const statusItem = document.createElement('span');
    statusItem.className = 'task-meta-item';
    statusItem.textContent = statusLabel;
    meta.appendChild(statusItem);
    if (task.deadline) {
      const deadlineItem = document.createElement('span');
      deadlineItem.className = 'task-meta-item';
      deadlineItem.textContent = `Deadline ${task.deadline}`;
      meta.appendChild(deadlineItem);
    }
    if (task.side) {
      const sideItem = document.createElement('span');
      sideItem.className = 'tag';
      sideItem.textContent = `Side: ${task.side}`;
      meta.appendChild(sideItem);
    }
    if (task.category) {
      const categoryItem = document.createElement('span');
      const categoryColor = getCategoryColor(task.category);
      categoryItem.className = 'tag tag-category';
      categoryItem.textContent = `Kategori: ${task.category}`;
      categoryItem.style.borderColor = categoryColor;
      categoryItem.style.color = categoryColor;
      categoryItem.style.background = rgbaFromHex(categoryColor, 0.12);
      meta.appendChild(categoryItem);
    }
    main.appendChild(title);
    if (task.detail) {
      const detail = document.createElement('div');
      detail.className = 'task-detail';
      detail.textContent = task.detail;
      main.appendChild(detail);
    }
    main.appendChild(meta);
    div.appendChild(main);
    if (!isDone) {
      const button = document.createElement('button');
      button.textContent = 'Done';
      button.className = 'btn-small';
      button.addEventListener('click', () => completeTask(task.id));
      actions.appendChild(button);
    }
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'btn-small';
    editButton.addEventListener('click', () => startEdit(task));
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Hapus';
    deleteButton.className = 'btn-small';
    deleteButton.addEventListener('click', () => deleteTask(task.id));
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    div.appendChild(actions);
    container.appendChild(div);
  });
  taskOffset += tasks.length;
  taskHasMore = !taskSearchQuery && tasks.length === TASK_PAGE_SIZE;
  const loadMoreButton = document.getElementById('tasksLoadMore');
  if (loadMoreButton) {
    loadMoreButton.classList.toggle('is-hidden', !taskHasMore);
    loadMoreButton.disabled = !taskHasMore;
  }
  return tasks;
}

async function addTask() {
  const sideInput = document.getElementById('side');
  const statusInput = document.getElementById('status');
  const categoryInput = document.getElementById('category');
  const titleInput = document.getElementById('title');
  const detailInput = document.getElementById('detail');
  const deadlineInput = document.getElementById('deadline');
  const addButton = document.getElementById('addButton');
  if (!titleInput || !detailInput || !deadlineInput || !sideInput || !statusInput || !categoryInput) return;

  const side = sideInput.value.trim();
  const status = statusInput.value.trim();
  const category = categoryInput.value.trim();
  const title = titleInput.value.trim();
  const detail = detailInput.value.trim();
  const deadline = deadlineInput.value;

  clearTaskError();
  if (isSubmittingTask) return;
  if (!title) {
    setTaskError('Judul task wajib diisi.');
    return;
  }
  if (title.length > 120) {
    setTaskError('Judul task maksimal 120 karakter.');
    return;
  }
  if (detail.length > 280) {
    setTaskError('Detail task maksimal 280 karakter.');
    return;
  }
  if (side.length > 60) {
    setTaskError('Nama side maksimal 60 karakter.');
    return;
  }

  isSubmittingTask = true;
  if (addButton) {
    addButton.disabled = true;
    addButton.textContent = editingTaskId ? 'Menyimpan...' : 'Menyimpan...';
  }

  try {
    if (editingTaskId) {
      await callWithRetry(() =>
        window.api.updateTask({
          id: editingTaskId,
          title,
          deadline: deadline || null,
          side: side || null,
          detail: detail || null,
          status: status || null,
          category: category || null
        })
      );
      resetEditMode();
    } else {
      await callWithRetry(() =>
        window.api.addTask({
          title,
          deadline,
          side: side || null,
          detail: detail || null,
          status: status || null,
          category: category || null
        })
      );
    }
    sideInput.value = '';
    statusInput.value = 'To Do';
    categoryInput.value = getDefaultCategoryName();
    titleInput.value = '';
    detailInput.value = '';
    deadlineInput.value = '';
    await refreshAll();
  } catch (err) {
    console.error(err);
    setTaskError(err?.message || 'Gagal menyimpan task. Coba lagi.');
  } finally {
    isSubmittingTask = false;
    if (addButton) {
      addButton.disabled = false;
      addButton.textContent = editingTaskId ? 'Simpan' : 'Add';
    }
  }
}

async function completeTask(id) {
  await unwrap(window.api.completeTask(id), false);
  await refreshAll();
}

function startEdit(task) {
  editingTaskId = task.id;
  document.getElementById('side').value = task.side || '';
  document.getElementById('status').value = task.status || 'To Do';
  document.getElementById('category').value = task.category || getDefaultCategoryName();
  document.getElementById('title').value = task.title;
  document.getElementById('detail').value = task.detail || '';
  document.getElementById('deadline').value = task.deadline || '';
  const addButton = document.getElementById('addButton');
  const cancelButton = document.getElementById('cancelEdit');
  if (addButton) addButton.textContent = 'Simpan';
  if (cancelButton) cancelButton.classList.remove('is-hidden');
}

function resetEditMode() {
  editingTaskId = null;
  const addButton = document.getElementById('addButton');
  const cancelButton = document.getElementById('cancelEdit');
  if (addButton) addButton.textContent = 'Add';
  if (cancelButton) cancelButton.classList.add('is-hidden');
}

function cancelEdit() {
  const sideInput = document.getElementById('side');
  const statusInput = document.getElementById('status');
  const categoryInput = document.getElementById('category');
  const titleInput = document.getElementById('title');
  const detailInput = document.getElementById('detail');
  const deadlineInput = document.getElementById('deadline');
  if (sideInput) sideInput.value = '';
  if (statusInput) statusInput.value = 'To Do';
  if (categoryInput) categoryInput.value = getDefaultCategoryName();
  if (titleInput) titleInput.value = '';
  if (detailInput) detailInput.value = '';
  if (deadlineInput) deadlineInput.value = '';
  clearTaskError();
  resetEditMode();
}

async function deleteTask(id) {
  const confirmed = window.confirm('Hapus task ini?');
  if (!confirmed) return;
  await unwrap(window.api.deleteTask(id), false);
  if (editingTaskId === id) {
    resetEditMode();
  }
  await refreshAll();
}

async function loadStats() {
  const stats = await unwrap(window.api.getStats(), { xp: 0, level: 0, streak: 0 });
  const levelBadge = document.getElementById('levelBadge');
  const levelPill = document.getElementById('levelPill');
  const streakPill = document.getElementById('streakPill');
  const streakCard = document.getElementById('streakCard');
  const levelCard = document.getElementById('levelCard');
  const xpText = document.getElementById('xpText');
  const streakText = document.getElementById('streakText');
  const xpProgress = document.getElementById('xpProgress');
  const levelSubtitle = document.getElementById('levelSubtitle');

  const xp = stats.xp || 0;
  const level = stats.level || 0;
  const streak = stats.streak || 0;
  const levelStep = stats.level_step || currentSettings.level_step || 100;
  const xpInLevel = xp % levelStep;
  const progress = Math.min(100, Math.max(0, (xpInLevel / levelStep) * 100));
  currentLevel = level;

  document.getElementById('stats').innerHTML = `XP ${xp}`;
  if (levelBadge) levelBadge.textContent = level;
  if (levelPill) levelPill.textContent = level;
  if (streakPill) streakPill.textContent = `🔥 ${streak}`;
  if (streakCard) streakCard.textContent = `🔥 ${streak}`;
  if (levelCard) levelCard.textContent = level;
  if (xpText) xpText.textContent = `XP ${xpInLevel}/${levelStep}`;
  if (streakText) streakText.textContent = `🔥 ${streak}`;
  if (xpProgress) xpProgress.style.width = `${progress}%`;
  if (levelSubtitle) levelSubtitle.textContent = `Naik level tiap ${levelStep} XP`;
  updateGreeting();
  return stats;
}

async function loadChart() {
  const data = await unwrap(window.api.get30Days(), []);
  const ctx = document.getElementById('chart');
  if (!ctx) return data;
  if (chartInstance) {
    chartInstance.destroy();
  }
  const accent = currentSettings.accent || '#7367f0';
  const accent2 = currentSettings.accent_secondary || '#9f87ff';
  const chartCtx = ctx.getContext('2d');
  let fillColor = accent;
  if (chartCtx) {
    const gradient = chartCtx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, rgbaFromHex(accent, 0.28));
    gradient.addColorStop(1, rgbaFromHex(accent2, 0.02));
    fillColor = gradient;
  }
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map((d) => d.date),
      datasets: [{
        label: 'XP Earned',
        data: data.map((d) => d.xp_earned),
        borderColor: accent,
        backgroundColor: fillColor,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: accent2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: currentSettings.text_muted }
        },
        y: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { color: currentSettings.text_muted }
        }
      }
    }
  });
  return data;
}

function buildSideSummary(tasks) {
  const map = new Map();
  tasks.forEach((task) => {
    const side = (task.side || '').trim() || 'General';
    const entry = map.get(side) || { side, total: 0, done: 0 };
    entry.total += 1;
    if (isTaskDone(task)) entry.done += 1;
    map.set(side, entry);
  });
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function renderDashboardSummary(tasks, stats, dailyStats) {
  const dashboardTasks = document.getElementById('dashboardTasks');
  const projectCards = document.getElementById('projectCards');
  const insightText = document.getElementById('insightText');
  const totalTasks = dailyStats.reduce((acc, row) => acc + (row.tasks_completed || 0), 0);
  const activeDays = dailyStats.filter(
    (row) => (row.tasks_completed || 0) > 0 || (row.xp_earned || 0) > 0
  ).length;
  const last7 = dailyStats.slice(-7);
  const weekXp = last7.reduce((acc, row) => acc + (row.xp_earned || 0), 0);

  setText('weekXp', `XP ${formatNumber(weekXp)}`);
  setText('tasks30', formatNumber(totalTasks));
  setText('activeDays', formatNumber(activeDays));

  if (insightText) {
    const streak = stats?.streak || 0;
    if (activeDays === 0) {
      insightText.textContent = 'Mulai dengan satu task kecil hari ini.';
    } else if (streak >= 7) {
      insightText.textContent = `Streak ${streak} hari, pertahankan ritme ini.`;
    } else {
      insightText.textContent = `Kamu aktif ${activeDays} hari dalam 30 hari terakhir.`;
    }
  }

  if (dashboardTasks) {
    const today = getTodayString();
    const pendingTasks = tasks.filter((task) => !isTaskDone(task));
    const todayTasks = pendingTasks.filter((task) => task.deadline === today);
    const list = (todayTasks.length ? todayTasks : pendingTasks).slice(0, 3);
    if (!list.length) {
      dashboardTasks.innerHTML = `
        <div class="task-mini">
          <div class="task-mini-info">
            <div class="task-mini-title">Belum ada task hari ini</div>
            <div class="task-mini-meta">Tambahkan task baru untuk mulai</div>
          </div>
          <div class="task-mini-status"> </div>
        </div>
      `;
    } else {
      dashboardTasks.innerHTML = list
        .map((task) => {
          const side = (task.side || '').trim() || 'General';
          const label = task.deadline === today ? 'Hari ini' : task.deadline || 'Berjalan';
          const statusIcon = isTaskDone(task) ? '✓' : ' ';
          return `
            <div class="task-mini">
              <div class="task-mini-info">
                <div class="task-mini-title">${task.title}</div>
                <div class="task-mini-meta">${side} · ${label}</div>
              </div>
              <div class="task-mini-status">${statusIcon}</div>
            </div>
          `;
        })
        .join('');
    }
  }

  if (projectCards) {
    const summaries = buildSideSummary(tasks);
    const palette = ['project-purple', 'project-teal', 'project-coral'];
    const fallback = [
      { side: 'Web Redesign', total: 10, done: 9 },
      { side: 'Mobile App', total: 12, done: 6 },
      { side: 'Brand Kit', total: 22, done: 17 }
    ];
    const items = (summaries.length ? summaries : fallback).slice(0, 3);
    projectCards.innerHTML = items
      .map((item, index) => {
        const percent = item.total ? Math.round((item.done / item.total) * 100) : 0;
        return `
          <div class="project-card ${palette[index % palette.length]}">
            <div class="project-title">${item.side}</div>
            <div class="project-meta">${item.total} task · ${percent}%</div>
            <div class="project-progress"><span style="width:${percent}%"></span></div>
          </div>
        `;
      })
      .join('');
  }
}

function renderAnalyticsSummary(tasks, stats, dailyStats) {
  const totalXp = stats?.xp || 0;
  const totalTasks = dailyStats.reduce((acc, row) => acc + (row.tasks_completed || 0), 0);
  const activeDays = dailyStats.filter(
    (row) => (row.tasks_completed || 0) > 0 || (row.xp_earned || 0) > 0
  ).length;
  const avgXp = activeDays ? Math.round(totalXp / activeDays) : 0;
  const last7 = dailyStats.slice(-7);
  const last7Xp = last7.reduce((acc, row) => acc + (row.xp_earned || 0), 0);
  const prev7 = dailyStats.slice(-14, -7);
  const prev7Xp = prev7.reduce((acc, row) => acc + (row.xp_earned || 0), 0);
  const bestDay = dailyStats.reduce(
    (best, row) => ((row.xp_earned || 0) > (best?.xp_earned || 0) ? row : best),
    null
  );

  setText('analyticsTotalXp', `XP ${formatNumber(totalXp)}`);
  setText('analyticsStreak', `🔥 ${stats?.streak || 0}`);
  setText('analyticsAvgXp', `XP ${formatNumber(avgXp)}`);
  setText('analyticsActiveDays', `${formatNumber(activeDays)} hari`);
  setText('analyticsTasks30', formatNumber(totalTasks));
  setText('analyticsXp7', formatNumber(last7Xp));
  setText(
    'analyticsBestDay',
    bestDay ? `${formatShortDate(bestDay.date)} · XP ${formatNumber(bestDay.xp_earned)}` : '-'
  );

  const consistency = dailyStats.length
    ? Math.round((activeDays / dailyStats.length) * 100)
    : 0;
  setText('analyticsConsistency', `${consistency}%`);

  let trendLabel = 'Stabil';
  if (prev7Xp === 0 && last7Xp > 0) {
    trendLabel = 'Naik pesat';
  } else if (prev7Xp > 0) {
    const diff = ((last7Xp - prev7Xp) / prev7Xp) * 100;
    if (diff > 10) trendLabel = `Naik ${Math.round(diff)}%`;
    if (diff < -10) trendLabel = `Turun ${Math.abs(Math.round(diff))}%`;
  }
  setText('analyticsTrend', trendLabel);

  const analyticsSides = document.getElementById('analyticsSides');
  if (analyticsSides) {
    const summaries = buildSideSummary(tasks).slice(0, 5);
    const fallback = ['Planning', 'Design', 'Research'];
    analyticsSides.innerHTML = (summaries.length ? summaries.map((item) => item.side) : fallback)
      .map((side) => `<span class="chip">${side}</span>`)
      .join('');
  }

  const analyticsWeekList = document.getElementById('analyticsWeekList');
  if (analyticsWeekList) {
    const maxXp = Math.max(...last7.map((row) => row.xp_earned || 0), 1);
    if (!last7.length) {
      analyticsWeekList.innerHTML = `
        <div class="week-row">
          <div class="week-label">-</div>
          <div class="week-bar"><span style="width:0%"></span></div>
          <div class="week-value">XP 0</div>
        </div>
      `;
    } else {
      analyticsWeekList.innerHTML = last7
        .map((row) => {
          const date = new Date(row.date);
          const label = Number.isNaN(date.getTime())
            ? row.date
            : date.toLocaleDateString('id-ID', { weekday: 'short' });
          const percent = Math.round(((row.xp_earned || 0) / maxXp) * 100);
          return `
            <div class="week-row">
              <div class="week-label">${label}</div>
              <div class="week-bar"><span style="width:${percent}%"></span></div>
              <div class="week-value">XP ${formatNumber(row.xp_earned || 0)}</div>
            </div>
          `;
        })
        .join('');
    }
  }
}

function updateCalendar() {
  const calendarDate = document.getElementById('calendarDate');
  if (!calendarDate) return;
  const now = new Date();
  calendarDate.textContent = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const days = document.querySelectorAll('.panel-day[data-reminder-date]');
  days.forEach((day, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() + index);
    const formatted = date.toISOString().split('T')[0];
    day.setAttribute('data-reminder-date', formatted);
  });
  updateCalendarReminderIndicators();
}

function buildTaskDateMap(tasks) {
  const map = new Map();
  tasks.forEach((task) => {
    if (!task.deadline) return;
    const key = task.deadline;
    const list = map.get(key) || [];
    list.push(task);
    map.set(key, list);
  });
  return map;
}

function renderMonthCalendar(tasks) {
  const grid = document.getElementById('calendarGrid');
  const label = document.getElementById('calendarMonthLabel');
  if (!grid || !label) return;
  const viewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  label.textContent = viewDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const taskMap = buildTaskDateMap(tasks);
  const today = getTodayString();

  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const dayNumber = i - startOffset + 1;
    let cellDate = new Date(year, month, dayNumber);
    let isOutside = false;
    if (dayNumber <= 0) {
      cellDate = new Date(year, month - 1, daysInPrev + dayNumber);
      isOutside = true;
    } else if (dayNumber > daysInMonth) {
      cellDate = new Date(year, month + 1, dayNumber - daysInMonth);
      isOutside = true;
    }
    const dateKey = cellDate.toISOString().split('T')[0];
    const dayTasks = taskMap.get(dateKey) || [];
    const events = dayTasks.slice(0, 3);
    const moreCount = dayTasks.length - events.length;
    const eventHtml = events
      .map((task) => {
        const color = getCategoryColor(task.category || '');
        return `
          <div class="calendar-event" style="background:${color}">
            <div class="calendar-event-title">${escapeHtml(task.title)}</div>
          </div>
        `;
      })
      .join('');
    const moreHtml = moreCount > 0 ? `<div class="calendar-event-more">+${moreCount} lagi</div>` : '';
    cells.push(`
      <div class="calendar-day ${isOutside ? 'is-outside' : ''} ${dateKey === today ? 'is-today' : ''}" data-date="${dateKey}">
        <div class="calendar-day-number">${cellDate.getDate()}</div>
        <div class="calendar-events">
          ${eventHtml}
          ${moreHtml}
        </div>
      </div>
    `);
  }
  grid.innerHTML = cells.join('');
}

function setupCalendarControls() {
  const prevButton = document.getElementById('calendarPrev');
  const nextButton = document.getElementById('calendarNext');
  const grid = document.getElementById('calendarGrid');
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
      renderMonthCalendar(cachedTasks);
    });
  }
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
      renderMonthCalendar(cachedTasks);
    });
  }
  if (grid) {
    grid.addEventListener('click', (event) => {
      const cell = event.target.closest('.calendar-day');
      if (!cell) return;
      const date = cell.getAttribute('data-date');
      if (date) openCalendarQuickAdd(date);
    });
  }
}

function setupCalendarQuickAdd() {
  const modal = document.getElementById('calendarQuickAdd');
  const dateInput = document.getElementById('calendarQuickDate');
  const titleInput = document.getElementById('calendarQuickTitle');
  const sideInput = document.getElementById('calendarQuickSide');
  const categoryInput = document.getElementById('calendarQuickCategory');
  const saveButton = document.getElementById('calendarQuickSave');
  const cancelButton = document.getElementById('calendarQuickCancel');
  if (!modal || !dateInput || !titleInput || !categoryInput) return;
  const backdrop = modal.querySelector('[data-close="calendar"]');

  const closeModal = () => {
    modal.classList.add('is-hidden');
  };

  if (backdrop) backdrop.addEventListener('click', closeModal);
  if (cancelButton) cancelButton.addEventListener('click', closeModal);

  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      const date = dateInput.value;
      const title = titleInput.value.trim();
      const side = sideInput?.value.trim() || '';
      const category = categoryInput.value;
      if (!date || !title) return;
      await callWithRetry(() =>
        window.api.addTask({
          title,
          deadline: date,
          side: side || null,
          detail: null,
          status: null,
          category: category || null
        })
      );
      titleInput.value = '';
      if (sideInput) sideInput.value = '';
      closeModal();
      await refreshAll();
    });
  }
}

function openCalendarQuickAdd(date) {
  const modal = document.getElementById('calendarQuickAdd');
  const dateInput = document.getElementById('calendarQuickDate');
  const titleInput = document.getElementById('calendarQuickTitle');
  const categoryInput = document.getElementById('calendarQuickCategory');
  if (!modal || !dateInput || !titleInput || !categoryInput) return;
  dateInput.value = date;
  categoryInput.value = getDefaultCategoryName();
  modal.classList.remove('is-hidden');
  titleInput.focus();
}

function renderCalendarTasks(tasks) {
  const listContainer = document.getElementById('calendarTasks');
  const panelList = document.getElementById('calendarTaskList');
  const items = (tasks || [])
    .filter((task) => task.deadline)
    .sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)))
    .slice(0, 8);

  const renderList = (container, template) => {
    if (!container) return;
    if (!items.length) {
      container.innerHTML = `
        <div class="${template.itemClass}">
          <div class="${template.timeClass}">-</div>
          <div class="${template.dividerClass}"></div>
          <div class="${template.infoClass}">
            <div class="${template.titleClass}">Belum ada jadwal</div>
            <div class="${template.noteClass}">Tambahkan deadline pada task untuk tampil di kalender.</div>
          </div>
        </div>
      `;
      return;
    }
    container.innerHTML = items
      .map((task) => {
        const title = escapeHtml(task.title);
        const side = escapeHtml(task.side || 'Tanpa side');
        return `
          <div class="${template.itemClass}">
            <div class="${template.timeClass}">${formatShortDate(task.deadline)}</div>
            <div class="${template.dividerClass}"></div>
            <div class="${template.infoClass}">
              <div class="${template.titleClass}">${title}</div>
              <div class="${template.noteClass}">${side}</div>
            </div>
          </div>
        `;
      })
      .join('');
  };

  renderList(listContainer, {
    itemClass: 'calendar-item',
    timeClass: 'calendar-time',
    dividerClass: 'calendar-divider',
    infoClass: 'calendar-info',
    titleClass: 'calendar-title',
    noteClass: 'calendar-note',
    emptyClass: 'calendar-item'
  });

  renderList(panelList, {
    itemClass: 'panel-item',
    timeClass: 'panel-time',
    dividerClass: 'panel-indicator',
    infoClass: 'panel-info',
    titleClass: 'panel-title',
    noteClass: 'panel-note',
    emptyClass: 'panel-item'
  });
}

async function refreshAll() {
  const [tasks, stats, dailyStats] = await Promise.all([loadTasks(), loadStats(), loadChart()]);
  cachedTasks = tasks || [];
  cachedStats = stats || {};
  cachedDailyStats = dailyStats || [];
  renderDashboardSummary(tasks || [], stats || {}, dailyStats || []);
  renderAnalyticsSummary(tasks || [], stats || {}, dailyStats || []);
  updateCalendar();
  renderCalendarTasks(tasks || []);
  renderMonthCalendar(cachedTasks);
  updateGreeting();
}

async function loadProfile() {
  const profile = await unwrap(window.api.getProfile(), null);
  const name = profile?.name || 'Raka Pratama';
  const avatar = profile?.avatar || defaultAvatar;
  const email = profile?.email || '';
  currentProfile = { name, avatar, email };

  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profileAvatar = document.getElementById('profileAvatar');
  const preview = document.getElementById('profilePreview');
  const nameInput = document.getElementById('profileNameInput');
  const emailInput = document.getElementById('profileEmailInput');
  const previewName = document.getElementById('profilePreviewName');
  const previewEmail = document.getElementById('profilePreviewEmail');

  if (profileName) profileName.textContent = name;
  if (profileEmail) profileEmail.textContent = email || 'raka@streakly.app';
  if (profileAvatar) profileAvatar.src = avatar;
  if (profileAvatar) profileAvatar.alt = `Foto profil ${name}`;
  if (preview) preview.src = avatar;
  if (nameInput) nameInput.value = name;
  if (emailInput) emailInput.value = email;
  if (previewName) previewName.textContent = name;
  if (previewEmail) previewEmail.textContent = email || 'raka@streakly.app';
  updateGreeting();
}

function resizeAvatarData(dataUrl, size = 256) {
  return new Promise((resolve) => {
    if (!dataUrl) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function setupProfile() {
  loadProfile();
  const editButton = document.getElementById('editProfile');
  const cancelButton = document.getElementById('profileCancel');
  const saveButton = document.getElementById('profileSave');
  const photoInput = document.getElementById('profilePhotoInput');
  const nameInput = document.getElementById('profileNameInput');
  const emailInput = document.getElementById('profileEmailInput');
  const preview = document.getElementById('profilePreview');
  const previewName = document.getElementById('profilePreviewName');
  const previewEmail = document.getElementById('profilePreviewEmail');
  const nameError = document.getElementById('profileNameError');
  const emailError = document.getElementById('profileEmailError');
  if (editButton) {
    editButton.addEventListener('click', () => {
      const targetTab = editButton.getAttribute('data-settings-tab');
      const tabs = document.querySelectorAll('[data-settings-tab]');
      const panels = document.querySelectorAll('[data-settings-panel]');
      tabs.forEach((tab) => {
        tab.classList.toggle('is-active', tab.getAttribute('data-settings-tab') === targetTab);
      });
      panels.forEach((panel) => {
        panel.classList.toggle(
          'is-active',
          panel.getAttribute('data-settings-panel') === targetTab
        );
      });
      if (targetTab) {
        window.location.hash = `settings/${targetTab}`;
      }
    });
  }
  if (photoInput) {
    photoInput.addEventListener('change', () => {
      const file = photoInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const raw = typeof reader.result === 'string' ? reader.result : null;
        const resized = await resizeAvatarData(raw);
        pendingAvatarData = resized || raw;
        if (preview && pendingAvatarData) preview.src = pendingAvatarData;
      };
      reader.readAsDataURL(file);
    });
  }
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      if (previewName) previewName.textContent = nameInput.value.trim() || 'Nama kamu';
      if (nameError) nameError.classList.add('is-hidden');
    });
  }
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      if (previewEmail) {
        previewEmail.textContent = emailInput.value.trim() || 'nama@email.com';
      }
      if (emailError) emailError.classList.add('is-hidden');
    });
  }
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      const profileAvatar = document.getElementById('profileAvatar');
      const name = nameInput?.value?.trim() || '';
      const email = emailInput?.value?.trim() || '';
      const avatar = pendingAvatarData || profileAvatar?.src || defaultAvatar;
      const isNameValid = name.length >= 2 && name.length <= 60;
      const isEmailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!isNameValid) {
        if (nameError) nameError.classList.remove('is-hidden');
        return;
      }
      if (!isEmailValid) {
        if (emailError) emailError.classList.remove('is-hidden');
        return;
      }
      window.api.updateProfile({ name, avatar, email }).then(() => {
        pendingAvatarData = null;
        loadProfile();
      });
    });
  }
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      pendingAvatarData = null;
      loadProfile();
      if (nameError) nameError.classList.add('is-hidden');
      if (emailError) emailError.classList.add('is-hidden');
    });
  }
}

const MOTIVATION_POOLS = {
  1: [
    { title: 'Mulai pelan, hasilnya besar', subtitle: 'Satu langkah kecil hari ini sudah cukup' },
    { title: 'Fokus ringan dulu', subtitle: 'Cukup satu task untuk membuka ritme' }
  ],
  2: [
    { title: 'Ritme mulai terbentuk', subtitle: 'Jaga konsistensi kecil setiap hari' },
    { title: 'Semangat makin stabil', subtitle: 'Sedikit demi sedikit, hasilnya terasa' }
  ],
  3: [
    { title: 'Progresmu solid', subtitle: 'Momentum sedang bagus, lanjutkan' },
    { title: 'Pertumbuhan nyata', subtitle: 'Ritme produktifmu makin terlihat' }
  ],
  4: [
    { title: 'Level naik cepat', subtitle: 'Fokusmu kuat, pertahankan pola ini' },
    { title: 'Kamu on track', subtitle: 'Produktivitasmu konsisten dan terarah' }
  ],
  5: [
    { title: 'Mastery mode aktif', subtitle: 'Kamu memimpin ritme hari ini' },
    { title: 'Puncak fokus', subtitle: 'Gunakan energi terbaikmu sekarang' }
  ]
};

function calculateEngagement(tasks, stats, dailyStats) {
  const list = tasks || [];
  const doneCount = list.filter((task) => isTaskDone(task)).length;
  const totalCount = list.length;
  const completionRate = totalCount ? doneCount / totalCount : 0;
  const activeDays = (dailyStats || []).filter(
    (row) => (row.tasks_completed || 0) > 0 || (row.xp_earned || 0) > 0
  ).length;
  const streak = stats?.streak || 0;
  const achievements = [
    (stats?.level || 0) >= 5,
    streak >= 7,
    doneCount >= 20,
    activeDays >= 10,
    completionRate >= 0.6
  ].filter(Boolean).length;
  const completionScore = completionRate;
  const activeScore = Math.min(activeDays / 30, 1);
  const streakScore = Math.min(streak / 14, 1);
  const achievementScore = achievements / 5;
  const score =
    completionScore * 0.35 +
    activeScore * 0.25 +
    streakScore * 0.25 +
    achievementScore * 0.15;
  let level = 1;
  if (score >= 0.8) level = 5;
  else if (score >= 0.65) level = 4;
  else if (score >= 0.5) level = 3;
  else if (score >= 0.35) level = 2;
  return {
    level,
    completionRate,
    activeDays,
    streak
  };
}

function getMotivationMessage(level) {
  const pool = MOTIVATION_POOLS[level] || MOTIVATION_POOLS[1];
  const seed = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const index = Number(seed) % pool.length;
  return pool[index];
}

function applyMotivationTheme(level) {
  const card = document.getElementById('motivationCard');
  if (!card) return;
  const palette = {
    1: { start: '#e6f1ff', end: '#dbe9ff' },
    2: { start: '#d9efff', end: '#ffe6cc' },
    3: { start: '#d0e7ff', end: '#ffd4a3' },
    4: { start: '#c2dcff', end: '#ffc07a' },
    5: { start: '#b5d2ff', end: '#ffb357' }
  };
  const colors = palette[level] || palette[1];
  card.style.setProperty('--motivation-start', colors.start);
  card.style.setProperty('--motivation-end', colors.end);
}

function updateGreeting() {
  const greetingTitle = document.getElementById('greetingTitle');
  const greetingSubtitle = document.getElementById('greetingSubtitle');
  const todayDate = document.getElementById('todayDate');
  const card = document.getElementById('motivationCard');
  const name = currentProfile?.name || 'Raka';
  const engagement = calculateEngagement(cachedTasks, cachedStats, cachedDailyStats);
  const message = getMotivationMessage(engagement.level);
  const streakText = engagement.streak ? `🔥 ${engagement.streak} hari` : 'Bangun streak pertamamu';
  if (greetingTitle) greetingTitle.textContent = `${message.title}, ${name}!`;
  if (greetingSubtitle) greetingSubtitle.textContent = `${message.subtitle} · ${streakText}`;
  if (todayDate) {
    const now = new Date();
    todayDate.textContent = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  applyMotivationTheme(engagement.level);
  const nextKey = `${engagement.level}-${message.title}-${message.subtitle}`;
  if (card && nextKey !== lastMotivationKey) {
    card.classList.remove('message-animate');
    void card.offsetWidth;
    card.classList.add('message-animate');
    lastMotivationKey = nextKey;
  }
}

function setActiveSection(section) {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.section');
  navItems.forEach((item) => {
    item.classList.toggle('active', item.dataset.section === section);
  });
  sections.forEach((el) => {
    el.classList.toggle('active', el.dataset.section === section);
  });
  if (section === 'tasks') {
    loadTasks({ append: false });
  }
}

function setupTaskForm() {
  const addButton = document.getElementById('addButton');
  const cancelButton = document.getElementById('cancelEdit');
  const loadMoreButton = document.getElementById('tasksLoadMore');
  const inputs = ['side', 'status', 'category', 'title', 'detail', 'deadline']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (addButton) addButton.addEventListener('click', () => addTask());
  if (cancelButton) cancelButton.addEventListener('click', () => cancelEdit());
  if (loadMoreButton) {
    loadMoreButton.addEventListener('click', () => loadTasks({ append: true }));
  }

  inputs.forEach((input) => {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addTask();
      }
    });
  });
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const target = item.dataset.section;
      if (target) setActiveSection(target);
    });
  });

  const sectionLinks = document.querySelectorAll('[data-section-target]');
  sectionLinks.forEach((item) => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-section-target');
      if (target) setActiveSection(target);
    });
  });
}

function setupAboutTabs() {
  const tabs = document.querySelectorAll('.about-tab');
  const panels = document.querySelectorAll('.about-panel');
  if (!tabs.length || !panels.length) return;
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-about-tab');
      if (!target) return;
      tabs.forEach((btn) => btn.classList.toggle('is-active', btn === tab));
      panels.forEach((panel) =>
        panel.classList.toggle('is-active', panel.getAttribute('data-about-panel') === target)
      );
    });
  });
}

window.onload = () => {
  calendarViewDate = new Date();
  calendarViewDate.setDate(1);
  setupNavigation();
  setupProfile();
  setupSettings();
  setupCategoryManager();
  setupTopbar();
  setupCalendarControls();
  setupCalendarQuickAdd();
  setupReminderCalendar();
  setupTaskForm();
  setupAboutTabs();
  refreshAll();
};
