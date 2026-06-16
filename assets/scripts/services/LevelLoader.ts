import { ResourceLoader } from '../core/ResourceLoader';
import type { LevelConfig } from '../data/LevelConfig';
import { PharmacistRole } from '../data/enums/PharmacistRole';
import { Difficulty } from '../data/enums/Difficulty';
import { GameMode } from '../data/enums/GameMode';

export class LevelLoader {
    private static _instance: LevelLoader | null = null;
    private levels: LevelConfig[] = [];
    private isLoaded: boolean = false;

    public static get instance(): LevelLoader {
        if (!LevelLoader._instance) {
            LevelLoader._instance = new LevelLoader();
        }
        return LevelLoader._instance;
    }

    public async loadAllLevels(): Promise<LevelConfig[]> {
        if (this.isLoaded && this.levels.length > 0) {
            return this.levels;
        }

        const levelConfigs = await ResourceLoader.instance.loadDirJson<LevelConfig>('levels');
        this.levels = levelConfigs.filter(config => this.validateLevelConfig(config));
        this.isLoaded = true;
        return this.levels;
    }

    public async getLevelById(levelId: string): Promise<LevelConfig | null> {
        if (!this.isLoaded) {
            await this.loadAllLevels();
        }
        return this.levels.find(level => level.id === levelId) || null;
    }

    public async getLevelsByFilter(
        role?: PharmacistRole,
        difficulty?: Difficulty,
        mode?: GameMode
    ): Promise<LevelConfig[]> {
        if (!this.isLoaded) {
            await this.loadAllLevels();
        }

        return this.levels.filter(level => {
            if (role && !level.roles.includes(role)) {
                return false;
            }
            if (difficulty && level.difficulty !== difficulty) {
                return false;
            }
            if (mode === GameMode.FORMAL_TRAINING) {
                return true;
            }
            return true;
        });
    }

    public getLevels(): LevelConfig[] {
        return this.levels;
    }

    private validateLevelConfig(config: any): config is LevelConfig {
        if (!config.id || !config.name || !config.roles || !config.difficulty) {
            console.warn(`Invalid level config: missing required fields`, config);
            return false;
        }
        if (!Array.isArray(config.tasks) || config.tasks.length === 0) {
            console.warn(`Level ${config.id} has no tasks`);
            return false;
        }
        return true;
    }

    public getTotalScore(level: LevelConfig): number {
        return level.tasks.reduce((sum, task) => sum + task.score, 0);
    }

    public clearCache(): void {
        this.levels = [];
        this.isLoaded = false;
    }
}
