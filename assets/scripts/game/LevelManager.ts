import { EventManager, GameEvents } from '../core/EventManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { LevelConfig, LevelObjective } from '../models/Level';
import { GameStats, LevelResult } from '../models/GameStats';

export class LevelManager {
    private static _instance: LevelManager | null = null;

    private _currentLevel: LevelConfig | null = null;
    private _objectiveProgress: Map<string, number> = new Map();
    private _unlockedLevels: Set<string> = new Set();
    private _highScores: Map<string, number> = new Map();

    public static getInstance(): LevelManager {
        if (!this._instance) {
            this._instance = new LevelManager();
        }
        return this._instance;
    }

    public getAvailableLevels(): LevelConfig[] {
        const allLevels = ConfigManager.getInstance().getListConfig<LevelConfig>(ConfigKeys.LEVELS);
        return allLevels.sort((a, b) => a.difficulty - b.difficulty);
    }

    public isLevelUnlocked(levelId: string): boolean {
        if (this._unlockedLevels.has(levelId)) return true;

        const level = ConfigManager.getInstance().findById<LevelConfig>(ConfigKeys.LEVELS, levelId);
        if (!level) return false;

        if (level.unlockConditions.length === 0) return true;

        for (const condition of level.unlockConditions) {
            if (!this._unlockedLevels.has(condition)) return false;
        }

        return true;
    }

    public startLevel(levelId: string): boolean {
        const level = ConfigManager.getInstance().findById<LevelConfig>(ConfigKeys.LEVELS, levelId);
        if (!level) return false;
        if (!this.isLevelUnlocked(levelId)) return false;

        this._currentLevel = level;
        this._objectiveProgress.clear();

        for (const obj of level.objectives) {
            this._objectiveProgress.set(obj.id, 0);
        }

        return true;
    }

    public updateObjectiveProgress(objectiveId: string, value: number): void {
        if (this._objectiveProgress.has(objectiveId)) {
            this._objectiveProgress.set(objectiveId, value);
            EventManager.getInstance().emit(GameEvents.LEVEL_OBJECTIVE_PROGRESS, {
                objectiveId,
                value
            });
        }
    }

    public getObjectiveProgress(objectiveId: string): number {
        return this._objectiveProgress.get(objectiveId) || 0;
    }

    public evaluateLevel(stats: GameStats): { isPassed: boolean; totalScore: number; objectiveScores: Record<string, number> } {
        if (!this._currentLevel) {
            return { isPassed: false, totalScore: 0, objectiveScores: {} };
        }

        const objectiveScores: Record<string, number> = {};
        let totalScore = 0;
        let totalWeight = 0;
        let allPassed = true;

        for (const obj of this._currentLevel.objectives) {
            totalWeight += obj.weight;
            const progress = this._objectiveProgress.get(obj.id) || 0;
            const ratio = Math.min(1, progress / obj.targetValue);
            const score = Math.floor(ratio * 100 * obj.weight);

            objectiveScores[obj.id] = score;
            totalScore += score;

            if (ratio < 0.6) {
                allPassed = false;
            }
        }

        totalScore = totalWeight > 0 ? Math.floor(totalScore / totalWeight) : 0;

        return { isPassed: allPassed, totalScore, objectiveScores };
    }

    public completeLevel(result: LevelResult): void {
        if (result.isPassed) {
            this._unlockedLevels.add(result.levelId);

            const currentHigh = this._highScores.get(result.levelId) || 0;
            if (result.totalScore > currentHigh) {
                this._highScores.set(result.levelId, result.totalScore);
            }

            const allLevels = ConfigManager.getInstance().getListConfig<LevelConfig>(ConfigKeys.LEVELS);
            for (const level of allLevels) {
                if (level.unlockConditions.includes(result.levelId)) {
                    if (this.isLevelUnlocked(level.id)) {
                        this._unlockedLevels.add(level.id);
                    }
                }
            }

            EventManager.getInstance().emit(GameEvents.LEVEL_COMPLETED, result);
        }
    }

    public getCurrentLevel(): LevelConfig | null {
        return this._currentLevel;
    }

    public getHighScore(levelId: string): number {
        return this._highScores.get(levelId) || 0;
    }

    public reset(): void {
        this._currentLevel = null;
        this._objectiveProgress.clear();
    }
}
