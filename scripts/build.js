#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.join(PROJECT_ROOT, 'package.json');

function log(msg) {
  console.log(`[build] ${msg}`);
}

function error(msg) {
  console.error(`[build][ERROR] ${msg}`);
}

function fileExists(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

function dirExists(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function findCocosCreator() {
  const candidates = [];

  if (process.env.COCOS_CREATOR_PATH) {
    candidates.push(process.env.COCOS_CREATOR_PATH);
  }

  if (process.platform === 'darwin') {
    candidates.push('/Applications/CocosCreator/Creator/3.8.3/CocosCreator.app/Contents/MacOS/CocosCreator');
    candidates.push('/Applications/CocosCreator/Creator/3.8.2/CocosCreator.app/Contents/MacOS/CocosCreator');
    candidates.push('/Applications/CocosCreator/Creator/3.8.1/CocosCreator.app/Contents/MacOS/CocosCreator');
    candidates.push('/Applications/CocosCreator/Creator/3.8.0/CocosCreator.app/Contents/MacOS/CocosCreator');
    candidates.push('/Applications/CocosCreator/Creator/3.7.4/CocosCreator.app/Contents/MacOS/CocosCreator');
    candidates.push('/Applications/CocosCreator.app/Contents/MacOS/CocosCreator');
  } else if (process.platform === 'win32') {
    candidates.push('C:\\Program Files\\CocosDashboard\\resources\\.editors\\Creator\\3.8.3\\CocosCreator.exe');
    candidates.push('C:\\Program Files\\CocosDashboard\\resources\\.editors\\Creator\\3.8.0\\CocosCreator.exe');
  }

  for (const c of candidates) {
    if (fileExists(c)) return c;
  }

  try {
    if (process.platform === 'darwin') {
      const result = execSync('mdfind "kMDItemCFBundleIdentifier == \'com.cocos.creator\'" 2>/dev/null | head -1', { encoding: 'utf8' }).trim();
      if (result) {
        const bin = path.join(result, 'Contents/MacOS/CocosCreator');
        if (fileExists(bin)) return bin;
      }
    }
  } catch {}

  return null;
}

function runTypecheck() {
  log('运行 TypeScript 类型检查...');
  try {
    execSync('npm run typecheck', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    return true;
  } catch (e) {
    error('TypeScript 类型检查失败，请修复错误后重新构建');
    return false;
  }
}

function buildWithCocos(creatorPath, platform) {
  return new Promise((resolve) => {
    const buildDir = path.join(PROJECT_ROOT, 'build', platform);
    log(`使用 Cocos Creator 构建 ${platform} 到 ${buildDir}`);
    log(`Cocos Creator 路径: ${creatorPath}`);

    const buildOptions = [
      `platform=${platform}`,
      `buildPath=${path.join(PROJECT_ROOT, 'build')}`,
      'debug=false',
      'sourceMaps=false',
      'md5Cache=true',
      'encryptJs=false',
      'inlineSpriteFrames=true',
      'mergeStartScene=true',
      'optimizeHotUpdate=true',
    ].join(';');

    const args = [
      '--project', PROJECT_ROOT,
      '--build', buildOptions,
    ];

    const proc = spawn(creatorPath, args, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: process.env,
    });

    proc.on('exit', (code) => {
      if (code === 0) {
        log(`[✓] ${platform} 构建成功！产物在: ${buildDir}`);
        resolve(true);
      } else {
        error(`[✗] ${platform} 构建失败 (exit code: ${code})`);
        resolve(false);
      }
    });

    proc.on('error', (err) => {
      error(`[✗] 执行 Cocos Creator 出错: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  const platforms = process.argv.slice(2);
  if (platforms.length === 0) {
    platforms.push('web-mobile');
  }

  const validPlatforms = ['web-mobile', 'web-desktop', 'wechatgame', 'android', 'ios', 'win32', 'mac'];
  for (const p of platforms) {
    if (!validPlatforms.includes(p)) {
      error(`不支持的平台: ${p}，可用平台: ${validPlatforms.join(', ')}`);
      process.exit(1);
    }
  }

  log('====== 家装工地量房报价模拟器 - 构建开始 ======');
  log(`构建平台: ${platforms.join(', ')}`);
  log(`项目根目录: ${PROJECT_ROOT}`);

  if (!runTypecheck()) {
    process.exit(1);
  }

  const creatorPath = findCocosCreator();
  if (!creatorPath) {
    error('────────────────────────────────────────────');
    error('未检测到 Cocos Creator 3.x 安装，无法生成构建产物！');
    error('');
    error('请选择以下任一方案：');
    error('  1) 通过环境变量指定路径:');
    error('     export COCOS_CREATOR_PATH="/path/to/CocosCreator"');
    error('     然后再次运行 npm run build');
    error('');
    error('  2) 直接使用 Cocos Creator 3.8.x 打开项目目录，');
    error('     点击菜单 "项目 → 构建发布" 进行可视化构建');
    error('');
    error('TypeScript 类型检查已通过，但构建产物未生成。');
    error('────────────────────────────────────────────');
    process.exit(1);
  }

  const results = [];
  for (const platform of platforms) {
    const ok = await buildWithCocos(creatorPath, platform);
    results.push({ platform, ok });
  }

  log('====== 构建结果汇总 ======');
  for (const r of results) {
    log(`${r.ok ? '[✓]' : '[✗]'} ${r.platform}`);
  }

  const allOk = results.every(r => r.ok);
  process.exit(allOk ? 0 : 1);
}

main().catch(err => {
  error(`未预期的错误: ${err.stack}`);
  process.exit(1);
});
