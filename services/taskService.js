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

function toDateString(value) {
  if (!value || typeof value !== 'string') return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function parseJsonList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function normalizeId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function validateTaskInput(payload) {
  const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
  if (!title) return { ok: false, message: 'Judul task wajib diisi.' };
  if (title.length < 5) return { ok: false, message: 'Judul task minimal 5 karakter.' };
  if (title.length > 200) return { ok: false, message: 'Judul task maksimal 200 karakter.' };
  const deadline = normalizeDeadline(payload?.deadline);
  if (!deadline) return { ok: false, message: 'Deadline wajib diisi.' };
  const today = new Date().toISOString().slice(0, 10);
  if (deadline < today) return { ok: false, message: 'Deadline tidak boleh kurang dari hari ini.' };
  const status = typeof payload?.status === 'string' ? payload.status.trim() : '';
  const priority = typeof payload?.priority === 'string' ? payload.priority.trim() : '';
  const statusOptions = ['To Do', 'In Progress', 'In Review', 'Completed', 'On Hold', 'Cancelled'];
  const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];
  if (!statusOptions.includes(status)) {
    return { ok: false, message: 'Status task tidak valid.' };
  }
  if (!priorityOptions.includes(priority)) {
    return { ok: false, message: 'Prioritas task tidak valid.' };
  }
  const assignees = parseJsonList(payload?.assignees);
  if (!assignees.length) {
    return { ok: false, message: 'Assignee minimal 1 orang.' };
  }
  const startDate = toDateString(payload?.start_date);
  if (startDate && startDate > deadline) {
    return { ok: false, message: 'Tanggal mulai tidak boleh lebih besar dari deadline.' };
  }
  if (payload?.is_recurring && !payload?.recurring_frequency) {
    return { ok: false, message: 'Frekuensi task berulang wajib dipilih.' };
  }
  if (payload?.estimate_value) {
    const estimateValue = Number(payload.estimate_value);
    if (Number.isNaN(estimateValue) || estimateValue <= 0) {
      return { ok: false, message: 'Estimasi durasi harus berupa angka.' };
    }
    if (payload.estimate_unit === 'hours' && (estimateValue < 1 || estimateValue > 999)) {
      return { ok: false, message: 'Estimasi jam harus 1-999.' };
    }
    if (payload.estimate_unit === 'days' && (estimateValue < 0.5 || estimateValue > 365)) {
      return { ok: false, message: 'Estimasi hari harus 0.5-365.' };
    }
  }
  return { ok: true, message: '' };
}

async function addTask(payload) {
  try {
    const validation = validateTaskInput(payload);
    if (!validation.ok) {
      console.error(new Error(validation.message));
      return null;
    }
    const cleanTitle = cleanText(payload.title, 200);
    const cleanSide = cleanOptional(payload.side, 80);
    const cleanDetail = cleanOptional(payload.detail, 1000);
    const cleanStatus = cleanOptional(payload.status, 40);
    const cleanPriority = cleanOptional(payload.priority, 20);
    const cleanCategory = cleanOptional(payload.category, 60);
    const cleanDeadline = normalizeDeadline(payload.deadline);
    const cleanStart = normalizeDeadline(payload.start_date);
    const cleanRich = cleanOptional(payload.description_rich, 8000);
    const safePayload = {
      title: cleanTitle,
      deadline: cleanDeadline,
      side: cleanSide,
      detail: cleanDetail,
      status: cleanStatus,
      priority: cleanPriority,
      category: cleanCategory,
      start_date: cleanStart,
      description_rich: cleanRich,
      project_id: payload.project_id || null,
      workspace_id: payload.workspace_id || null,
      task_type: payload.task_type || null,
      assignees: payload.assignees || null,
      time_tracking_enabled: payload.time_tracking_enabled ? 1 : 0,
      estimate_value: payload.estimate_value || null,
      estimate_unit: payload.estimate_unit || null,
      is_recurring: payload.is_recurring ? 1 : 0,
      recurring_frequency: payload.recurring_frequency || null,
      parent_task_id: payload.parent_task_id || null,
      dependencies: payload.dependencies || null,
      related_tags: payload.related_tags || null,
      email_notification: payload.email_notification ? 1 : 0,
      in_app_notification: payload.in_app_notification ? 1 : 0,
      reminder: payload.reminder || null,
      smtp_config: payload.smtp_config || null,
      notification_recipients: payload.notification_recipients || null,
      attachments: payload.attachments || null,
      external_links: payload.external_links || null,
      checklist: payload.checklist || null,
      budget: payload.budget || null,
      client_id: payload.client_id || null,
      labels: payload.labels || null,
      location: payload.location || null
    };
    const id = await queries.addTask(safePayload);
    if (id && safePayload.in_app_notification) {
      await queries.addNotification({
        type: 'task',
        title: 'Task baru ditambahkan',
        message: safePayload.title
      });
    }
    return id;
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

async function updateTask(id, payload, expectedUpdatedAt) {
  try {
    const safeId = normalizeId(id);
    const validation = validateTaskInput(payload);
    if (!safeId || !validation.ok) {
      console.error(new Error(validation.message || 'ID task tidak valid.'));
      return false;
    }
    const cleanTitle = cleanText(payload.title, 200);
    const cleanSide = cleanOptional(payload.side, 80);
    const cleanDetail = cleanOptional(payload.detail, 1000);
    const cleanStatus = cleanOptional(payload.status, 40);
    const cleanPriority = cleanOptional(payload.priority, 20);
    const cleanCategory = cleanOptional(payload.category, 60);
    const cleanDeadline = normalizeDeadline(payload.deadline);
    const cleanStart = normalizeDeadline(payload.start_date);
    const cleanRich = cleanOptional(payload.description_rich, 8000);
    const result = await queries.updateTask(
      safeId,
      {
        title: cleanTitle,
        deadline: cleanDeadline,
        side: cleanSide,
        detail: cleanDetail,
        status: cleanStatus,
        priority: cleanPriority,
        category: cleanCategory,
        start_date: cleanStart,
        description_rich: cleanRich,
        project_id: payload.project_id || null,
        workspace_id: payload.workspace_id || null,
        task_type: payload.task_type || null,
        assignees: payload.assignees || null,
        time_tracking_enabled: payload.time_tracking_enabled ? 1 : 0,
        estimate_value: payload.estimate_value || null,
        estimate_unit: payload.estimate_unit || null,
        is_recurring: payload.is_recurring ? 1 : 0,
        recurring_frequency: payload.recurring_frequency || null,
        parent_task_id: payload.parent_task_id || null,
        dependencies: payload.dependencies || null,
        related_tags: payload.related_tags || null,
        email_notification: payload.email_notification ? 1 : 0,
        in_app_notification: payload.in_app_notification ? 1 : 0,
        reminder: payload.reminder || null,
        smtp_config: payload.smtp_config || null,
        notification_recipients: payload.notification_recipients || null,
        attachments: payload.attachments || null,
        external_links: payload.external_links || null,
        checklist: payload.checklist || null,
        budget: payload.budget || null,
        client_id: payload.client_id || null,
        labels: payload.labels || null,
        location: payload.location || null
      },
      expectedUpdatedAt || null
    );
    if (expectedUpdatedAt && !result?.changes) {
      throw new Error('Task telah diperbarui di tempat lain. Muat ulang terlebih dulu.');
    }
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
