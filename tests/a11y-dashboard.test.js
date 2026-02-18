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

test('Elemen navigasi memiliki akses ke konten utama', () => {
  const html = fs.readFileSync(path.join(__dirname, '../ui/index.html'), 'utf8');
  document.documentElement.innerHTML = html;
  const skipLink = document.querySelector('.skip-link');
  const main = document.getElementById('mainContent');
  expect(skipLink).not.toBeNull();
  expect(main).not.toBeNull();
  expect(skipLink.getAttribute('href')).toBe('#mainContent');
});

test('Ikon tombol memiliki label aksesibilitas', () => {
  const html = fs.readFileSync(path.join(__dirname, '../ui/index.html'), 'utf8');
  document.documentElement.innerHTML = html;
  const iconButtons = Array.from(document.querySelectorAll('.icon-button'));
  expect(iconButtons.length).toBeGreaterThan(0);
  iconButtons.forEach((button) => {
    const label = button.getAttribute('aria-label');
    expect(label).toBeTruthy();
  });
});

test('Link eksternal memiliki rel yang aman', () => {
  const html = fs.readFileSync(path.join(__dirname, '../ui/index.html'), 'utf8');
  document.documentElement.innerHTML = html;
  const links = Array.from(document.querySelectorAll('a[target="_blank"]'));
  links.forEach((link) => {
    const rel = link.getAttribute('rel') || '';
    expect(rel.includes('noreferrer')).toBe(true);
  });
});

test('Logo aplikasi tersedia di folder aset', () => {
  const assetDir = path.join(__dirname, '../ui/assets');
  const logoLight = path.join(assetDir, 'logo streakly-05-04.svg');
  const logoDark = path.join(assetDir, 'logo streakly-05-05.svg');
  expect(fs.existsSync(logoLight)).toBe(true);
  expect(fs.existsSync(logoDark)).toBe(true);
});
