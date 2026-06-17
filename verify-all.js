const fs = require('fs');

let errors = 0;
let passed = 0;

function check(condition, msg) {
    if (condition) {
        console.log(`  ✅ ${msg}`);
        passed++;
    } else {
        console.log(`  ❌ ${msg}`);
        errors++;
    }
}

console.log('\n=== 1. 资源文件存在性 ===');
const files = [
    'assets/resources/prefabs/LevelCard.prefab',
    'assets/resources/prefabs/LevelCard.prefab.meta',
    'assets/resources/prefabs/WrongItemCard.prefab',
    'assets/resources/prefabs/WrongItemCard.prefab.meta',
    'assets/resources/prefabs/AdviceBubble.prefab',
    'assets/resources/prefabs/AdviceBubble.prefab.meta',
    'assets/resources/tiled-maps/pharmacy.tmx',
    'assets/resources/tiled-maps/pharmacy.tmx.meta',
    'assets/resources/tiled-maps/pharmacy.tsj',
    'assets/resources/tiled-maps/pharmacy.tsj.meta',
];
files.forEach(f => check(fs.existsSync(f), f));

console.log('\n=== 2. 场景预制体引用 ===');
function checkSceneRef(scenePath, scriptType, prop, expectedUuid) {
    try {
        const d = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
        const script = d.find(e => e.__type__ === scriptType);
        if (!script) { check(false, `${scenePath}: script ${scriptType} not found`); return; }
        const val = script[prop];
        check(val && val.__uuid__ === expectedUuid,
            `${scenePath}.${prop} → ${expectedUuid}`);
    } catch (e) {
        check(false, `${scenePath}: ${e.message}`);
    }
}
checkSceneRef('assets/scenes/LevelSelect.scene',
    'a1b2c3d4e5f67890abcdef1234567802',
    'levelCardPrefab',
    'c1b2c3d4-e5f6-7890-abcd-ef1234567801');
checkSceneRef('assets/scenes/Result.scene',
    'a1b2c3d4e5f67890abcdef1234567804',
    'wrongItemCardPrefab',
    'c1b2c3d4-e5f6-7890-abcd-ef1234567802');
checkSceneRef('assets/scenes/Game.scene',
    'a1b2c3d4e5f67890abcdef1234567807',
    'adviceBubblePrefab',
    'c1b2c3d4-e5f6-7890-abcd-ef1234567803');

console.log('\n=== 3. Tiled地图交互区域 ===');
try {
    const tmx = fs.readFileSync('assets/resources/tiled-maps/pharmacy.tmx', 'utf8');
    check(tmx.includes('name="interactive_areas"'), 'interactive_areas 对象组存在');
    check(tmx.includes('prescription_area'), '处方审核区存在');
    check(tmx.includes('replenishment_area'), '补货区存在');
    check(tmx.includes('insurance_area'), '医保前台存在');
} catch (e) {
    check(false, `tmx error: ${e.message}`);
}

console.log('\n=== 4. 游戏流程完整性 ===');
const flowChecks = [
    { file: 'assets/scripts/scenes/MainMenuScene.ts', patterns: ['formalTrainingButton', 'freePracticeButton', 'LevelSelect'] },
    { file: 'assets/scripts/scenes/LevelSelectScene.ts', patterns: ['levelCardPrefab', 'onLevelSelected', 'SceneManager.instance.loadScene'] },
    { file: 'assets/scripts/scenes/GameScene.ts', patterns: ['infoPanel.setTask', 'pharmacistAdvice', 'tiledMapManager.onAreaClicked', 'showInfoPanel', 'advanceToNextTask', 'LEVEL_COMPLETED'] },
    { file: 'assets/scripts/components/InfoPanel.ts', patterns: ['adviceBubblePrefab', 'showPharmacistAdvice', 'instantiate', 'pharmacistAdvice'] },
    { file: 'assets/scripts/components/ActionBar.ts', patterns: ['GameFlowController.instance.submitAction', 'approveButton', 'rejectButton', 'supplementButton', 'reportButton'] },
    { file: 'assets/scripts/scenes/ResultScene.ts', patterns: ['wrongItemCardPrefab', 'scoreLabel', 'timeLabel', 'wrongReason', 'LevelCompletionData'] },
    { file: 'assets/scripts/services/GameFlowController.ts', patterns: ['submitAction', 'advanceToNextTask', 'completeLevel', 'LevelCompletionData'] },
    { file: 'assets/scripts/tiled/TiledMapManager.ts', patterns: ['onAreaClicked', 'interactive_areas', 'prescription_area', 'replenishment_area', 'insurance_area'] },
];
flowChecks.forEach(({ file, patterns }) => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const missing = patterns.filter(p => !content.includes(p));
        if (missing.length === 0) {
            check(true, `${file}: 全部 ${patterns.length} 个关键点`);
        } else {
            check(false, `${file}: 缺少 ${missing.join(', ')}`);
        }
    } catch (e) {
        check(false, `${file}: ${e.message}`);
    }
});

console.log(`\n=== 总计: ${passed} 项通过, ${errors} 项错误 ===`);
process.exit(errors > 0 ? 1 : 0);
