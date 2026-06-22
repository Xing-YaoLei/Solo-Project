import { GameManager } from './assets/scripts/core/GameManager';
import { ConfigManager } from './assets/scripts/core/ConfigManager';
import { SaveManager } from './assets/scripts/core/SaveManager';
import { LeaderboardManager } from './assets/scripts/core/LeaderboardManager';
import { TrainingAnalysis } from './assets/scripts/core/TrainingAnalysis';
import { GameConstants } from './assets/scripts/core/GameConstants';
import { MemoryStorage, StorageFactory } from './assets/scripts/core/PlatformAdapters';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

StorageFactory.setInstance(new MemoryStorage());

function loadJson(p: string): any {
    const full = path.join(process.cwd(), p);
    return JSON.parse(fs.readFileSync(full, 'utf-8'));
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query: string): Promise<string> {
    return new Promise(resolve => rl.question(query, resolve));
}

function printDivider(char: string = '=', length: number = 60): void {
    console.log(char.repeat(length));
}

function printHeader(title: string): void {
    printDivider();
    console.log(`  ${title}`);
    printDivider();
}

async function showMissionHall(): Promise<string | null> {
    printHeader('⚖️  法律模拟游戏 - 任务大厅');

    const save = SaveManager.instance.getSave();
    console.log(`\n  玩家: ${save.playerName}  |  总分: ${save.totalScore}  |  已完成案件: ${save.completedCaseIds.length}`);
    console.log(`  当前关卡: ${save.currentLevelId}  |  已解锁关卡: ${save.unlockedLevelIds.join(', ')}`);
    console.log(`  已解锁客户: ${save.unlockedClientIds.join(', ')}`);

    const allCases = ConfigManager.instance.getAllCases();
    console.log('\n  📋 可接案件:');
    printDivider('-');

    const availableCases: string[] = [];
    allCases.forEach((c, i) => {
        let locked = false;
        let lockReason = '';
        if (c.requiredUnlockedCaseIds.length > 0) {
            for (const reqId of c.requiredUnlockedCaseIds) {
                if (!SaveManager.instance.isCaseCompleted(reqId)) {
                    locked = true;
                    lockReason = `(需先完成案件: ${reqId})`;
                    break;
                }
            }
        }

        const difficultyNames: Record<string, string> = {
            easy: '简单', normal: '普通', hard: '困难', expert: '专家'
        };

        const completed = SaveManager.instance.isCaseCompleted(c.id);
        const best = SaveManager.instance.getBestRecord(c.id);
        const bestScore = best ? ` 最高分:${best.score}` : '';
        const status = completed ? `✓已完成${bestScore}` : (locked ? `🔒${lockReason}` : '○未完成');

        console.log(`  ${i + 1}. [${difficultyNames[c.difficulty] || c.difficulty}] ${c.title}`);
        console.log(`     ${c.description.substring(0, 40)}...`);
        console.log(`     状态: ${status}`);

        if (!locked) {
            availableCases.push(c.id);
        }
    });

    printDivider('-');
    console.log('  输入案件编号开始游戏 (输入 q 退出, 输入 r 查看训练记录)');

    const answer = await askQuestion('\n  请选择: ');

    if (answer.toLowerCase() === 'q') {
        return null;
    }

    if (answer.toLowerCase() === 'r') {
        await showTrainingRecords();
        return await showMissionHall();
    }

    const idx = parseInt(answer) - 1;
    if (isNaN(idx) || idx < 0 || idx >= allCases.length) {
        console.log('  ❌ 无效选择');
        return await showMissionHall();
    }

    const selectedCase = allCases[idx];
    if (!availableCases.includes(selectedCase.id)) {
        console.log('  ❌ 该案件尚未解锁');
        return await showMissionHall();
    }

    return selectedCase.id;
}

async function showTrainingRecords(): Promise<void> {
    printHeader('📊 训练记录');

    const records = SaveManager.instance.getTrainingRecords();
    if (records.length === 0) {
        console.log('\n  暂无训练记录');
        await askQuestion('\n  按回车返回...');
        return;
    }

    const stats = TrainingAnalysis.instance.getOverallStats();
    console.log(`\n  📈 总体统计:`);
    console.log(`     训练次数: ${stats.totalCases}`);
    console.log(`     平均得分: ${stats.avgScore}`);
    console.log(`     通过率: ${stats.successRate}%`);
    console.log(`     累计得分: ${stats.totalScore}`);

    const recs = TrainingAnalysis.instance.getRecommendations();
    console.log(`\n  💡 改进建议: ${recs[0]}`);

    console.log('\n  📝 最近5次训练:');
    printDivider('-');

    const sorted = [...records].sort((a, b) => b.endTime - a.endTime).slice(0, 5);
    sorted.forEach((r, i) => {
        const caseData = ConfigManager.instance.getCase(r.caseId);
        const date = new Date(r.endTime);
        const status = r.perfect ? '⭐完美' : (r.passed ? '✓通过' : '✗未通过');
        console.log(`  ${i + 1}. ${caseData?.title || r.caseId}`);
        console.log(`     得分: ${r.score}/${r.maxScore}  ${status}  错误: ${r.errorRecords.length}次`);
        console.log(`     ${date.toLocaleString()}`);
    });

    await askQuestion('\n  按回车返回...');
}

