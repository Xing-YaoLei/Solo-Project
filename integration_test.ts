import { GameManager } from './assets/scripts/core/GameManager';
import { ConfigManager } from './assets/scripts/core/ConfigManager';
import { SaveManager } from './assets/scripts/core/SaveManager';
import { GameConstants } from './assets/scripts/core/GameConstants';
import { ResourceFactory, InMemoryResourceLoader } from './assets/scripts/core/PlatformAdapters';
import * as fs from 'fs';
import * as path from 'path';

console.log('=== 集成测试：任务大厅 → 接案件 → 看线索 → 选动作 ===\n');

const configDir = path.join(process.cwd(), 'assets/resources/configs');
const configFiles = ['cases', 'levels', 'tutorials', 'assets', 'clients', 'trial_schedules'];

const mockData: Record<string, any> = {};
for (const f of configFiles) {
    const filePath = path.join(configDir, `${f}.json`);
    if (fs.existsSync(filePath)) {
        mockData[f] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
}

const loader = new InMemoryResourceLoader();
for (const f of configFiles) {
    const filePath = path.join(configDir, `${f}.json`);
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        loader.registerJson(`configs/${f}.json`, data);
    }
}
ResourceFactory.setInstance(loader);

let passed = 0;
let failed = 0;

function test(name: string, condition: boolean, detail?: string): void {
    if (condition) {
        console.log(`  ✓ ${name}`);
        passed++;
    } else {
        console.log(`  ✗ ${name}`);
        if (detail) console.log(`    ${detail}`);
        failed++;
    }
}

async function runTest() {
    console.log('【Step 1】加载配置 (模拟 resources/configs/)');
    await ConfigManager.instance.loadAllConfigs('configs');
    const allCases = ConfigManager.instance.getAllCases();
    test('配置加载成功', ConfigManager.instance.isConfigLoaded());
    test('案件数量: 2', allCases.length === 2, `实际: ${allCases.length}`);
    test('包含 case_001', allCases.some(c => c.id === 'case_001'));
    test('包含 case_002', allCases.some(c => c.id === 'case_002'));

    console.log('\n【Step 2】初始化游戏管理器');
    SaveManager.instance.resetSave();
    GameManager.reset();
    await GameManager.instance.init();
    const save = SaveManager.instance.getSave();
    test('存档初始化成功', save !== null);
    test('初始总分 0', save.totalScore === 0);
    test('初始已完成案件 0', save.completedCaseIds.length === 0);

    console.log('\n【Step 3】任务大厅 - 可接案件列表');
    const unlockedCases = allCases.filter(c => 
        c.requiredUnlockedCaseIds.length === 0 || 
        c.requiredUnlockedCaseIds.every(id => save.completedCaseIds.includes(id))
    );
    test('可接案件数量: 1 (只有 case_001)', unlockedCases.length === 1, `实际: ${unlockedCases.length}`);
    test('可接案件是 case_001', unlockedCases[0]?.id === 'case_001');
    test('case_002 被锁定', !unlockedCases.some(c => c.id === 'case_002'));

    console.log('\n【Step 4】点击案件 - 开始 case_001');
    const startResult = GameManager.instance.startCase('case_001');
    test('案件启动成功', startResult);
    test('当前案件正确', GameManager.instance.getCurrentCase()?.id === 'case_001');
    test('游戏状态为进行中', GameManager.instance.isPlaying());
    test('当前阶段: 案件受理 (acceptance)', 
        GameManager.instance.getCurrentStage()?.stage === GameConstants.CaseStage.ACCEPTANCE);

    console.log('\n【Step 5】查看当前阶段线索');
    const clues = GameManager.instance.getDiscoveredClues();
    test('初始线索数量: 2', clues.length === 2, `实际: ${clues.length}`);
    if (clues.length > 0) {
        test('第一条线索有名称', clues[0].name.length > 0);
        test('第一条线索有描述', clues[0].description.length > 0);
        console.log(`    线索1: ${clues[0].name}`);
        console.log(`    线索2: ${clues[1].name}`);
    }

    console.log('\n【Step 6】查看可用动作');
    const actions = GameManager.instance.getAvailableActions();
    test('可用动作数量: 3', actions.length === 3, `实际: ${actions.length}`);
    if (actions.length > 0) {
        test('第一个动作有名称', actions[0].name.length > 0);
        test('第一个动作有描述', actions[0].description.length > 0);
        console.log(`    动作1: ${actions[0].name}`);
        console.log(`    动作2: ${actions[1].name}`);
        console.log(`    动作3: ${actions[2].name}`);
    }

    console.log('\n【Step 7】执行一次动作 (选择第一个动作)');
    const firstAction = actions[0];
    const beforeScore = GameManager.instance.getScore();
    const result = GameManager.instance.takeAction(firstAction.id);
    const afterScore = GameManager.instance.getScore();
    
    test('动作执行有结果', result !== null);
    test('动作已记录为已执行', GameManager.instance['_takenActionIds'].has(firstAction.id));
    test('得分有变化', afterScore !== beforeScore || result.isCorrect === false);
    console.log(`    执行动作: ${firstAction.name}`);
    console.log(`    结果: ${result.isCorrect ? '✓ 正确' : '✗ 错误'}`);
    console.log(`    得分变化: ${result.scoreChange}`);
    console.log(`    当前得分: ${afterScore}/${GameManager.instance.getMaxScore()}`);
    console.log(`    反馈: ${result.message}`);

    console.log('\n【Step 8】验证阶段推进可能性');
    const stageAfter = GameManager.instance.getCurrentStage();
    test('仍在案件进行中', GameManager.instance.isPlaying());
    test('阶段有效', stageAfter !== null);

    console.log('\n【Step 9】返回大厅 - 验证存档更新');
    GameManager.instance.endCase();
    test('案件已结束', !GameManager.instance.isPlaying());

    const records = SaveManager.instance.getTrainingRecords();
    test('训练记录已保存', records.length > 0);
    if (records.length > 0) {
        const lastRecord = records[records.length - 1];
        test('记录的是 case_001', lastRecord.caseId === 'case_001');
        test('记录有得分', lastRecord.score > 0);
        console.log(`    最近记录: ${lastRecord.caseId} - ${lastRecord.score}/${lastRecord.maxScore}分`);
    }

    console.log('\n' + '='.repeat(50));
    console.log(`  测试结果: ${passed} 通过, ${failed} 失败`);
    console.log('='.repeat(50));

    if (failed === 0) {
        console.log('\n✅ 完整流程验证通过！');
        console.log('   任务大厅 → 接案件 → 看线索 → 选动作 全部正常');
    } else {
        console.log('\n❌ 有测试失败');
        process.exit(1);
    }
}

runTest().catch(e => {
    console.error('测试异常:', e);
    process.exit(1);
});
