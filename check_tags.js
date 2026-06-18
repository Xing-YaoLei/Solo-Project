import { readFileSync } from 'fs';

const file = readFileSync('/Users/yaoleyxing/Developer/solo-mange-pro/MP0321/resources/js/Pages/Vehicles/Show.vue', 'utf-8');

const templateMatch = file.match(/<template>([\s\S]*?)<\/template>/);
if (!templateMatch) {
    console.error('No template found');
    process.exit(1);
}

const template = templateMatch[1];
const lines = template.split('\n');

const stack = [];
const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(?:\s[^>]*)?(\/)?>/g;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;
    
    while ((match = tagRegex.exec(line)) !== null) {
        const fullTag = match[0];
        const tagName = match[1];
        const isSelfClosing = match[2] === '/' || 
            ['input', 'br', 'hr', 'img', 'meta', 'link'].includes(tagName.toLowerCase());
        
        if (fullTag.startsWith('</')) {
            if (stack.length === 0) {
                console.log(`Line ${i + 1}: Extra closing tag </${tagName}>`);
                console.log(`  Content: ${line.trim()}`);
            } else if (stack[stack.length - 1] !== tagName) {
                console.log(`Line ${i + 1}: Mismatched closing tag </${tagName}>, expected </${stack[stack.length - 1]}>`);
                console.log(`  Content: ${line.trim()}`);
                console.log(`  Stack: [${stack.join(', ')}]`);
            } else {
                stack.pop();
            }
        } else if (!isSelfClosing && !fullTag.startsWith('<!')) {
            stack.push(tagName);
        }
    }
}

console.log(`\nFinal stack: [${stack.join(', ')}]`);
if (stack.length > 0) {
    console.log('These tags were not closed:');
    for (const tag of stack) {
        console.log(`  - ${tag}`);
    }
}
