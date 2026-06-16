import { _decorator, log, warn, error } from 'cc';
import { ConfigManager } from '../core/ConfigManager';
import { GameManager } from '../core/GameManager';
import { SaveManager } from '../core/SaveManager';
import { TrainingRecordManager } from '../core/TrainingRecordManager';

const { ccclass } = _decorator;

@ccclass('GameTestSuite')
export class GameTestSuite {

    private static testResults: Array<{ name: string; passed: boolean; message: string; duration: number }> = [];
    private static verbose: boolean = true;

    public static async runAllTests(): Promise<{ total: number; passed: number; failed: number; results: typeof GameTestSuite.testResults }> {
        log('[GameTestSuite] ========== 开始运行测试套件 ==========');
        this.testResults = [];

        await this.loadConfigsIfNeeded();

        this.testConfigLoading();
        this.testLevelConfigIntegrity();
        this.testTaskConfigIntegrity();
        this.testClueConfigIntegrity();
        this.testPrescriptionConfigIntegrity();
        this.testSaveManager();
        this.testGameFlowSimulation();
        this.testTrainingRecordCalculations();
        this.testLevelUnlockLogic();
        this.testInsuranceRejectionSimulation();

        const total = this.testResults.length;
        const passed = this.testResults.filter(r => r.passed).length;
        const failed = total - passed;

        log('[GameTestSuite] ========== 测试汇总 ==========');
        log(`  总计: ${total}项 | 通过: ${passed}项 | 失败: ${failed}项`);

        this.testResults.forEach(r => {
            const icon = r.passed ? '✅' : '❌';
            const line = `${icon} ${r.name} (${r.duration.toFixed(2)}ms): ${r.message}`;
            if (r.passed && this.verbose) log('  ' + line);
            else if (!r.passed) error('  ' + line);
        });

        return { total, passed, failed, results: [...this.testResults] };
    }

    private static async loadConfigsIfNeeded(): Promise<void> {
        return new Promise((resolve) => {
            if (ConfigManager.instance.getIsLoaded()) {
                resolve();
                return;
            }
            ConfigManager.instance.preloadAll(() => resolve());
            setTimeout(resolve, 5000);
        });
    }

    private static assert(condition: boolean, testName: string, failMessage: string, passMessage: string = '通过', startTime?: number): void {
        const duration = startTime ? performance.now() - startTime : 0;
        this.testResults.push({
            name: testName,
            passed: condition,
            message: condition ? passMessage : failMessage,
            duration
        });
    }

    private static testConfigLoading(): void {
        const start = performance.now();
        const loaded = ConfigManager.instance.getIsLoaded();
        this.assert(loaded,
            '配置表加载',
            '配置表未加载完成',
            '所有配置表加载成功',
            start
        );
    }

    private static testLevelConfigIntegrity(): void {
        const start = performance.now();
        const levels = ConfigManager.instance.getAllLevels();
        this.assert(levels.length > 0,
            '关卡数量检查',
            `关卡数量为0`,
            `共${levels.length}个关卡配置`,
            start
        );

        let valid = true;
        let issues: string[] = [];
        levels.forEach(level => {
            if (!level.id) { issues.push(`关卡缺少id`); valid = false; }
            if (!level.name) { issues.push(`${level.id}缺少name`); valid = false; }
            if (level.tasks.length === 0) { issues.push(`${level.id}无任务配置`); valid = false; }
            if (level.passScore <= 0 || level.passScore > 100) { issues.push(`${level.id}及格线${level.passScore}不合理`); valid = false; }

            level.tasks.forEach(tid => {
                const task = ConfigManager.instance.getTaskById(tid);
                if (!task) { issues.push(`${level.id}引用不存在的任务${tid}`); valid = false; }
            });

            const prescription = ConfigManager.instance.getPrescriptionById(level.prescriptionId);
            if (!prescription) { issues.push(`${level.id}引用不存在的处方${level.prescriptionId}`); valid = false; }
        });
        this.assert(valid,
            '关卡配置完整性',
            issues.join('; '),
            '所有关卡配置完整有效',
            performance.now() - start
        );
    }

