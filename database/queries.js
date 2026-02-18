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

async function updateProfile({ name, avatar, email, avatar_config }) {
  await run('UPDATE profile SET name = ?, avatar = ?, email = ?, avatar_config = ? WHERE id = 1', [
    name,
    avatar || null,
    email || null,
    avatar_config || null
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
  return await updateDailyStats(date, { tasksDelta: 1, xpDelta: xpEarned });
}

async function updateDailyStats(date, { tasksDelta = 0, xpDelta = 0 } = {}) {
  const row = await getDailyStatsByDate(date);
  if (!row) {
    const safeTasks = Math.max(0, tasksDelta);
    const safeXp = Math.max(0, xpDelta);
    await run(
      'INSERT INTO daily_stats (date, tasks_completed, xp_earned) VALUES (?, ?, ?)',
      [date, safeTasks, safeXp]
    );
    return;
  }
  const nextTasks = Math.max(0, (row.tasks_completed || 0) + tasksDelta);
  const nextXp = Math.max(0, (row.xp_earned || 0) + xpDelta);
  await run(
    'UPDATE daily_stats SET tasks_completed = ?, xp_earned = ? WHERE date = ?',
    [nextTasks, nextXp, date]
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

async function getBadges() {
  return await all('SELECT * FROM badges ORDER BY id ASC');
}

async function getUserBadges() {
  return await all(
    `
      SELECT ub.id, ub.badge_id, ub.earned_at, b.name, b.description, b.icon, b.color
      FROM user_badges ub
      LEFT JOIN badges b ON ub.badge_id = b.id
      ORDER BY ub.earned_at DESC
    `
  );
}

async function hasUserBadge(badgeId) {
  if (!badgeId) return false;
  const row = await get('SELECT id FROM user_badges WHERE badge_id = ?', [badgeId]);
  return !!row;
}

async function addUserBadge(badgeId) {
  if (!badgeId) return null;
  const exists = await hasUserBadge(badgeId);
  if (exists) return null;
  const result = await run('INSERT INTO user_badges (badge_id) VALUES (?)', [badgeId]);
  return result.lastID || null;
}

async function getChallenges() {
  return await all('SELECT * FROM challenges WHERE active = 1 ORDER BY id ASC');
}

async function getUserChallenges() {
  return await all(
    'SELECT * FROM user_challenges ORDER BY started_at DESC'
  );
}

async function getUserChallengeById(challengeId) {
  if (!challengeId) return null;
  return await get('SELECT * FROM user_challenges WHERE challenge_id = ?', [challengeId]);
}

async function upsertUserChallenge({ challenge_id, status, progress, completed_at }) {
  if (!challenge_id) return null;
  const existing = await getUserChallengeById(challenge_id);
  if (!existing) {
    const result = await run(
      'INSERT INTO user_challenges (challenge_id, status, progress, completed_at) VALUES (?, ?, ?, ?)',
      [challenge_id, status || 'active', progress || 0, completed_at || null]
    );
    return result.lastID || null;
  }
  await run(
    'UPDATE user_challenges SET status = ?, progress = ?, completed_at = ? WHERE challenge_id = ?',
    [status || existing.status, progress ?? existing.progress, completed_at || existing.completed_at, challenge_id]
  );
  return existing.id || null;
}

async function getRewards({ limit } = {}) {
  let sql = 'SELECT * FROM rewards ORDER BY issued_at DESC';
  const params = [];
  if (Number.isFinite(limit)) {
    sql += ' LIMIT ?';
    params.push(limit);
  }
  return await all(sql, params);
}

async function getRewardByTypeRef(type, refValue) {
  if (!type) return null;
  return await get(
    'SELECT * FROM rewards WHERE type = ? AND ref_value = ?',
    [type, refValue ?? null]
  );
}

async function addReward({ type, title, description, xp_bonus, ref_value }) {
  const result = await run(
    'INSERT INTO rewards (type, title, description, xp_bonus, ref_value) VALUES (?, ?, ?, ?, ?)',
    [type || null, title || null, description || null, xp_bonus || 0, ref_value ?? null]
  );
  return result.lastID || null;
}

async function getHabits() {
  return await all('SELECT * FROM habits ORDER BY created_at DESC');
}

async function getHabitById(id) {
  if (!id) return null;
  return await get('SELECT * FROM habits WHERE id = ?', [id]);
}

async function addHabit(payload) {
  if (!payload?.title) return null;
  const result = await run(
    'INSERT INTO habits (title, description, kind, frequency, target_count, xp_reward, xp_penalty) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      payload.title,
      payload.description || null,
      payload.kind || 'positive',
      payload.frequency || 'daily',
      payload.target_count || 1,
      payload.xp_reward || 10,
      payload.xp_penalty || 5
    ]
  );
  return result.lastID || null;
}

async function updateHabitProgress({ id, streak_current, streak_best, last_log_date }) {
  if (!id) return null;
  await run(
    'UPDATE habits SET streak_current = ?, streak_best = ?, last_log_date = ? WHERE id = ?',
    [streak_current || 0, streak_best || 0, last_log_date || null, id]
  );
  return await getHabitById(id);
}

async function addHabitLog({ habit_id, log_date, value, note }) {
  if (!habit_id || !log_date) return null;
  const result = await run(
    'INSERT INTO habit_logs (habit_id, log_date, value, note) VALUES (?, ?, ?, ?)',
    [habit_id, log_date, value || 0, note || null]
  );
  return result.lastID || null;
}

async function getHabitLogsByDate(date) {
  if (!date) return [];
  return await all('SELECT * FROM habit_logs WHERE log_date = ?', [date]);
}

async function getCompletedTaskCount() {
  const row = await get('SELECT COUNT(*) as total FROM tasks WHERE done = 1');
  return row?.total || 0;
}

async function getCompletedChallengesCount() {
  const row = await get('SELECT COUNT(*) as total FROM user_challenges WHERE status = "completed"');
  return row?.total || 0;
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
  updateDailyStats,
  getLast30Days,
  getBadges,
  getUserBadges,
  addUserBadge,
  getChallenges,
  getUserChallenges,
  upsertUserChallenge,
  getRewards,
  getRewardByTypeRef,
  addReward,
  getHabits,
  getHabitById,
  addHabit,
  updateHabitProgress,
  addHabitLog,
  getHabitLogsByDate,
  getCompletedTaskCount,
  getCompletedChallengesCount
};
