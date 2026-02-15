const fs = require('fs');
const path = require('path');
const { TextDecoder, TextEncoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { axe, toHaveNoViolations } = require('jest-axe');

expect.extend(toHaveNoViolations);

test('Legend kategori di dashboard memenuhi aksesibilitas dasar', async () => {
  const html = fs.readFileSync(path.join(__dirname, '../ui/index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../ui/styles.css'), 'utf8');
  document.documentElement.innerHTML = html;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const legend = document.getElementById('categoryLegend');
  expect(legend).not.toBeNull();
  const dashboard = legend.closest('[data-section="dashboard"]');
  expect(dashboard).not.toBeNull();
  const results = await axe(legend, {
    rules: { 'color-contrast': { enabled: true } }
  });
  expect(results).toHaveNoViolations();
});
