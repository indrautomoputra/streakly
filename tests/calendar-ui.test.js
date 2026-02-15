const assert = require('assert');
const CalendarUtils = require('../renderer/calendar-utils');

function run() {
  const events = [
    { title: 'Task A', start: '2026-02-10', end: '2026-02-10', allDay: true },
    { title: 'Meeting', start: '2026-02-12T10:00:00+07:00', end: '2026-02-12T11:00:00+07:00', allDay: false }
  ];

  const monthCells = CalendarUtils.buildMonthCells(new Date('2026-02-01'), events);
  assert.strictEqual(monthCells.length, 42);
  assert.ok(monthCells.find((cell) => cell.date === '2026-02-10'));

  const weekModel = CalendarUtils.buildWeekModel('2026-02-10', events);
  assert.strictEqual(weekModel.length, 7);
  assert.ok(weekModel.find((day) => day.date === '2026-02-10'));

  const dayModel = CalendarUtils.buildDayModel('2026-02-12', events);
  assert.strictEqual(dayModel.events.length, 1);
  assert.strictEqual(dayModel.events[0].title, 'Meeting');
}

try {
  run();
  console.log('Tests passed');
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
