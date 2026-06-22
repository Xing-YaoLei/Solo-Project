import { ITrainingRecord } from './GameInterfaces';
import { GameConstants } from './GameConstants';
import { SaveManager } from './SaveManager';
import { ConfigManager } from './ConfigManager';

export class TrainingAnalysis {

    private static _instance: TrainingAnalysis | null = null;

    public static get instance(): TrainingAnalysis {
        if (!TrainingAnalysis._instance) {
            TrainingAnalysis._instance = new TrainingAnalysis();
        }
        return TrainingAnalysis._instance;
    }

    public static reset(): void {
        TrainingAnalysis._instance = null;
    }

    private constructor() {
    }

    public getCaseSummary(caseId: string): CaseAnalysisSummary {
        const records = SaveManager.instance.getTrainingRecords(caseId);
        const caseData = ConfigManager.instance.getCase(caseId);

        if (records.length === 0) {
            return {
                caseId,
                caseName: caseData?.title || caseId,
                attempts: 0,
                bestScore: 0,
                avgScore: 0,
                passRate: 0,
                perfectRate: 0,
                avgPlayTime: 0,
                errorCounts: {} as Record<GameConstants.ErrorCategory, number>,
                topMissedClues: [],
                improvementTrend: []
            };
        }

        const bestRecord = SaveManager.instance.getBestRecord(caseId);
        const totalScore = records.reduce((sum, r) => sum + r.score, 0);
        const passedCount = records.filter(r => r.passed).length;
        const perfectCount = records.filter(r => r.perfect).length;
        const totalTime = records.reduce((sum, r) => sum + r.totalPlayTime, 0);

        const errorCounts: Record<string, number> = {};
        records.forEach(record => {
            record.errorRecords.forEach(error => {
                const cat = error.errorCategory;
                errorCounts[cat] = (errorCounts[cat] || 0) + 1;
            });
        });

        const clueMissCounts: Record<string, number> = {};
        records.forEach(record => {
            record.materialMissRecords.forEach(miss => {
                clueMissCounts[miss.clueId] = (clueMissCounts[miss.clueId] || 0) + 1;
            });
        });

        const topMissedClues = Object.entries(clueMissCounts)
            .map(([clueId, count]) => {
                const clue = ConfigManager.instance.getClueById(caseId, clueId);
                return { clueId, clueName: clue?.name || clueId, count };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const sortedRecords = [...records].sort((a, b) => a.startTime - b.startTime);
        const improvementTrend = sortedRecords.map((r, i) => ({
            attempt: i + 1,
            score: r.score,
            date: r.startTime
        }));

        return {
            caseId,
            caseName: caseData?.title || caseId,
            attempts: records.length,
            bestScore: bestRecord?.score || 0,
            avgScore: Math.round(totalScore / records.length),
            passRate: Math.round((passedCount / records.length) * 100),
            perfectRate: Math.round((perfectCount / records.length) * 100),
            avgPlayTime: Math.round(totalTime / records.length),
            errorCounts: errorCounts as Record<GameConstants.ErrorCategory, number>,
            topMissedClues,
            improvementTrend
        };
    }

    public getOverallStats(): OverallStats {
        const allRecords = SaveManager.instance.getTrainingRecords();
        const save = SaveManager.instance.getSave();

        if (allRecords.length === 0) {
            return {
                totalCases: 0,
                completedCases: 0,
                totalScore: 0,
                avgScore: 0,
                totalPlayTime: 0,
                successRate: 0,
                strongestCategory: null,
                weakestCategory: null,
                unlockedClients: save.unlockedClientIds.length,
                unlockedLevels: save.unlockedLevelIds.length
            };
        }

        const totalScore = allRecords.reduce((sum, r) => sum + r.score, 0);
        const totalTime = allRecords.reduce((sum, r) => sum + r.totalPlayTime, 0);
        const passedCount = allRecords.filter(r => r.passed).length;

        const categoryStats: Record<string, { correct: number; total: number }> = {};
        allRecords.forEach(record => {
            const caseData = ConfigManager.instance.getCase(record.caseId);
            if (!caseData) return;

            record.takenActionIds.forEach(actionId => {
                const action = caseData.actions.find(a => a.id === actionId);
                if (!action) return;

                const cat = action.errorCategory || 'strategic';
                if (!categoryStats[cat]) {
                    categoryStats[cat] = { correct: 0, total: 0 };
                }
                categoryStats[cat].total++;
                if (action.isCorrect) {
                    categoryStats[cat].correct++;
                }
            });
        });

        let strongestCategory: string | null = null;
        let weakestCategory: string | null = null;
        let highestRate = -1;
        let lowestRate = Infinity;

        for (const [cat, stats] of Object.entries(categoryStats)) {
            if (stats.total > 0) {
                const rate = stats.correct / stats.total;
                if (rate > highestRate) {
                    highestRate = rate;
                    strongestCategory = cat;
                }
                if (rate < lowestRate) {
                    lowestRate = rate;
                    weakestCategory = cat;
                }
            }
        }

        return {
            totalCases: allRecords.length,
            completedCases: save.completedCaseIds.length,
            totalScore: save.totalScore,
            avgScore: Math.round(totalScore / allRecords.length),
            totalPlayTime: totalTime,
            successRate: Math.round((passedCount / allRecords.length) * 100),
            strongestCategory: strongestCategory as GameConstants.ErrorCategory | null,
            weakestCategory: weakestCategory as GameConstants.ErrorCategory | null,
            unlockedClients: save.unlockedClientIds.length,
            unlockedLevels: save.unlockedLevelIds.length
        };
    }

    public getReviewData(record: ITrainingRecord): ReviewData {
        const caseData = ConfigManager.instance.getCase(record.caseId);
        if (!caseData) {
            return {
                record,
                caseData: null,
                errorsByStage: {},
                missedClues: [],
                correctActions: [],
                wrongActions: [],
                scoreBreakdown: []
            };
        }

        const errorsByStage: Record<string, any[]> = {};
        record.errorRecords.forEach(error => {
            if (!errorsByStage[error.stage]) {
                errorsByStage[error.stage] = [];
            }
            errorsByStage[error.stage].push(error);
        });

        const missedClues = record.materialMissRecords.map(miss => {
            const clue = caseData.clues.find(c => c.id === miss.clueId);
            return {
                ...miss,
                clueName: clue?.name || miss.clueId,
                clueDescription: clue?.description || ''
            };
        });

        const correctActions: string[] = [];
        const wrongActions: string[] = [];
        const scoreBreakdown: { action: string; scoreChange: number; reason: string }[] = [];

        record.takenActionIds.forEach(actionId => {
            const action = caseData.actions.find(a => a.id === actionId);
            if (!action) return;

            if (action.isCorrect) {
                correctActions.push(action.name);
            } else {
                wrongActions.push(action.name);
            }

            scoreBreakdown.push({
                action: action.name,
                scoreChange: action.scoreImpact || (action.isCorrect ? 0 : -GameConstants.WRONG_ACTION_PENALTY),
                reason: action.isCorrect ? '正确决策' : (action.errorReason || '策略失误')
            });
        });

        return {
            record,
            caseData,
            errorsByStage,
            missedClues,
            correctActions,
            wrongActions,
            scoreBreakdown
        };
    }

    public getRecommendations(caseId?: string): string[] {
        const recommendations: string[] = [];
        const errorAnalysis = SaveManager.instance.getErrorAnalysis(caseId);

        if (errorAnalysis.length > 0) {
            const topError = errorAnalysis[0];
            recommendations.push(
                `建议重点加强${GameConstants.ERROR_CATEGORY_NAMES[topError.category] || topError.category}错误的学习，已累计出现${topError.count}次`
            );
        }

        const missAnalysis = SaveManager.instance.getMaterialMissAnalysis(caseId);
        if (missAnalysis.length > 0) {
            const clueName = ConfigManager.instance.getClueById(caseId || '', missAnalysis[0].clueId)?.name || '相关证据';
            recommendations.push(
                `注意材料缺页问题，建议在「${clueName}」上加强审查`
            );
        }

        if (recommendations.length === 0) {
            recommendations.push('继续保持，尝试挑战更高难度的案件！');
        }

        return recommendations;
    }

    public formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}分${remainingSeconds}秒`;
    }
}

export interface CaseAnalysisSummary {
    caseId: string;
    caseName: string;
    attempts: number;
    bestScore: number;
    avgScore: number;
    passRate: number;
    perfectRate: number;
    avgPlayTime: number;
    errorCounts: Record<GameConstants.ErrorCategory, number>;
    topMissedClues: { clueId: string; clueName: string; count: number }[];
    improvementTrend: { attempt: number; score: number; date: number }[];
}

export interface OverallStats {
    totalCases: number;
    completedCases: number;
    totalScore: number;
    avgScore: number;
    totalPlayTime: number;
    successRate: number;
    strongestCategory: GameConstants.ErrorCategory | null;
    weakestCategory: GameConstants.ErrorCategory | null;
    unlockedClients: number;
    unlockedLevels: number;
}

export interface ReviewData {
    record: ITrainingRecord;
    caseData: any;
    errorsByStage: Record<string, any[]>;
    missedClues: any[];
    correctActions: string[];
    wrongActions: string[];
    scoreBreakdown: { action: string; scoreChange: number; reason: string }[];
}
