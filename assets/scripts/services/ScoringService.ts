import { _decorator } from 'cc';
import { EventBus } from '../core/EventBus';
import { GameEventType } from '../data/enums/GameEventType';
import { TaskAction } from '../data/enums/TaskAction';
import { GameMode } from '../data/enums/GameMode';
import type { TaskConfig, LevelConfig, WrongActionConfig } from '../data/LevelConfig';
import type { TaskResult } from '../data/GameState';

@ccclass('ScoringService')
export class ScoringService {
    private static _instance: ScoringService | null = null;

    public static get instance(): ScoringService {
        if (!ScoringService._instance) {
            ScoringService._instance = new ScoringService();
        }
        return ScoringService._instance;
    }

    public evaluateAction(
        task: TaskConfig,
        playerAction: TaskAction,
        timeSpent: number,
        mode: GameMode
    ): TaskResult {
        const isCorrect = playerAction === task.correctAction;
        let scoreEarned = 0;
        let wrongReason: string | undefined;
        let knowledgeExplanation: string | undefined;

        if (isCorrect) {
            scoreEarned = task.score;
            if (mode === GameMode.FORMAL_TRAINING) {
                const timeBonus = this.calculateTimeBonus(timeSpent, task.score);
                scoreEarned += timeBonus;
            }
        } else {
            const wrongConfig = this.findWrongActionConfig(task, playerAction);
            if (wrongConfig) {
                scoreEarned = Math.max(0, task.score - wrongConfig.penalty);
                wrongReason = wrongConfig.reason;
                knowledgeExplanation = wrongConfig.knowledgeExplanation;
            } else {
                scoreEarned = 0;
                wrongReason = '操作错误，请参考知识点讲解';
            }
        }

        const result: TaskResult = {
            taskId: task.id,
            playerAction,
            correctAction: task.correctAction,
            isCorrect,
            scoreEarned,
            timeSpent,
            wrongReason,
            knowledgeExplanation,
            knowledgePoint: task.knowledgePoint
        };

        EventBus.instance.emit(GameEventType.TASK_COMPLETED, result);

        return result;
    }

    private findWrongActionConfig(task: TaskConfig, action: TaskAction): WrongActionConfig | undefined {
        return task.wrongActions.find(w => w.action === action);
    }

    private calculateTimeBonus(timeSpent: number, baseScore: number): number {
        const maxBonus = Math.floor(baseScore * 0.2);
        if (timeSpent < 10) {
            return maxBonus;
        } else if (timeSpent < 20) {
            return Math.floor(maxBonus * 0.5);
        } else if (timeSpent < 30) {
            return Math.floor(maxBonus * 0.2);
        }
        return 0;
    }

    public calculateFinalScore(results: TaskResult[]): number {
        return results.reduce((sum, result) => sum + result.scoreEarned, 0);
    }

    public getCorrectCount(results: TaskResult[]): number {
        return results.filter(r => r.isCorrect).length;
    }

    public getAccuracy(results: TaskResult[]): number {
        if (results.length === 0) return 0;
        return Math.round((this.getCorrectCount(results) / results.length) * 100);
    }

    public getTotalTimeSpent(results: TaskResult[]): number {
        return results.reduce((sum, r) => sum + r.timeSpent, 0);
    }

    public getGrade(score: number, totalScore: number, passingScore: number): string {
        const percentage = (score / totalScore) * 100;
        if (percentage >= 90) return 'S';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= passingScore) return 'C';
        return 'D';
    }

    public isPassed(score: number, passingScore: number, totalTasks: number, results: TaskResult[]): boolean {
        const accuracy = this.getAccuracy(results);
        return score >= passingScore && accuracy >= 60;
    }

    public getWrongResults(results: TaskResult[]): TaskResult[] {
        return results.filter(r => !r.isCorrect);
    }

    public getKnowledgePointStats(results: TaskResult[]): Map<string, { correct: number; total: number }> {
        const stats = new Map<string, { correct: number; total: number }>();
        for (const result of results) {
            const point = result.knowledgePoint || '未分类';
            if (!stats.has(point)) {
                stats.set(point, { correct: 0, total: 0 });
            }
            const stat = stats.get(point)!;
            stat.total++;
            if (result.isCorrect) stat.correct++;
        }
        return stats;
    }
}
