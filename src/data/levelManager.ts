import type { LevelConfig } from '../types';

import level1 from './levels/level1.json';
import level2 from './levels/level2.json';

const levelModules: Record<string, LevelConfig> = {
  'level-001': level1 as LevelConfig,
  'level-002': level2 as LevelConfig,
};

export const levelManager = {
  getAllLevels(): LevelConfig[] {
    return Object.values(levelModules);
  },

  getLevelById(id: string): LevelConfig | undefined {
    return levelModules[id];
  },

  getLevelIds(): string[] {
    return Object.keys(levelModules);
  },

  getLevelsByDifficulty(difficulty: number): LevelConfig[] {
    return this.getAllLevels().filter(level => level.difficulty === difficulty);
  },

  async loadLevel(id: string): Promise<LevelConfig> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const level = this.getLevelById(id);
        if (level) {
          resolve(level);
        } else {
          reject(new Error(`Level ${id} not found`));
        }
      }, 300);
    });
  },

  registerLevel(id: string, config: LevelConfig): void {
    levelModules[id] = config;
  },

  registerLevels(configs: LevelConfig[]): void {
    configs.forEach(config => {
      this.registerLevel(config.id, config);
    });
  },
};

export default levelManager;
