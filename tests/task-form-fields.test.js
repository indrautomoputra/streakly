const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../ui/index.html'), 'utf8');
const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));

const requiredIds = [
  'title',
  'detailRich',
  'deadline',
  'priority',
  'status',
  'assignees',
  'category',
  'addButton',
  'cancelEdit'
];

const missing = requiredIds.filter((id) => !ids.has(id));
assert.strictEqual(
  missing.length,
  0,
  `Field task form belum lengkap. Missing: ${missing.join(', ')}`
);

const sectionCount = (html.match(/task-form-section/g) || []).length;
assert.ok(sectionCount >= 1, 'Section form task belum lengkap.');

const dashboardStart = html.indexOf(
  '<section class="section active" data-section="dashboard">'
);
assert.ok(dashboardStart !== -1, 'Section dashboard tidak ditemukan.');
const dashboardEnd = html.indexOf('</section>', dashboardStart);
assert.ok(dashboardEnd !== -1, 'Penutup section dashboard tidak ditemukan.');
const dashboardSection = html.slice(dashboardStart, dashboardEnd);
assert.ok(
  dashboardSection.includes('categoryLegend'),
  'Keterangan warna task belum dipindahkan ke dashboard.'
);

const tasksStart = html.indexOf('<section class="section" data-section="tasks">');
assert.ok(tasksStart !== -1, 'Section task list tidak ditemukan.');
const tasksEnd = html.indexOf('</section>', tasksStart);
assert.ok(tasksEnd !== -1, 'Penutup section task list tidak ditemukan.');
const tasksSection = html.slice(tasksStart, tasksEnd);
assert.ok(
  !tasksSection.includes('categoryLegend'),
  'Keterangan warna task masih muncul di task list.'
);
