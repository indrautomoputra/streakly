const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const baseDir = path.join(__dirname, '..', 'ui', 'assets', 'logo-concepts');
const output = async (filePath) => {
  const svg = await fs.promises.readFile(filePath);
  const baseName = path.basename(filePath, '.svg');
  const pngPath = path.join(baseDir, `${baseName}-1024.png`);
  const jpgPath = path.join(baseDir, `${baseName}-300dpi.jpg`);
  await sharp(svg, { density: 300 })
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(pngPath);
  await sharp(svg, { density: 300 })
    .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .jpeg({ quality: 96 })
    .withMetadata({ density: 300 })
    .toFile(jpgPath);
};

const run = async () => {
  const files = (await fs.promises.readdir(baseDir)).filter((file) => file.endsWith('.svg'));
  for (const file of files) {
    await output(path.join(baseDir, file));
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
