const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, pixels) {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    const ihdr = createIHDR(width, height);
    const idat = createIDAT(width, height, pixels);
    const iend = createIEND();

    return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const typeBuffer = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = crc32(crcData);

    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc >>> 0, 0);

    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function createIHDR(width, height) {
    const data = Buffer.alloc(13);
    data.writeUInt32BE(width, 0);
    data.writeUInt32BE(height, 4);
    data[8] = 8;
    data[9] = 6;
    data[10] = 0;
    data[11] = 0;
    data[12] = 0;
    return createChunk('IHDR', data);
}

function createIDAT(width, height, pixels) {
    const rawData = [];
    for (let y = 0; y < height; y++) {
        rawData.push(0);
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            rawData.push(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]);
        }
    }

    const raw = Buffer.from(rawData);
    const compressed = zlib.deflateSync(raw, { level: 9 });
    return createChunk('IDAT', compressed);
}

function createIEND() {
    return createChunk('IEND', Buffer.alloc(0));
}

const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[n] = c >>> 0;
    }
    return table;
})();

function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function fillPixelArray(pixels, width, height, x0, y0, w, h, r, g, b, a = 255) {
    for (let y = y0; y < y0 + h && y < height; y++) {
        for (let x = x0; x < x0 + w && x < width; x++) {
            const idx = (y * width + x) * 4;
            pixels[idx] = r;
            pixels[idx + 1] = g;
            pixels[idx + 2] = b;
            pixels[idx + 3] = a;
        }
    }
}

function drawRectBorder(pixels, width, height, x0, y0, w, h, r, g, b, a = 255, borderWidth = 2) {
    fillPixelArray(pixels, width, height, x0, y0, w, borderWidth, r, g, b, a);
    fillPixelArray(pixels, width, height, x0, y0 + h - borderWidth, w, borderWidth, r, g, b, a);
    fillPixelArray(pixels, width, height, x0, y0, borderWidth, h, r, g, b, a);
    fillPixelArray(pixels, width, height, x0 + w - borderWidth, y0, borderWidth, h, r, g, b, a);
}

function generateFloorTiles() {
    const tileW = 64;
    const tileH = 64;
    const cols = 2;
    const rows = 2;
    const imgW = tileW * cols;
    const imgH = tileH * rows;

    const pixels = new Uint8Array(imgW * imgH * 4);

    const colors = [
        { bg: [245, 235, 220], border: [220, 210, 195] },
        { bg: [210, 195, 175], border: [190, 175, 155] },
        { bg: [200, 220, 230], border: [180, 200, 210] },
        { bg: [255, 250, 240], border: [235, 230, 220] },
    ];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const idx = row * cols + col;
            const color = colors[idx];
            const x0 = col * tileW;
            const y0 = row * tileH;

            fillPixelArray(pixels, imgW, imgH, x0, y0, tileW, tileH,
                color.bg[0], color.bg[1], color.bg[2], 255);

            for (let dy = 0; dy < tileH; dy += 16) {
                fillPixelArray(pixels, imgW, imgH, x0, y0 + dy, tileW, 1,
                    color.border[0], color.border[1], color.border[2], 100);
            }
            for (let dx = 0; dx < tileW; dx += 16) {
                fillPixelArray(pixels, imgW, imgH, x0 + dx, y0, 1, tileH,
                    color.border[0], color.border[1], color.border[2], 100);
            }

            drawRectBorder(pixels, imgW, imgH, x0, y0, tileW, tileH,
                color.border[0], color.border[1], color.border[2], 255, 1);
        }
    }

    return createPNG(imgW, imgH, Buffer.from(pixels));
}

function generateFurnitureTiles() {
    const tileW = 64;
    const tileH = 64;
    const cols = 3;
    const rows = 2;
    const imgW = tileW * cols;
    const imgH = tileH * rows;

    const pixels = new Uint8Array(imgW * imgH * 4);

    const drawBed = (x0, y0) => {
        fillPixelArray(pixels, imgW, imgH, x0 + 8, y0 + 12, 48, 40, 180, 140, 100, 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 10, y0 + 14, 44, 12, 220, 200, 170, 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 10, y0 + 28, 44, 22, 200, 180, 150, 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 8, y0 + 10, 48, 4, 150, 110, 70, 255);
    };

    const drawChair = (x0, y0) => {
        fillPixelArray(pixels, imgW, imgH, x0 + 18, y0 + 16, 28, 4, 140, 90, 50, 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 18, y0 + 16, 4, 36, 140, 90, 50, 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 42, y0 + 16, 4, 36, 140, 90, 50, 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 20, y0 + 28, 24, 20, 180, 130, 80, 255);
    };

    const drawTable = (x0, y0) => {
        fillPixelArray(pixels, imgW, imgH, x0 + 8, y0 + 20, 48, 6, 160, 110, 60, 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 12, y0 + 26, 4, 30, 130, 90, 50, 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 48, y0 + 26, 4, 30, 130, 90, 50, 255);
    };

    const drawPlant = (x0, y0) => {
        fillPixelArray(pixels, imgW, imgH, x0 + 24, y0 + 36, 16, 20, 180, 120, 60, 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 20, y0 + 12, 24, 28, 80, 160, 80, 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 16, y0 + 20, 8, 16, 70, 140, 70, 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 40, y0 + 18, 8, 18, 90, 170, 90, 255);
    };

    const drawElderly = (x0, y0, skinColor = [255, 220, 180]) => {
        fillPixelArray(pixels, imgW, imgH, x0 + 24, y0 + 8, 16, 16, skinColor[0], skinColor[1], skinColor[2], 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 22, y0 + 6, 20, 8, 200, 180, 160, 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 20, y0 + 24, 24, 30, 100, 150, 200, 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 28, y0 + 13, 3, 3, 60, 60, 60, 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 34, y0 + 13, 3, 3, 60, 60, 60, 255);
    };

    const drawReception = (x0, y0) => {
        fillPixelArray(pixels, imgW, imgH, x0 + 4, y0 + 20, 56, 36, 150, 120, 90, 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 4, y0 + 20, 56, 4, 180, 150, 110, 255);
        fillPixelArray(pixels, imgW, imgH, x0 + 12, y0 + 28, 16, 12, 200, 220, 255, 255);
    };

    const tileDrawers = [drawBed, drawChair, drawTable, drawPlant, drawElderly, drawReception];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const idx = row * cols + col;
            const x0 = col * tileW;
            const y0 = row * tileH;

            fillPixelArray(pixels, imgW, imgH, x0, y0, tileW, tileH, 0, 0, 0, 0);

            if (tileDrawers[idx]) {
                tileDrawers[idx](x0, y0);
            }
        }
    }

    return createPNG(imgW, imgH, Buffer.from(pixels));
}

function main() {
    const tiledDir = path.join(__dirname, '..', 'assets', 'tiled');

    if (!fs.existsSync(tiledDir)) {
        fs.mkdirSync(tiledDir, { recursive: true });
    }

    const floorPng = generateFloorTiles();
    fs.writeFileSync(path.join(tiledDir, 'floor_tiles.png'), floorPng);
    console.log('✅ Generated floor_tiles.png (' + floorPng.length + ' bytes)');

    const furniturePng = generateFurnitureTiles();
    fs.writeFileSync(path.join(tiledDir, 'furniture_tiles.png'), furniturePng);
    console.log('✅ Generated furniture_tiles.png (' + furniturePng.length + ' bytes)');

    console.log('\n🎉 All tile images generated successfully!');
}

main();
