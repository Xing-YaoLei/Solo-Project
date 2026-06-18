import { baseParse } from '@vue/compiler-core';

// Test optional chaining in template binding
const test1 = `<InfoItem label="里程数" :value="vehicle.mileage?.toLocaleString() + ' km'" />`;
try {
    baseParse(test1, { filename: 'test.vue' });
    console.log('Test 1 (optional chaining): OK');
} catch (e) {
    console.log('Test 1 FAILED:', e.message);
    console.log('  Line:', e.loc?.start.line);
}

// Test just the expression
const test2 = `<div :data="vehicle.mileage?.toLocaleString()"></div>`;
try {
    baseParse(test2, { filename: 'test.vue' });
    console.log('Test 2 (optional chaining in div): OK');
} catch (e) {
    console.log('Test 2 FAILED:', e.message);
}

// Test multiple InfoItems
const test3 = `
<div>
    <InfoItem label="颜色" :value="vehicle.color || '未填写'" />
    <InfoItem label="里程数" :value="vehicle.mileage?.toLocaleString() + ' km'" />
    <InfoItem label="排量" :value="vehicle.displacement || '未填写'" />
    <InfoItem label="变速箱" :value="vehicle.transmission || '未填写'" />
    <InfoItem label="燃油类型" :value="vehicle.fuel_type || '未填写'" />
</div>
`;
try {
    baseParse(test3, { filename: 'test.vue' });
    console.log('Test 3 (multiple InfoItems): OK');
} catch (e) {
    console.log('Test 3 FAILED:', e.message);
    console.log('  At line:', e.loc?.start.line);
}

// Now let's check the actual lines 48-55 from Show.vue
const actualLines = `
                        <div class="card-body">
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <InfoItem label="颜色" :value="vehicle.color || '未填写'" />
                                <InfoItem label="里程数" :value="vehicle.mileage?.toLocaleString() + ' km'" />
                                <InfoItem label="排量" :value="vehicle.displacement || '未填写'" />
                                <InfoItem label="变速箱" :value="vehicle.transmission || '未填写'" />
                                <InfoItem label="燃油类型" :value="vehicle.fuel_type || '未填写'" />
                                <InfoItem label="上牌日期" :value="vehicle.registration_date || '未填写'" />
                                <InfoItem label="过户次数" :value="vehicle.transfer_count || 0" />
                                <InfoItem label="交强险到期" :value="vehicle.insurance_expire || '未填写'" />
                                <InfoItem label="年检到期" :value="vehicle.inspection_expire || '未填写'" />
                                <InfoItem label="排放标准" :value="vehicle.emission_standard || '未填写'" />
                            </div>
                        </div>
`;
try {
    baseParse(actualLines, { filename: 'test.vue' });
    console.log('Test 4 (actual lines): OK');
} catch (e) {
    console.log('Test 4 FAILED:', e.message);
    console.log('  At line:', e.loc?.start.line);
}