async function playCase(caseId: string): Promise<void> {
    const started = GameManager.instance.startCase(caseId);
    if (!started) {
        console.log('  ❌ 无法开始案件');
        return;
    }

    const caseData = GameManager.instance.getCurrentCase()!;
    printHeader(`⚖️  ${caseData.title}`);
    console.log(`\n  📖 案情简介: ${caseData.backgroundStory}`);
    console.log(`  📚 法律依据: ${caseData.legalBasis.join('; ')}`);
    console.log(`  🎯 基础分数: ${caseData.baseScore}  满分: ${caseData.baseScore + GameConstants.PERFECT_BONUS}  及格: ${GameConstants.BASE_PASS_SCORE}`);

    await askQuestion('\n  按回车开始处理案件...');

    while (GameManager.instance.isPlaying()) {
        const currentStage = GameManager.instance.getCurrentStage()!;
        const stageName = GameConstants.STAGE_NAMES[currentStage.stage as GameConstants.CaseStage];

        printHeader(`📍 ${stageName} (第 ${GameManager.instance.getDayCount()} 天)`);

        console.log(`\n  📝 阶段描述: ${currentStage.description}`);
        console.log(`  📊 当前得分: ${GameManager.instance.getScore()}/${GameManager.instance.getMaxScore()}`);
        console.log(`  👤 客户信任度: ${GameManager.instance.getClientTrustLevel()}%`);
        console.log(`  📈 案件进度: ${Math.round(GameManager.instance.getStageProgress() * 100)}%`);

        const discoveredClues = GameManager.instance.getDiscoveredClues();
        console.log(`\n  🔍 已发现线索 (${discoveredClues.length}条):`);
        discoveredClues.forEach((c, i) => {
            const typeNames: Record<string, string> = {
                testimony: '证人证言', physical: '物证', documentary: '书证',
                digital: '电子数据', expert: '鉴定意见'
            };
            const keyMark = c.isKey ? ' ⭐关键' : '';
            const missMark = c.missingPage ? ' ⚠️缺页' : '';
            console.log(`     ${i + 1}. [${typeNames[c.type] || c.type}]${keyMark}${missMark} ${c.name}`);
            console.log(`        ${c.description.substring(0, 50)}...`);
        });

        const actions = GameManager.instance.getAvailableActions();
        console.log(`\n  🎯 可选动作 (${actions.length}个):`);
        printDivider('-');

        actions.forEach((a, i) => {
            const typeNames: Record<string, string> = {
                interrogate: '询问', evidence: '举证', document: '文书',
                consult: '咨询', objection: '异议', settlement: '和解'
            };
            console.log(`  ${i + 1}. [${typeNames[a.type] || a.type}] ${a.name}`);
            console.log(`     ${a.description.substring(0, 50)}...`);
        });

        if (actions.length === 0) {
            console.log('     (当前没有可执行的动作)');
        }

        printDivider('-');
        console.log('  输入动作编号执行 (输入 c 查看线索详情, 输入 q 放弃案件)');

        const answer = await askQuestion('\n  请选择: ');

        if (answer.toLowerCase() === 'q') {
            const confirm = await askQuestion('  确认放弃当前案件? (y/n): ');
            if (confirm.toLowerCase() === 'y') {
                GameManager.instance.endCase();
                return;
            }
            continue;
        }

        if (answer.toLowerCase() === 'c') {
            await showClueDetails();
            continue;
        }

        const idx = parseInt(answer) - 1;
        if (isNaN(idx) || idx < 0 || idx >= actions.length) {
            console.log('  ❌ 无效选择');
            continue;
        }

        const selectedAction = actions[idx];
        const result = GameManager.instance.takeAction(selectedAction.id);

        console.log('');
        printDivider('-');
        if (result.isCorrect) {
            console.log(`  ✅ 决策正确! (得分 ${result.scoreChange >= 0 ? '+' : ''}${result.scoreChange})`);
        } else {
            console.log(`  ❌ 决策失误! (得分 ${result.scoreChange})`);
        }
        console.log(`  📜 ${result.message}`);

        if (result.nextStage) {
            console.log(`  ➡️  进入下一阶段`);
        }
        printDivider('-');

        await askQuestion('\n  按回车继续...');
    }

    await showCaseResult();
}

async function showClueDetails(): Promise<void> {
    const clues = GameManager.instance.getDiscoveredClues();
    if (clues.length === 0) {
        console.log('  无线索可查看');
        await askQuestion('\n  按回车返回...');
        return;
    }

    printHeader('🔍 线索详情');

    const typeNames: Record<string, string> = {
        testimony: '证人证言', physical: '物证', documentary: '书证',
        digital: '电子数据', expert: '鉴定意见'
    };

    clues.forEach((c, i) => {
        const keyMark = c.isKey ? ' ⭐[关键证据]' : '';
        const missMark = c.missingPage ? ` ⚠️[材料缺页: ${c.missingPageReason || '未知原因'}]` : '';
        console.log(`\n  ${i + 1}. ${c.name}${keyMark}${missMark}`);
        console.log(`     类型: ${typeNames[c.type] || c.type}  可信度: ${c.credibility}%`);
        console.log(`     描述: ${c.description}`);
    });

    await askQuestion('\n  按回车返回...');
}

