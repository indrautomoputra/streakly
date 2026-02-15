const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../ui/index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../ui/styles.css'), 'utf8');

assert.ok(!html.includes('startupError'), 'Markup startup error tidak boleh tampil saat render.');
assert.ok(html.includes('class="card'), 'Markup card tidak ditemukan di UI.');

const cardRule = css.match(/\.card\s*\{[\s\S]*?\}/);
assert.ok(cardRule, 'Style .card tidak ditemukan.');
assert.ok(cardRule[0].includes('width: 100%'), 'Card harus lebar 100% dari container.');

const bodyRules = [...css.matchAll(/body\s*\{[\s\S]*?\}/g)].map((match) => match[0]);
assert.ok(bodyRules.length > 0, 'Style body tidak ditemukan.');
assert.ok(
  bodyRules.some((rule) => rule.includes('overflow: hidden')),
  'Body harus mencegah overflow horizontal.'
);

assert.ok(
  css.includes('minmax(0, 1fr)'),
  'Layout grid harus menggunakan minmax(0, 1fr) untuk menghindari overflow.'
);
