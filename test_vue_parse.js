import { parse } from '@vue/compiler-sfc';
import { readFileSync } from 'fs';

const file = readFileSync('/Users/yaoleyxing/Developer/solo-mange-pro/MP0321/resources/js/Pages/Vehicles/Show.vue', 'utf-8');

try {
    const { descriptor } = parse(file);
    console.log('Template parsed successfully!');
    console.log('Template length:', descriptor.template.content.length);
} catch (e) {
    console.error('Parse error:', e.message);
    console.error('Error location:', e.loc);
}
