const fs = require('fs');
const path = require('path');

const BASE_DIR = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0359/assets/resources';

const files = [
  path.join(BASE_DIR, 'maps/shop_tiles.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/engine_belt_tension/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/engine_valve_clearance/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/engine_mount_condition/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/brake_pad_thickness/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/brake_disc_surface/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/brake_caliper_condition/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/transmission_seal_leak/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/transmission_fluid_level/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/transmission_pan_gasket/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/ac_compressor_pressure/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/ac_refrigerant_level/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/ac_condenser_condition/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/tire_tread_depth/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/suspension_alignment/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/tie_rod_condition/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/battery_voltage/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/battery_terminal_corrosion/spriteFrame.png'),
  path.join(BASE_DIR, 'textures/inspection-photos/alternator_output/spriteFrame.png'),
];

const PNG_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

function readIHDR(data) {
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  return { width, height };
}

let allValid = true;
console.log('=== PNG Validation Report ===\n');

files.forEach((file, i) => {
  const data = fs.readFileSync(file);
  const size = data.length;
  const validSignature = PNG_SIGNATURE.every((b, idx) => data[idx] === b);
  const iendTypePos = data.length - 12 + 4;
  const hasIEND = data.length >= 12 && data.slice(iendTypePos, iendTypePos + 4).toString('ascii') === 'IEND';
  const dims = validSignature ? readIHDR(data) : null;
  const dimStr = dims ? `${dims.width}x${dims.height}` : 'unknown';
  const status = validSignature && hasIEND ? '✓' : '✗';
  if (!validSignature || !hasIEND) allValid = false;
  const relPath = path.relative('/Users/yaoleyxing/Developer/solo-mange-pro/MP0359', file);
  console.log(`${status} ${dimStr.padStart(10)} | ${size.toString().padStart(8)} bytes | ${relPath}`);
});

console.log('\n' + (allValid ? '✅ All 19 PNG files validated successfully!' : '❌ Some files failed validation!'));
