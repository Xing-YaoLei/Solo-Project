import { _decorator, log } from 'cc';
import { GameTypes } from '../types/GameTypes';
import { ConfigTypes } from '../types/ConfigTypes';
import { ConfigManager } from './ConfigManager';
import { SaveManager } from './SaveManager';

const { ccclass } = _decorator;

@ccclass('TrainingRecordManager')
export class TrainingRecordManager {

    private static _instance: TrainingRecordManager | null = null;
    public static get instance(): TrainingRecordManager {
        if (!TrainingRecordManager._instance) {
            TrainingRecordManager._instance = new TrainingRecordManager();
        }
        return TrainingRecordManager._instance;
    }

    private constructor() {}

    public createNursingLogEntry(
        taskId: string,
        selectedOption: ConfigTypes.ActionOption,
        scoreChange: number
    ): GameTypes.NursingLogEntry {
        const taskConfig = ConfigManager.instance.getTaskById(taskId);
        return {
            timestamp: Date.now(),
            taskId,
            taskName: taskConfig?.name || '未知任务',
            action: taskConfig?.type || 'ACTION',
            selectedOption: selectedOption.text,
            scoreChange,
            isCorrect: selectedOption.isCorrect,
            errorType: selectedOption.errorType,
            insuranceRisk: selectedOption.insuranceRejectionRisk,
            notes: selectedOption.explanation
        };
    }

    public buildSettlementDetail(
        session: GameTypes.LevelSession,
        levelConfig: ConfigTypes.LevelConfig
    ): GameTypes.SettlementDetail {
        const settlement: GameTypes.SettlementDetail = {
            levelId: levelConfig.id,
            totalCost: 0,
            insuranceCoveredTotal: 0,
            outOfPocketTotal: 0,
            deniedItems: [],
            deniedAmountTotal: 0,
            billingItems: [],
            drgGroup: undefined,
            drgStandardCost: undefined,
            costOverrun: undefined
        };

        const prescription = ConfigManager.instance.getPrescriptionById(levelConfig.prescriptionId);
        if (prescription?.parameters.drgCostCeiling) {
            settlement.drgGroup = prescription.category;
            settlement.drgStandardCost = prescription.parameters.drgCostCeiling;
        }

        for (const taskId of session.taskOrder) {
            const progress = session.taskProgress[taskId];
            if (!progress || !progress.selectedOptionId) continue;

            const taskConfig = ConfigManager.instance.getTaskById(taskId);
            if (!taskConfig) continue;

            const option = taskConfig.actionOptions.find(o => o.id === progress.selectedOptionId);
            if (!option || option.cost === undefined) continue;

            const isDenied = progress.triggeredInsuranceRejection;
            const insuranceRatio = isDenied ? 0 : 0.85;
            const unitCost = option.cost / Math.max(1, taskConfig.actionOptions.length);

            const billingItem: GameTypes.BillingItem = {
                id: taskId,
                name: taskConfig.name,
                insuranceCode: this.generateInsuranceCode(taskConfig),
                category: taskConfig.type,
                unitPrice: unitCost,
                quantity: 1,
                totalCost: option.cost,
                insuranceRatio,
                insuranceCovered: isDenied ? 0 : option.cost * insuranceRatio,
                outOfPocket: isDenied ? option.cost : option.cost * (1 - insuranceRatio),
                isDenied,
                denialReason: isDenied ? this.getDenialReason(progress, option) : undefined
            };

            settlement.billingItems.push(billingItem);
            settlement.totalCost += billingItem.totalCost;
            settlement.insuranceCoveredTotal += billingItem.insuranceCovered;
            settlement.outOfPocketTotal += billingItem.outOfPocket;

            if (isDenied) {
                settlement.deniedItems.push(billingItem);
                settlement.deniedAmountTotal += billingItem.totalCost;
            }
        }

        if (settlement.drgStandardCost !== undefined) {
            settlement.costOverrun = Math.max(0, settlement.totalCost - settlement.drgStandardCost);
        }

        return settlement;
    }

    private generateInsuranceCode(taskConfig: ConfigTypes.TaskConfig): string {
        const prefixMap: Record<string, string> = {
            'ACTION': '3401',
            'EVALUATION': '340100',
            'PLANNING': '340101',
            'PRESCRIPTION': '340102',
            'BILLING': '340103',
            'SAFETY': '340104',
            'COLLABORATION': '340105',
            'COMMUNICATION': '340106',
            'OBSERVATION': '340107'
        };
        const prefix = prefixMap[taskConfig.type] || '340199';
        return `${prefix}-${taskConfig.id.substring(taskConfig.id.length - 3)}`;
    }

    private getDenialReason(
        progress: GameTypes.TaskProgress,
        option: ConfigTypes.ActionOption
    ): string {
        const reasonMap: Partial<Record<ConfigTypes.ErrorType, string>> = {
            'BILLING_FRAUD': '涉嫌串换项目/虚假申报',
            'OVERTREATMENT': '过度治疗，超出临床路径范围',
            'DOCUMENTATION': '病历记录不完整，缺乏支持资料',
            'EVALUATION': '缺乏量化评估记录',
            'PROCEDURAL': '违反诊疗流程',
            'PLANNING': '康复计划缺乏针对性'
        };

        if (option.errorType && reasonMap[option.errorType]) {
            return reasonMap[option.errorType]!;
        }
        return '医保稽核未通过';
    }

