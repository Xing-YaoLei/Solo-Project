import { Singleton } from '../core/Singleton';
import { GameConfig, DifficultyLevel, DifficultyConfig, ItemConfig, AchievementConfig, AnalyticsConfig } from '../types';

export class ConfigManager extends Singleton<ConfigManager> {
  private _config: GameConfig | null = null;
  private _currentDifficulty: DifficultyLevel = 'normal';

  get config(): GameConfig {
    if (!this._config) {
      this._config = this.loadDefaultConfig();
    }
    return this._config;
  }

  get currentDifficulty(): DifficultyLevel {
    return this._currentDifficulty;
  }

  set currentDifficulty(level: DifficultyLevel) {
    this._currentDifficulty = level;
  }

  get difficultyConfig(): DifficultyConfig {
    return this.getDifficultyConfig(this._currentDifficulty);
  }

  get items(): ItemConfig[] {
    return this.config.items;
  }

  get achievements(): AchievementConfig[] {
    return this.config.achievements;
  }

  get analyticsConfig(): AnalyticsConfig {
    return this.config.analytics;
  }

  private loadDefaultConfig(): GameConfig {
    return {
      difficulty: this.getDifficultyConfig(this._currentDifficulty),
      items: this.getDefaultItems(),
      achievements: this.getDefaultAchievements(),
      analytics: this.getDefaultAnalytics(),
    };
  }

  getDifficultyConfig(level: DifficultyLevel): DifficultyConfig {
    const configs: Record<DifficultyLevel, DifficultyConfig> = {
      easy: {
        level: 'easy',
        timeLimit: 600,
        studentCount: 5,
        courseCount: 8,
        conflictFrequency: 0.1,
        minSatisfaction: 60,
      },
      normal: {
        level: 'normal',
        timeLimit: 480,
        studentCount: 8,
        courseCount: 12,
        conflictFrequency: 0.25,
        minSatisfaction: 75,
      },
      hard: {
        level: 'hard',
        timeLimit: 360,
        studentCount: 12,
        courseCount: 16,
        conflictFrequency: 0.4,
        minSatisfaction: 85,
      },
    };
    return configs[level];
  }

  private getDefaultItems(): ItemConfig[] {
    return [
      {
        id: 'time_extender',
        name: '时间延长',
        description: '增加60秒游戏时间',
        icon: 'icon_clock',
        cooldown: 120,
        effect: { type: 'extend_time', value: 60 },
      },
      {
        id: 'conflict_resolver',
        name: '冲突解决',
        description: '立即解决当前所有冲突',
        icon: 'icon_fix',
        cooldown: 180,
        effect: { type: 'resolve_conflict', value: 1 },
      },
      {
        id: 'satisfaction_boost',
        name: '满意度提升',
        description: '临时提升学生满意度10%',
        icon: 'icon_heart',
        cooldown: 90,
        effect: { type: 'boost_satisfaction', value: 10 },
      },
      {
        id: 'preference_reveal',
        name: '偏好揭示',
        description: '显示所有学生的选课偏好',
        icon: 'icon_eye',
        cooldown: 150,
        effect: { type: 'reveal_preference', value: 1 },
      },
    ];
  }

  private getDefaultAchievements(): AchievementConfig[] {
    return [
      {
        id: 'first_game',
        name: '初次排课',
        description: '完成第一局游戏',
        icon: 'achievement_first',
        condition: { type: 'complete_n_games', target: 1 },
        reward: 100,
      },
      {
        id: 'perfect_schedule',
        name: '完美排课',
        description: '完成一局零冲突的排课',
        icon: 'achievement_perfect',
        condition: { type: 'perfect_schedule', target: 1 },
        reward: 500,
      },
      {
        id: 'speed_demon',
        name: '极速排课',
        description: '在2分钟内完成一局游戏',
        icon: 'achievement_speed',
        condition: { type: 'fast_completion', target: 120 },
        reward: 300,
      },
      {
        id: 'veteran',
        name: '排课老手',
        description: '累计完成10局游戏',
        icon: 'achievement_veteran',
        condition: { type: 'complete_n_games', target: 10 },
        reward: 1000,
      },
    ];
  }

  private getDefaultAnalytics(): AnalyticsConfig {
    return {
      enabled: true,
      events: [
        'game_start',
        'game_end',
        'course_placed',
        'course_removed',
        'conflict_occurred',
        'conflict_resolved',
        'item_used',
        'achievement_unlocked',
      ],
    };
  }

  getItemConfig(itemId: string): ItemConfig | undefined {
    return this.items.find(item => item.id === itemId);
  }

  getAchievementConfig(achievementId: string): AchievementConfig | undefined {
    return this.achievements.find(a => a.id === achievementId);
  }
}
