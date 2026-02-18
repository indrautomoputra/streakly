export function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatShortDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

export function normalizeHex(value, fallback) {
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

export function unwrap(promise, fallback) {
  return promise.then(res => (res && res.ok ? res.data : fallback)).catch(() => fallback);
}

export function hexToRgb(hex) {
  const value = normalizeHex(hex).replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return { r, g, b };
}

export function lightenHex(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const to = (v) => Math.round(v + (255 - v) * amount);
  const toHex = (v) => v.toString(16).padStart(2, '0');
  return `#${toHex(to(r))}${toHex(to(g))}${toHex(to(b))}`;
}

export function rgbaFromHex(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
