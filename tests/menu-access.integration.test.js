const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../ui/index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../ui/styles.css'), 'utf8');

assert.ok(html.includes('id="accessNotice"'), 'Access notice harus tersedia di UI.');
assert.ok(html.includes('id="roleGate"'), 'Role gate harus tersedia di UI.');

const navMatches = [...html.matchAll(/class="nav-item[^"]*"\s+data-section="([^"]+)"/g)];
assert.ok(navMatches.length >= 5, 'Nav item tidak lengkap untuk akses menu.');

assert.ok(
  css.includes('.nav-item.is-disabled'),
  'Style nav item disabled harus tersedia untuk akses berbasis role.'
);
assert.ok(
  css.includes('.role-gate'),
  'Style role gate harus tersedia agar overlay dapat ditampilkan.'
);
assert.ok(
  css.includes('.access-notice'),
  'Style access notice harus tersedia untuk notifikasi user.'
);