    public buildReplaySession(
        session: GameTypes.LevelSession,
        levelConfig: ConfigTypes.LevelConfig
    ): GameTypes.ReplaySession {
        let correctCount = 0;
        let errorCount = 0;
        for (const taskId of session.taskOrder) {
            const progress = session.taskProgress[taskId];
            if (!progress) continue;
            if (progress.scoreEarned >= 0) correctCount++;
            else errorCount++;
        }

        return {
            sessionId: session.sessionId,
            levelId: levelConfig.id,
            levelName: levelConfig.name,
            totalScore: session.totalScore,
            passScore: session.passScore,
            passed: session.passed,
            timeSpent: session.totalTimeSpent,
            taskCount: session.taskOrder.length,
            correctCount,
            errorCount,
            insuranceRejectionCount: session.insuranceRejectionCount,
            nursingLogs: session.nursingLogs,
            taskProgress: session.taskProgress,
            settlement: session.settlement,
            completedAt: session.endTime || Date.now()
        };
    }

    public generateTrainingSummary(): GameTypes.TrainingSummary {
        const profile = SaveManager.instance.getPlayerProfile();
        const replays = SaveManager.instance.getAllReplaySummaries();

        let totalCorrect = 0;
        let totalErrors = 0;
        let totalSessions = replays.length;
        let totalScores = 0;

        const byLevelBreakdown: GameTypes.TrainingSummary['byLevelBreakdown'] = {};

        replays.forEach(r => {
            const session = SaveManager.instance.loadReplaySession(r.sessionId);
            if (session) {
                totalCorrect += session.correctCount;
                totalErrors += session.errorCount;
                totalScores += session.totalScore;

                if (!byLevelBreakdown[session.levelId]) {
                    byLevelBreakdown[session.levelId] = {
                        attempts: 0,
                        bestScore: 0,
                        averageScore: 0,
                        passRate: 0
                    };
                }
                const entry = byLevelBreakdown[session.levelId];
                entry.attempts++;
                if (session.totalScore > entry.bestScore) {
                    entry.bestScore = session.totalScore;
                }
                entry.averageScore += session.totalScore;
                if (session.passed) {
                    entry.passRate++;
                }
            }
        });

        for (const levelId in byLevelBreakdown) {
            const entry = byLevelBreakdown[levelId];
            entry.averageScore = entry.attempts > 0 ? entry.averageScore / entry.attempts : 0;
            entry.passRate = entry.attempts > 0 ? entry.passRate / entry.attempts : 0;
        }

        const totalActions = totalCorrect + totalErrors;
        const overallAccuracy = totalActions > 0 ? totalCorrect / totalActions : 0;
        const averageScore = totalSessions > 0 ? totalScores / totalSessions : 0;

        const recommendedFocusAreas = this.analyzeWeakAreas(profile.errorDistribution);

        return {
            totalSessions,
            totalCorrect,
            totalErrors,
            overallAccuracy,
            averageScore,
            errorBreakdown: profile.errorDistribution,
            insuranceRejectionTotal: profile.insuranceRejectionTotalCount,
            byLevelBreakdown,
            recommendedFocusAreas
        };
    }

    private analyzeWeakAreas(
        errorDistribution: Record<ConfigTypes.ErrorType, number>
    ): string[] {
        const areas: { type: ConfigTypes.ErrorType; count: number; label: string }[] = [];
        const labelMap: Record<ConfigTypes.ErrorType, string> = {
            'PROCEDURAL': '诊疗流程规范',
            'ADMINISTRATIVE': '行政登记流程',
            'DIAGNOSTIC': '诊断鉴别能力',
            'EVALUATION': '量化评估技能',
            'DOCUMENTATION': '病历文书书写',
            'OVERTREATMENT': '过度治疗控制',
            'TREATMENT': '治疗方案选择',
            'BILLING_FRAUD': '医保合规风险',
            'COMMUNICATION': '医患沟通技巧',
            'SAFETY': '患者安全管理',
            'COLLABORATION': '多学科协作',
            'PLANNING': '康复计划制定'
        };

        for (const key in errorDistribution) {
            const t = key as ConfigTypes.ErrorType;
            if (errorDistribution[t] > 0) {
                areas.push({ type: t, count: errorDistribution[t], label: labelMap[t] });
            }
        }

        areas.sort((a, b) => b.count - a.count);
        return areas.slice(0, 3).map(a => a.label);
    }

    public calculateCompositeScore(
        score: number,
        timeSpent: number,
        levelConfig: ConfigTypes.LevelConfig,
        insuranceRejections: number
    ): number {
        const scoreWeight = 0.6;
        const timeWeight = 0.15;
        const complianceWeight = 0.25;

        const normalizedScore = Math.max(0, Math.min(100, score)) / 100;

        const timeLimit = levelConfig.timeLimit;
        const timeRatio = Math.max(0, 1 - timeSpent / timeLimit);

        const taskCount = levelConfig.tasks.length;
        const complianceRatio = Math.max(0, 1 - insuranceRejections / Math.max(3, taskCount * 0.3));

        const composite =
            normalizedScore * scoreWeight * 100 +
            timeRatio * timeWeight * 100 +
            complianceRatio * complianceWeight * 100;

        return Math.round(composite * 100) / 100;
    }

    public shouldUnlockComplexLogs(prescriptionId: string): boolean {
        const profile = SaveManager.instance.getPlayerProfile();
        const prescription = ConfigManager.instance.getPrescriptionById(prescriptionId);
        if (!prescription) return false;
        const threshold = prescription.parameters.unlockComplexLogsAfter || 3;
        return profile.totalTrainingCount >= threshold;
    }
}
