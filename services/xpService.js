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

function calculateHabitStreak(habit, today, value) {
  const prevStreak = habit?.streak_current || 0;
  const bestStreak = habit?.streak_best || 0;
  const lastLog = habit?.last_log_date || null;
  if (value < 0) {
    return { streak_current: 0, streak_best: bestStreak, last_log_date: today };
  }
  if (!lastLog) {
    return { streak_current: 1, streak_best: Math.max(bestStreak, 1), last_log_date: today };
  }
  if (lastLog === today) {
    const current = Math.max(prevStreak, 1);
    return { streak_current: current, streak_best: Math.max(bestStreak, current), last_log_date: today };
  }
  const lastDate = new Date(`${lastLog}T00:00:00`);
  const yesterday = toDateString(new Date(lastDate.getTime() - 86400000));
  const current = lastLog === yesterday ? prevStreak + 1 : 1;
  return { streak_current: current, streak_best: Math.max(bestStreak, current), last_log_date: today };
}

async function applyBonuses(stats, settings, bonusXP, today) {
  if (!bonusXP) return stats;
  const safeXP = Math.max(0, (stats?.xp || 0) + bonusXP);
  const newLevel = Math.floor(safeXP / settings.level_step);
  const updated = {
    xp: safeXP,
    streak: stats?.streak || 0,
    level: newLevel,
    last_activity: today
  };
  await queries.updateStats(updated);
  return updated;
}

async function evaluateChallenges(stats, settings, today) {
  const [challenges, userChallenges, taskCount, completedChallenges] = await Promise.all([
    queries.getChallenges(),
    queries.getUserChallenges(),
    queries.getCompletedTaskCount(),
    queries.getCompletedChallengesCount()
  ]);
  const userMap = new Map(userChallenges.map((row) => [row.challenge_id, row]));
  const rewards = [];
  const badges = [];
  let bonusXP = 0;

  for (const challenge of challenges) {
    const existing = userMap.get(challenge.id) || null;
    let progress = 0;
    if (challenge.requirement_type === 'tasks_completed_total') {
      progress = taskCount;
    } else if (challenge.requirement_type === 'streak_days') {
      progress = stats?.streak || 0;
    } else if (challenge.requirement_type === 'level_reached') {
      progress = stats?.level || 0;
    } else if (challenge.requirement_type === 'challenges_completed_total') {
      progress = completedChallenges;
    }
    const isComplete = progress >= (challenge.requirement_value || 0);
    if (isComplete && existing?.status !== 'completed') {
      await queries.upsertUserChallenge({
        challenge_id: challenge.id,
        status: 'completed',
        progress,
        completed_at: today
      });
      if (challenge.xp_reward) {
        bonusXP += challenge.xp_reward;
        rewards.push({
          type: 'challenge',
          title: challenge.title,
          description: challenge.description,
          xp_bonus: challenge.xp_reward
        });
        await queries.addReward({
          type: 'challenge',
          title: challenge.title,
          description: challenge.description,
          xp_bonus: challenge.xp_reward,
          ref_value: challenge.id
        });
      }
      if (challenge.badge_id) {
        const badgeAdded = await queries.addUserBadge(challenge.badge_id);
        if (badgeAdded) {
          badges.push(challenge.badge_id);
        }
      }
      await queries.addNotification({
        type: 'achievement',
        title: challenge.title,
        message: `Challenge selesai. ${challenge.description}`
      });
      continue;
    }
    await queries.upsertUserChallenge({
      challenge_id: challenge.id,
      status: existing?.status || 'active',
      progress,
      completed_at: existing?.completed_at || null
    });
  }

  return { bonusXP, rewards, badges };
}

async function applyStreakRewards(stats, today) {
  const thresholds = [3, 7, 14, 30];
  const rewards = [];
  let bonusXP = 0;
  for (const threshold of thresholds) {
    if ((stats?.streak || 0) < threshold) continue;
    const existing = await queries.getRewardByTypeRef('streak', threshold);
    if (existing) continue;
    const xpBonus = threshold * 5;
    bonusXP += xpBonus;
    rewards.push({
      type: 'streak',
      title: `Streak ${threshold} hari`,
      description: `Konsistensi ${threshold} hari berturut-turut`,
      xp_bonus: xpBonus
    });
    await queries.addReward({
      type: 'streak',
      title: `Streak ${threshold} hari`,
      description: `Konsistensi ${threshold} hari berturut-turut`,
      xp_bonus: xpBonus,
      ref_value: threshold
    });
    await queries.addNotification({
      type: 'reward',
      title: `Hadiah streak ${threshold} hari`,
      message: `Bonus XP ${xpBonus} untuk konsistensi harian.`
    });
  }
  return { bonusXP, rewards };
}

