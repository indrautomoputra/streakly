const db = require('./db');

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function transaction(work) {
  await run('BEGIN IMMEDIATE TRANSACTION');
  try {
    const result = await work();
    await run('COMMIT');
    return result;
  } catch (err) {
    await run('ROLLBACK');
    throw err;
  }
}

async function addTask(payload) {
  if (!payload?.title) return null;
  const result = await run(
    `INSERT INTO tasks (
      title,
      deadline,
      side,
      detail,
      status,
      priority,
      category,
      start_date,
      description_rich,
      project_id,
      workspace_id,
      task_type,
      assignees,
      time_tracking_enabled,
      estimate_value,
      estimate_unit,
      is_recurring,
      recurring_frequency,
      parent_task_id,
      dependencies,
      related_tags,
      email_notification,
      in_app_notification,
      reminder,
      smtp_config,
      notification_recipients,
      attachments,
      external_links,
      checklist,
      budget,
      client_id,
      labels,
      location
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.title,
      payload.deadline || null,
      payload.side || null,
      payload.detail || null,
      payload.status || null,
      payload.priority || null,
      payload.category || null,
      payload.start_date || null,
      payload.description_rich || null,
      payload.project_id || null,
      payload.workspace_id || null,
      payload.task_type || null,
      payload.assignees || null,
      payload.time_tracking_enabled || 0,
      payload.estimate_value || null,
      payload.estimate_unit || null,
      payload.is_recurring || 0,
      payload.recurring_frequency || null,
      payload.parent_task_id || null,
      payload.dependencies || null,
      payload.related_tags || null,
      payload.email_notification || 0,
      payload.in_app_notification || 0,
      payload.reminder || null,
      payload.smtp_config || null,
      payload.notification_recipients || null,
      payload.attachments || null,
      payload.external_links || null,
      payload.checklist || null,
      payload.budget || null,
      payload.client_id || null,
      payload.labels || null,
      payload.location || null
    ]
  );
  return result.lastID || null;
}

async function getTasks({ limit, offset } = {}) {
  let sql = 'SELECT * FROM tasks ORDER BY created_at DESC';
  const params = [];
  if (Number.isFinite(limit)) {
    sql += ' LIMIT ?';
    params.push(limit);
    if (Number.isFinite(offset)) {
      sql += ' OFFSET ?';
      params.push(offset);
    }
  }
  return await all(sql, params);
}

async function markTaskDone(id) {
  if (!id) return { changes: 0 };
  return await run('UPDATE tasks SET done = 1 WHERE id = ?', [id]);
}

async function updateTask(id, payload, expectedUpdatedAt) {
  if (!id || !payload?.title) return { changes: 0 };
  const sql =
    `UPDATE tasks SET
      title = ?,
      deadline = ?,
      side = ?,
      detail = ?,
      status = ?,
      priority = ?,
      category = ?,
      start_date = ?,
      description_rich = ?,
      project_id = ?,
      workspace_id = ?,
      task_type = ?,
      assignees = ?,
      time_tracking_enabled = ?,
      estimate_value = ?,
      estimate_unit = ?,
      is_recurring = ?,
      recurring_frequency = ?,
      parent_task_id = ?,
      dependencies = ?,
      related_tags = ?,
      email_notification = ?,
      in_app_notification = ?,
      reminder = ?,
      smtp_config = ?,
      notification_recipients = ?,
      attachments = ?,
      external_links = ?,
      checklist = ?,
      budget = ?,
      client_id = ?,
      labels = ?,
      location = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?` + (expectedUpdatedAt ? ' AND updated_at = ?' : '');
  const params = [
    payload.title,
    payload.deadline || null,
    payload.side || null,
    payload.detail || null,
    payload.status || null,
    payload.priority || null,
    payload.category || null,
    payload.start_date || null,
    payload.description_rich || null,
    payload.project_id || null,
    payload.workspace_id || null,
    payload.task_type || null,
    payload.assignees || null,
    payload.time_tracking_enabled || 0,
    payload.estimate_value || null,
    payload.estimate_unit || null,
    payload.is_recurring || 0,
    payload.recurring_frequency || null,
    payload.parent_task_id || null,
    payload.dependencies || null,
    payload.related_tags || null,
    payload.email_notification || 0,
    payload.in_app_notification || 0,
    payload.reminder || null,
    payload.smtp_config || null,
    payload.notification_recipients || null,
    payload.attachments || null,
    payload.external_links || null,
    payload.checklist || null,
    payload.budget || null,
    payload.client_id || null,
    payload.labels || null,
    payload.location || null,
    id
  ];
  if (expectedUpdatedAt) params.push(expectedUpdatedAt);
  return await run(sql, params);
}

async function getProjects() {
  return await all('SELECT * FROM projects ORDER BY name ASC');
}

async function getClients() {
  return await all('SELECT * FROM clients ORDER BY name ASC');
}

async function getUsers() {
  return await all('SELECT * FROM users ORDER BY name ASC');
}

async function getWorkspaces() {
  return await all('SELECT * FROM workspaces ORDER BY name ASC');
}

async function addNotification({ type, title, message }) {
  return await run(
    'INSERT INTO notifications (type, title, message) VALUES (?, ?, ?)',
    [type || null, title || null, message || null]
  );
}

async function deleteTask(id) {
  if (!id) return { changes: 0 };
  return await run('DELETE FROM tasks WHERE id = ?', [id]);
}

async function getStats() {
  return await get('SELECT * FROM stats WHERE id = 1');
}

async function getProfile() {
  return await get('SELECT * FROM profile WHERE id = 1');
}

async function ensureProfileRow() {
  const row = await getProfile();
  if (row) return row;
  await run(
    'INSERT INTO profile (id, name, avatar, email) VALUES (1, "Raka Pratama", NULL, NULL)'
  );
  return await getProfile();
}

async function updateProfile({ name, avatar, email }) {
  await run('UPDATE profile SET name = ?, avatar = ?, email = ? WHERE id = 1', [
    name,
    avatar || null,
    email || null
  ]);
}

async function getSettings() {
  return await get('SELECT * FROM settings WHERE id = 1');
}

async function ensureSettingsRow() {
  const row = await getSettings();
  if (row) return row;
  await run(
    'INSERT INTO settings (id, accent, accent_secondary, bg_primary, bg_secondary, bg_elevated, text_primary, text_muted, border, glow_intensity, reminder_enabled, reminder_time, xp_per_task, level_step, zoom_level, glass_enabled) VALUES (1, "#7367f0", "#9f87ff", "#f4f5fb", "#eef0f7", "#ffffff", "#3a3541", "#6f6b7d", "#e4e6ef", 0.14, 0, "09:00", 10, 100, 100, 0)'
  );
  return await getSettings();
}

async function updateSettings({
  accent,
  accent_secondary,
  bg_primary,
  bg_secondary,
  bg_elevated,
  text_primary,
  text_muted,
  border,
  glow_intensity,
  reminder_enabled,
  reminder_time,
  xp_per_task,
  level_step,
  zoom_level,
  glass_enabled
}) {
  await run(
    'UPDATE settings SET accent = ?, accent_secondary = ?, bg_primary = ?, bg_secondary = ?, bg_elevated = ?, text_primary = ?, text_muted = ?, border = ?, glow_intensity = ?, reminder_enabled = ?, reminder_time = ?, xp_per_task = ?, level_step = ?, zoom_level = ?, glass_enabled = ? WHERE id = 1',
    [
      accent,
      accent_secondary,
      bg_primary,
      bg_secondary,
      bg_elevated,
      text_primary,
      text_muted,
      border,
      glow_intensity,
      reminder_enabled ? 1 : 0,
      reminder_time,
      xp_per_task,
      level_step,
      zoom_level,
      glass_enabled ? 1 : 0
    ]
  );
  return await getSettings();
}

async function ensureStatsRow() {
  const row = await getStats();
  if (row) return row;
  await run(
    'INSERT INTO stats (id, xp, streak, level, last_activity) VALUES (1, 0, 0, 0, NULL)'
  );
  return await getStats();
}

async function updateStats({ xp, streak, level, last_activity }) {
  await run(
    'UPDATE stats SET xp = ?, streak = ?, level = ?, last_activity = ? WHERE id = 1',
    [xp, streak, level, last_activity]
  );
}

async function resetProductivityData() {
  return await transaction(async () => {
    await ensureStatsRow();
    await run('DELETE FROM tasks');
    await run('DELETE FROM daily_stats');
    await run('UPDATE stats SET xp = 0, streak = 0, level = 0, last_activity = NULL WHERE id = 1');
    return true;
  });
}

async function getDailyStatsByDate(date) {
  return await get('SELECT * FROM daily_stats WHERE date = ?', [date]);
}

async function upsertDailyStats(date, xpEarned) {
  const row = await getDailyStatsByDate(date);
  if (!row) {
    await run(
      'INSERT INTO daily_stats (date, tasks_completed, xp_earned) VALUES (?, 1, ?)',
      [date, xpEarned]
    );
    return;
  }
  await run(
    'UPDATE daily_stats SET tasks_completed = tasks_completed + 1, xp_earned = xp_earned + ? WHERE date = ?',
    [xpEarned, date]
  );
}

async function getLast30Days() {
  const rows = await all(
    `
      SELECT * FROM daily_stats
      ORDER BY date DESC
      LIMIT 30
    `
  );
  return rows.reverse();
}

module.exports = {
  run,
  get,
  all,
  transaction,
  addTask,
  getTasks,
  markTaskDone,
  updateTask,
  getProjects,
  getClients,
  getUsers,
  getWorkspaces,
  addNotification,
  deleteTask,
  getStats,
  getProfile,
  ensureProfileRow,
  updateProfile,
  getSettings,
  ensureSettingsRow,
  updateSettings,
  ensureStatsRow,
  updateStats,
  resetProductivityData,
  getDailyStatsByDate,
  upsertDailyStats,
  getLast30Days
};
