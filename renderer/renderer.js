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
let taskSuccessTimer = null;
let taskDraftTimer = null;
let editingTaskUpdatedAt = null;
let cachedProjects = [];
let cachedClients = [];
let cachedUsers = [];
let cachedWorkspaces = [];
const TASK_DRAFT_KEY = 'streakly_task_draft_v2';
const TASK_PAGE_SIZE = 50;
let taskOffset = 0;
let taskHasMore = true;
let taskSearchQuery = '';
let calendarViewDate = new Date();
let cachedTasks = [];
let cachedDailyStats = [];
let cachedStats = {};
let lastMotivationKey = '';
let calendarViewMode = 'month';
let calendarSelectedDate = '';
window.api = new Proxy(window.api || {}, {
  get(target, prop) {
    if (prop in target) return target[prop];
    return () =>
      Promise.resolve({
        ok: false,
        error: { message: `IPC ${String(prop)} unavailable` }
      });
  }
});
const CATEGORY_STORAGE_KEY = 'streakly_categories';
const CATEGORY_TUTORIAL_KEY = 'streakly_category_tutorial';
const THEME_MODE_KEY = 'streakly_theme_mode';
let currentThemeMode = 'light';
const THEME_PRESETS = {
  light: {
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
  dark: {
    accent: '#5cb8ff',
    accent_secondary: '#5fe0d3',
    bg_primary: '#0f1623',
    bg_secondary: '#142033',
    bg_elevated: '#1a2941',
    text_primary: '#e6f2ff',
    text_muted: '#a7bdd6',
    border: '#1f2f46',
    glow_intensity: 0.18
  }
};
const defaultAvatar =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%237367f0'/><stop offset='100%' stop-color='%239f87ff'/></linearGradient></defs><rect width='80' height='80' rx='40' fill='url(%23g)'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Segoe UI, Arial' font-size='30' fill='white'>R</text></svg>";

const DEFAULT_CATEGORIES = [
  { name: 'Urgent', color: '#6f67ff', icon: '⚡', label: 'Urgent - Ungu' },
  { name: 'Normal', color: '#46b3c5', icon: '✅', label: 'Normal - Hijau Tosca' },
  { name: 'Meeting', color: '#ff9a62', icon: '📌', label: 'Meeting - Oranye' },
  { name: 'Deadline', color: '#ef4444', icon: '⏰', label: 'Deadline - Merah' },
  { name: 'Personal', color: '#7c9cff', icon: '🏠', label: 'Personal - Biru' }
];
const REGISTRATION_SCHEMA_KEY = 'streakly_registration_schema';
const REGISTRATION_TEMPLATE_KEY = 'streakly_registration_templates';
const REGISTRATION_SUBMISSION_KEY = 'streakly_registration_submissions';
const REGISTRATION_PREFS_KEY = 'streakly_registration_prefs';
let registrationSchema = [];
let registrationTemplates = [];
let registrationPrefs = { role: 'developer', language: 'id', template: 'pegawai-negeri' };
let registrationSubmissions = [];
const REGISTRATION_I18N = {
  id: {
    builderTitle: 'Form Pendaftaran Dinamis',
    builderSubtitle: 'Kelola field dengan drag-and-drop dan simpan template.',
    previewTitle: 'Preview Form',
    previewSubtitle: 'Isi data dan lakukan validasi real-time.',
    roleLabel: 'Role Akses',
    languageLabel: 'Bahasa',
    templateLabel: 'Template Pekerjaan',
    saveTemplateLabel: 'Simpan Template',
    saveTemplateButton: 'Simpan',
    paletteTitle: 'Tambah Field',
    fieldListTitle: 'Field Aktif',
    submitButton: 'Kirim',
    resetButton: 'Reset',
    exportPdf: 'Export PDF',
    exportExcel: 'Export Excel',
    statusSaved: 'Data berhasil disimpan.',
    statusEmpty: 'Belum ada data untuk diexport.',
    statusExported: 'Data berhasil diexport.',
    requiredLabel: 'Wajib',
    labelLabel: 'Label',
    typeLabel: 'Tipe',
    optionsLabel: 'Opsi',
    removeLabel: 'Hapus',
    templatePlaceholder: 'Nama template',
    developerRole: 'Developer',
    endUserRole: 'End-user',
    validationRequired: 'Wajib diisi',
    validationEmail: 'Email tidak valid',
    validationPhone: 'Nomor telepon tidak valid',
    validationUrl: 'URL tidak valid',
    validationNumber: 'Angka tidak valid',
    fieldTypes: {
      text: 'Teks',
      email: 'Email',
      phone: 'Telepon',
      number: 'Angka',
      date: 'Tanggal',
      url: 'URL',
      textarea: 'Paragraf',
      select: 'Pilihan'
    },
    fieldLabels: {
      fullName: 'Nama lengkap',
      email: 'Email',
      phone: 'Nomor telepon',
      nip: 'NIP',
      cert: 'Nomor Sertifikasi Profesi',
      portfolio: 'Portofolio',
      company: 'Instansi/Perusahaan',
      position: 'Jabatan',
      address: 'Alamat',
      notes: 'Catatan',
      custom: 'Field baru',
      options: 'Opsi (pisahkan dengan koma)'
    }
  },
  en: {
    builderTitle: 'Dynamic Registration Form',
    builderSubtitle: 'Drag-and-drop fields and save templates.',
    previewTitle: 'Form Preview',
    previewSubtitle: 'Fill data with real-time validation.',
    roleLabel: 'Access Role',
    languageLabel: 'Language',
    templateLabel: 'Job Template',
    saveTemplateLabel: 'Save Template',
    saveTemplateButton: 'Save',
    paletteTitle: 'Add Field',
    fieldListTitle: 'Active Fields',
    submitButton: 'Submit',
    resetButton: 'Reset',
    exportPdf: 'Export PDF',
    exportExcel: 'Export Excel',
    statusSaved: 'Data saved successfully.',
    statusEmpty: 'No data to export yet.',
    statusExported: 'Data exported successfully.',
    requiredLabel: 'Required',
    labelLabel: 'Label',
    typeLabel: 'Type',
    optionsLabel: 'Options',
    removeLabel: 'Remove',
    templatePlaceholder: 'Template name',
    developerRole: 'Developer',
    endUserRole: 'End-user',
    validationRequired: 'Required',
    validationEmail: 'Invalid email',
    validationPhone: 'Invalid phone number',
    validationUrl: 'Invalid URL',
    validationNumber: 'Invalid number',
    fieldTypes: {
      text: 'Text',
      email: 'Email',
      phone: 'Phone',
      number: 'Number',
      date: 'Date',
      url: 'URL',
      textarea: 'Paragraph',
      select: 'Select'
    },
    fieldLabels: {
      fullName: 'Full name',
      email: 'Email',
      phone: 'Phone number',
      nip: 'Civil ID',
      cert: 'Professional Certification',
      portfolio: 'Portfolio',
      company: 'Company',
      position: 'Position',
      address: 'Address',
      notes: 'Notes',
      custom: 'New field',
      options: 'Options (comma separated)'
    }
  }
};
const REGISTRATION_DEFAULT_TEMPLATES = [
  {
    id: 'pegawai-negeri',
    name: { id: 'Pegawai Negeri', en: 'Civil Servant' },
    fields: [
      { id: 'fullName', labelKey: 'fullName', type: 'text', required: true },
      { id: 'email', labelKey: 'email', type: 'email', required: true },
      { id: 'phone', labelKey: 'phone', type: 'phone', required: true },
      { id: 'nip', labelKey: 'nip', type: 'text', required: true },
      { id: 'position', labelKey: 'position', type: 'text', required: false },
      { id: 'address', labelKey: 'address', type: 'textarea', required: false }
    ]
  },
  {
    id: 'swasta',
    name: { id: 'Pekerja Swasta', en: 'Private Sector' },
    fields: [
      { id: 'fullName', labelKey: 'fullName', type: 'text', required: true },
      { id: 'email', labelKey: 'email', type: 'email', required: true },
      { id: 'phone', labelKey: 'phone', type: 'phone', required: true },
      { id: 'company', labelKey: 'company', type: 'text', required: true },
      { id: 'cert', labelKey: 'cert', type: 'text', required: false },
      { id: 'position', labelKey: 'position', type: 'text', required: false }
    ]
  },
  {
    id: 'kreatif',
    name: { id: 'Pekerja Kreatif', en: 'Creative' },
    fields: [
      { id: 'fullName', labelKey: 'fullName', type: 'text', required: true },
      { id: 'email', labelKey: 'email', type: 'email', required: true },
      { id: 'phone', labelKey: 'phone', type: 'phone', required: false },
      { id: 'portfolio', labelKey: 'portfolio', type: 'url', required: true },
      { id: 'notes', labelKey: 'notes', type: 'textarea', required: false }
    ]
  }
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

const WORDMARK_SOURCES = {
  light: 'assets/logo streakly-04-05.svg',
  dark: 'assets/logo streakly-05-04.svg'
};

let wordmarkPreloaded = false;

function preloadWordmarks() {
  if (wordmarkPreloaded) return;
  wordmarkPreloaded = true;
  Object.values(WORDMARK_SOURCES).forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

function updateWordmarkTheme(mode) {
  const wordmark = document.querySelector('.app-wordmark');
  if (!wordmark) return;
  preloadWordmarks();
  const next = mode === 'dark' ? WORDMARK_SOURCES.dark : WORDMARK_SOURCES.light;
  if (wordmark.getAttribute('src') === next) return;
  wordmark.classList.add('is-switching');
  const img = new Image();
  img.onload = () => {
    wordmark.setAttribute('src', next);
    requestAnimationFrame(() => {
      wordmark.classList.remove('is-switching');
    });
  };
  img.onerror = () => {
    wordmark.setAttribute('src', next);
    wordmark.classList.remove('is-switching');
  };
  img.src = next;
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

function getRegistrationI18n(language) {
  return REGISTRATION_I18N[language] || REGISTRATION_I18N.id;
}

function resolveRegistrationLabel(field, language) {
  const i18n = getRegistrationI18n(language);
  if (field.label) return field.label;
  if (field.labelKey && i18n.fieldLabels[field.labelKey]) return i18n.fieldLabels[field.labelKey];
  return i18n.fieldLabels.custom;
}

function loadRegistrationPrefs() {
  try {
    const raw = window.localStorage.getItem(REGISTRATION_PREFS_KEY);
    if (!raw) return { role: 'developer', language: 'id', template: 'pegawai-negeri' };
    const parsed = JSON.parse(raw);
    return {
      role: parsed.role === 'end-user' ? 'end-user' : 'developer',
      language: parsed.language === 'en' ? 'en' : 'id',
      template: String(parsed.template || 'pegawai-negeri')
    };
  } catch (err) {
    return { role: 'developer', language: 'id', template: 'pegawai-negeri' };
  }
}

function saveRegistrationPrefs(prefs) {
  window.localStorage.setItem(REGISTRATION_PREFS_KEY, JSON.stringify(prefs));
}

function loadRegistrationTemplates() {
  try {
    const raw = window.localStorage.getItem(REGISTRATION_TEMPLATE_KEY);
    const custom = raw ? JSON.parse(raw) : [];
    const customList = Array.isArray(custom) ? custom : [];
    return [...REGISTRATION_DEFAULT_TEMPLATES, ...customList];
  } catch (err) {
    return [...REGISTRATION_DEFAULT_TEMPLATES];
  }
}

function saveRegistrationTemplates(templates) {
  const custom = templates.filter(
    (template) => !REGISTRATION_DEFAULT_TEMPLATES.find((base) => base.id === template.id)
  );
  window.localStorage.setItem(REGISTRATION_TEMPLATE_KEY, JSON.stringify(custom));
}

function loadRegistrationSchema(prefs, templates) {
  try {
    const raw = window.localStorage.getItem(REGISTRATION_SCHEMA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (err) {
  }
  const fallback = templates.find((template) => template.id === prefs.template) || templates[0];
  return JSON.parse(JSON.stringify(fallback?.fields || []));
}

function saveRegistrationSchema(schema) {
  window.localStorage.setItem(REGISTRATION_SCHEMA_KEY, JSON.stringify(schema));
}

function loadRegistrationSubmissions() {
  try {
    const raw = window.localStorage.getItem(REGISTRATION_SUBMISSION_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function saveRegistrationSubmissions(submissions) {
  window.localStorage.setItem(REGISTRATION_SUBMISSION_KEY, JSON.stringify(submissions));
}

function createRegistrationField(type, language) {
  const i18n = getRegistrationI18n(language);
  const id = `field_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
  return {
    id,
    label: i18n.fieldLabels.custom,
    type,
    required: false,
    options: type === 'select' ? ['Option 1', 'Option 2'] : []
  };
}

function validateRegistrationValue(field, value, language) {
  const i18n = getRegistrationI18n(language);
  const trimmed = String(value || '').trim();
  if (field.required && !trimmed) return i18n.validationRequired;
  if (!trimmed) return '';
  if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return i18n.validationEmail;
  }
  if (field.type === 'phone' && !/^[0-9+()\s-]{8,}$/.test(trimmed)) {
    return i18n.validationPhone;
  }
  if (field.type === 'url') {
    try {
      new URL(trimmed);
    } catch (err) {
      return i18n.validationUrl;
    }
  }
  if (field.type === 'number' && Number.isNaN(Number(trimmed))) {
    return i18n.validationNumber;
  }
  return '';
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
      (item) => {
        const label = escapeHtml(item.label || item.name);
        return `
        <div class="category-pill" title="${label}">
          <span style="background:${item.color}"></span>
          <span class="category-pill-label">${label}</span>
        </div>
      `;
      }
    )
    .join('');
}

function setupFocusAreaLayout() {
  const layout = document.querySelector('.focus-area-layout');
  const cards = document.getElementById('projectCards');
  const legend = document.querySelector('.focus-legend');
  if (!layout || !cards || !legend) return;
  let frame = 0;

  const measure = () => {
    const items = cards.querySelectorAll('.project-card');
    const first = items[0];
    const second = items[1];
    const firstRect = first?.getBoundingClientRect();
    const secondRect = second?.getBoundingClientRect();
    const isStacked = Boolean(
      firstRect && secondRect && secondRect.top > firstRect.top + firstRect.height * 0.5
    );
    const cardsRect = cards.getBoundingClientRect();
    return { isStacked, cardsWidth: cardsRect.width };
  };

  const apply = ({ isStacked, cardsWidth }) => {
    layout.classList.toggle('is-stacked', isStacked);
    if (cardsWidth) {
      layout.style.setProperty('--focus-cards-width', `${Math.round(cardsWidth)}px`);
      layout.style.setProperty(
        '--focus-legend-width',
        `${Math.round(cardsWidth * 0.8)}px`
      );
    }
  };

  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      apply(measure());
    });
  };

  const observer = new ResizeObserver(() => schedule());
  observer.observe(cards);
  observer.observe(legend);
  window.addEventListener('resize', schedule);
  schedule();
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

const taskFormState = {
  attachments: [],
  externalLinks: [],
  checklist: []
};

function setFieldError(field, message) {
  const el = document.querySelector(`[data-error-for="${field}"]`);
  if (!el) return;
  el.textContent = message || '';
}

function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach((el) => {
    el.textContent = '';
  });
}

function sanitizeRichText(html) {
  const container = document.createElement('div');
  container.innerHTML = html || '';
  const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'UL', 'OL', 'LI', 'BR', 'P']);
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }
  nodes.forEach((node) => {
    if (!allowed.has(node.tagName)) {
      node.replaceWith(document.createTextNode(node.textContent || ''));
      return;
    }
    [...node.attributes].forEach((attr) => node.removeAttribute(attr.name));
  });
  return container.innerHTML.trim();
}

function parseJsonList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (err) {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function parseJsonObject(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (err) {
      return {};
    }
  }
  return {};
}

function getRichTextPlain() {
  const editor = document.getElementById('detailRich');
  if (!editor) return '';
  return (editor.textContent || '').trim();
}

function getRichTextHtml() {
  const editor = document.getElementById('detailRich');
  if (!editor) return '';
  return sanitizeRichText(editor.innerHTML || '');
}

function setRichTextHtml(html) {
  const editor = document.getElementById('detailRich');
  if (editor) editor.innerHTML = sanitizeRichText(html || '');
}

function parseTags(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDateInput(date) {
  if (!date) return '';
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

function getSelectedValues(select) {
  if (!select) return [];
  return Array.from(select.selectedOptions).map((opt) => opt.value).filter(Boolean);
}

function buildTaskOptionValue(task) {
  return `${task.id} | ${task.title}`;
}

function parseTaskOptionValue(value) {
  if (!value) return null;
  const [idPart] = String(value).split('|');
  const id = Number(String(idPart).trim());
  return Number.isFinite(id) ? id : null;
}

function hasCircularDependency(taskId, dependencies, tasks) {
  if (!taskId) return false;
  const dependencyMap = new Map();
  (tasks || []).forEach((task) => {
    dependencyMap.set(task.id, parseJsonList(task.dependencies).map((id) => Number(id)));
  });
  const visited = new Set();
  const stack = new Set();
  const visit = (id) => {
    if (stack.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    stack.add(id);
    const deps = dependencyMap.get(id) || [];
    for (const dep of deps) {
      if (visit(dep)) return true;
    }
    stack.delete(id);
    return false;
  };
  dependencyMap.set(taskId, dependencies || []);
  return visit(taskId);
}

function getTaskDetailHtml(task) {
  if (typeof task?.description_rich === 'string' && task.description_rich.trim()) {
    return sanitizeRichText(task.description_rich);
  }
  return escapeHtml(task?.detail || '');
}

function updateChecklistProgress() {
  const total = taskFormState.checklist.length;
  const done = taskFormState.checklist.filter((item) => item.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const bar = document.getElementById('checklistProgress');
  const label = document.getElementById('checklistPercent');
  if (bar) bar.style.width = `${percent}%`;
  if (label) label.textContent = `${percent}%`;
}

function renderChecklist() {
  const list = document.getElementById('checklistList');
  if (!list) return;
  list.innerHTML = taskFormState.checklist
    .map(
      (item, index) => `
        <div class="checklist-item">
          <label>
            <input type="checkbox" data-checklist-index="${index}" ${item.done ? 'checked' : ''}>
            ${escapeHtml(item.text)}
          </label>
          <button type="button" class="btn-ghost btn-compact" data-checklist-remove="${index}">Hapus</button>
        </div>
      `
    )
    .join('');
  updateChecklistProgress();
}

function renderAttachments() {
  const list = document.getElementById('attachmentList');
  if (!list) return;
  list.innerHTML = taskFormState.attachments
    .map(
      (file, index) => `
        <div class="file-item">
          <span>${escapeHtml(file.name)} (${Math.round(file.size / 1024)} KB)</span>
          <button type="button" class="btn-ghost btn-compact" data-attachment-remove="${index}">Hapus</button>
        </div>
      `
    )
    .join('');
}

function renderExternalLinks() {
  const list = document.getElementById('externalLinkList');
  if (!list) return;
  list.innerHTML = taskFormState.externalLinks
    .map(
      (link, index) => `
        <div class="link-item">
          <a href="${escapeHtml(link)}" target="_blank" rel="noreferrer">${escapeHtml(link)}</a>
          <button type="button" class="btn-ghost btn-compact" data-link-remove="${index}">Hapus</button>
        </div>
      `
    )
    .join('');
}

function saveTaskDraft(data) {
  window.localStorage.setItem(TASK_DRAFT_KEY, JSON.stringify(data));
}

function loadTaskDraft() {
  try {
    const raw = window.localStorage.getItem(TASK_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function clearTaskDraft() {
  window.localStorage.removeItem(TASK_DRAFT_KEY);
}

function setOptions(select, options, placeholder) {
  if (!select) return;
  const items = options || [];
  const placeholderOption = placeholder
    ? `<option value="">${placeholder}</option>`
    : '';
  select.innerHTML =
    placeholderOption +
    items.map((item) => `<option value="${item.value}">${escapeHtml(item.label)}</option>`).join('');
}

function setMultiOptions(select, options) {
  if (!select) return;
  const safeOptions = Array.isArray(options) ? options : [];
  select.innerHTML = safeOptions
    .map((item) => `<option value="${item.value}">${escapeHtml(item.label)}</option>`)
    .join('');
}

function applyRecipientFilter(role) {
  const recipients = document.getElementById('notificationRecipients');
  if (!recipients) return;
  const selected = getSelectedValues(recipients);
  const safeUsers = Array.isArray(cachedUsers) ? cachedUsers : [];
  const filtered = role
    ? safeUsers.filter((user) => String(user.role || '').toLowerCase() === role.toLowerCase())
    : safeUsers;
  setMultiOptions(
    recipients,
    filtered.map((item) => ({ value: item.name, label: `${item.name} · ${item.role || 'User'}` }))
  );
  Array.from(recipients.options).forEach((option) => {
    option.selected = selected.includes(option.value);
  });
}

async function loadReferenceData() {
  const users = await Promise.allSettled([window.api.getUsers()]);
  const userResult = users[0];
  cachedUsers = userResult.status === 'fulfilled' && Array.isArray(userResult.value)
    ? userResult.value
    : [];

  setMultiOptions(
    document.getElementById('assignees'),
    cachedUsers.map((item) => ({ value: item.name, label: `${item.name} · ${item.role || 'User'}` }))
  );
}

function populateTaskReferences(tasks) {
  const parentList = document.getElementById('taskParentList');
  const dependencySelect = document.getElementById('dependencies');
  const relatedTagList = document.getElementById('relatedTagList');
  const labelList = document.getElementById('labelList');
  if (parentList) {
    parentList.innerHTML = (tasks || [])
      .map((task) => `<option value="${escapeHtml(buildTaskOptionValue(task))}"></option>`)
      .join('');
  }
  if (dependencySelect) {
    dependencySelect.innerHTML = (tasks || [])
      .map((task) => `<option value="${task.id}">${escapeHtml(task.title)}</option>`)
      .join('');
  }
  if (relatedTagList || labelList) {
    const tagSet = new Set();
    const labelSet = new Set();
    (tasks || []).forEach((task) => {
      parseJsonList(task.related_tags).forEach((tag) => tagSet.add(tag));
      parseJsonList(task.labels).forEach((tag) => labelSet.add(tag));
    });
    if (relatedTagList) {
      relatedTagList.innerHTML = Array.from(tagSet)
        .map((tag) => `<option value="${escapeHtml(tag)}"></option>`)
        .join('');
    }
    if (labelList) {
      labelList.innerHTML = Array.from(labelSet)
        .map((tag) => `<option value="${escapeHtml(tag)}"></option>`)
        .join('');
    }
  }
}
function setTaskSuccess(message) {
  const success = document.getElementById('taskSuccess');
  if (!success) return;
  success.textContent = message;
  success.classList.remove('is-hidden');
  if (taskSuccessTimer) clearTimeout(taskSuccessTimer);
  taskSuccessTimer = setTimeout(() => {
    clearTaskSuccess();
  }, 3000);
}

function clearTaskSuccess() {
  const success = document.getElementById('taskSuccess');
  if (!success) return;
  success.textContent = '';
  success.classList.add('is-hidden');
  if (taskSuccessTimer) {
    clearTimeout(taskSuccessTimer);
    taskSuccessTimer = null;
  }
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
    const priority = String(task.priority || '').toLowerCase();
    const assignees = String(task.assignees || '').toLowerCase();
    const labels = String(task.labels || '').toLowerCase();
    return (
      title.includes(keyword) ||
      side.includes(keyword) ||
      detail.includes(keyword) ||
      status.includes(keyword) ||
      category.includes(keyword) ||
      priority.includes(keyword) ||
      assignees.includes(keyword) ||
      labels.includes(keyword)
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
  root.style.setProperty('--bg-sidebar', bgElevated);
  root.style.setProperty('--text-primary', textPrimary);
  root.style.setProperty('--text-muted', textMuted);
  root.style.setProperty('--border', border);
  root.style.setProperty('--bg-gradient-1', gradient1);
  root.style.setProperty('--bg-gradient-2', gradient2);
  root.style.setProperty('--bg-gradient-3', gradient3);
  root.style.setProperty('--glow', `0 0 24px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glowStrength})`);
  root.style.setProperty('--surface-base', `${surfaceRgb.r} ${surfaceRgb.g} ${surfaceRgb.b}`);
}

function loadThemeMode() {
  const stored = window.localStorage.getItem(THEME_MODE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function saveThemeMode(mode) {
  window.localStorage.setItem(THEME_MODE_KEY, mode);
}

function applyThemeMode(mode, syncToggle = true) {
  const nextMode = mode === 'dark' ? 'dark' : 'light';
  currentThemeMode = nextMode;
  const preset = THEME_PRESETS[nextMode] || THEME_PRESETS.light;
  applyThemeFromSettings({ ...currentSettings, ...preset });
  const navText = nextMode === 'dark' ? preset.text_muted : preset.text_primary;
  const navTextActive = nextMode === 'dark' ? preset.text_primary : preset.accent;
  const navHover = nextMode === 'dark' ? preset.text_primary : preset.accent;
  const navBgActive =
    nextMode === 'dark' ? 'rgba(92, 184, 255, 0.18)' : 'rgba(111, 103, 255, 0.2)';
  const navBgHover =
    nextMode === 'dark' ? 'rgba(92, 184, 255, 0.12)' : 'rgba(111, 103, 255, 0.18)';
  const navBorderActive =
    nextMode === 'dark' ? 'rgba(92, 184, 255, 0.38)' : 'rgba(111, 103, 255, 0.45)';
  const navBorderHover =
    nextMode === 'dark' ? 'rgba(92, 184, 255, 0.3)' : 'rgba(111, 103, 255, 0.28)';
  const root = document.documentElement;
  root.style.setProperty('--nav-text', navText);
  root.style.setProperty('--nav-text-active', navTextActive);
  root.style.setProperty('--nav-text-hover', navHover);
  root.style.setProperty('--nav-bg-active', navBgActive);
  root.style.setProperty('--nav-bg-hover', navBgHover);
  root.style.setProperty('--nav-border-active', navBorderActive);
  root.style.setProperty('--nav-border-hover', navBorderHover);
  document.documentElement.setAttribute('data-theme', nextMode);
  updateWordmarkTheme(nextMode);
  if (syncToggle) {
    const toggle = document.getElementById('themeModeToggle');
    if (toggle) toggle.checked = nextMode === 'dark';
  }
}

function applyDisplayPreferences(settings) {
  const zoom = Number(settings.zoom_level) || 100;
  document.body.style.zoom = `${zoom}%`;
  const opacity = settings.glass_enabled ? 0.85 : 1;
  document.documentElement.style.setProperty('--surface-opacity', String(opacity));
  document.body.classList.toggle('glass-on', Boolean(settings.glass_enabled));
}

function hydrateSettingsForm(settings) {
  const xpPerTask = document.getElementById('xpPerTask');
  const levelStep = document.getElementById('levelStep');
  const zoomSelect = document.getElementById('zoomSelect');
  const glassToggle = document.getElementById('glassToggle');

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
  applyThemeMode(loadThemeMode(), false);
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
  const zoomSelect = document.getElementById('zoomSelect');
  const glassToggle = document.getElementById('glassToggle');
  const saveButton = document.getElementById('settingsSave');
  const resetButton = document.getElementById('resetData');
  const backupButton = document.getElementById('backupData');
  const restoreButton = document.getElementById('restoreData');
  const exportButton = document.getElementById('exportPdf');
  const settingsTabs = document.querySelectorAll('[data-settings-tab]');
  const settingsPanels = document.querySelectorAll('[data-settings-panel]');

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
      const zoomValue = Number(zoomSelect?.value || currentSettings.zoom_level || 100);
      const glassEnabled = glassToggle?.checked ? 1 : 0;

      const payload = {
        ...currentSettings,
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

  const applyHashTab = () => {
    const hash = window.location.hash.replace('#', '');
    if (!hash.startsWith('settings/')) return;
    const target = hash.split('/')[1];
    if (!target) return;
    const availableTargets = Array.from(settingsTabs).map((tab) =>
      tab.getAttribute('data-settings-tab')
    );
    const resolvedTarget = availableTargets.includes(target)
      ? target
      : settingsTabs[0]?.getAttribute('data-settings-tab');
    if (!resolvedTarget) return;
    settingsTabs.forEach((tab) => {
      tab.classList.toggle('is-active', tab.getAttribute('data-settings-tab') === resolvedTarget);
    });
    settingsPanels.forEach((panel) => {
      panel.classList.toggle(
        'is-active',
        panel.getAttribute('data-settings-panel') === resolvedTarget
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
  const themeToggle = document.getElementById('themeModeToggle');
  if (searchToggle && searchDropdown) {
    searchToggle.setAttribute('aria-controls', 'searchDropdown');
    const setSearchOpen = (isOpen) => {
      searchDropdown.classList.toggle('is-hidden', !isOpen);
      searchToggle.classList.toggle('is-active', isOpen);
      searchToggle.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) {
        searchInput?.focus();
      }
    };
    searchToggle.addEventListener('click', () => {
      const isOpen = searchDropdown.classList.contains('is-hidden');
      setSearchOpen(isOpen);
    });
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (searchDropdown.contains(target) || searchToggle.contains(target)) return;
      setSearchOpen(false);
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
        if (searchDropdown && searchToggle) {
          searchDropdown.classList.add('is-hidden');
          searchToggle.classList.remove('is-active');
          searchToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }
  if (themeToggle) {
    const initialMode = loadThemeMode();
    themeToggle.checked = initialMode === 'dark';
    applyThemeMode(initialMode);
    themeToggle.addEventListener('change', () => {
      const mode = themeToggle.checked ? 'dark' : 'light';
      saveThemeMode(mode);
      applyThemeMode(mode);
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
    const rawPriority = typeof task.priority === 'string' ? task.priority.trim() : '';
    const legacyPriority = ['Low', 'Medium', 'High', 'Urgent'].includes(rawStatus)
      ? rawStatus
      : '';
    const effectivePriority = rawPriority || legacyPriority || 'Medium';
    const effectiveStatus = legacyPriority ? 'To Do' : rawStatus || 'To Do';
    const statusLabel = isDone ? '✅ Selesai' : `🧭 ${effectiveStatus}`;
    const priorityLabel = `⭐ Prioritas ${effectivePriority}`;
    const statusItem = document.createElement('span');
    statusItem.className = 'task-meta-item';
    statusItem.textContent = statusLabel;
    meta.appendChild(statusItem);
    const priorityItem = document.createElement('span');
    priorityItem.className = 'task-meta-item';
    priorityItem.textContent = priorityLabel;
    meta.appendChild(priorityItem);
    if (task.deadline) {
      const deadlineItem = document.createElement('span');
      deadlineItem.className = 'task-meta-item';
      deadlineItem.textContent = `Deadline ${task.deadline}`;
      meta.appendChild(deadlineItem);
    }
    if (task.assignees || task.side) {
      const assignees = task.assignees ? parseJsonList(task.assignees) : [];
      const label = assignees.length ? assignees.join(', ') : task.side;
      const sideItem = document.createElement('span');
      sideItem.className = 'tag';
      sideItem.textContent = `Assignee: ${label}`;
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
    if (task.detail || task.description_rich) {
      const detail = document.createElement('div');
      detail.className = 'task-detail';
      detail.innerHTML = getTaskDetailHtml(task);
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

function collectTaskFormData() {
  const title = document.getElementById('title')?.value.trim() || '';
  const deadline = document.getElementById('deadline')?.value || '';
  const priority = document.getElementById('priority')?.value || '';
  const status = document.getElementById('status')?.value || '';
  const assignees = getSelectedValues(document.getElementById('assignees'));
  const category = document.getElementById('category')?.value || '';

  return {
    title,
    deadline,
    priority,
    status,
    assignees,
    category,
    description_rich: getRichTextHtml(),
    detail: getRichTextPlain()
  };
}

function getMissingTaskFormFields() {
  const ids = [
    'title',
    'deadline',
    'priority',
    'status',
    'assignees',
    'category',
    'detailRich',
    'addButton',
    'cancelEdit'
  ];
  return ids.filter((id) => !document.getElementById(id));
}

function ensureTaskFormReady() {
  const missing = getMissingTaskFormFields();
  if (missing.length) {
    setTaskError('Form task belum memuat seluruh field. Muat ulang halaman.');
    return false;
  }
  return true;
}

function validateTaskForm(data) {
  clearFieldErrors();
  const errors = [];
  if (!data.title) {
    setFieldError('title', 'Judul task wajib diisi.');
    errors.push('Judul task wajib diisi.');
  } else if (data.title.length < 5) {
    setFieldError('title', 'Judul task minimal 5 karakter.');
    errors.push('Judul task minimal 5 karakter.');
  } else if (data.title.length > 200) {
    setFieldError('title', 'Judul task maksimal 200 karakter.');
    errors.push('Judul task maksimal 200 karakter.');
  }
  if (!data.deadline) {
    setFieldError('deadline', 'Tanggal jatuh tempo wajib diisi.');
    errors.push('Tanggal jatuh tempo wajib diisi.');
  } else {
    const today = new Date().toISOString().slice(0, 10);
    if (data.deadline < today) {
      setFieldError('deadline', 'Tanggal jatuh tempo tidak boleh kurang dari hari ini.');
      errors.push('Tanggal jatuh tempo tidak boleh kurang dari hari ini.');
    }
  }
  if (!data.priority) {
    setFieldError('priority', 'Prioritas wajib dipilih.');
    errors.push('Prioritas wajib dipilih.');
  }
  if (!data.status) {
    setFieldError('status', 'Status task wajib dipilih.');
    errors.push('Status task wajib dipilih.');
  }
  if (!data.assignees.length) {
    setFieldError('assignees', 'Assignee minimal 1 orang.');
    errors.push('Assignee minimal 1 orang.');
  }
  return errors;
}

function applyTaskDraft(data) {
  if (!data) return;
  const titleInput = document.getElementById('title');
  const deadlineInput = document.getElementById('deadline');
  const priorityInput = document.getElementById('priority');
  const statusInput = document.getElementById('status');
  const categoryInput = document.getElementById('category');
  const assigneesInput = document.getElementById('assignees');

  if (titleInput) titleInput.value = data.title || '';
  if (deadlineInput) deadlineInput.value = formatDateInput(data.deadline);
  if (priorityInput) priorityInput.value = data.priority || '';
  if (statusInput) statusInput.value = data.status || '';
  if (categoryInput) categoryInput.value = data.category || '';
  if (assigneesInput) {
    Array.from(assigneesInput.options).forEach((option) => {
      option.selected = (data.assignees || []).includes(option.value);
    });
  }
  setRichTextHtml(data.description_rich || '');
}

async function addTask() {
  const addButton = document.getElementById('addButton');
  if (!ensureTaskFormReady()) return;
  const data = collectTaskFormData();
  const isEditing = Boolean(editingTaskId);
  clearTaskError();
  clearTaskSuccess();
  if (isSubmittingTask) return;
  const errors = validateTaskForm(data);
  if (errors.length) {
    setTaskError(errors[0]);
    return;
  }

  isSubmittingTask = true;
  if (addButton) {
    addButton.disabled = true;
    addButton.textContent = 'Menyimpan...';
  }

  try {
    if (editingTaskId) {
      await callWithRetry(() =>
        window.api.updateTask({
          id: editingTaskId,
          expected_updated_at: editingTaskUpdatedAt,
          title: data.title,
          deadline: data.deadline || null,
          side: data.assignees.join(', '),
          detail: data.detail || null,
          status: data.status || null,
          priority: data.priority || null,
          category: data.category || null,
          description_rich: data.description_rich || null,
          assignees: JSON.stringify(data.assignees || [])
        })
      );
      resetEditMode();
      editingTaskUpdatedAt = null;
    } else {
      await callWithRetry(() =>
        window.api.addTask({
          title: data.title,
          deadline: data.deadline || null,
          side: data.assignees.join(', '),
          detail: data.detail || null,
          status: data.status || null,
          priority: data.priority || null,
          category: data.category || null,
          description_rich: data.description_rich || null,
          assignees: JSON.stringify(data.assignees || [])
        })
      );
    }
    clearTaskDraft();
    applyTaskDraft({
      title: '',
      deadline: '',
      priority: 'Medium',
      status: 'To Do',
      assignees: [],
      category: getDefaultCategoryName(),
      description_rich: ''
    });
    await refreshAll();
    setTaskSuccess(isEditing ? 'Task berhasil diperbarui.' : 'Task berhasil ditambahkan.');
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
  editingTaskUpdatedAt = task.updated_at || null;
  applyTaskDraft({
    title: task.title || '',
    deadline: task.deadline || '',
    priority: task.priority || (['Low', 'Medium', 'High', 'Urgent'].includes(task.status) ? task.status : 'Medium'),
    status: ['Low', 'Medium', 'High', 'Urgent'].includes(task.status) ? 'To Do' : task.status || 'To Do',
    assignees: parseJsonList(task.assignees || task.side || ''),
    category: task.category || getDefaultCategoryName(),
    description_rich: task.description_rich || ''
  });
  const addButton = document.getElementById('addButton');
  const cancelButton = document.getElementById('cancelEdit');
  if (addButton) addButton.textContent = 'Simpan';
  if (cancelButton) cancelButton.classList.remove('is-hidden');
}

function resetEditMode() {
  editingTaskId = null;
  editingTaskUpdatedAt = null;
  const addButton = document.getElementById('addButton');
  const cancelButton = document.getElementById('cancelEdit');
  if (addButton) addButton.textContent = 'Add';
  if (cancelButton) cancelButton.classList.add('is-hidden');
}

function cancelEdit() {
  clearTaskError();
  clearTaskSuccess();
  applyTaskDraft({
    title: '',
    deadline: '',
    priority: 'Medium',
    status: 'To Do',
    assignees: [],
    category: getDefaultCategoryName(),
    description_rich: ''
  });
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
  if (typeof Chart === 'undefined') return data;
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

function getEventTypeClass(type) {
  return type === 'task' ? 'calendar-event--task' : 'calendar-event--task';
}

function shiftSelectedDate(days) {
  const base = calendarSelectedDate || getTodayString();
  const date = new Date(base);
  if (Number.isNaN(date.getTime())) return;
  date.setDate(date.getDate() + days);
  calendarSelectedDate = CalendarUtils.toIsoDate(date);
}

function formatEventTime(event) {
  if (event.allDay) return 'Seharian';
  const start = new Date(event.start);
  const end = new Date(event.end || event.start);
  if (Number.isNaN(start.getTime())) return 'Waktu tidak valid';
  const startText = start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const endText = end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return startText === endText ? startText : `${startText}–${endText}`;
}

function buildCalendarTooltip(event) {
  const lines = [];
  lines.push(event.title || '(Tanpa judul)');
  lines.push(formatEventTime(event));
  if (event.sourceLabel) lines.push(`Sumber: ${event.sourceLabel}`);
  if (event.location) lines.push(`Lokasi: ${event.location}`);
  return lines.join('\n');
}

function buildCalendarEventHtml(event) {
  const typeClass = event.pending ? 'calendar-event--pending' : getEventTypeClass(event.type);
  const tooltip = buildCalendarTooltip(event);
  return `
    <div
      class="calendar-event ${typeClass}"
      data-tooltip="${escapeHtml(tooltip)}"
      data-event-id="${escapeHtml(event.id || '')}"
      data-event-source="${escapeHtml(event.source || '')}"
      data-event-calendar="${escapeHtml(event.calendarId || '')}"
    >
      <div class="calendar-event-title">${escapeHtml(event.title)}</div>
    </div>
  `;
}

function normalizeTaskEvents(tasks) {
  return (tasks || [])
    .filter((task) => task.deadline)
    .map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      start: task.deadline,
      end: task.deadline,
      allDay: true,
      type: 'task',
      source: 'task',
      sourceLabel: 'Task'
    }));
}

function buildUnifiedCalendarEvents(tasks) {
  return normalizeTaskEvents(tasks);
}

function renderMonthCalendar(events) {
  const grid = document.getElementById('calendarGrid');
  const label = document.getElementById('calendarMonthLabel');
  if (!grid || !label || typeof CalendarUtils === 'undefined') return;
  const viewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1);
  label.textContent = viewDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const today = getTodayString();
  const cells = CalendarUtils.buildMonthCells(viewDate, events);
  grid.innerHTML = cells
    .map((cell) => {
      const dayEvents = cell.events || [];
      const visible = dayEvents.slice(0, 3);
      const moreCount = dayEvents.length - visible.length;
      const eventHtml = visible.map(buildCalendarEventHtml).join('');
      const moreHtml = moreCount > 0 ? `<div class="calendar-event-more">+${moreCount} lagi</div>` : '';
      return `
        <div class="calendar-day ${cell.isOutside ? 'is-outside' : ''} ${cell.date === today ? 'is-today' : ''}" data-date="${cell.date}">
          <div class="calendar-day-number">${cell.dayNumber}</div>
          <div class="calendar-events">
            ${eventHtml}
            ${moreHtml}
          </div>
        </div>
      `;
    })
    .join('');
}

function renderWeekCalendar(events) {
  const container = document.getElementById('calendarWeek');
  if (!container) return;
  const baseDate = calendarSelectedDate || getTodayString();
  const model = CalendarUtils.buildWeekModel(baseDate, events);
  container.innerHTML = model
    .map((day) => {
      const list = day.events.length
        ? day.events.map(buildCalendarEventHtml).join('')
        : '<div class="calendar-event-more">Tidak ada event</div>';
      return `
        <div class="calendar-week-day" data-date="${day.date}">
          <div class="calendar-week-label">${day.label}</div>
          <div class="calendar-event-list">${list}</div>
        </div>
      `;
    })
    .join('');
}

function renderDayCalendar(events) {
  const container = document.getElementById('calendarDay');
  if (!container) return;
  const baseDate = calendarSelectedDate || getTodayString();
  const model = CalendarUtils.buildDayModel(baseDate, events);
  const list = model.events.length
    ? model.events.map(buildCalendarEventHtml).join('')
    : '<div class="calendar-event-more">Tidak ada event</div>';
  container.innerHTML = `
    <div class="calendar-day-label">${model.label}</div>
    <div class="calendar-event-list">${list}</div>
  `;
}

function renderCalendarView(events) {
  const grid = document.getElementById('calendarGrid');
  const week = document.getElementById('calendarWeek');
  const day = document.getElementById('calendarDay');
  const weekdays = document.querySelector('.calendar-weekdays');
  if (calendarViewMode === 'month') {
    grid?.classList.remove('is-hidden');
    week?.classList.add('is-hidden');
    day?.classList.add('is-hidden');
    weekdays?.classList.remove('is-hidden');
    renderMonthCalendar(events);
  } else if (calendarViewMode === 'week') {
    grid?.classList.add('is-hidden');
    week?.classList.remove('is-hidden');
    day?.classList.add('is-hidden');
    weekdays?.classList.add('is-hidden');
    renderWeekCalendar(events);
  } else {
    grid?.classList.add('is-hidden');
    week?.classList.add('is-hidden');
    day?.classList.remove('is-hidden');
    weekdays?.classList.add('is-hidden');
    renderDayCalendar(events);
  }
}

function setupCalendarControls() {
  const prevButton = document.getElementById('calendarPrev');
  const nextButton = document.getElementById('calendarNext');
  const grid = document.getElementById('calendarGrid');
  const week = document.getElementById('calendarWeek');
  const day = document.getElementById('calendarDay');
  const viewTabs = document.querySelectorAll('.calendar-view-tab');
  const quickAddButton = document.getElementById('calendarQuickAddTrigger');
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      if (calendarViewMode === 'month') {
        calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
      } else if (calendarViewMode === 'week') {
        shiftSelectedDate(-7);
      } else {
        shiftSelectedDate(-1);
      }
      renderCalendarView(buildUnifiedCalendarEvents(cachedTasks));
    });
  }
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      if (calendarViewMode === 'month') {
        calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
      } else if (calendarViewMode === 'week') {
        shiftSelectedDate(7);
      } else {
        shiftSelectedDate(1);
      }
      renderCalendarView(buildUnifiedCalendarEvents(cachedTasks));
    });
  }
  if (quickAddButton) {
    quickAddButton.addEventListener('click', () => {
      openCalendarQuickAdd(calendarSelectedDate || getTodayString());
    });
  }
  if (grid) {
    grid.addEventListener('click', (event) => {
      const eventCard = event.target.closest('.calendar-event');
      if (eventCard) {
        handleCalendarEventClick(eventCard);
        return;
      }
      const cell = event.target.closest('.calendar-day');
      if (!cell) return;
      const date = cell.getAttribute('data-date');
      if (date) {
        calendarSelectedDate = date;
        if (calendarViewMode === 'month') {
          openCalendarQuickAdd(date);
        }
        renderCalendarView(buildUnifiedCalendarEvents(cachedTasks));
      }
    });
  }
  if (viewTabs.length) {
    viewTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-calendar-view');
        if (!target) return;
        calendarViewMode = target;
        viewTabs.forEach((item) => item.classList.toggle('is-active', item === tab));
        renderCalendarView(buildUnifiedCalendarEvents(cachedTasks));
      });
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
          status: 'To Do',
          priority: 'Medium',
          assignees: JSON.stringify([currentProfile?.name || 'User']),
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
  const [tasksResult, statsResult, dailyStatsResult] = await Promise.allSettled([
    loadTasks(),
    loadStats(),
    loadChart()
  ]);
  const tasks = tasksResult.status === 'fulfilled' ? tasksResult.value : [];
  const stats = statsResult.status === 'fulfilled' ? statsResult.value : {};
  const dailyStats = dailyStatsResult.status === 'fulfilled' ? dailyStatsResult.value : [];
  cachedTasks = tasks || [];
  cachedStats = stats || {};
  cachedDailyStats = dailyStats || [];
  populateTaskReferences(cachedTasks);
  renderDashboardSummary(tasks || [], stats || {}, dailyStats || []);
  renderAnalyticsSummary(tasks || [], stats || {}, dailyStats || []);
  updateCalendar();
  renderCalendarTasks(tasks || []);
  renderCalendarView(buildUnifiedCalendarEvents(cachedTasks));
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
  document.body.dataset.activeSection = section;
  if (section === 'tasks') {
    loadTasks({ append: false });
  }
  if (section === 'dashboard') {
    renderCategoryLegend();
  }
}

function setupTaskForm() {
  if (!ensureTaskFormReady()) return;
  const addButton = document.getElementById('addButton');
  const cancelButton = document.getElementById('cancelEdit');
  const loadMoreButton = document.getElementById('tasksLoadMore');
  const titleInput = document.getElementById('title');
  const deadlineInput = document.getElementById('deadline');
  const priorityInput = document.getElementById('priority');
  const statusInput = document.getElementById('status');
  const richButtons = document.querySelectorAll('[data-rich-action]');
  const inputs = [
    titleInput,
    deadlineInput,
    priorityInput,
    statusInput,
    document.getElementById('assignees'),
    document.getElementById('category')
  ].filter(Boolean);

  if (addButton) addButton.addEventListener('click', () => addTask());
  if (cancelButton) cancelButton.addEventListener('click', () => cancelEdit());
  if (loadMoreButton) {
    loadMoreButton.addEventListener('click', () => loadTasks({ append: true }));
  }
  if (priorityInput && !priorityInput.value) priorityInput.value = 'Medium';
  if (statusInput && !statusInput.value) statusInput.value = 'To Do';
  if (deadlineInput) deadlineInput.min = getTodayString();
  richButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-rich-action');
      const editor = document.getElementById('detailRich');
      if (!editor || !action) return;
      editor.focus();
      if (action === 'bold') document.execCommand('bold');
      if (action === 'italic') document.execCommand('italic');
      if (action === 'unordered') document.execCommand('insertUnorderedList');
      clearTaskError();
      clearTaskSuccess();
    });
  });
  loadReferenceData().then(() => {
    const draft = loadTaskDraft();
    if (draft) {
      applyTaskDraft(draft);
    }
  });

  inputs.forEach((input) => {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addTask();
      }
    });
    input.addEventListener('input', () => {
      clearTaskError();
      clearTaskSuccess();
      validateTaskForm(collectTaskFormData());
      saveTaskDraft(collectTaskFormData());
    });
    input.addEventListener('change', () => {
      clearTaskError();
      clearTaskSuccess();
      validateTaskForm(collectTaskFormData());
      saveTaskDraft(collectTaskFormData());
    });
  });
  if (document.getElementById('detailRich')) {
    document.getElementById('detailRich').addEventListener('input', () => {
      clearTaskError();
      clearTaskSuccess();
      validateTaskForm(collectTaskFormData());
      saveTaskDraft(collectTaskFormData());
    });
  }
  if (taskDraftTimer) clearInterval(taskDraftTimer);
  taskDraftTimer = setInterval(() => {
    saveTaskDraft(collectTaskFormData());
  }, 30000);
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

function applyRegistrationLanguage(language) {
  const section = document.querySelector('[data-section="registration"]');
  if (!section) return;
  const i18n = getRegistrationI18n(language);
  section.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    if (key && i18n[key]) node.textContent = i18n[key];
  });
  const templateInput = document.getElementById('registrationTemplateName');
  if (templateInput) templateInput.placeholder = i18n.templatePlaceholder;
  const roleSelect = document.getElementById('registrationRoleSelect');
  if (roleSelect) {
    roleSelect.querySelectorAll('option').forEach((option) => {
      if (option.value === 'developer') option.textContent = i18n.developerRole;
      if (option.value === 'end-user') option.textContent = i18n.endUserRole;
    });
  }
}

function renderRegistrationTemplateOptions(templates, language) {
  const select = document.getElementById('registrationTemplateSelect');
  if (!select) return;
  const i18n = getRegistrationI18n(language);
  select.innerHTML = templates
    .map((template) => {
      const label =
        (language === 'en' ? template.name?.en : template.name?.id) ||
        template.name?.id ||
        template.name?.en ||
        i18n.templateLabel;
      return `<option value="${escapeHtml(template.id)}">${escapeHtml(label)}</option>`;
    })
    .join('');
}

function renderRegistrationPalette(language) {
  const palette = document.getElementById('registrationPalette');
  if (!palette) return;
  const i18n = getRegistrationI18n(language);
  const types = Object.keys(i18n.fieldTypes);
  palette.innerHTML = types
    .map(
      (type) =>
        `<button class="field-palette-item" type="button" draggable="true" data-field-type="${type}">${i18n.fieldTypes[type]}</button>`
    )
    .join('');
}

function renderRegistrationFieldList(schema, language, role) {
  const list = document.getElementById('registrationFieldList');
  if (!list) return;
  const i18n = getRegistrationI18n(language);
  list.innerHTML = schema
    .map((field, index) => {
      const label = resolveRegistrationLabel(field, language);
      const options = Object.keys(i18n.fieldTypes)
        .map(
          (type) =>
            `<option value="${type}" ${field.type === type ? 'selected' : ''}>${i18n.fieldTypes[type]}</option>`
        )
        .join('');
      const optionsValue = (field.options || []).join(', ');
      const showOptions = field.type === 'select' ? 'block' : 'none';
      return `
        <div class="field-item" draggable="true" data-field-id="${escapeHtml(field.id)}" data-field-index="${index}">
          <span class="field-item-handle">⋮⋮</span>
          <div class="field-item-main">
            <input class="input field-label-input" type="text" value="${escapeHtml(label)}" placeholder="${escapeHtml(i18n.labelLabel)}">
            <select class="input field-type-select">${options}</select>
            <label class="toggle">
              <input class="field-required-toggle" type="checkbox" ${field.required ? 'checked' : ''}>
              <span class="toggle-track"></span>
              <span class="toggle-label">${i18n.requiredLabel}</span>
            </label>
          </div>
          <div class="field-item-actions">
            <button class="btn-ghost btn-compact" type="button" data-field-remove="${escapeHtml(field.id)}">${i18n.removeLabel}</button>
          </div>
        </div>
        <div class="field-options-row" data-field-options="${escapeHtml(field.id)}" style="display:${showOptions}">
          <input class="input field-options-input" type="text" value="${escapeHtml(optionsValue)}" placeholder="${escapeHtml(i18n.fieldLabels.options)}">
        </div>
      `;
    })
    .join('');
  if (role === 'end-user') return;
}

function renderRegistrationForm(schema, language) {
  const form = document.getElementById('registrationForm');
  if (!form) return;
  const i18n = getRegistrationI18n(language);
  form.innerHTML = schema
    .map((field) => {
      const label = resolveRegistrationLabel(field, language);
      const id = escapeHtml(field.id);
      const required = field.required ? 'required' : '';
      if (field.type === 'textarea') {
        return `
          <div class="form-row full">
            <label class="settings-label" for="${id}">${escapeHtml(label)}</label>
            <textarea id="${id}" class="input" rows="3" data-field-id="${id}" ${required}></textarea>
            <div class="form-error" data-error-for="${id}"></div>
          </div>
        `;
      }
      if (field.type === 'select') {
        const options = (field.options || ['Option 1', 'Option 2'])
          .map((opt) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`)
          .join('');
        return `
          <div class="form-row">
            <label class="settings-label" for="${id}">${escapeHtml(label)}</label>
            <select id="${id}" class="input" data-field-id="${id}" ${required}>
              ${options}
            </select>
            <div class="form-error" data-error-for="${id}"></div>
          </div>
        `;
      }
      const inputType =
        field.type === 'email'
          ? 'email'
          : field.type === 'phone'
            ? 'tel'
            : field.type === 'number'
              ? 'number'
              : field.type === 'date'
                ? 'date'
                : field.type === 'url'
                  ? 'url'
                  : 'text';
      return `
        <div class="form-row">
          <label class="settings-label" for="${id}">${escapeHtml(label)}</label>
          <input id="${id}" class="input" type="${inputType}" data-field-id="${id}" ${required}>
          <div class="form-error" data-error-for="${id}"></div>
        </div>
      `;
    })
    .join('');
  form.querySelectorAll('[data-field-id]').forEach((input) => {
    input.addEventListener('input', () => {
      const fieldId = input.getAttribute('data-field-id');
      const field = registrationSchema.find((item) => item.id === fieldId);
      if (!field) return;
      const message = validateRegistrationValue(field, input.value, language);
      const errorNode = form.querySelector(`[data-error-for="${fieldId}"]`);
      if (errorNode) errorNode.textContent = message;
      input.classList.toggle('is-invalid', Boolean(message));
    });
  });
}

function setRegistrationStatus(message) {
  const status = document.getElementById('registrationSubmissionStatus');
  if (status) status.textContent = message;
}

function renderRegistrationBuilder() {
  applyRegistrationLanguage(registrationPrefs.language);
  renderRegistrationTemplateOptions(registrationTemplates, registrationPrefs.language);
  renderRegistrationPalette(registrationPrefs.language);
  renderRegistrationFieldList(registrationSchema, registrationPrefs.language, registrationPrefs.role);
  renderRegistrationForm(registrationSchema, registrationPrefs.language);
}

function setupRegistrationBuilder() {
  const section = document.querySelector('[data-section="registration"]');
  if (!section) return;
  registrationPrefs = loadRegistrationPrefs();
  registrationTemplates = loadRegistrationTemplates();
  registrationSchema = loadRegistrationSchema(registrationPrefs, registrationTemplates);
  registrationSubmissions = loadRegistrationSubmissions();

  const roleSelect = document.getElementById('registrationRoleSelect');
  const languageSelect = document.getElementById('registrationLanguageSelect');
  const templateSelect = document.getElementById('registrationTemplateSelect');
  const templateInput = document.getElementById('registrationTemplateName');
  const templateSave = document.getElementById('registrationTemplateSave');
  const submitButton = document.getElementById('registrationSubmit');
  const resetButton = document.getElementById('registrationReset');
  const exportPdf = document.getElementById('registrationExportPdf');
  const exportExcel = document.getElementById('registrationExportExcel');
  const builderCard = section.querySelector('.registration-builder');
  function wireFieldListEvents() {
    const list = document.getElementById('registrationFieldList');
    if (!list) return;
    list.querySelectorAll('.field-item').forEach((item) => {
      item.addEventListener('dragstart', (event) => {
        if (registrationPrefs.role === 'end-user') return;
        const id = item.getAttribute('data-field-id') || '';
        event.dataTransfer?.setData('text/plain', `field:${id}`);
      });
    });
    list.querySelectorAll('.field-label-input').forEach((input) => {
      input.addEventListener('input', () => {
        const fieldId = input.closest('.field-item')?.getAttribute('data-field-id');
        const field = registrationSchema.find((item) => item.id === fieldId);
        if (!field) return;
        field.label = input.value;
        saveRegistrationSchema(registrationSchema);
        renderRegistrationForm(registrationSchema, registrationPrefs.language);
      });
    });
    list.querySelectorAll('.field-type-select').forEach((select) => {
      select.addEventListener('change', () => {
        const fieldId = select.closest('.field-item')?.getAttribute('data-field-id');
        const field = registrationSchema.find((item) => item.id === fieldId);
        if (!field) return;
        field.type = select.value;
        if (field.type === 'select' && (!field.options || !field.options.length)) {
          field.options = ['Option 1', 'Option 2'];
        }
        saveRegistrationSchema(registrationSchema);
        renderAndWire();
      });
    });
    list.querySelectorAll('.field-required-toggle').forEach((toggle) => {
      toggle.addEventListener('change', () => {
        const fieldId = toggle.closest('.field-item')?.getAttribute('data-field-id');
        const field = registrationSchema.find((item) => item.id === fieldId);
        if (!field) return;
        field.required = toggle.checked;
        saveRegistrationSchema(registrationSchema);
        renderRegistrationForm(registrationSchema, registrationPrefs.language);
      });
    });
    list.querySelectorAll('[data-field-remove]').forEach((button) => {
      button.addEventListener('click', () => {
        const fieldId = button.getAttribute('data-field-remove');
        registrationSchema = registrationSchema.filter((field) => field.id !== fieldId);
        saveRegistrationSchema(registrationSchema);
        renderAndWire();
      });
    });
    list.querySelectorAll('.field-options-input').forEach((input) => {
      input.addEventListener('input', () => {
        const fieldId = input.parentElement?.getAttribute('data-field-options');
        const field = registrationSchema.find((item) => item.id === fieldId);
        if (!field) return;
        field.options = input.value.split(',').map((opt) => opt.trim()).filter(Boolean);
        saveRegistrationSchema(registrationSchema);
        renderRegistrationForm(registrationSchema, registrationPrefs.language);
      });
    });
  }
  const renderAndWire = () => {
    renderRegistrationBuilder();
    wireFieldListEvents();
    if (templateSelect) templateSelect.value = registrationPrefs.template;
  };

  if (roleSelect) roleSelect.value = registrationPrefs.role;
  if (languageSelect) languageSelect.value = registrationPrefs.language;

  const setRoleState = (role) => {
    if (builderCard) builderCard.classList.toggle('is-readonly', role === 'end-user');
    if (templateSelect) templateSelect.disabled = role === 'end-user';
  };
  setRoleState(registrationPrefs.role);

  if (roleSelect) {
    roleSelect.addEventListener('change', () => {
      registrationPrefs.role = roleSelect.value === 'end-user' ? 'end-user' : 'developer';
      saveRegistrationPrefs(registrationPrefs);
      setRoleState(registrationPrefs.role);
      renderAndWire();
    });
  }

  if (languageSelect) {
    languageSelect.addEventListener('change', () => {
      registrationPrefs.language = languageSelect.value === 'en' ? 'en' : 'id';
      saveRegistrationPrefs(registrationPrefs);
      renderAndWire();
    });
  }

  if (templateSelect) {
    templateSelect.addEventListener('change', () => {
      registrationPrefs.template = templateSelect.value;
      saveRegistrationPrefs(registrationPrefs);
      const selected = registrationTemplates.find((template) => template.id === templateSelect.value);
      registrationSchema = JSON.parse(JSON.stringify(selected?.fields || []));
      saveRegistrationSchema(registrationSchema);
      renderAndWire();
    });
  }

  if (templateSave && templateInput) {
    templateSave.addEventListener('click', () => {
      const name = templateInput.value.trim();
      if (!name) return;
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const newTemplate = {
        id: id || `template-${Date.now()}`,
        name: { id: name, en: name },
        fields: JSON.parse(JSON.stringify(registrationSchema))
      };
      registrationTemplates = [...registrationTemplates.filter((item) => item.id !== newTemplate.id), newTemplate];
      saveRegistrationTemplates(registrationTemplates);
      templateInput.value = '';
      renderAndWire();
    });
  }

  const palette = document.getElementById('registrationPalette');
  if (palette) {
    palette.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const type = target.getAttribute('data-field-type');
      if (!type || registrationPrefs.role === 'end-user') return;
      registrationSchema = [...registrationSchema, createRegistrationField(type, registrationPrefs.language)];
      saveRegistrationSchema(registrationSchema);
      renderAndWire();
    });
    palette.addEventListener('dragstart', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const type = target.getAttribute('data-field-type');
      if (!type) return;
      event.dataTransfer?.setData('text/plain', `palette:${type}`);
    });
  }

  const fieldList = document.getElementById('registrationFieldList');
  if (fieldList) {
    fieldList.addEventListener('dragover', (event) => {
      if (registrationPrefs.role === 'end-user') return;
      event.preventDefault();
    });
    fieldList.addEventListener('drop', (event) => {
      if (registrationPrefs.role === 'end-user') return;
      event.preventDefault();
      const payload = event.dataTransfer?.getData('text/plain') || '';
      const targetItem = (event.target instanceof Element && event.target.closest('.field-item')) || null;
      const targetIndex = targetItem ? Number(targetItem.getAttribute('data-field-index')) : registrationSchema.length;
      if (payload.startsWith('palette:')) {
        const type = payload.replace('palette:', '');
        if (!type) return;
        const field = createRegistrationField(type, registrationPrefs.language);
        registrationSchema.splice(targetIndex, 0, field);
        saveRegistrationSchema(registrationSchema);
        renderAndWire();
        return;
      }
      if (payload.startsWith('field:')) {
        const fieldId = payload.replace('field:', '');
        const fromIndex = registrationSchema.findIndex((item) => item.id === fieldId);
        if (fromIndex === -1 || fromIndex === targetIndex) return;
        const [moved] = registrationSchema.splice(fromIndex, 1);
        const insertIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
        registrationSchema.splice(insertIndex, 0, moved);
        saveRegistrationSchema(registrationSchema);
        renderAndWire();
      }
    });
  }

  renderAndWire();

  renderAndWire();

  if (submitButton) {
    submitButton.addEventListener('click', () => {
      const form = document.getElementById('registrationForm');
      if (!form) return;
      const payload = { submitted_at: new Date().toISOString(), values: {} };
      let hasError = false;
      registrationSchema.forEach((field) => {
        const input = form.querySelector(`[data-field-id="${field.id}"]`);
        const value = input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement ? input.value : '';
        const message = validateRegistrationValue(field, value, registrationPrefs.language);
        const errorNode = form.querySelector(`[data-error-for="${field.id}"]`);
        if (errorNode) errorNode.textContent = message;
        if (input instanceof HTMLElement) input.classList.toggle('is-invalid', Boolean(message));
        if (message) hasError = true;
        payload.values[field.id] = value;
      });
      if (hasError) return;
      registrationSubmissions = [...registrationSubmissions, payload];
      saveRegistrationSubmissions(registrationSubmissions);
      setRegistrationStatus(getRegistrationI18n(registrationPrefs.language).statusSaved);
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      const form = document.getElementById('registrationForm');
      if (form) form.reset();
      setRegistrationStatus('');
    });
  }

  if (exportPdf) {
    exportPdf.addEventListener('click', async () => {
      if (!registrationSubmissions.length) {
        setRegistrationStatus(getRegistrationI18n(registrationPrefs.language).statusEmpty);
        return;
      }
      const ok = await unwrap(
        window.api.exportRegistrationPdf({
          schema: registrationSchema,
          submissions: registrationSubmissions,
          language: registrationPrefs.language
        }),
        false
      );
      if (ok) setRegistrationStatus(getRegistrationI18n(registrationPrefs.language).statusExported);
    });
  }

  if (exportExcel) {
    exportExcel.addEventListener('click', async () => {
      if (!registrationSubmissions.length) {
        setRegistrationStatus(getRegistrationI18n(registrationPrefs.language).statusEmpty);
        return;
      }
      const ok = await unwrap(
        window.api.exportRegistrationExcel({
          schema: registrationSchema,
          submissions: registrationSubmissions,
          language: registrationPrefs.language
        }),
        false
      );
      if (ok) setRegistrationStatus(getRegistrationI18n(registrationPrefs.language).statusExported);
    });
  }
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

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (window.location.protocol === 'file:') {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    return;
  }
  try {
    await navigator.serviceWorker.register('sw.js');
  } catch (err) {
    console.error(err);
  }
}

