const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  throw new Error('dist folder not found');
}

const files = fs.readdirSync(distPath);
const exe = files.find((name) => name.toLowerCase().endsWith('.exe'));
if (!exe) {
  throw new Error('Installer .exe not found in dist');
}

const exePath = path.join(distPath, exe);
const hash = crypto.createHash('sha256').update(fs.readFileSync(exePath)).digest('hex');
const checksumPath = `${exePath}.sha256`;
fs.writeFileSync(checksumPath, `${hash}  ${exe}\n`, 'utf8');
process.stdout.write(`Checksum created: ${checksumPath}\n`);
