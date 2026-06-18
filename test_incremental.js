import { baseParse } from '@vue/compiler-core';
import { readFileSync } from 'fs';

const file = readFileSync('/Users/yaoleyxing/Developer/solo-mange-pro/MP0321/resources/js/Pages/Vehicles/Show.vue', 'utf-8');

const templateMatch = file.match(/<template>([\s\S]*?)<\/template>/);
if (!templateMatch) {
    console.error('No template found');
    process.exit(1);
}

const fullTemplate = templateMatch[1];
const lines = fullTemplate.split('\n');

// Try parsing incrementally
for (let i = 100; i <= lines.length; i += 50) {
    const partial = lines.slice(0, i).join('\n');
    try {
        baseParse(partial, { filename: 'Show.vue' });
        console.log(`Lines 1-${i}: OK`);
    } catch (e) {
        console.log(`Lines 1-${i}: FAILED at line ${e.loc?.start.line || 'unknown'}`);
        console.log(`  Error: ${e.message}`);
        // Narrow down
        for (let j = i - 50; j <= i; j++) {
            const p = lines.slice(0, j).join('\n');
            try {
                baseParse(p, { filename: 'Show.vue' });
            } catch (e2) {
                console.log(`  First failure at line ${j}`);
                console.log(`  Line ${j} content: ${lines[j-1]}`);
                break;
            }
        }
        break;
    }
}