    private static testTaskConfigIntegrity(): void {
        const start = performance.now();
        const taskIds = ['TASK_001', 'TASK_002', 'TASK_003', 'TASK_101', 'TASK_102', 'TASK_103', 'TASK_104'];
        let valid = true;
        let issues: string[] = [];

        taskIds.forEach(tid => {
            const task = ConfigManager.instance.getTaskById(tid);
            if (!task) { issues.push(`任务${tid}不存在`); valid = false; return; }
            if (task.actionOptions.length < 2) { issues.push(`${tid}选项少于2个`); valid = false; }

            let hasCorrect = false;
            task.actionOptions.forEach(opt => {
                if (opt.isCorrect) hasCorrect = true;
                if (opt.nextTask !== null && opt.nextTask !== undefined) {
                    const next = ConfigManager.instance.getTaskById(opt.nextTask);
                    if (!next) { issues.push(`${tid}选项${opt.id}引用不存在的nextTask`); valid = false; }
                }
            });

            if (!hasCorrect) { issues.push(`${tid}无正确选项`); valid = false; }

            task.clueIds.forEach(cid => {
                const clue = ConfigManager.instance.getClueById(cid);
                if (!clue) { issues.push(`${tid}引用不存在的线索${cid}`); valid = false; }
            });
        });

        this.assert(valid,
            '任务配置完整性',
            issues.join('; ') || '通过',
            `检查的${taskIds.length}个任务配置完整`,
            performance.now() - start
        );
    }

    private static testClueConfigIntegrity(): void {
        const start = performance.now();
        const clueIds = ['CLUE_001', 'CLUE_003', 'CLUE_101', 'CLUE_106', 'CLUE_205', 'CLUE_305', 'CLUE_308'];
        let valid = true;
        let issues: string[] = [];

        clueIds.forEach(cid => {
            const clue = ConfigManager.instance.getClueById(cid);
            if (!clue) { issues.push(`线索${cid}不存在`); valid = false; return; }
            if (!clue.name || !clue.description) { issues.push(`${cid}缺少基本信息`); valid = false; }
            if (!clue.content) { issues.push(`${cid}缺少content字段`); valid = false; }
            if (!clue.importance) { issues.push(`${cid}缺少importance标记`); valid = false; }
        });

        this.assert(valid,
            '线索配置完整性',
            issues.join('; ') || '通过',
            `检查的${clueIds.length}个线索配置完整`,
            performance.now() - start
        );
    }

    private static testPrescriptionConfigIntegrity(): void {
        const start = performance.now();
        const prescIds = ['PRE_BASIC_001', 'PRE_STROKE_001', 'PRE_FRACTURE_001', 'PRE_ELDERLY_001'];
        let valid = true;
        let issues: string[] = [];

        prescIds.forEach(pid => {
            const p = ConfigManager.instance.getPrescriptionById(pid);
            if (!p) { issues.push(`处方${pid}不存在`); valid = false; return; }
            if (!p.parameters.maxAttempts) { issues.push(`${pid}缺少maxAttempts`); valid = false; }
            if (p.parameters.scoreMultiplier === undefined) { issues.push(`${pid}缺少scoreMultiplier`); valid = false; }
            if (p.objectives.length === 0) { issues.push(`${pid}无训练目标`); valid = false; }
        });

        this.assert(valid,
            '训练处方配置完整性',
            issues.join('; ') || '通过',
            `检查的${prescIds.length}个处方配置完整`,
            performance.now() - start
        );
    }

    private static testSaveManager(): void {
        const start = performance.now();
        try {
            const profile = SaveManager.instance.getPlayerProfile();
            this.assert(!!profile && !!profile.playerId,
                '玩家档案创建',
                '获取玩家档案失败',
                `玩家ID: ${profile.playerId.substring(0, 15)}...`,
                start
            );

            const unlocked = SaveManager.instance.isLevelUnlocked('LV001');
            this.assert(unlocked,
                '初始关卡解锁',
                'LV001初始未解锁',
                'LV001默认已解锁',
                performance.now()
            );

            SaveManager.instance.addCoins(100);
            SaveManager.instance.addExp(200);
            const p2 = SaveManager.instance.getPlayerProfile();
            this.assert(p2.coins >= 100 && p2.level >= 1,
                '数据写入验证',
                `金币/经验写入异常`,
                `金币: ${p2.coins}, 等级: Lv.${p2.level}`,
                performance.now()
            );

        } catch (e) {
            this.assert(false, '存档系统', `异常: ${e}`, '', start);
        }
    }

