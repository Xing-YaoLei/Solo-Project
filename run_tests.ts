import { GameManager } from './assets/scripts/core/GameManager';
import { ConfigManager } from './assets/scripts/core/ConfigManager';
import { SaveManager } from './assets/scripts/core/SaveManager';
import { LeaderboardManager } from './assets/scripts/core/LeaderboardManager';
import { TrainingAnalysis } from './assets/scripts/core/TrainingAnalysis';
import { GameConstants } from './assets/scripts/core/GameConstants';
import { MemoryStorage, StorageFactory } from './assets/scripts/core/PlatformAdapters';
import * as fs from 'fs';
import * as path from 'path';

StorageFactory.setInstance(new MemoryStorage());

function loadJson(p: string): any {
    const full = path.join(process.cwd(), p);
    return JSON.parse(fs.readFileSync(full, 'utf-8'));
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string): void {
    if (condition) {
        console.log(`  ✓ ${testName}`);
        passed++;
    } else {
        console.log(`  ✗ ${testName}`);
        failed++;
    }
}

function printHeader(title: string): void {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`  ${title}`);
    console.log(`${'='.repeat(50)}`);
}

async function runTests(): Promise<void> {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║   法律服务案件委托经营模拟游戏 - 核心逻辑测试    ║');
    console.log('╚══════════════════════════════════════════════════╝');

    printHeader('1. 配置加载测试');

    try {
        const casesData = loadJson('assets/resources/configs/cases.json');
        const levelsData = loadJson('assets/resources/configs/levels.json');
        const tutorialsData = loadJson('assets/resources/configs/tutorials.json');
        const assetsData = loadJson('assets/resources/configs/assets.json');
        const clientsData = loadJson('assets/resources/configs/clients.json');
        const schedulesData = loadJson('assets/resources/configs/trial_schedules.json');

        ConfigManager.instance.loadFromData({
            cases: casesData,
            levels: levelsData,
            tutorials: tutorialsData,
            assets: assetsData,
            clients: clientsData,
            trialSchedules: schedulesData
        });

        SaveManager.instance.init();
    } catch (e) {
        console.error('初始化失败:', e);
        process.exit(1);
    }

    const cases = ConfigManager.instance.getAllCases();
    assert(cases.length >= 2, `加载案件数量: ${cases.length} (至少2个)`);

    const clients = ConfigManager.instance.getAllClients();
    assert(clients.length >= 4, `加载客户数量: ${clients.length} (至少4个)`);

    const levels = ConfigManager.instance.getAllLevels();
    assert(levels.length >= 4, `加载关卡数量: ${levels.length} (至少4个)`);

    const case1 = ConfigManager.instance.getCase('case_001');
    assert(!!case1, '获取交通事故案件');
    assert(case1!.clues.length >= 10, `交通事故案件线索数: ${case1!.clues.length}`);
    assert(case1!.actions.length >= 15, `交通事故案件动作数: ${case1!.actions.length}`);
    assert(case1!.stages.length === 6, `交通事故案件阶段数: ${case1!.stages.length}`);

    const schedule = ConfigManager.instance.getTrialSchedule('case_001');
    assert(schedule.length > 0, `庭审日程数量: ${schedule.length}`);

    printHeader('2. 存档系统测试');

    const save = SaveManager.instance.getSave();
    assert(!!save, '获取存档数据');
    assert(save.totalScore === 0, `初始总分为0: ${save.totalScore}`);
    assert(save.unlockedLevelIds.includes('level_1'), '初始解锁 level_1');
    assert(save.unlockedClientIds.includes('client_1'), '初始解锁 client_1');
    assert(save.completedCaseIds.length === 0, '初始未完成任何案件');

    SaveManager.instance.addScore(50);
    assert(SaveManager.instance.getTotalScore() === 50, '加分后总分=50');

    SaveManager.instance.completeCase('case_001');
    assert(SaveManager.instance.isCaseCompleted('case_001'), '案件标记完成');

    SaveManager.instance.unlockLevel('level_2');
    assert(SaveManager.instance.isLevelUnlocked('level_2'), '解锁关卡 level_2');

    printHeader('3. 案件流程测试 - 接任务');

    SaveManager.instance.resetSave();

    const startResult = GameManager.instance.startCase('case_001');
    assert(startResult === true, '成功开始交通事故案件');

    const currentCase = GameManager.instance.getCurrentCase();
    assert(!!currentCase, '获取当前案件');
    assert(currentCase!.id === 'case_001', '当前案件ID正确');
    assert(GameManager.instance.isPlaying() === true, '游戏进行中');

    const currentStage = GameManager.instance.getCurrentStage();
    assert(!!currentStage, '获取当前阶段');
    assert(currentStage!.stage === GameConstants.CaseStage.ACCEPTANCE, `当前阶段为案件受理: ${currentStage!.stage}`);
    assert(GameManager.instance.getCurrentStageName() === '案件受理', '阶段名称正确');

    const initialScore = GameManager.instance.getScore();
    assert(initialScore === case1!.baseScore, `初始基础分: ${initialScore}`);

    printHeader('4. 案件流程测试 - 看线索');

    const discoveredClues = GameManager.instance.getDiscoveredClues();
    assert(discoveredClues.length >= 2, `受理阶段初始线索数: ${discoveredClues.length}`);
    assert(discoveredClues.some(c => c.id === 'clue_001'), '已发现客户陈述线索');
    assert(discoveredClues.some(c => c.id === 'clue_002'), '已发现委托代理协议线索');

    const clue001 = ConfigManager.instance.getClueById('case_001', 'clue_001');
    assert(!!clue001, '获取线索详情');
    assert(clue001.type === GameConstants.ClueType.TESTIMONY, '线索类型为证人证言');
    assert(clue001.credibility === 70, '线索可信度为70');

    printHeader('5. 案件流程测试 - 选动作');

    let availableActions = GameManager.instance.getAvailableActions();
    assert(availableActions.length >= 2, `受理阶段可用动作数: ${availableActions.length}`);

    const action001 = availableActions.find(a => a.id === 'action_001');
    assert(!!action001, '可用动作包含"详细询问案情"');
    assert(action001!.isCorrect === true, '动作是正确决策');

    const result1 = GameManager.instance.takeAction('action_001');
    assert(result1.success === true, '执行动作成功');
    assert(result1.isCorrect === true, '动作判定正确');
    assert(result1.scoreChange === 5, `正确动作+5分: ${result1.scoreChange}`);
    assert(result1.nextStage === false, '执行后未进入下一阶段');
    assert(GameManager.instance.getScore() === initialScore + 5, `得分+5: ${GameManager.instance.getScore()}`);

    availableActions = GameManager.instance.getAvailableActions();
    assert(!availableActions.some(a => a.id === 'action_001'), '已执行动作不再可用');

    const result2 = GameManager.instance.takeAction('action_001');
    assert(result2.success === false, '重复执行动作返回失败');

    printHeader('6. 阶段推进测试');

    const result3 = GameManager.instance.takeAction('action_002');
    assert(result3.success === true, '执行"签署委托协议"成功');
    assert(result3.isCorrect === true, '动作判定正确');
    assert(result3.nextStage === true, '进入下一阶段');

    const nextStage = GameManager.instance.getCurrentStage();
    assert(nextStage!.stage === GameConstants.CaseStage.INVESTIGATION, `阶段推进到调查取证: ${nextStage!.stage}`);

    const newClues = GameManager.instance.getDiscoveredClues();
    assert(newClues.some(c => c.id === 'clue_003'), '新阶段解锁新线索: 交通事故责任认定书');
    assert(newClues.some(c => c.id === 'clue_004'), '新阶段解锁新线索: 医院诊断证明');
    assert(newClues.some(c => c.id === 'clue_005'), '新阶段解锁新线索: 医疗费用票据');

    printHeader('7. 错误动作与扣分测试');

    const wrongAction = GameManager.instance.getAvailableActions().find(a => a.id === 'action_007');
    if (wrongAction) {
        const beforeScore = GameManager.instance.getScore();
        const wrongResult = GameManager.instance.takeAction('action_007');
        assert(wrongResult.success === true, '执行错误动作成功');
        assert(wrongResult.isCorrect === false, '动作判定错误');
        assert(wrongResult.scoreChange < 0, `错误动作扣分: ${wrongResult.scoreChange}`);
        assert(GameManager.instance.getScore() < beforeScore, `得分降低: ${beforeScore}→${GameManager.instance.getScore()}`);

        const errors = GameManager.instance.getErrorRecords();
        assert(errors.length === 1, `错误记录条数: ${errors.length}`);
        assert(errors[0].errorCategory === GameConstants.ErrorCategory.STRATEGIC, `错误分类为策略类: ${errors[0].errorCategory}`);
        assert(errors[0].errorReason.length > 0, '包含错误原因说明');
    }

    printHeader('8. 材料缺页检测测试');

    const clue004 = ConfigManager.instance.getClueById('case_001', 'clue_004');
    assert(clue004!.missingPage === true, '医院诊断证明线索标记为材料缺页');

    const existingMissCount = GameManager.instance.getMaterialMissRecords().length;
    assert(existingMissCount >= 1, `阶段推进已触发材料缺页: ${existingMissCount}`);

    const missRecords = GameManager.instance.getMaterialMissRecords();
    assert(missRecords.some(m => m.clueId === 'clue_004'), '记录包含医院诊断证明缺页');
    assert(missRecords[0].reason.length > 0, '缺页原因已记录');

    printHeader('9. 排行榜测试');

    LeaderboardManager.instance.clearLeaderboard();
    const rank = LeaderboardManager.instance.submitScore('player_1', '测试玩家', 200, 3, 1);
    assert(rank === 1, '第一个玩家排名第1');

    LeaderboardManager.instance.submitScore('player_2', '玩家二', 150, 2, 0);
    LeaderboardManager.instance.submitScore('player_3', '玩家三', 300, 5, 2);

    const topEntries = LeaderboardManager.instance.getTopEntries(3);
    assert(topEntries[0].playerId === 'player_3', '排行榜第1名是玩家三');
    assert(topEntries[1].playerId === 'player_1', '排行榜第2名是测试玩家');
    assert(topEntries[2].playerId === 'player_2', '排行榜第3名是玩家二');
    assert(LeaderboardManager.instance.getTotalPlayers() === 3, `排行榜总人数: 3`);

    printHeader('10. 训练分析与复盘测试');

    GameManager.instance.endCase();
    const trainingRecords = SaveManager.instance.getTrainingRecords();
    assert(trainingRecords.length >= 1, `训练记录数量: ${trainingRecords.length}`);

    if (trainingRecords.length > 0) {
        const lastRecord = trainingRecords[trainingRecords.length - 1];
        const review = TrainingAnalysis.instance.getReviewData(lastRecord);

        assert(!!review.caseData, '复盘数据包含案件信息');
        assert(review.correctActions.length > 0, `复盘正确决策数: ${review.correctActions.length}`);
        assert(review.scoreBreakdown.length > 0, `复盘得分明细数: ${review.scoreBreakdown.length}`);

        const summary = TrainingAnalysis.instance.getCaseSummary('case_001');
        assert(summary.attempts >= 1, `案件尝试次数: ${summary.attempts}`);
        assert(summary.bestScore > 0, `案件最高分: ${summary.bestScore}`);

        const stats = TrainingAnalysis.instance.getOverallStats();
        assert(stats.totalCases >= 1, `总训练次数: ${stats.totalCases}`);
        assert(stats.totalScore >= 0, `累计得分: ${stats.totalScore}`);

        const recs = TrainingAnalysis.instance.getRecommendations('case_001');
        assert(recs.length >= 1, `改进建议数: ${recs.length}`);
        console.log(`    💡 建议: ${recs[0]}`);
    }

    printHeader('11. 完整通关测试 (模拟全部正确决策)');

    SaveManager.instance.resetSave();
    GameManager.instance.startCase('case_001');

    let safetyCounter = 0;
    const safetyMax = 50;
    const takenActions: string[] = [];

    while (GameManager.instance.isPlaying() && safetyCounter < safetyMax) {
        safetyCounter++;
        const actions = GameManager.instance.getAvailableActions();
        const correctAction = actions.find(a => a.isCorrect);

        if (!correctAction) {
            const anyAction = actions[0];
            if (!anyAction) {
                break;
            }
            GameManager.instance.takeAction(anyAction.id);
            continue;
        }

        const result = GameManager.instance.takeAction(correctAction.id);
        takenActions.push(correctAction.id);
        if (result.nextStage && GameManager.instance.isPlaying()) {
            console.log(`    ➡️  推进到: ${GameManager.instance.getCurrentStageName()}`);
        }
    }

    assert(safetyCounter < safetyMax, `循环未超过最大次数 (${safetyCounter})`);
    assert(!GameManager.instance.isPlaying(), '案件已结束');

    const finalRecords = SaveManager.instance.getTrainingRecords('case_001');
    const lastRecord = finalRecords[finalRecords.length - 1];

    assert(lastRecord.score > 0, `最终得分: ${lastRecord.score}/${lastRecord.maxScore}`);
    assert(lastRecord.passed, '案件通过 (score >= 60)');
    assert(lastRecord.takenActionIds.length >= 5, `执行动作数: ${lastRecord.takenActionIds.length}`);

    console.log(`    🎯 最终得分: ${lastRecord.score}/${lastRecord.maxScore}`);
    console.log(`    🏆 评级: ${lastRecord.perfect ? 'S 完美' : (lastRecord.passed ? '通过' : '未通过')}`);
    console.log(`    ❌ 错误次数: ${lastRecord.errorRecords.length}`);
    console.log(`    ⚠️  材料缺页: ${lastRecord.materialMissRecords.length}`);
    console.log(`    📋 执行动作 (${takenActions.length}个): ${takenActions.join(', ')}`);

    printHeader('12. 解锁系统测试');

    const completedCount = SaveManager.instance.getSave().completedCaseIds.length;
    assert(completedCount >= 1, `已完成案件数: ${completedCount}`);

    const totalScore = SaveManager.instance.getTotalScore();
    console.log(`    累计总分: ${totalScore}`);

    const unlockedLevels = SaveManager.instance.getSave().unlockedLevelIds;
    assert(unlockedLevels.length >= 1, `已解锁关卡数: ${unlockedLevels.length}`);

    printHeader('📊 测试结果汇总');

    console.log(`\n  总测试项: ${passed + failed}`);
    console.log(`  通过: ${passed}`);
    console.log(`  失败: ${failed}`);

    const successRate = Math.round((passed / (passed + failed)) * 100);
    console.log(`  通过率: ${successRate}%`);

    if (failed === 0) {
        console.log('\n  ✅✅✅ 全部测试通过! 游戏核心逻辑运行正常 ✅✅✅');
        console.log('\n  完整流程验证:');
        console.log('    ✓ 接任务 (startCase)');
        console.log('    ✓ 看线索 (getDiscoveredClues)');
        console.log('    ✓ 选动作 (takeAction)');
        console.log('    ✓ 阶段推进 (stage advance)');
        console.log('    ✓ 错误记录 (error records)');
        console.log('    ✓ 材料缺页 (material miss)');
        console.log('    ✓ 训练复盘 (training review)');
        console.log('    ✓ 排行榜 (leaderboard)');
        console.log('    ✓ 解锁系统 (unlock system)');
    } else {
        console.log(`\n  ❌ 有 ${failed} 项测试失败`);
        process.exit(1);
    }
}

runTests().catch(e => {
    console.error('\n测试执行出错:', e);
    console.error(e.stack);
    process.exit(1);
});
