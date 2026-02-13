const queries = require('../database/queries');
const xpService = require('./xpService');

function cleanText(value, max) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function cleanOptional(value, max) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function normalizeDeadline(value) {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function normalizeId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function validateTaskInput({ title, detail, side }) {
  if (typeof title !== 'string') return { ok: false, message: 'Judul task wajib diisi.' };
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return { ok: false, message: 'Judul task wajib diisi.' };
  if (trimmedTitle.length > 120) return { ok: false, message: 'Judul task maksimal 120 karakter.' };
  if (typeof detail === 'string' && detail.trim().length > 280) {
    return { ok: false, message: 'Detail task maksimal 280 karakter.' };
  }
  if (typeof side === 'string' && side.trim().length > 60) {
    return { ok: false, message: 'Nama side maksimal 60 karakter.' };
  }
  return { ok: true, message: '' };
}

async function addTask(title, deadline, side, detail, status, category) {
  try {
    const validation = validateTaskInput({ title, detail, side });
    if (!validation.ok) {
      console.error(new Error(validation.message));
      return null;
    }
    const cleanTitle = cleanText(title, 120);
    const cleanSide = cleanOptional(side, 60);
    const cleanDetail = cleanOptional(detail, 280);
    const cleanStatus = cleanOptional(status, 40);
    const cleanCategory = cleanOptional(category, 60);
    const cleanDeadline = normalizeDeadline(deadline);
    return await queries.addTask(
      cleanTitle,
      cleanDeadline,
      cleanSide,
      cleanDetail,
      cleanStatus,
      cleanCategory
    );
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function getTasks(params) {
  const limit = Number(params?.limit);
  const offset = Number(params?.offset);
  const safeLimit = Number.isFinite(limit) ? Math.min(200, Math.max(1, limit)) : undefined;
  const safeOffset = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : undefined;
  return await queries.getTasks({ limit: safeLimit, offset: safeOffset });
}

async function completeTask(id) {
  const safeId = normalizeId(id);
  if (!safeId) return false;
  const result = await queries.markTaskDone(safeId);
  if (!result?.changes) return false;
  await xpService.updateXP();
  return true;
}

async function updateTask(id, title, deadline, side, detail, status, category) {
  try {
    const safeId = normalizeId(id);
    const validation = validateTaskInput({ title, detail, side });
    if (!safeId || !validation.ok) {
      console.error(new Error(validation.message || 'ID task tidak valid.'));
      return false;
    }
    const cleanTitle = cleanText(title, 120);
    const cleanSide = cleanOptional(side, 60);
    const cleanDetail = cleanOptional(detail, 280);
    const cleanStatus = cleanOptional(status, 40);
    const cleanCategory = cleanOptional(category, 60);
    const cleanDeadline = normalizeDeadline(deadline);
    const result = await queries.updateTask(safeId, {
      title: cleanTitle,
      deadline: cleanDeadline,
      side: cleanSide,
      detail: cleanDetail,
      status: cleanStatus,
      category: cleanCategory
    });
    return !!result?.changes;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function deleteTask(id) {
  const safeId = normalizeId(id);
  if (!safeId) return false;
  const result = await queries.deleteTask(safeId);
  return !!result?.changes;
}

module.exports = {
  addTask,
  getTasks,
  completeTask,
  updateTask,
  deleteTask,
  validateTaskInput
};
