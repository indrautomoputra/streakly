const assert = require('assert');
const fs = require('fs');
const path = require('path');

const renderer = fs.readFileSync(path.join(__dirname, '../renderer/renderer.js'), 'utf8');

const roleBlock = renderer.match(/const ROLE_PERMISSIONS = \{[\s\S]*?\};/);
assert.ok(roleBlock, 'ROLE_PERMISSIONS tidak ditemukan di renderer.');

const requiredSections = ['dashboard', 'calendar', 'analytics', 'tasks', 'tracking', 'settings', 'about'];
requiredSections.forEach((section) => {
  assert.ok(
    roleBlock[0].includes(section),
    `ROLE_PERMISSIONS harus memuat akses untuk menu ${section}.`
  );
});

assert.ok(/function canAccessSection/.test(renderer), 'Fungsi canAccessSection tidak ditemukan.');
assert.ok(/function setActiveSection/.test(renderer), 'Fungsi setActiveSection tidak ditemukan.');
assert.ok(
  /access_denied/.test(renderer),
  'Logging access_denied harus dicatat saat akses diblokir.'
);
assert.ok(
  /role_set_failed/.test(renderer),
  'Logging role_set_failed harus dicatat saat gagal menerapkan role.'
);
assert.ok(
  /setAttribute\('hidden'/.test(renderer) || /removeAttribute\('hidden'/.test(renderer),
  'Akses role harus mengatur atribut hidden pada section.'
);
