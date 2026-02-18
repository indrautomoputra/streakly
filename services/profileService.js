const queries = require('../database/queries');

function cleanName(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 60);
}

function cleanAvatar(value) {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  if (!value.startsWith('data:image/')) return null;
  return value;
}

function cleanAvatarConfig(value) {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return null;
    return JSON.stringify({
      base: String(parsed.base || 'human'),
      armor: String(parsed.armor || 'vanguard'),
      accessory: String(parsed.accessory || 'aura'),
      mood: String(parsed.mood || 'focus'),
      palette: String(parsed.palette || '#6f67ff')
    });
  } catch (err) {
    return null;
  }
}

function cleanEmail(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  return isValid ? trimmed.slice(0, 120) : null;
}

async function getProfile() {
  const row = await queries.ensureProfileRow();
  return {
    name: row?.name || 'Raka Pratama',
    avatar: row?.avatar || null,
    email: row?.email || null,
    avatar_config: row?.avatar_config || null
  };
}

async function updateProfile(name, avatar, email, avatarConfig) {
  const clean = cleanName(name);
  if (!clean) return false;
  const safeAvatar = cleanAvatar(avatar);
  const safeEmail = cleanEmail(email);
  const safeAvatarConfig = cleanAvatarConfig(avatarConfig);
  if (email && !safeEmail) return false;
  await queries.ensureProfileRow();
  await queries.updateProfile({
    name: clean,
    avatar: safeAvatar,
    email: safeEmail,
    avatar_config: safeAvatarConfig
  });
  return true;
}

module.exports = {
  getProfile,
  updateProfile
};
