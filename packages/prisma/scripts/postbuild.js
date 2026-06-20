const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'generated');
const dstDir = path.join(__dirname, '..', 'dist', 'generated');

if (!fs.existsSync(srcDir)) {
  console.log('src/generated not found, skipping postbuild copy');
  process.exit(0);
}

function copyRecursive(src, dst) {
  if (!fs.existsSync(dst)) {
    fs.mkdirSync(dst, { recursive: true });
  }
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dst, entry);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

copyRecursive(srcDir, dstDir);
console.log('Copied src/generated -> dist/generated');
