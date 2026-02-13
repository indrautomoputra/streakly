const queries = require('../database/queries');

async function getSettingsValues() {
  const settings = await queries.ensureSettingsRow();
  const xp_per_task = Number.isFinite(settings?.xp_per_task) ? settings.xp_per_task : 10;
  const level_step = Number.isFinite(settings?.level_step) ? settings.level_step : 100;
  return { xp_per_task, level_step };
}

function toDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function calculateStreak(previousStreak, lastActivity, today) {
  if (!lastActivity) return 1;
  if (lastActivity === today) return Math.max(previousStreak || 0, 1);
  const yesterday = toDateString(new Date(Date.now() - 86400000));
  if (lastActivity === yesterday) return (previousStreak || 0) + 1;
  return 1;
}

async function updateXP() {
  const today = toDateString();
  return await queries.transaction(async () => {
    const stats = await queries.ensureStatsRow();
    const settings = await getSettingsValues();
    const safeXP = stats?.xp || 0;
    const safeStreak = stats?.streak || 0;
    const newXP = safeXP + settings.xp_per_task;
    const newStreak = calculateStreak(safeStreak, stats?.last_activity || null, today);
    const newLevel = Math.floor(newXP / settings.level_step);

    await queries.updateStats({
      xp: newXP,
      streak: newStreak,
      level: newLevel,
      last_activity: today
    });

    await queries.upsertDailyStats(today, settings.xp_per_task);

    return {
      xp: newXP,
      streak: newStreak,
      level: newLevel,
      last_activity: today,
      level_step: settings.level_step,
      xp_per_task: settings.xp_per_task
    };
  });
}

async function getStats() {
  const row = await queries.ensureStatsRow();
  const settings = await getSettingsValues();
  const xp = row?.xp || 0;
  const streak = row?.streak || 0;
  const level = Number.isFinite(row?.level) ? row.level : Math.floor(xp / settings.level_step);
  const last_activity = row?.last_activity || null;

  if (row && row.level !== level) {
    await queries.updateStats({
      xp,
      streak,
      level,
      last_activity
    });
  }

  return {
    xp,
    streak,
    level,
    last_activity,
    level_step: settings.level_step,
    xp_per_task: settings.xp_per_task
  };
}

module.exports = {
  updateXP,
  getStats
};
