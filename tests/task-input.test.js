const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');

const tempDbPath = path.join(os.tmpdir(), `streakly-test-${Date.now()}.db`);
process.env.STREAKLY_DB_PATH = tempDbPath;

const initSchema = require('../database/schema');
const taskService = require('../services/taskService');
const queries = require('../database/queries');
const db = require('../database/db');

async function run() {
  await initSchema();

  const invalidTitle = taskService.validateTaskInput({ title: '', detail: '', side: '' });
  assert.strictEqual(invalidTitle.ok, false);

  const longTitle = 'a'.repeat(121);
  const invalidLength = taskService.validateTaskInput({ title: longTitle, detail: '', side: '' });
  assert.strictEqual(invalidLength.ok, false);

  const longDetail = 'a'.repeat(281);
  const invalidDetail = taskService.validateTaskInput({ title: 'Test', detail: longDetail, side: '' });
  assert.strictEqual(invalidDetail.ok, false);

  const longSide = 'a'.repeat(61);
  const invalidSide = taskService.validateTaskInput({ title: 'Test', detail: '', side: longSide });
  assert.strictEqual(invalidSide.ok, false);

  const valid = taskService.validateTaskInput({ title: 'Test', detail: 'Detail', side: 'Side' });
  assert.strictEqual(valid.ok, true);

  const id = await taskService.addTask('Test', null, 'Side', 'Detail', 'To Do', 'General');
  assert.ok(id);

  const tasks = await queries.getTasks();
  assert.ok(tasks.find((task) => task.id === id));
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
