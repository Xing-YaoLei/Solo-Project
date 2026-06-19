export interface AchievementCondition {
    type: "accuracy" | "speed" | "streak" | "total_complete" | "no_rework";
    threshold: number;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    condition: AchievementCondition;
    isUnlocked: boolean;
    unlockedAt: number | null;
}

interface AchievementStats {
    accuracy: number;
    timeUsed: number;
    streak: number;
    totalCompleted: number;
    reworkCount: number;
}

export class AchievementManager {
    private static _instance: AchievementManager | null = null;
    private _achievements: Map<string, Achievement> = new Map();

    static getInstance(): AchievementManager {
        if (!AchievementManager._instance) {
            AchievementManager._instance = new AchievementManager();
        }
        return AchievementManager._instance;
    }

    registerAchievement(achievement: Achievement): void {
        this._achievements.set(achievement.id, achievement);
    }

    checkAchievements(stats: AchievementStats): string[] {
        const newlyUnlocked: string[] = [];

        for (const achievement of this._achievements.values()) {
            if (achievement.isUnlocked) continue;

            const met = this._evaluateCondition(achievement.condition, stats);
            if (met) {
                achievement.isUnlocked = true;
                achievement.unlockedAt = Date.now();
                newlyUnlocked.push(achievement.id);
            }
        }

        return newlyUnlocked;
    }

    isUnlocked(id: string): boolean {
        return this._achievements.get(id)?.isUnlocked ?? false;
    }

    getAllAchievements(): Achievement[] {
        return Array.from(this._achievements.values());
    }

    getUnlockedCount(): number {
        let count = 0;
        for (const achievement of this._achievements.values()) {
            if (achievement.isUnlocked) count++;
        }
        return count;
    }

    loadFromData(data: { id: string; isUnlocked: boolean; unlockedAt: number | null }[]): void {
        for (const entry of data) {
            const achievement = this._achievements.get(entry.id);
            if (achievement) {
                achievement.isUnlocked = entry.isUnlocked;
                achievement.unlockedAt = entry.unlockedAt;
            }
        }
    }

    serialize(): object {
        const result: { id: string; isUnlocked: boolean; unlockedAt: number | null }[] = [];
        for (const achievement of this._achievements.values()) {
            result.push({
                id: achievement.id,
                isUnlocked: achievement.isUnlocked,
                unlockedAt: achievement.unlockedAt,
            });
        }
        return { achievements: result };
    }

    private _evaluateCondition(condition: AchievementCondition, stats: AchievementStats): boolean {
        switch (condition.type) {
            case "accuracy":
                return stats.accuracy >= condition.threshold;
            case "speed":
                return stats.timeUsed <= condition.threshold;
            case "streak":
                return stats.streak >= condition.threshold;
            case "total_complete":
                return stats.totalCompleted >= condition.threshold;
            case "no_rework":
                return stats.reworkCount <= condition.threshold;
            default:
                return false;
        }
    }
}