function updateOnlineStatusBadge(isOnline) {
  const badge = document.getElementById('onlineStatusBadge');
  if (!badge) return;
  badge.textContent = isOnline ? 'Online' : 'Offline';
  badge.classList.toggle('is-offline', !isOnline);
}

function setupOnlineStatus() {
  const badge = document.getElementById('onlineStatusBadge');
  if (!badge) return;
  updateOnlineStatusBadge(navigator.onLine);
  window.addEventListener('online', () => {
    updateOnlineStatusBadge(true);
  });
  window.addEventListener('offline', () => {
    updateOnlineStatusBadge(false);
  });
}

const STARTUP_ERROR_KEY = 'streakly_startup_errors';

async function getRuntimeInfoSafe() {
  const info = await unwrap(window.api.getRuntimeInfo(), null);
  return info || {
    app_version: 'unknown',
    electron: 'unknown',
    chrome: 'unknown',
    node: 'unknown',
    platform: navigator.platform,
    arch: 'unknown',
    env: 'unknown',
    app_path: 'unknown',
    user_data: 'unknown'
  };
}

function serializeError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack || ''
    };
  }
  return { name: 'Error', message: String(error || 'Unknown error'), stack: '' };
}

function saveStartupError(payload) {
  try {
    const existing = JSON.parse(window.localStorage.getItem(STARTUP_ERROR_KEY) || '[]');
    existing.unshift(payload);
    window.localStorage.setItem(STARTUP_ERROR_KEY, JSON.stringify(existing.slice(0, 5)));
  } catch (err) {
    console.error(err);
  }
}

