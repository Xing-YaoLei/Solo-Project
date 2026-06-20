const fs = require('fs');
const path = require('path');

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

function copyIfExists(src, dst) {
  if (fs.existsSync(src)) {
    const dstDir = path.dirname(dst);
    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir, { recursive: true });
    }
    fs.copyFileSync(src, dst);
    return true;
  }
  return false;
}

const rootDir = path.join(__dirname, '..');

// 1. 复制 generated 目录（Prisma Client 生成产物）
const generatedSrc = path.join(rootDir, 'src', 'generated');
const generatedDst = path.join(rootDir, 'dist', 'generated');
if (fs.existsSync(generatedSrc)) {
  copyRecursive(generatedSrc, generatedDst);
  console.log('Copied src/generated -> dist/generated');
} else {
  console.log('src/generated not found, skipping');
}

// 2. 复制 src 下的 JS 文件到 dist（开发态入口文件）
const jsFiles = ['index.js', 'enums.js'];
for (const f of jsFiles) {
  const src = path.join(rootDir, 'src', f);
  const dst = path.join(rootDir, 'dist', f);
  if (copyIfExists(src, dst)) {
    console.log(`Copied src/${f} -> dist/${f}`);
  }
}

console.log('✅ postbuild 完成');
