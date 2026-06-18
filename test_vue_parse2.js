import { baseParse } from '@vue/compiler-core';
import { readFileSync } from 'fs';

const file = readFileSync('/Users/yaoleyxing/Developer/solo-mange-pro/MP0321/resources/js/Pages/Vehicles/Show.vue', 'utf-8');

const templateMatch = file.match(/<template>([\s\S]*?)<\/template>/);
if (!templateMatch) {
    console.error('No template found');
    process.exit(1);
}

const template = templateMatch[1];
const lines = template.split('\n');

try {
    const ast = baseParse(template, {
        filename: 'Show.vue',
    });
    console.log('Parse successful!');
} catch (e) {
    console.error('Parse error:', e.message);
    if (e.loc) {
        const lineNum = e.loc.start.line;
        console.error('Error at line', lineNum, 'column', e.loc.start.column);
        console.error('Line content:', lines[lineNum - 1]);
        console.error('');
        console.error('Context (5 lines before and after):');
        const start = Math.max(0, lineNum - 6);
        const end = Math.min(lines.length, lineNum + 5);
        for (let i = start; i < end; i++) {
            const marker = i === lineNum - 1 ? '>> ' : '   ';
            console.log(`${marker}${i + 1}: ${lines[i]}`);
        }
    }
}