async function updateXP() {
  const today = toDateString();
  return await queries.transaction(async () => {
    const stats = await queries.ensureStatsRow();
    const settings = await getSettingsValues();
    const safeXP = stats?.xp || 0;
    const safeStreak = stats?.streak || 0;
    const newXP = Math.max(0, safeXP + settings.xp_per_task);
    const newStreak = calculateStreak(safeStreak, stats?.last_activity || null, today);
    const newLevel = Math.floor(newXP / settings.level_step);

    const updated = {
      xp: newXP,
      streak: newStreak,
      level: newLevel,
      last_activity: today
    };

    await queries.updateStats(updated);
    await queries.updateDailyStats(today, { tasksDelta: 1, xpDelta: settings.xp_per_task });

    const challengeResult = await evaluateChallenges(updated, settings, today);
    const streakResult = await applyStreakRewards(updated, today);
    const bonusXP = (challengeResult?.bonusXP || 0) + (streakResult?.bonusXP || 0);
    const finalStats = await applyBonuses(updated, settings, bonusXP, today);

    return {
      ...finalStats,
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

async function addHabit(payload) {
  const title = String(payload?.title || '').trim();
  if (title.length < 3) return null;
  const clean = {
    title: title.slice(0, 80),
    description: String(payload?.description || '').trim().slice(0, 160) || null,
    kind: payload?.kind === 'negative' ? 'negative' : 'positive',
    frequency: payload?.frequency === 'weekly' ? 'weekly' : 'daily',
    target_count: Math.max(1, Math.min(7, Number(payload?.target_count || 1))),
    xp_reward: Math.max(1, Math.min(200, Number(payload?.xp_reward || 10))),
    xp_penalty: Math.max(0, Math.min(200, Number(payload?.xp_penalty || 5)))
  };
  return await queries.addHabit(clean);
}

async function logHabit({ habit_id, value, note, date }) {
  const habitId = Number(habit_id);
  if (!Number.isFinite(habitId)) return null;
  const today = date ? toDateString(new Date(date)) : toDateString();
  const logValue = value === -1 ? -1 : 1;
  return await queries.transaction(async () => {
    const habit = await queries.getHabitById(habitId);
    if (!habit) return null;
    await queries.addHabitLog({
      habit_id: habitId,
      log_date: today,
      value: logValue,
      note: note ? String(note).slice(0, 160) : null
    });
    const streakState = calculateHabitStreak(habit, today, logValue);
    const updatedHabit = await queries.updateHabitProgress({
      id: habitId,
      streak_current: streakState.streak_current,
      streak_best: streakState.streak_best,
      last_log_date: streakState.last_log_date
    });
    const stats = await queries.ensureStatsRow();
    const settings = await getSettingsValues();
    const baseDelta = logValue > 0 ? habit.xp_reward : -Math.abs(habit.xp_penalty || 0);
    const safeXP = Math.max(0, (stats?.xp || 0) + baseDelta);
    const newStreak = calculateStreak(stats?.streak || 0, stats?.last_activity || null, today);
    const newLevel = Math.floor(safeXP / settings.level_step);
    const updatedStats = {
      xp: safeXP,
      streak: newStreak,
      level: newLevel,
      last_activity: today
    };
    await queries.updateStats(updatedStats);
    await queries.updateDailyStats(today, { tasksDelta: 0, xpDelta: baseDelta });

    const challengeResult = await evaluateChallenges(updatedStats, settings, today);
    const streakResult = await applyStreakRewards(updatedStats, today);
    const bonusXP = (challengeResult?.bonusXP || 0) + (streakResult?.bonusXP || 0);
    const finalStats = await applyBonuses(updatedStats, settings, bonusXP, today);

    return {
      habit: updatedHabit,
      stats: finalStats
    };
  });
}

async function getGamificationState() {
  const today = toDateString();
  return await queries.transaction(async () => {
    const stats = await queries.ensureStatsRow();
    const settings = await getSettingsValues();
    const challengeResult = await evaluateChallenges(stats, settings, today);
    const streakResult = await applyStreakRewards(stats, today);
    const bonusXP = (challengeResult?.bonusXP || 0) + (streakResult?.bonusXP || 0);
    const finalStats = await applyBonuses(stats, settings, bonusXP, today);
    const [habits, rewards, badges, userBadges, challenges, userChallenges, habitLogs] =
      await Promise.all([
        queries.getHabits(),
        queries.getRewards({ limit: 8 }),
        queries.getBadges(),
        queries.getUserBadges(),
        queries.getChallenges(),
        queries.getUserChallenges(),
        queries.getHabitLogsByDate(today)
      ]);
    return {
      stats: {
        ...finalStats,
        level_step: settings.level_step,
        xp_per_task: settings.xp_per_task
      },
      habits,
      rewards,
      badges,
      userBadges,
      challenges,
      userChallenges,
      habitLogs
    };
  });
}

module.exports = {
  updateXP,
  getStats,
  addHabit,
  logHabit,
  getGamificationState
};
