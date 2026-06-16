const fs = require('fs');
const path = require('path');

let errors = 0;
let passed = 0;

console.log('=== 修复验证 ===\n');

console.log('1. 验证关卡JSON (roles字段):');
const levelsDir = 'assets/resources/levels';
fs.readdirSync(levelsDir).forEach(file => {
    if (file.endsWith('.json')) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(levelsDir, file), 'utf8'));
            if (data.roles && Array.isArray(data.roles)) {
                console.log('  OK', file, '- roles:', data.roles.join(','));
                passed++;
            } else if (data['岗位']) {
                console.log('  FAIL', file, '- still uses 岗位 field!');
                errors++;
            } else {
                console.log('  FAIL', file, '- missing roles field!');
                errors++;
            }
        } catch (e) {
            console.log('  FAIL', file, '- JSON error:', e.message);
            errors++;
        }
    }
});

console.log('\n2. 验证场景文件:');
const scenesDir = 'assets/scenes';
fs.readdirSync(scenesDir).forEach(file => {
    if (file.endsWith('.scene')) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(scenesDir, file), 'utf8'));
            const hasSceneType = Array.isArray(data) && data.some(d => d['__type__'] === 'cc.Scene');
            if (hasSceneType) {
                console.log('  OK', file, '- valid scene');
                passed++;
            } else {
                console.log('  FAIL', file, '- missing cc.Scene type');
                errors++;
            }
        } catch (e) {
            console.log('  FAIL', file, '- JSON error:', e.message);
            errors++;
        }
    }
});

console.log('\n3. 验证meta文件:');
let metaCount = 0;
const dirs = ['assets/scripts/scenes', 'assets/scripts/components', 'assets/scripts/tiled', 'assets/scenes'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
        if (file.endsWith('.meta')) {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
                if (data.uuid) {
                    metaCount++;
                } else {
                    console.log('  FAIL', path.join(dir, file), '- missing uuid');
                    errors++;
                }
            } catch (e) {
                console.log('  FAIL', path.join(dir, file), '- JSON error');
                errors++;
            }
        }
    });
});
console.log('  OK valid meta files:', metaCount);
passed++;

console.log('\n4. 验证TypeScript @ccclass in non-Component files:');
const tsDirs = ['assets/scripts/core', 'assets/scripts/services'];
let ccclassIssues = 0;
tsDirs.forEach(dir => {
    fs.readdirSync(dir).forEach(file => {
        if (file.endsWith('.ts')) {
            const content = fs.readFileSync(path.join(dir, file), 'utf8');
            if (content.includes('@ccclass')) {
                console.log('  FAIL', path.join(dir, file), '- should NOT use @ccclass');
                ccclassIssues++;
                errors++;
            }
        }
    });
});
if (ccclassIssues === 0) {
    console.log('  OK non-Component classes have no @ccclass misuse');
    passed++;
}

console.log('\n5. 验证ActionBar direct submit:');
const actionBarContent = fs.readFileSync('assets/scripts/components/ActionBar.ts', 'utf8');
if (actionBarContent.includes('GameFlowController.instance.submitAction')) {
    console.log('  OK ActionBar directly calls GameFlowController.submitAction');
    passed++;
} else {
    console.log('  FAIL ActionBar does not directly call submitAction');
    errors++;
}

console.log('\n6. 验证LevelCompletionData:');
const gfcContent = fs.readFileSync('assets/scripts/services/GameFlowController.ts', 'utf8');
if (gfcContent.includes('LevelCompletionData') && gfcContent.includes('levelId:')) {
    console.log('  OK GameFlowController exports LevelCompletionData with levelId');
    passed++;
} else {
    console.log('  FAIL LevelCompletionData incomplete');
    errors++;
}

console.log('\n7. 验证cc.d.ts type declarations:');
if (fs.existsSync('assets/scripts/cc.d.ts')) {
    const ccContent = fs.readFileSync('assets/scripts/cc.d.ts', 'utf8');
    const hasCcclass = ccContent.includes('ccclass');
    const hasProperty = ccContent.includes('property');
    const hasComponent = ccContent.includes('class Component');
    if (hasCcclass && hasProperty && hasComponent) {
        console.log('  OK cc.d.ts has ccclass/property/Component declarations');
        passed++;
    } else {
        console.log('  FAIL cc.d.ts missing key declarations');
        errors++;
    }
} else {
    console.log('  FAIL cc.d.ts not found');
    errors++;
}

console.log('\n8. 验证ResultScene使用LevelCompletionData:');
const resultContent = fs.readFileSync('assets/scripts/scenes/ResultScene.ts', 'utf8');
if (resultContent.includes('LevelCompletionData') && resultContent.includes('taskMap')) {
    console.log('  OK ResultScene uses LevelCompletionData with task mapping');
    passed++;
} else {
    console.log('  FAIL ResultScene not using LevelCompletionData properly');
    errors++;
}

console.log('\n=== RESULT: ' + passed + ' passed, ' + errors + ' errors ===');
process.exit(errors > 0 ? 1 : 0);
