const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'ui', 'assets', 'logo-concepts');

const run = async () => {
  const files = (await fs.promises.readdir(baseDir)).filter((file) => file.endsWith('.svg'));
  for (const file of files) {
    const svgPath = path.join(baseDir, file);
    const aiPath = path.join(baseDir, file.replace(/\.svg$/, '.ai'));
    const content = await fs.promises.readFile(svgPath, 'utf8');
    await fs.promises.writeFile(aiPath, content, 'utf8');
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
