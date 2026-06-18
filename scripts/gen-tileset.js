#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.resolve(__dirname, '..', 'assets', 'resources', 'tiled');

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crcData = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function makePng(width, height, getPixel) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = chunk('IHDR', ihdr);

  const raw = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(x, y);
      const idx = y * (width * 3 + 1) + 1 + x * 3;
      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
    }
  }
  const idatChunk = chunk('IDAT', zlib.deflateSync(raw));
  const iendChunk = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const TILE = 32;
const COLS = 10;
const ROWS = 10;
const W = TILE * COLS;
const H = TILE * ROWS;

const PALETTES = [
  [210, 180, 140],
  [180, 140, 100],
  [240, 230, 210],
  [200, 170, 130],
  [160, 120, 80],
  [250, 240, 220],
  [190, 150, 110],
  [170, 130, 90],
  [230, 200, 160],
  [150, 100, 60],
];

const FLOOR_COLORS = [
  [230, 210, 180],
  [200, 170, 130],
  [215, 190, 150],
  [245, 225, 195],
  [185, 150, 110],
  [225, 200, 165],
  [195, 160, 120],
  [235, 215, 185],
  [175, 135, 95],
  [255, 245, 225],
];

function inCircle(tx, ty, cx, cy, r) {
  const dx = tx - cx, dy = ty - cy;
  return dx * dx + dy * dy <= r * r;
}

const WALL_COLOR = [120, 80, 50];
const WALL_HIGHLIGHT = [140, 100, 70];

function tilePixel(tx, ty, tileIdx) {
  const kind = tileIdx < 10 ? 'floor' : (tileIdx < 20 ? 'wall' : (tileIdx < 30 ? 'door' : 'furniture'));

  if (tileIdx === 1) {
    const base = FLOOR_COLORS[0];
    const stripe = (Math.floor(ty / 4) + Math.floor(tx / 4)) % 2 === 0 ? 0 : 1;
    return stripe ? base : base.map(v => Math.min(255, v + 15));
  }

  if (tileIdx === 2 || tileIdx === 10) {
    if (ty < 6) return WALL_HIGHLIGHT;
    const vertical = tx % 16 === 0 || tx % 16 === 15;
    return vertical ? WALL_HIGHLIGHT : WALL_COLOR;
  }

  if (kind === 'floor') {
    const palette = FLOOR_COLORS[tileIdx % FLOOR_COLORS.length];
    const grain = ((tx * 7 + ty * 13) % 5) - 2;
    return palette.map(v => Math.max(0, Math.min(255, v + grain)));
  }

  if (kind === 'wall') {
    const palette = PALETTES[tileIdx % PALETTES.length];
    const line = ty % 8 === 0 || tx % 16 === 0;
    return line ? palette.map(v => Math.min(255, v + 20)) : palette;
  }

  if (tileIdx === 30) {
    if (ty < 20 && tx > 6 && tx < 26) return [180, 120, 60];
    if (ty < 24 && tx > 8 && tx < 24) return [200, 140, 80];
    return [160, 100, 40];
  }

  if (tileIdx === 31) {
    const cx = 16, cy = 16, r = 10;
    if (inCircle(tx, ty, cx, cy, r)) {
      if (inCircle(tx, ty, cx, cy, r - 2)) return [200, 160, 100];
      return [160, 100, 60];
    }
    return PALETTES[1];
  }

  return PALETTES[tileIdx % PALETTES.length];
}

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const png = makePng(W, H, (x, y) => {
    const col = Math.floor(x / TILE);
    const row = Math.floor(y / TILE);
    const tx = x % TILE;
    const ty = y % TILE;
    const tileIdx = row * COLS + col;
    return tilePixel(tx, ty, tileIdx);
  });

  const pngPath = path.join(OUT_DIR, 'interior_tiles.png');
  fs.writeFileSync(pngPath, png);
  console.log(`[✓] 生成 Tiled tileset: ${pngPath} (${W}x${H})`);

  const tsx = `<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.5" tiledversion="1.8.2" name="interior" tilewidth="32" tileheight="32" tilecount="100" columns="10">
  <image source="interior_tiles.png" width="${W}" height="${H}"/>
</tileset>
`;
  const tsxPath = path.join(OUT_DIR, 'interior.tsx');
  fs.writeFileSync(tsxPath, tsx);
  console.log(`[✓] 生成 Tiled tileset 定义: ${tsxPath}`);

  const pngMeta = `{
  "ver": "1.1.35",
  "importer": "image",
  "imported": true,
  "uuid": "",
  "files": [
    ".json"
  ],
  "subMetas": {},
  "userData": {
    "type": "sprite-frame",
    "hasAlpha": false,
    "fixAlphaTransparencyArtifacts": true,
    "wrapModeS": "clamp-to-edge",
    "wrapModeT": "clamp-to-edge",
    "minfilter": "linear",
    "magfilter": "linear",
    "mipfilter": "linear",
    "anisotropy": 0,
    "isUuid": true,
    "imageUuidOrDatabaseUri": "",
    "locale": "zh-cn",
    "name": "interior_tiles"
  }
}
`;
  fs.writeFileSync(path.join(OUT_DIR, 'interior_tiles.png.meta'), pngMeta);
  console.log('[✓] 生成 Cocos 资源 meta: interior_tiles.png.meta');

  console.log('');
  console.log('说明：请用 Cocos Creator 打开项目后，编辑器会自动为 tileset 和 TMX 资源');
  console.log('重新生成正确的 .meta 信息（包含 uuid）。以上 meta 为占位模板。');
}

main();
