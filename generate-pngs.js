const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BASE_DIR = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0359/assets/resources';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  const result = Buffer.alloc(4);
  result.writeUInt32BE((crc ^ 0xFFFFFFFF) >>> 0, 0);
  return result;
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function createIHDR(width, height, bitDepth = 8, colorType = 2) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data.writeUInt8(bitDepth, 8);
  data.writeUInt8(colorType, 9);
  data.writeUInt8(0, 10);
  data.writeUInt8(0, 11);
  data.writeUInt8(0, 12);
  return createChunk('IHDR', data);
}

function createIDAT(width, height, pixels) {
  const rawData = Buffer.alloc(height * (1 + width * 3));
  
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 3)] = 0;
    for (let x = 0; x < width; x++) {
      const idx = y * (1 + width * 3) + 1 + x * 3;
      const pixelIdx = y * width + x;
      rawData[idx] = pixels[pixelIdx * 3];
      rawData[idx + 1] = pixels[pixelIdx * 3 + 1];
      rawData[idx + 2] = pixels[pixelIdx * 3 + 2];
    }
  }
  
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  return createChunk('IDAT', compressed);
}

function createIEND() {
  return createChunk('IEND', Buffer.alloc(0));
}

function createPNG(width, height, pixels) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = createIHDR(width, height);
  const idat = createIDAT(width, height, pixels);
  const iend = createIEND();
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createSolidColorPNG(width, height, r, g, b) {
  const pixels = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    pixels[i * 3] = r;
    pixels[i * 3 + 1] = g;
    pixels[i * 3 + 2] = b;
  }
  return createPNG(width, height, pixels);
}

function createShopTiles() {
  const tileWidth = 32;
  const tileHeight = 32;
  const numTiles = 5;
  const totalWidth = tileWidth * numTiles;
  const totalHeight = tileHeight;
  
  const tiles = [
    [200, 200, 200],
    [100, 150, 200],
    [180, 100, 80],
    [220, 220, 210],
    [120, 80, 60],
  ];
  
  const pixels = Buffer.alloc(totalWidth * totalHeight * 3);
  
  for (let y = 0; y < totalHeight; y++) {
    for (let x = 0; x < totalWidth; x++) {
      const tileIdx = Math.floor(x / tileWidth);
      const idx = (y * totalWidth + x) * 3;
      pixels[idx] = tiles[tileIdx][0];
      pixels[idx + 1] = tiles[tileIdx][1];
      pixels[idx + 2] = tiles[tileIdx][2];
    }
  }
  
  return createPNG(totalWidth, totalHeight, pixels);
}

const inspectionPhotos = [
  { path: 'inspection-photos/engine_belt_tension', name: 'spriteFrame.png', color: [200, 160, 120] },
  { path: 'inspection-photos/engine_valve_clearance', name: 'spriteFrame.png', color: [140, 140, 150] },
  { path: 'inspection-photos/engine_mount_condition', name: 'spriteFrame.png', color: [60, 60, 70] },
  { path: 'inspection-photos/brake_pad_thickness', name: 'spriteFrame.png', color: [90, 90, 100] },
  { path: 'inspection-photos/brake_disc_surface', name: 'spriteFrame.png', color: [180, 180, 190] },
  { path: 'inspection-photos/brake_caliper_condition', name: 'spriteFrame.png', color: [220, 50, 50] },
  { path: 'inspection-photos/transmission_seal_leak', name: 'spriteFrame.png', color: [150, 40, 40] },
  { path: 'inspection-photos/transmission_fluid_level', name: 'spriteFrame.png', color: [130, 30, 30] },
  { path: 'inspection-photos/transmission_pan_gasket', name: 'spriteFrame.png', color: [110, 110, 120] },
  { path: 'inspection-photos/ac_compressor_pressure', name: 'spriteFrame.png', color: [80, 160, 220] },
  { path: 'inspection-photos/ac_refrigerant_level', name: 'spriteFrame.png', color: [120, 200, 240] },
  { path: 'inspection-photos/ac_condenser_condition', name: 'spriteFrame.png', color: [170, 170, 180] },
  { path: 'inspection-photos/tire_tread_depth', name: 'spriteFrame.png', color: [40, 40, 50] },
  { path: 'inspection-photos/suspension_alignment', name: 'spriteFrame.png', color: [50, 100, 80] },
  { path: 'inspection-photos/tie_rod_condition', name: 'spriteFrame.png', color: [130, 130, 140] },
  { path: 'inspection-photos/battery_voltage', name: 'spriteFrame.png', color: [50, 200, 80] },
  { path: 'inspection-photos/battery_terminal_corrosion', name: 'spriteFrame.png', color: [80, 180, 150] },
  { path: 'inspection-photos/alternator_output', name: 'spriteFrame.png', color: [160, 160, 170] },
];

const generatedFiles = [];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFile(filePath, buffer) {
  fs.writeFileSync(filePath, buffer);
  generatedFiles.push(filePath);
  console.log(`Generated: ${filePath}`);
}

const mapsDir = path.join(BASE_DIR, 'maps');
ensureDir(mapsDir);

const shopTilesPath = path.join(mapsDir, 'shop_tiles.png');
writeFile(shopTilesPath, createShopTiles());

const texturesDir = path.join(BASE_DIR, 'textures');
ensureDir(texturesDir);

const inspectionPhotosBaseDir = path.join(texturesDir, 'inspection-photos');
ensureDir(inspectionPhotosBaseDir);

inspectionPhotos.forEach((photo) => {
  const photoDir = path.join(texturesDir, photo.path);
  ensureDir(photoDir);
  const filePath = path.join(photoDir, photo.name);
  writeFile(filePath, createSolidColorPNG(256, 256, photo.color[0], photo.color[1], photo.color[2]));
});

console.log('\n=== Generated Files List ===');
generatedFiles.forEach((f, i) => {
  console.log(`${i + 1}. ${f}`);
});
console.log(`\nTotal: ${generatedFiles.length} files generated.`);
