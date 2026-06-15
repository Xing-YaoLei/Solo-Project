import { Singleton } from '../core/Singleton';
import { EventBus, GameEvents } from '../core/EventBus';
import { ConfigManager } from '../config/ConfigManager';
import { AnalyticsService } from './AnalyticsService';
import { AchievementConfig } from '../types';

const STORAGE_KEY = 'usg_achievements';

interface PlayerAchievement {
  id: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
}

export class AchievementService extends Singleton<AchievementService> {
  private _achievements: Map<string, PlayerAchievement> = new Map();
  private _totalGamesCompleted: number = 0;

  get achievements(): PlayerAchievement[] {
    return Array.from(this._achievements.values());
  }

  get unlockedCount(): number {
    return this.achievements.filter(a => a.unlocked).length;
  }

  get totalCount(): number {
    return this._achievements.size;
  }

  get totalGamesCompleted(): number {
    return this._totalGamesCompleted;
  }

  init(): void {
    this.load();
    EventBus.instance.on(GameEvents.GAME_END, this.onGameEnd.bind(this));
    EventBus.instance.on(GameEvents.ACHIEVEMENT_UNLOCKED, this.onAchievementUnlocked.bind(this));
  }

  private load(): void {
    const configs = ConfigManager.getInstance().achievements;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as { achievements: PlayerAchievement[]; totalGames: number };
        this._totalGamesCompleted = data.totalGames || 0;
        
        const savedMap = new Map(data.achievements.map(a => [a.id, a]));
        configs.forEach(config => {
          const saved = savedMap.get(config.id);
          this._achievements.set(config.id, saved || {
            id: config.id,
            unlocked: false,
            progress: 0,
          });
        });
      } else {
        configs.forEach(config => {
          this._achievements.set(config.id, {
            id: config.id,
            unlocked: false,
            progress: 0,
          });
        });
      }
    } catch (e) {
      console.warn('Failed to load achievements:', e);
      configs.forEach(config => {
        this._achievements.set(config.id, {
          id: config.id,
          unlocked: false,
          progress: 0,
        });
      });
    }
  }

  private save(): void {
    try {
      const data = {
        achievements: Array.from(this._achievements.values()),
        totalGames: this._totalGamesCompleted,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save achievements:', e);
    }
  }

  private onGameEnd(success: boolean, stats: { perfectSchedule?: boolean; completionTime?: number }): void {
    if (success) {
      this._totalGamesCompleted++;
      this.updateProgress('complete_n_games', this._totalGamesCompleted);
      
      if (stats.perfectSchedule) {
        this.updateProgress('perfect_schedule', 1);
      }
      
      if (stats.completionTime && stats.completionTime <= 120) {
        this.updateProgress('fast_completion', stats.completionTime);
      }
    }
    this.save();
  }

  private onAchievementUnlocked(achievementId: string): void {
    const achievement = this._achievements.get(achievementId);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = Date.now();
      AnalyticsService.getInstance().trackAchievementUnlocked(achievementId);
      this.save();
    }
  }

  updateProgress(type: string, value: number): void {
    const configs = ConfigManager.getInstance().achievements;
    
    configs.forEach(config => {
      if (config.condition.type !== type) return;
      
      const achievement = this._achievements.get(config.id);
      if (!achievement || achievement.unlocked) return;

      let shouldUnlock = false;
      
      switch (type) {
        case 'complete_n_games':
          achievement.progress = value;
          shouldUnlock = value >= config.condition.target;
          break;
        case 'perfect_schedule':
          achievement.progress = value;
          shouldUnlock = value >= config.condition.target;
          break;
        case 'fast_completion':
          achievement.progress = config.condition.target - value;
          shouldUnlock = value <= config.condition.target;
          break;
      }

      if (shouldUnlock) {
        EventBus.instance.emit(GameEvents.ACHIEVEMENT_UNLOCKED, config.id);
      }
    });
  }

  isUnlocked(achievementId: string): boolean {
    return this._achievements.get(achievementId)?.unlocked || false;
  }

  getProgress(achievementId: string): number {
    return this._achievements.get(achievementId)?.progress || 0;
  }

  getConfig(achievementId: string): AchievementConfig | undefined {
    return ConfigManager.getInstance().getAchievementConfig(achievementId);
  }

  reset(): void {
    this._totalGamesCompleted = 0;
    const configs = ConfigManager.getInstance().achievements;
    configs.forEach(config => {
      this._achievements.set(config.id, {
        id: config.id,
        unlocked: false,
        progress: 0,
      });
    });
    this.save();
  }

  destroy(): void {
    EventBus.instance.off(GameEvents.GAME_END);
    EventBus.instance.off(GameEvents.ACHIEVEMENT_UNLOCKED);
  }
}
