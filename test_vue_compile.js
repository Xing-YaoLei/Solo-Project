import { compile } from '@vue/compiler-dom';
import { readFileSync } from 'fs';

const file = readFileSync('/Users/yaoleyxing/Developer/solo-mange-pro/MP0321/resources/js/Pages/Vehicles/Show.vue', 'utf-8');

// Extract template content
const templateMatch = file.match(/<template>([\s\S]*?)<\/template>/);
if (!templateMatch) {
    console.error('No template found');
    process.exit(1);
}

const template = templateMatch[1];

try {
    const result = compile(template, {
        filename: 'Show.vue',
        sourceMap: false,
    });
    console.log('Compiled successfully!');
    console.log('Code length:', result.code.length);
} catch (e) {
    console.error('Compile error:', e.message);
    if (e.loc) {
        console.error('Location:', e.loc);
        // Show the problematic line
        const lines = template.split('\n');
        const lineNum = e.loc.start.line - 1;
        if (lines[lineNum]) {
            console.error('Line content:', lines[lineNum]);
        }
    }
    console.error(e.stack);
}
