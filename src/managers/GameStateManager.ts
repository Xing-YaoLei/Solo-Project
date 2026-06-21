import type { GameSettings, LevelConfig, LevelRecord, GameStats } from '../types';
import { DEFAULT_SETTINGS, LEVELS } from '../config/gameConfig';

export class GameStateManager {
  private static instance: GameStateManager;
  private settings: GameSettings;
  private levelRecords: Map<number, LevelRecord>;
  private currentLevel: LevelConfig | null = null;
  private lastGameStats: GameStats | null = null;
  private fromReview = false;

  private constructor() {
    this.settings = this.loadSettings();
    this.levelRecords = this.loadLevelRecords();
    this.checkUnlocks();
  }

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  private loadSettings(): GameSettings {
    try {
      const saved = localStorage.getItem('settlement_game_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.log('No saved settings found');
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    localStorage.setItem('settlement_game_settings', JSON.stringify(this.settings));
  }

  private loadLevelRecords(): Map<number, LevelRecord> {
    const records = new Map<number, LevelRecord>();
    try {
      const saved = localStorage.getItem('settlement_game_records');
      if (saved) {
        const data = JSON.parse(saved);
        data.forEach((item: LevelRecord) => {
          records.set(item.levelId, item);
        });
      }
    } catch (e) {
      console.log('No saved records found');
    }
    return records;
  }

  private saveLevelRecords(): void {
    const data = Array.from(this.levelRecords.values());
    localStorage.setItem('settlement_game_records', JSON.stringify(data));
  }

  private checkUnlocks(): void {
    LEVELS.forEach((level, index) => {
      if (index === 0) return;
      const prevLevel = LEVELS[index - 1];
      const prevRecord = this.levelRecords.get(prevLevel.id);
      if (prevRecord && prevRecord.bestScore > 0) {
        level.unlocked = true;
      }
    });
  }

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  getLevels(): LevelConfig[] {
    this.checkUnlocks();
    return LEVELS.map(l => ({ ...l }));
  }

  getLevelById(id: number): LevelConfig | undefined {
    return LEVELS.find(l => l.id === id);
  }

  setCurrentLevel(level: LevelConfig): void {
    this.currentLevel = level;
  }

  getCurrentLevel(): LevelConfig | null {
    return this.currentLevel;
  }

  setFromReview(value: boolean): void {
    this.fromReview = value;
  }

  isFromReview(): boolean {
    return this.fromReview;
  }

  saveGameStats(stats: GameStats): void {
    this.lastGameStats = stats;
    const existing = this.levelRecords.get(stats.levelId);
    const level = this.getLevelById(stats.levelId);
    
    if (!level) return;

    const accuracy = stats.totalBills > 0 ? stats.correctCount / stats.totalBills : 0;
    
    if (!existing || stats.score > existing.bestScore) {
      this.levelRecords.set(stats.levelId, {
        levelId: stats.levelId,
        levelName: level.name,
        bestScore: stats.score,
        bestCombo: Math.max(existing?.bestCombo || 0, stats.maxCombo),
        accuracy: Math.max(existing?.accuracy || 0, accuracy),
        payoutCycle: level.payoutCycle,
        playCount: (existing?.playCount || 0) + 1
      });
    } else {
      this.levelRecords.set(stats.levelId, {
        ...existing,
        bestCombo: Math.max(existing.bestCombo, stats.maxCombo),
        accuracy: Math.max(existing.accuracy, accuracy),
        playCount: existing.playCount + 1
      });
    }

    this.saveLevelRecords();
    this.checkUnlocks();
  }

  getLastGameStats(): GameStats | null {
    return this.lastGameStats;
  }

  getLevelRecord(levelId: number): LevelRecord | undefined {
    return this.levelRecords.get(levelId);
  }

  getAllRecords(): LevelRecord[] {
    return Array.from(this.levelRecords.values());
  }

  isSoundEnabled(): boolean {
    return this.settings.soundEnabled;
  }

  isVibrationEnabled(): boolean {
    return this.settings.vibrationEnabled;
  }

  isTutorialCompleted(): boolean {
    return this.settings.tutorialCompleted;
  }

  setTutorialCompleted(): void {
    this.settings.tutorialCompleted = true;
    this.saveSettings();
  }
}
