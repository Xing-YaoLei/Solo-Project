const fs = require('fs');
const path = require('path');

const file = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0359/assets/resources/maps/shop_tiles.png';
const data = fs.readFileSync(file);

const PNG_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

console.log('File size:', data.length);
console.log('First 8 bytes (hex):', Array.from(data.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' '));
console.log('Expected signature: ', PNG_SIGNATURE.map(b => b.toString(16).padStart(2, '0')).join(' '));

const validSignature = PNG_SIGNATURE.every((b, idx) => data[idx] === b);
console.log('Valid signature:', validSignature);

console.log('Last 12 bytes (hex):', Array.from(data.slice(-12)).map(b => b.toString(16).padStart(2, '0')).join(' '));
const last8 = data.slice(-8);
console.log('Last 8 bytes slice(4,8) ascii:', last8.slice(4, 8).toString('ascii'));
console.log('Last 8 bytes raw:', Array.from(last8));

const iendPos = data.length - 8;
console.log('At IEND position bytes:', Array.from(data.slice(iendPos, iendPos + 8)).map(b => b.toString(16).padStart(2, '0')).join(' '));
console.log('Chunk type at -8 pos:', data.slice(iendPos + 4, iendPos + 8).toString('ascii'));
