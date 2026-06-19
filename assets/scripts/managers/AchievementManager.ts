import { _decorator, Component } from "cc";
import { AchievementConfig } from "../models/Config";
import { GameManager } from "./GameManager";

const { ccclass } = _decorator;

interface AchievementProgress {
    configId: string;
    currentValue: number;
    unlocked: boolean;
    unlockedAt: number | null;
}

@ccclass("AchievementManager")
export class AchievementManager extends Component {
    private achievements: Map<string, AchievementProgress> = new Map();
    private configs: AchievementConfig[] = [];
    private onAchievementUnlocked: ((achievement: AchievementConfig) => void) | null = null;

    public init(configs: AchievementConfig[]): void {
        this.configs = configs;
        this.achievements.clear();

        for (const config of configs) {
            this.achievements.set(config.id, {
                configId: config.id,
                currentValue: 0,
                unlocked: false,
                unlockedAt: null
            });
        }

        this.loadProgress();
    }

    public updateProgress(conditionType: string, value: number): void {
        for (const config of this.configs) {
            if (config.conditionType !== conditionType) continue;

            const progress = this.achievements.get(config.id);
            if (!progress || progress.unlocked) continue;

            progress.currentValue = Math.max(progress.currentValue, value);

            if (progress.currentValue >= config.conditionValue) {
                progress.unlocked = true;
                progress.unlockedAt = Date.now();

                const gm = GameManager.instance;
                if (gm) {
                    gm.addRevenue(config.reward);
                }

                if (this.onAchievementUnlocked) {
                    this.onAchievementUnlocked(config);
                }
            }
        }

        this.saveProgress();
    }

    public incrementProgress(conditionType: string, delta: number = 1): void {
        for (const config of this.configs) {
            if (config.conditionType !== conditionType) continue;

            const progress = this.achievements.get(config.id);
            if (!progress || progress.unlocked) continue;

            progress.currentValue += delta;

            if (progress.currentValue >= config.conditionValue) {
                progress.unlocked = true;
                progress.unlockedAt = Date.now();

                const gm = GameManager.instance;
                if (gm) {
                    gm.addRevenue(config.reward);
                }

                if (this.onAchievementUnlocked) {
                    this.onAchievementUnlocked(config);
                }
            }
        }

        this.saveProgress();
    }

    public getProgress(achievementId: string): AchievementProgress | undefined {
        return this.achievements.get(achievementId);
    }

    public getAllProgress(): AchievementProgress[] {
        return Array.from(this.achievements.values());
    }

    public getUnlockedAchievements(): AchievementProgress[] {
        return Array.from(this.achievements.values()).filter(a => a.unlocked);
    }

    public getVisibleAchievements(): { config: AchievementConfig; progress: AchievementProgress }[] {
        const result: { config: AchievementConfig; progress: AchievementProgress }[] = [];
        for (const config of this.configs) {
            if (config.hidden) {
                const progress = this.achievements.get(config.id);
                if (progress && progress.unlocked) {
                    result.push({ config, progress });
                }
            } else {
                const progress = this.achievements.get(config.id);
                if (progress) {
                    result.push({ config, progress });
                }
            }
        }
        return result;
    }

    public setOnAchievementUnlocked(cb: (achievement: AchievementConfig) => void): void {
        this.onAchievementUnlocked = cb;
    }

    private saveProgress(): void {
        try {
            const data: Record<string, AchievementProgress> = {};
            for (const [id, progress] of this.achievements) {
                data[id] = progress;
            }
            localStorage.setItem("inn_manager_achievements", JSON.stringify(data));
        } catch (e) {
            console.warn("Failed to save achievements:", e);
        }
    }

    private loadProgress(): void {
        try {
            const saved = localStorage.getItem("inn_manager_achievements");
            if (saved) {
                const data = JSON.parse(saved) as Record<string, AchievementProgress>;
                for (const [id, progress] of Object.entries(data)) {
                    if (this.achievements.has(id)) {
                        this.achievements.set(id, progress);
                    }
                }
            }
        } catch (e) {
            console.warn("Failed to load achievements:", e);
        }
    }

    public reset(): void {
        this.achievements.clear();
        this.configs = [];
    }
}
