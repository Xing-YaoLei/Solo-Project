const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, pixels) {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    function createChunk(type, data) {
        const length = Buffer.alloc(4);
        length.writeUInt32BE(data.length, 0);
        const typeBuffer = Buffer.from(type, 'ascii');
        const crc = Buffer.alloc(4);
        const crcData = Buffer.concat([typeBuffer, data]);
        let c = 0xFFFFFFFF;
        for (let i = 0; i < crcData.length; i++) {
            c ^= crcData[i];
            for (let j = 0; j < 8; j++) {
                c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
            }
        }
        c ^= 0xFFFFFFFF;
        crc.writeUInt32BE(c >>> 0, 0);
        return Buffer.concat([length, typeBuffer, data, crc]);
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const rawData = [];
    for (let y = 0; y < height; y++) {
        rawData.push(0);
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            rawData.push(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]);
        }
    }
    const rawBuffer = Buffer.from(rawData);
    const compressed = zlib.deflateSync(rawBuffer);

    const iend = Buffer.alloc(0);

    return Buffer.concat([
        signature,
        createChunk('IHDR', ihdr),
        createChunk('IDAT', compressed),
        createChunk('IEND', iend)
    ]);
}

const TILE_SIZE = 64;
const TILES_X = 4;
const TILES_Y = 4;
const WIDTH = TILE_SIZE * TILES_X;
const HEIGHT = TILE_SIZE * TILES_Y;

const colors = [
    [100, 100, 120, 255],
    [60, 60, 80, 255],
    [200, 180, 120, 255],
    [150, 100, 80, 255],
    [120, 120, 140, 255],
    [80, 80, 100, 255],
    [100, 180, 220, 255],
    [180, 180, 200, 255],
    [180, 160, 120, 255],
    [140, 140, 160, 255],
    [76, 175, 80, 255],
    [244, 67, 54, 255],
    [33, 150, 243, 255],
    [158, 158, 158, 255],
    [156, 39, 176, 255],
    [255, 235, 59, 255]
];

const pixels = new Uint8Array(WIDTH * HEIGHT * 4);

for (let tileIdx = 0; tileIdx < 16; tileIdx++) {
    const col = tileIdx % 4;
    const row = Math.floor(tileIdx / 4);
    const color = colors[tileIdx];

    for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
            const px = col * TILE_SIZE + x;
            const py = row * TILE_SIZE + y;
            const idx = (py * WIDTH + px) * 4;

            const isBorder = x === 0 || x === TILE_SIZE - 1 || y === 0 || y === TILE_SIZE - 1;

            if (isBorder) {
                pixels[idx] = 30;
                pixels[idx + 1] = 30;
                pixels[idx + 2] = 40;
                pixels[idx + 3] = 255;
            } else {
                pixels[idx] = color[0];
                pixels[idx + 1] = color[1];
                pixels[idx + 2] = color[2];
                pixels[idx + 3] = color[3];
            }
        }
    }
}

const pngBuffer = createPng(WIDTH, HEIGHT, pixels);
const outPath = path.join(__dirname, '..', 'assets', 'resources', 'maps', 'inn_tiles.png');
fs.writeFileSync(outPath, pngBuffer);
console.log('inn_tiles.png created at', outPath);