    private static testGameFlowSimulation(): void {
        const start = performance.now();
        try {
            const started = GameManager.instance.startLevel('LV001');
            this.assert(started,
                'LV001启动',
                'LV001启动失败',
                '成功启动LV001',
                start
            );

            const session = GameManager.instance.getCurrentSession();
            this.assert(!!session && session.taskOrder.length >= 3,
                '关卡会话创建',
                `任务数量不足: ${session?.taskOrder.length || 0}`,
                `共${session?.taskOrder.length}个任务`,
                performance.now()
            );

            const firstTask = GameManager.instance.getCurrentTask();
            this.assert(!!firstTask,
                '初始任务获取',
                '无法获取当前任务',
                `当前任务: ${firstTask?.name}`,
                performance.now()
            );

            const options = GameManager.instance.getOptionsForCurrentTask();
            this.assert(options.length >= 2,
                '动作选项获取',
                `选项数量不足: ${options.length}`,
                `共${options.length}个动作选项`,
                performance.now()
            );

            const correctOption = options.find(o => o.isCorrect);
            if (correctOption) {
                const selected = GameManager.instance.selectAction(correctOption.id);
                this.assert(!!selected && selected.isCorrect,
                    '正确动作选择',
                    `动作选择结果异常`,
                    `选择得分: ${selected?.score}`,
                    performance.now()
                );
            }

        } catch (e) {
            this.assert(false, '游戏流程模拟', `异常: ${e}`, '', start);
        }
    }

    private static testTrainingRecordCalculations(): void {
        const start = performance.now();
        try {
            const lv1 = ConfigManager.instance.getLevelById('LV001');
            if (!lv1) { this.assert(false, '训练记录计算', 'LV001不存在', '', start); return; }

            const composite = TrainingRecordManager.instance.calculateCompositeScore(85, 300, lv1, 1);
            this.assert(composite >= 0 && composite <= 100,
                '综合分计算',
                `综合分超出范围: ${composite}`,
                `综合分: ${composite.toFixed(2)} (得分85, 用时5分钟, 拒付1次)`,
                start
            );

            const composite2 = TrainingRecordManager.instance.calculateCompositeScore(95, 180, lv1, 0);
            this.assert(composite2 > composite,
                '综合分权重验证',
                `高分快速无拒付应更高分`,
                `优化后综合分: ${composite2.toFixed(2)}`,
                performance.now()
            );

        } catch (e) {
            this.assert(false, '训练记录计算', `异常: ${e}`, '', start);
        }
    }

    private static testLevelUnlockLogic(): void {
        const start = performance.now();
        try {
            const lv2 = ConfigManager.instance.getLevelById('LV002');
            if (!lv2 || lv2.unlockCondition.type !== 'LEVEL_PASS') {
                this.assert(false, '解锁条件配置', 'LV002解锁条件异常', '', start);
                return;
            }

            this.assert(lv2.unlockCondition.value === 'LV001',
                'LV002解锁依赖',
                `依赖应为LV001, 实际${lv2.unlockCondition.value}`,
                'LV002依赖LV001通过',
                start
            );

            const lv4 = ConfigManager.instance.getLevelById('LV004');
            this.assert(!!lv4 && lv4.unlockCondition.type === 'TOTAL_SCORE',
                'LV004解锁类型',
                `应为TOTAL_SCORE, 实际${lv4?.unlockCondition.type}`,
                `累计得分${lv4?.unlockCondition.value}分解锁LV004`,
                performance.now()
            );

        } catch (e) {
            this.assert(false, '关卡解锁逻辑', `异常: ${e}`, '', start);
        }
    }

    private static testInsuranceRejectionSimulation(): void {
        const start = performance.now();
        try {
            const task = ConfigManager.instance.getTaskById('TASK_205');
            if (!task) { this.assert(false, '医保拒付模拟', 'TASK_205不存在', '', start); return; }

            const fraudOption = task.actionOptions.find(o => o.errorType === 'BILLING_FRAUD');
            this.assert(
                !!fraudOption &&
                fraudOption.insuranceRejectionRisk !== undefined &&
                fraudOption.insuranceRejectionRisk >= 0.8,
                '医保欺诈拒付阈值',
                `BILLING_FRAUD拒付风险应>=0.8, 实际${fraudOption?.insuranceRejectionRisk}`,
                `BILLING_FRAUD拒付风险: ${(fraudOption?.insuranceRejectionRisk || 0) * 100}%`,
                start
            );

            const task003 = ConfigManager.instance.getTaskById('TASK_003');
            const badOption = task003?.actionOptions.find(o => !o.isCorrect);
            this.assert(
                !!badOption &&
                !!badOption.errorType &&
                ['DOCUMENTATION', 'PROCEDURAL', 'ADMINISTRATIVE'].includes(badOption.errorType),
                '错因分类合理性',
                `错因分类异常: ${badOption?.errorType}`,
                `文档类错误标记为: ${badOption?.errorType}`,
                performance.now()
            );

        } catch (e) {
            this.assert(false, '医保拒付模拟', `异常: ${e}`, '', start);
        }
    }
}
