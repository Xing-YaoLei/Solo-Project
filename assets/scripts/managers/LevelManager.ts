import { StorageManager } from '../utils/StorageManager';
import { LevelProgress } from '../core/LevelTypes';

export class LevelManager {
  private static _instance: LevelManager | null = null;
  private _progress: Map<string, LevelProgress> = new Map();
  private _unlockedLevels: string[] = [];
  private _inited = false;

  public static get instance(): LevelManager {
    if (!this._instance) {
      this._instance = new LevelManager();
    }
    return this._instance;
  }

  public init(): void {
    if (this._inited) return;
    this._inited = true;

    const savedProgress = StorageManager.instance.load<Record<string, LevelProgress>>('level_progress', {});
    for (const levelId in savedProgress) {
      this._progress.set(levelId, savedProgress[levelId]);
    }

    this._unlockedLevels = StorageManager.instance.load<string[]>('unlocked_levels', ['level_001']);
  }

  public save(): void {
    const progressObj: Record<string, LevelProgress> = {};
    this._progress.forEach((value, key) => {
      progressObj[key] = value;
    });
    StorageManager.instance.save('level_progress', progressObj);
    StorageManager.instance.save('unlocked_levels', this._unlockedLevels);
  }

  public isLevelUnlocked(levelId: string): boolean {
    return this._unlockedLevels.includes(levelId);
  }

  public unlockLevel(levelId: string): void {
    if (!this._unlockedLevels.includes(levelId)) {
      this._unlockedLevels.push(levelId);
      this.save();
    }
  }

  public getUnlockedLevels(): string[] {
    return [...this._unlockedLevels];
  }

  public getLevelProgress(levelId: string): LevelProgress | null {
    return this._progress.get(levelId) || null;
  }

  public updateLevelProgress(
    levelId: string,
    score: number,
    time: number,
    isVictory: boolean
  ): LevelProgress {
    let progress = this._progress.get(levelId);
    if (!progress) {
      progress = {
        levelId,
        bestScore: 0,
        bestTime: 999999,
        stars: 0,
        completed: false,
        attempts: 0,
      };
    }

    progress.attempts++;
    if (score > progress.bestScore) {
      progress.bestScore = score;
    }
    if (isVictory && time < progress.bestTime) {
      progress.bestTime = time;
    }
    if (isVictory) {
      progress.completed = true;
    }

    this._progress.set(levelId, progress);
    this.save();

    return progress;
  }

  public calculateStars(score: number, thresholds: number[]): number {
    let stars = 0;
    for (const threshold of thresholds) {
      if (score >= threshold) {
        stars++;
      }
    }
    return stars;
  }

  public resetProgress(): void {
    this._progress.clear();
    this._unlockedLevels = ['level_001'];
    this.save();
  }
}