async function showCaseResult(): Promise<void> {
    const records = SaveManager.instance.getTrainingRecords();
    if (records.length === 0) return;

    const latest = records[records.length - 1];
    const caseData = ConfigManager.instance.getCase(latest.caseId);

    printHeader('🏁 案件结案');

    console.log(`\n  📋 案件: ${caseData?.title || latest.caseId}`);
    console.log(`  🎯 最终得分: ${latest.score}/${latest.maxScore}`);

    const percentage = (latest.score / latest.maxScore) * 100;
    let grade = 'D';
    if (percentage >= 90) grade = 'S';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';

    console.log(`  🏆 评级: ${grade}  ${latest.perfect ? '⭐完美通关!' : (latest.passed ? '✓已通过' : '✗未通过')}`);
    console.log(`  ⏱️  用时: ${TrainingAnalysis.instance.formatTime(latest.totalPlayTime)}`);
    console.log(`  📈 发现线索: ${latest.discoveredClueIds.length}条`);
    console.log(`  🎯 执行动作: ${latest.takenActionIds.length}个`);

    if (latest.errorRecords.length > 0) {
        console.log(`\n  ❌ 错误记录 (${latest.errorRecords.length}次):`);
        latest.errorRecords.forEach((e, i) => {
            const stageName = GameConstants.STAGE_NAMES[e.stage as GameConstants.CaseStage];
            const catName = GameConstants.ERROR_CATEGORY_NAMES[e.errorCategory];
            console.log(`     ${i + 1}. [${stageName}] ${catName}: ${e.errorReason}`);
        });
    }

    if (latest.materialMissRecords.length > 0) {
        console.log(`\n  ⚠️  材料缺页 (${latest.materialMissRecords.length}次):`);
        latest.materialMissRecords.forEach((m, i) => {
            const clue = ConfigManager.instance.getClueById(m.caseId, m.clueId);
            console.log(`     ${i + 1}. ${clue?.name || m.clueId}: ${m.reason}`);
        });
    }

    const recs = TrainingAnalysis.instance.getRecommendations(latest.caseId);
    console.log(`\n  💡 改进建议: ${recs.join('; ')}`);

    const review = TrainingAnalysis.instance.getReviewData(latest);
    if (review.correctActions.length > 0) {
        console.log(`\n  ✅ 正确决策: ${review.correctActions.join('、')}`);
    }
    if (review.wrongActions.length > 0) {
        console.log(`  ❌ 失误决策: ${review.wrongActions.join('、')}`);
    }

    await askQuestion('\n  按回车返回任务大厅...');
}

async function main(): Promise<void> {
    console.log('\n');
    printHeader('⚖️  法律服务案件委托经营模拟游戏');
    console.log('  一款法律实务训练游戏');
    printDivider();

    try {
        const cases = loadJson('assets/resources/configs/cases.json');
        const levels = loadJson('assets/resources/configs/levels.json');
        const tutorials = loadJson('assets/resources/configs/tutorials.json');
        const assets = loadJson('assets/resources/configs/assets.json');
        const clients = loadJson('assets/resources/configs/clients.json');
        const trialSchedules = loadJson('assets/resources/configs/trial_schedules.json');

        ConfigManager.instance.loadFromData({ cases, levels, tutorials, assets, clients, trialSchedules });
        SaveManager.instance.init();
    } catch (e) {
        console.error('初始化失败:', e);
        rl.close();
        return;
    }

    console.log(`\n  ✅ 配置加载完成: ${ConfigManager.instance.getAllCases().length}个案件, ` +
        `${ConfigManager.instance.getAllClients().length}个客户, ` +
        `${ConfigManager.instance.getAllLevels().length}个关卡`);

    await askQuestion('\n  按回车进入任务大厅...');

    while (true) {
        const caseId = await showMissionHall();
        if (caseId === null) {
            break;
        }
        await playCase(caseId);
    }

    const save = SaveManager.instance.getSave();
    LeaderboardManager.instance.submitScore(
        'local_player',
        save.playerName,
        save.totalScore,
        save.completedCaseIds.length,
        save.trainingRecords.filter(r => r.perfect).length
    );

    printHeader('感谢游玩!');
    console.log(`\n  最终得分: ${save.totalScore}`);
    console.log(`  完成案件: ${save.completedCaseIds.length}`);
    console.log(`  训练次数: ${save.trainingRecords.length}`);

    const top3 = LeaderboardManager.instance.getTopEntries(3);
    if (top3.length > 0) {
        console.log(`\n  🏆 排行榜前3:`);
        top3.forEach((e, i) => {
            console.log(`     ${i + 1}. ${e.playerName} - ${e.totalScore}分`);
        });
    }

    rl.close();
}

main().catch(e => {
    console.error('运行出错:', e);
    rl.close();
    process.exit(1);
});
