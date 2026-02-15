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
  const today = new Date().toISOString().slice(0, 10);
  const basePayload = {
    title: 'Rancang roadmap produk',
    deadline: today,
    status: 'To Do',
    priority: 'Medium',
    assignees: JSON.stringify(['Raka Pratama'])
  };

  const invalidTitle = taskService.validateTaskInput({
    ...basePayload,
    title: ''
  });
  assert.strictEqual(invalidTitle.ok, false);

  const shortTitle = 'a'.repeat(4);
  const invalidShort = taskService.validateTaskInput({
    ...basePayload,
    title: shortTitle
  });
  assert.strictEqual(invalidShort.ok, false);

  const longTitle = 'a'.repeat(201);
  const invalidLength = taskService.validateTaskInput({
    ...basePayload,
    title: longTitle
  });
  assert.strictEqual(invalidLength.ok, false);

  const invalidDeadline = taskService.validateTaskInput({
    ...basePayload,
    deadline: '2000-01-01'
  });
  assert.strictEqual(invalidDeadline.ok, false);

  const invalidStatus = taskService.validateTaskInput({
    ...basePayload,
    status: 'Unknown'
  });
  assert.strictEqual(invalidStatus.ok, false);

  const invalidPriority = taskService.validateTaskInput({
    ...basePayload,
    priority: 'Critical'
  });
  assert.strictEqual(invalidPriority.ok, false);

  const invalidAssignee = taskService.validateTaskInput({
    ...basePayload,
    assignees: JSON.stringify([])
  });
  assert.strictEqual(invalidAssignee.ok, false);

  const valid = taskService.validateTaskInput({
    ...basePayload,
    title: 'Task valid'
  });
  assert.strictEqual(valid.ok, true);

  const id = await taskService.addTask({
    ...basePayload,
    title: 'Task valid',
    detail: 'Detail',
    category: 'Urgent',
    priority: 'High'
  });
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
