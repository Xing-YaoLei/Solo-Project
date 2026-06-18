import { LevelConfig } from '../core/LevelTypes';

export class DataManager {
  private static _instance: DataManager | null = null;
  private _levels: Map<string, LevelConfig> = new Map();
  private _loaded = false;

  public static get instance(): DataManager {
    if (!this._instance) {
      this._instance = new DataManager();
    }
    return this._instance;
  }

  public async loadAllConfig(): Promise<void> {
    if (this._loaded) return;

    try {
      const levelList = await this.loadLevelList();
      for (const levelId of levelList) {
        const levelConfig = await this.loadLevelConfig(levelId);
        if (levelConfig) {
          this._levels.set(levelId, levelConfig);
        }
      }
      this._loaded = true;
    } catch (e) {
      console.error('Failed to load configs:', e);
    }
  }

  private async loadLevelList(): Promise<string[]> {
    try {
      if (typeof cc !== 'undefined' && cc.resources) {
        return new Promise((resolve) => {
          cc.resources.loadDir('config/levels', cc.JsonAsset, (err, assets) => {
            if (err) {
              console.error('Load level list error:', err);
              resolve([]);
            } else {
              resolve(assets.map(a => a.name));
            }
          });
        });
      } else {
        const response = await fetch('resources/config/levels/index.json');
        const data = await response.json();
        return data.levels || [];
      }
    } catch (e) {
      console.error('Load level list failed:', e);
      return [];
    }
  }

  private async loadLevelConfig(levelId: string): Promise<LevelConfig | null> {
    try {
      if (typeof cc !== 'undefined' && cc.resources) {
        return new Promise((resolve) => {
          cc.resources.load(`config/levels/${levelId}`, cc.JsonAsset, (err, asset) => {
            if (err) {
              console.error(`Load level ${levelId} error:`, err);
              resolve(null);
            } else {
              resolve(asset.json as LevelConfig);
            }
          });
        });
      } else {
        const response = await fetch(`resources/config/levels/${levelId}.json`);
        return await response.json();
      }
    } catch (e) {
      console.error(`Load level ${levelId} failed:`, e);
      return null;
    }
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
}