async function showStartupError(error) {
  if (document.getElementById('startupError')) return;
  const runtime = await getRuntimeInfoSafe();
  const serialized = serializeError(error);
  const payload = {
    time: new Date().toISOString(),
    url: window.location.href,
    user_agent: navigator.userAgent,
    runtime,
    error: serialized
  };
  saveStartupError(payload);
  const wrapper = document.createElement('div');
  wrapper.id = 'startupError';
  wrapper.className = 'startup-error';
  const card = document.createElement('div');
  card.className = 'startup-error-card';
  const title = document.createElement('div');
  title.textContent = 'Gagal memuat aplikasi';
  title.className = 'startup-error-title';
  const message = document.createElement('div');
  message.textContent = serialized.message || 'Terjadi kesalahan tidak terduga.';
  message.className = 'startup-error-message';
  const detail = document.createElement('pre');
  detail.className = 'startup-error-detail';
  detail.textContent = JSON.stringify(payload, null, 2);
  const button = document.createElement('button');
  button.textContent = 'Coba muat ulang';
  button.className = 'startup-error-button';
  button.addEventListener('click', () => window.location.reload());
  const copyButton = document.createElement('button');
  copyButton.textContent = 'Salin detail';
  copyButton.className = 'startup-error-button secondary';
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(detail.textContent || '');
      copyButton.textContent = 'Tersalin';
      setTimeout(() => {
        copyButton.textContent = 'Salin detail';
      }, 1200);
    } catch (err) {
      console.error(err);
    }
  });
  card.appendChild(title);
  card.appendChild(message);
  card.appendChild(detail);
  card.appendChild(button);
  card.appendChild(copyButton);
  wrapper.appendChild(card);
  document.body.appendChild(wrapper);
}

