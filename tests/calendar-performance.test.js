const assert = require('assert');
const CalendarUtils = require('../renderer/calendar-utils');

function run() {
  const events = [];
  for (let i = 0; i < 1200; i += 1) {
    const day = String((i % 28) + 1).padStart(2, '0');
    events.push({
      title: `Event ${i}`,
      start: `2026-02-${day}T10:00:00+07:00`,
      end: `2026-02-${day}T11:00:00+07:00`,
      allDay: false
    });
  }

  const start = Date.now();
  const map = CalendarUtils.buildEventDateMap(events);
  const monthCells = CalendarUtils.buildMonthCells(new Date('2026-02-01'), events);
  const weekModel = CalendarUtils.buildWeekModel('2026-02-10', events);
  const dayModel = CalendarUtils.buildDayModel('2026-02-10', events);
  const elapsed = Date.now() - start;

  assert.ok(map.size > 0);
  assert.strictEqual(monthCells.length, 42);
  assert.strictEqual(weekModel.length, 7);
  assert.ok(dayModel.events.length >= 1);
  assert.ok(elapsed < 1500);
}

try {
  run();
  console.log('Tests passed');
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
