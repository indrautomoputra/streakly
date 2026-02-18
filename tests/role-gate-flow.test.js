const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../ui/index.html'), 'utf8');
const renderer = fs.readFileSync(path.join(__dirname, '../renderer/renderer.js'), 'utf8');

assert.ok(html.includes('id="roleGateStatus"'), 'Role gate status tidak ditemukan.');
assert.ok(
  /id="roleSelectDeveloper"[^>]*type="button"/.test(html),
  'Tombol Developer harus bertipe button.'
);
assert.ok(
  /id="roleSelectEmployee"[^>]*type="button"/.test(html),
  'Tombol Karyawan harus bertipe button.'
);

assert.ok(/function setRoleGateLoading/.test(renderer), 'setRoleGateLoading tidak ditemukan.');
assert.ok(/function handleRoleSelection/.test(renderer), 'handleRoleSelection tidak ditemukan.');
assert.ok(/setActiveSection\(target/.test(renderer), 'setActiveSection tidak dipanggil setelah pilih role.');
