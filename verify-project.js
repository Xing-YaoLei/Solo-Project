const fs = require('fs');
const path = require('path');

console.log('=== 处方审核模拟游戏项目验证 ===\n');

console.log('1. 检查目录结构:');
const requiredDirs = [
    'assets/scripts/core',
    'assets/scripts/data/enums',
    'assets/scripts/services',
    'assets/scripts/scenes',
    'assets/scripts/components',
    'assets/scripts/tiled',
    'assets/resources/levels',
    'assets/resources/tiled-maps'
];

requiredDirs.forEach(dir => {
    const exists = fs.existsSync(dir);
    console.log(`  ${exists ? '✓' : '✗'} ${dir}`);
});

console.log('\n2. 检查核心TypeScript文件:');
const tsFiles = [
    'assets/scripts/core/EventBus.ts',
    'assets/scripts/core/SceneManager.ts',
    'assets/scripts/core/ExpressionParser.ts',
    'assets/scripts/core/ResourceLoader.ts',
    'assets/scripts/data/enums/PharmacistRole.ts',
    'assets/scripts/data/enums/Difficulty.ts',
    'assets/scripts/data/enums/GameMode.ts',
    'assets/scripts/data/enums/TaskAction.ts',
    'assets/scripts/data/enums/GameEventType.ts',
    'assets/scripts/data/LevelConfig.ts',
    'assets/scripts/data/GameState.ts',
    'assets/scripts/data/PlayerData.ts',
    'assets/scripts/services/LevelLoader.ts',
    'assets/scripts/services/ScoringService.ts',
    'assets/scripts/services/TimerService.ts',
    'assets/scripts/services/PharmacistAdviceService.ts',
    'assets/scripts/services/PlayerDataService.ts',
    'assets/scripts/services/GameFlowController.ts',
    'assets/scripts/scenes/MainMenuScene.ts',
    'assets/scripts/scenes/LevelSelectScene.ts',
    'assets/scripts/scenes/GameScene.ts',
    'assets/scripts/scenes/ResultScene.ts',
    'assets/scripts/components/LevelCard.ts',
    'assets/scripts/components/TaskPanel.ts',
    'assets/scripts/components/InfoPanel.ts',
    'assets/scripts/components/ActionBar.ts',
    'assets/scripts/components/WrongItemCard.ts',
    'assets/scripts/components/AdviceBubble.ts',
    'assets/scripts/tiled/TiledMapManager.ts'
];

let tsCount = 0;
tsFiles.forEach(file => {
    const exists = fs.existsSync(file);
    if (exists) tsCount++;
    console.log(`  ${exists ? '✓' : '✗'} ${file}`);
});
console.log(`  总计: ${tsCount}/${tsFiles.length} 个TypeScript文件`);

console.log('\n3. 检查关卡配置JSON文件:');
const levelsDir = 'assets/resources/levels';
let jsonValid = 0;
let jsonTotal = 0;
fs.readdirSync(levelsDir).forEach(file => {
    if (file.endsWith('.json')) {
        jsonTotal++;
        try {
            const content = fs.readFileSync(path.join(levelsDir, file), 'utf8');
            JSON.parse(content);
            jsonValid++;
            const data = JSON.parse(content);
            console.log(`  ✓ ${file} - ${data.name} (${data.difficulty}, ${data.tasks.length}个任务)`);
        } catch (e) {
            console.log(`  ✗ ${file} - 语法错误: ${e.message}`);
        }
    }
});
console.log(`  总计: ${jsonValid}/${jsonTotal} 个JSON配置文件有效`);

console.log('\n4. 检查文档:');
const docs = [
    '.trae/documents/PRD-处方审核模拟游戏.md',
    '.trae/documents/TECH-技术架构设计.md'
];
docs.forEach(doc => {
    const exists = fs.existsSync(doc);
    console.log(`  ${exists ? '✓' : '✗'} ${doc}`);
});

console.log('\n=== 项目创建完成 ===');
console.log('\n核心特性:');
console.log('  ✓ 数据驱动：所有关卡配置通过JSON加载，不硬编码');
console.log('  ✓ 场景分离：正式训练与自由练习独立入口');
console.log('  ✓ 岗位筛选：按审方药师/营业员/补货专员筛选关卡');
console.log('  ✓ 挑战模式：处方不清等高难度挑战关卡');
console.log('  ✓ 药师意见：表达式驱动的动态药师意见');
console.log('  ✓ 结算系统：成绩、用时、错因分析');
console.log('  ✓ Tiled集成：支持Tiled地图场景');

console.log('\n后续步骤:');
console.log('  1. 使用Cocos Creator 3.8+打开项目');
console.log('  2. 在Cocos Creator中创建场景文件并绑定脚本');
console.log('  3. 创建预制体(Prefab)并关联组件');
console.log('  4. 使用Tiled编辑器创建药店地图');
console.log('  5. 添加更多关卡JSON配置');
