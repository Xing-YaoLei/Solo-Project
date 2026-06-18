import { Level, LevelGroup, Position, GameMode } from '../models';
import { sampleLevels } from '../data/sampleLevels';

export class LevelManager {
  private levels: Level[] = [];
  private levelGroups: LevelGroup[] = [];

  constructor() {
    this.initializeLevels();
  }

  private initializeLevels(): void {
    this.levels = sampleLevels;
    this.levelGroups = this.buildLevelGroups();
  }

  private buildLevelGroups(): LevelGroup[] {
    const groups: LevelGroup[] = [];
    const positions: Position[] = ['过户专员', '金融专员', '评估师', '综合岗位'];

    positions.forEach((position) => {
      const positionLevels = this.levels.filter((l) => l.position === position);
      if (positionLevels.length > 0) {
        groups.push({
          id: `group_${position}`,
          position,
          name: `${position}关卡`,
          description: `针对${position}岗位设计的过户流程培训关卡`,
          levels: positionLevels
        });
      }
    });

    return groups;
  }

  getAllLevels(): Level[] {
    return this.levels;
  }

  getLevelGroups(): LevelGroup[] {
    return this.levelGroups;
  }

  getLevelsByPosition(position: Position): Level[] {
    return this.levels.filter((l) => l.position === position);
  }

  getLevelById(id: string): Level | undefined {
    return this.levels.find((l) => l.id === id);
  }

  getLevelsByDifficulty(min: number, max: number): Level[] {
    return this.levels.filter((l) => l.difficulty >= min && l.difficulty <= max);
  }

  getLevelsWithMissingMaterials(): Level[] {
    return this.levels.filter((l) => l.hasMissingMaterials);
  }

  filterLevels(options: {
    position?: Position;
    mode?: GameMode;
    difficulty?: number;
    hasMissingMaterials?: boolean;
  }): Level[] {
    return this.levels.filter((level) => {
      if (options.position && level.position !== options.position) return false;
      if (options.difficulty && level.difficulty !== options.difficulty) return false;
      if (options.hasMissingMaterials !== undefined && level.hasMissingMaterials !== options.hasMissingMaterials) return false;
      return true;
    });
  }

  getRandomLevel(position?: Position): Level {
    let pool = this.levels;
    if (position) {
      pool = this.getLevelsByPosition(position);
    }
    if (pool.length === 0) pool = this.levels;
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
