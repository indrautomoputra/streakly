const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');

const tempDbPath = path.join(os.tmpdir(), `streakly-gamification-${Date.now()}.db`);
process.env.STREAKLY_DB_PATH = tempDbPath;

const initSchema = require('../database/schema');
const xpService = require('../services/xpService');
const db = require('../database/db');

async function run() {
  await initSchema();
  const statsBefore = await xpService.getStats();
  const habitId = await xpService.addHabit({
    title: 'Minum air',
    description: 'Minum 2 gelas saat pagi',
    kind: 'positive',
    frequency: 'daily',
    target_count: 1,
    xp_reward: 12,
    xp_penalty: 4
  });
  assert.ok(habitId);

  const logResult = await xpService.logHabit({ habit_id: habitId, value: 1 });
  assert.ok(logResult?.habit?.streak_current === 1);

  const statsAfter = await xpService.getStats();
  assert.ok(statsAfter.xp >= (statsBefore.xp || 0) + 12);

  const missResult = await xpService.logHabit({ habit_id: habitId, value: -1 });
  assert.ok(missResult?.habit?.streak_current === 0);

  const statsAfterMiss = await xpService.getStats();
  assert.ok(statsAfterMiss.xp >= 0);
}

run()
  .then(() => {
    console.log('Tests passed');
    db.close(() => {
      if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
      process.exit(0);
    });
  })
  .catch((err) => {
    console.error(err);
    db.close(() => {
      if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
      process.exit(1);
    });
  });
