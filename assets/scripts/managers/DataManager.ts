import { resources, JsonAsset, error, log } from 'cc';
import { LevelConfig } from '../core/LevelTypes';

export class DataManager {
  private static _instance: DataManager | null = null;
  private _levels: Map<string, LevelConfig> = new Map();
  private _loaded = false;
  private _loadPromise: Promise<void> | null = null;

  public static get instance(): DataManager {
    if (!this._instance) {
      this._instance = new DataManager();
    }
    return this._instance;
  }

  public async loadAllConfig(): Promise<void> {
    if (this._loaded) return;
    if (this._loadPromise) return this._loadPromise;

    this._loadPromise = this.doLoadAll();
    return this._loadPromise;
  }

  private async doLoadAll(): Promise<void> {
    try {
      const levelIds = await this.loadLevelIndex();
      log(`[DataManager] Found ${levelIds.length} levels`);

      for (const levelId of levelIds) {
        try {
          const levelConfig = await this.loadLevelConfig(levelId);
          if (levelConfig) {
            this._levels.set(levelId, levelConfig);
            log(`[DataManager] Loaded level: ${levelId}`);
          }
        } catch (e) {
          error(`[DataManager] Failed to load level ${levelId}:`, e);
        }
      }

      this._loaded = true;
      log(`[DataManager] All configs loaded, total ${this._levels.size} levels`);
    } catch (e) {
      error('[DataManager] Failed to load configs:', e);
      throw e;
    }
  }

  private async loadLevelIndex(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      resources.load('config/levels/index', JsonAsset, (err: Error | null, asset: JsonAsset) => {
        if (err) {
          error('[DataManager] Load level index error:', err);
          resolve([]);
          return;
        }
        const data = asset.json;
        resolve(data.levels || []);
      });
    });
  }

  private async loadLevelConfig(levelId: string): Promise<LevelConfig | null> {
    return new Promise((resolve, reject) => {
      resources.load(`config/levels/${levelId}`, JsonAsset, (err: Error | null, asset: JsonAsset) => {
        if (err) {
          error(`[DataManager] Load level ${levelId} error:`, err);
          resolve(null);
          return;
        }
        resolve(asset.json as LevelConfig);
      });
    });
  }

  public async loadTutorialIndex(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      resources.load('config/tutorials/index', JsonAsset, (err: Error | null, asset: JsonAsset) => {
        if (err) {
          error('[DataManager] Load tutorial index error:', err);
          resolve([]);
          return;
        }
        const data = asset.json;
        resolve(data.tutorials || []);
      });
    });
  }

  public async loadTutorialConfig(tutorialId: string): Promise<any | null> {
    return new Promise((resolve, reject) => {
      resources.load(`config/tutorials/${tutorialId}`, JsonAsset, (err: Error | null, asset: JsonAsset) => {
        if (err) {
          error(`[DataManager] Load tutorial ${tutorialId} error:`, err);
          resolve(null);
          return;
        }
        resolve(asset.json);
      });
    });
  }

  public getLevel(levelId: string): LevelConfig | null {
    return this._levels.get(levelId) || null;
  }

  public getAllLevels(): LevelConfig[] {
    return Array.from(this._levels.values());
  }

  public getLevelCount(): number {
    return this._levels.size;
  }

  public isLoaded(): boolean {
    return this._loaded;
  }
}
