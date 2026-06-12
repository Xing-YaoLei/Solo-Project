import { EventManager, GameEvents } from '../core/EventManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { AchievementConfig, AchievementCondition, PlayerAchievement, AchievementType } from '../models/Achievement';

export class AchievementManager {
    private static _instance: AchievementManager | null = null;

    private _playerAchievements: Map<string, PlayerAchievement> = new Map();

    public static getInstance(): AchievementManager {
        if (!this._instance) {
            this._instance = new AchievementManager();
        }
        return this._instance;
    }

    public loadProgress(progress: Record<string, { progress: number; unlocked: boolean; unlockedTime?: number }>): void {
        for (const [id, data] of Object.entries(progress)) {
            this._playerAchievements.set(id, {
                achievementId: id,
                progress: data.progress,
                isUnlocked: data.unlocked,
                unlockedTime: data.unlockedTime || 0
            });
        }
    }

    public checkAllAchievements(gameData: any): string[] {
        const newlyUnlocked: string[] = [];
        const achievements = ConfigManager.getInstance().getListConfig<AchievementConfig>(ConfigKeys.ACHIEVEMENTS);

        for (const achievement of achievements) {
            if (this.isUnlocked(achievement.id)) continue;

            const progress = this.calculateProgress(achievement.conditions, gameData);
            this.setProgress(achievement.id, progress);

            if (this.isConditionMet(achievement.conditions, gameData)) {
                this.unlock(achievement.id);
                newlyUnlocked.push(achievement.id);
            }
        }

        return newlyUnlocked;
    }

    private calculateProgress(conditions: AchievementCondition[], gameData: any): number {
        let totalProgress = 0;
        let count = 0;

        for (const condition of conditions) {
            const target = this.getTargetValue(condition);
            const current = this.getCurrentValue(condition, gameData);
            if (target > 0) {
                totalProgress += Math.min(1, current / target);
            }
            count++;
        }

        return count > 0 ? totalProgress / count : 0;
    }

    private isConditionMet(conditions: AchievementCondition[], gameData: any): boolean {
        for (const condition of conditions) {
            const target = this.getTargetValue(condition);
            const current = this.getCurrentValue(condition, gameData);
            if (current < target) return false;
        }
        return true;
    }

    private getTargetValue(condition: AchievementCondition): number {
        return Number(condition.params.target) || 0;
    }

    private getCurrentValue(condition: AchievementCondition, gameData: any): number {
        switch (condition.type) {
            case AchievementType.COMPLETE_LEVEL:
                return gameData?.levelsCompleted || 0;
            case AchievementType.PERFECT_INVENTORY:
                return gameData?.perfectInventoryCount || 0;
            case AchievementType.COST_SAVER:
                return gameData?.totalSpent ? Math.max(0, 100000 - gameData.totalSpent) : 0;
            case AchievementType.NO_SHORTAGE:
                return gameData?.shortageCount === 0 ? 1 : 0;
            case AchievementType.HIGH_TURNOVER:
                return gameData?.averageTurnoverDays ? Math.max(0, 30 - gameData.averageTurnoverDays) : 0;
            case AchievementType.SPEED_DELIVERY:
                return gameData?.fastestLevelCompletionTime ? Math.max(0, 600 - gameData.fastestLevelCompletionTime) : 0;
            case AchievementType.VETERAN:
                return gameData?.levelsCompleted || 0;
            default:
                return 0;
        }
    }

    public setProgress(achievementId: string, progress: number): void {
        let pa = this._playerAchievements.get(achievementId);
        if (!pa) {
            pa = {
                achievementId,
                progress: 0,
                isUnlocked: false,
                unlockedTime: 0
            };
            this._playerAchievements.set(achievementId, pa);
        }

        if (pa && pa.progress !== progress && !pa.isUnlocked) {
            pa.progress = progress;
            EventManager.getInstance().emit(GameEvents.ACHIEVEMENT_PROGRESS, {
                achievementId,
                progress
            });
        }
    }

    public unlock(achievementId: string): void {
        const pa = this._playerAchievements.get(achievementId);
        if (!pa) return;
        if (pa.isUnlocked) return;

        pa.isUnlocked = true;
        pa.unlockedTime = Date.now();
        pa.progress = 1;

        EventManager.getInstance().emit(GameEvents.ACHIEVEMENT_UNLOCKED, achievementId);
    }

    public isUnlocked(achievementId: string): boolean {
        const pa = this._playerAchievements.get(achievementId);
        return pa?.isUnlocked || false;
    }

    public getProgress(achievementId: string): number {
        const pa = this._playerAchievements.get(achievementId);
        return pa?.progress || 0;
    }

    public getPlayerAchievements(): PlayerAchievement[] {
        return Array.from(this._playerAchievements.values());
    }

    public getUnlockedAchievements(): PlayerAchievement[] {
        return this.getPlayerAchievements().filter(a => a.isUnlocked);
    }

    public reset(): void {
        this._playerAchievements.clear();
    }
}
