import { baseParse } from '@vue/compiler-core';

// Test 1: Simple self-closing component
const test1 = `<div><InfoItem label="test" :value="123" /></div>`;
try {
    baseParse(test1, { filename: 'test.vue' });
    console.log('Test 1 (self-closing InfoItem): OK');
} catch (e) {
    console.log('Test 1 FAILED:', e.message);
}

// Test 2: Explicit closing tag
const test2 = `<div><InfoItem label="test" :value="123"></InfoItem></div>`;
try {
    baseParse(test2, { filename: 'test.vue' });
    console.log('Test 2 (explicit closing): OK');
} catch (e) {
    console.log('Test 2 FAILED:', e.message);
}

// Test 3: SVG path self-closing
const test3 = `<svg><path d="M15 19l-7-7 7-7" /></svg>`;
try {
    baseParse(test3, { filename: 'test.vue' });
    console.log('Test 3 (SVG path): OK');
} catch (e) {
    console.log('Test 3 FAILED:', e.message);
}

// Test 4: With space before />
const test4 = `<svg><path d="M15 19l-7-7 7-7" /></svg>`;
try {
    baseParse(test4, { filename: 'test.vue' });
    console.log('Test 4 (SVG path with space): OK');
} catch (e) {
    console.log('Test 4 FAILED:', e.message);
}

// Test 5: Check if isCustomElement
const test5 = `<div><VehicleStatusBadge status="pending" /></div>`;
try {
    baseParse(test5, { filename: 'test.vue' });
    console.log('Test 5 (VehicleStatusBadge): OK');
} catch (e) {
    console.log('Test 5 FAILED:', e.message);
}