async function initApp() {
  calendarViewDate = new Date();
  calendarViewDate.setDate(1);
  calendarSelectedDate = getTodayString();
  setupNavigation();
  setupProfile();
  setupSettings();
  setupCategoryManager();
  setupTopbar();
  setupFocusAreaLayout();
  setupCalendarControls();
  setupCalendarQuickAdd();
  setupOnlineStatus();
  setupReminderCalendar();
  setupTaskForm();
  setupRegistrationBuilder();
  setupAboutTabs();
  setActiveSection('dashboard');
  await refreshAll();
  await registerServiceWorker();
}

window.addEventListener('error', (event) => {
  if (event?.error instanceof Error) {
    showStartupError(event.error);
    return;
  }
  const fallback = new Error(event?.message || 'Unknown error');
  if (event?.filename || event?.lineno || event?.colno) {
    fallback.stack = `at ${event.filename || 'unknown'}:${event.lineno || 0}:${event.colno || 0}`;
  }
  showStartupError(fallback);
});

window.addEventListener('unhandledrejection', (event) => {
  if (event?.reason instanceof Error) {
    showStartupError(event.reason);
    return;
  }
  const fallback = new Error(String(event?.reason || 'Unhandled rejection'));
  showStartupError(fallback);
});

window.addEventListener('DOMContentLoaded', () => {
  initApp().catch((error) => {
    console.error(error);
    showStartupError(error);
  });
});
