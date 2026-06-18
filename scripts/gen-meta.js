#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16).toLowerCase();
  });
}

function walk(dir, ext) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(p, ext));
    } else if (entry.isFile() && p.endsWith(ext)) {
      results.push(p);
    }
  }
  return results;
}

function generateMeta(filePath, type) {
  const file = path.basename(filePath);
  const id = uuid();
  const meta = {
    ver: '1.1.35',
    importer: type,
    imported: true,
    uuid: id,
    files: ['.json'],
    subMetas: {},
    userData: {}
  };

  if (type === 'typescript') {
    Object.assign(meta.userData, {
      isNewScript: false,
      name: file.replace(/\.ts$/, ''),
    });
  }

  const metaPath = filePath + '.meta';
  if (!fs.existsSync(metaPath)) {
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    console.log(`  [+] ${path.relative(PROJECT_ROOT, metaPath)} (${id})`);
  } else {
    const existing = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    if (!existing.uuid) {
      existing.uuid = id;
      existing.importer = type;
      fs.writeFileSync(metaPath, JSON.stringify(existing, null, 2));
      console.log(`  [u] ${path.relative(PROJECT_ROOT, metaPath)} (${id})`);
    } else {
      console.log(`  [·] ${path.relative(PROJECT_ROOT, metaPath)} (${existing.uuid})`);
    }
  }

  return JSON.parse(fs.readFileSync(metaPath, 'utf8')).uuid;
}

function main() {
  const scriptsDir = path.join(PROJECT_ROOT, 'assets', 'scripts');
  const scenesDir = path.join(PROJECT_ROOT, 'assets', 'scenes');
  const configDir = path.join(PROJECT_ROOT, 'assets', 'resources', 'config');

  const scriptFiles = walk(scriptsDir, '.ts');
  const sceneFiles = walk(scenesDir, '.scene');
  const jsonFiles = walk(configDir, '.json');
  const tmxFiles = walk(path.join(PROJECT_ROOT, 'assets', 'resources', 'tiled'), '.tmx');
  const pngFiles = walk(path.join(PROJECT_ROOT, 'assets', 'resources', 'tiled'), '.png');
  const tsxFiles = walk(path.join(PROJECT_ROOT, 'assets', 'resources', 'tiled'), '.tsx');

  console.log('\n=== 生成脚本 meta (.ts) ===');
  const scriptUuids = {};
  for (const f of scriptFiles) {
    const id = generateMeta(f, 'typescript');
    scriptUuids[path.basename(f, '.ts')] = id;
  }

  console.log('\n=== 生成场景 meta (.scene) ===');
  for (const f of sceneFiles) generateMeta(f, 'scene');

  console.log('\n=== 生成 JSON 配置 meta (.json) ===');
  for (const f of jsonFiles) generateMeta(f, 'json');

  console.log('\n=== 生成 TMX 地图 meta (.tmx) ===');
  for (const f of tmxFiles) generateMeta(f, 'tiled-map');

  console.log('\n=== 生成 TSX tileset meta (.tsx) ===');
  for (const f of tsxFiles) generateMeta(f, 'tiled-map');

  console.log('\n=== 生成 PNG 图片 meta (.png) ===');
  for (const f of pngFiles) generateMeta(f, 'image');

  const uuidMap = path.join(PROJECT_ROOT, 'temp', 'uuid-map.json');
  if (!fs.existsSync(path.dirname(uuidMap))) fs.mkdirSync(path.dirname(uuidMap), { recursive: true });
  fs.writeFileSync(uuidMap, JSON.stringify(scriptUuids, null, 2));
  console.log(`\n[✓] 脚本 UUID 映射已保存: ${path.relative(PROJECT_ROOT, uuidMap)}`);

  return scriptUuids;
}

if (require.main === module) {
  main();
}
module.exports = main;
