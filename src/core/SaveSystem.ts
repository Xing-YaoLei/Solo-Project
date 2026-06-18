import type { PlayerSave, GameSettings, TrainingRecord } from '../models';
import { eventBus, GameEvent } from './EventBus';
import { configManager } from './ConfigManager';

const STORAGE_KEYS = {
  SAVE: 'renovation_game_save_v1',
  RECORDS: 'renovation_game_records_v1',
} as const;

const SAVE_VERSION = 1;

interface SaveMetadata {
  version: number;
  createdAt: number;
  updatedAt: number;
  checksum: string;
}

interface SaveData<T> {
  metadata: SaveMetadata;
  data: T;
}

interface SaveSlot {
  id: number;
  name: string;
  timestamp: number;
  data: PlayerSave;
}

export class SaveSystem {
  private static instance: SaveSystem | null = null;
  private autoSaveTimer: number | null = null;
  private autoSaveInterval = 30000;
  private currentSave: PlayerSave | null = null;

  static getInstance(): SaveSystem {
    if (!SaveSystem.instance) {
      SaveSystem.instance = new SaveSystem();
    }
    return SaveSystem.instance;
  }

  private constructor() {}

  init(defaultSettings: GameSettings): void {
    this.load(defaultSettings);
    this.startAutoSave();
    this.autoSaveInterval = this.getAutoSaveInterval();
  }

  load(defaultSettings: GameSettings): PlayerSave {
    try {
      const savedData = localStorage.getItem(STORAGE_KEYS.SAVE);
      
      if (savedData) {
        const parsed = JSON.parse(savedData) as SaveData<PlayerSave>;
        
        if (this.validateSaveData(parsed)) {
          this.currentSave = this.migrateSaveData(parsed);
          this.currentSave.lastPlayed = Date.now();
          return this.currentSave;
        }
      }
    } catch (error) {
      console.error('[SaveSystem] Failed to load save:', error);
    }
    
    this.currentSave = this.createNewSave(defaultSettings);
    return this.currentSave;
  }

  save(): boolean {
    if (!this.currentSave) return false;
    
    try {
      this.currentSave.lastPlayed = Date.now();
      
      const saveData: SaveData<PlayerSave> = {
        metadata: {
          version: SAVE_VERSION,
          createdAt: this.currentSave.lastPlayed,
          updatedAt: Date.now(),
          checksum: this.generateChecksum(this.currentSave),
        },
        data: this.currentSave,
      };
      
      localStorage.setItem(STORAGE_KEYS.SAVE, JSON.stringify(saveData));
      eventBus.emit(GameEvent.SETTINGS_CHANGED, this.currentSave.settings);
      return true;
    } catch (error) {
      console.error('[SaveSystem] Failed to save:', error);
      return false;
    }
  }

  getCurrentSave(): PlayerSave | null {
    return this.currentSave;
  }

  updateSettings(settings: Partial<GameSettings>): void {
    if (!this.currentSave) return;
    
    this.currentSave.settings = {
      ...this.currentSave.settings,
      ...settings,
    };
    
    this.save();
  }

  getSettings(): GameSettings | null {
    return this.currentSave?.settings || null;
  }

  addCompletedTask(taskId: string): void {
    if (!this.currentSave) return;
    
    if (!this.currentSave.completedTasks.includes(taskId)) {
      this.currentSave.completedTasks.push(taskId);
    }
  }

  unlockLevel(levelId: string): void {
    if (!this.currentSave) return;
    
    if (!this.currentSave.unlockedLevels.includes(levelId)) {
      this.currentSave.unlockedLevels.push(levelId);
    }
  }

  addActiveTask(taskId: string): void {
    if (!this.currentSave) return;
    
    if (!this.currentSave.activeTasks.includes(taskId)) {
      this.currentSave.activeTasks.push(taskId);
    }
    this.save();
  }

  addScore(points: number): void {
    if (!this.currentSave) return;
    this.currentSave.totalScore += points;
    eventBus.emit(GameEvent.SCORE_UPDATED, this.currentSave.totalScore);
  }

  updatePlayerScore(score: number): void {
    if (!this.currentSave) return;
    this.currentSave.totalScore += score;
    eventBus.emit(GameEvent.SCORE_UPDATED, this.currentSave.totalScore);
    this.save();
  }

  unlockNextLevel(currentLevelId: string): void {
    if (!this.currentSave) return;

    if (!this.currentSave.completedLevels.includes(currentLevelId)) {
      this.currentSave.completedLevels.push(currentLevelId);
    }

    const allLevels = Object.values(configManager.getAllLevels() || {});
    const currentIndex = allLevels.findIndex((l) => l.id === currentLevelId);

    if (currentIndex >= 0 && currentIndex < allLevels.length - 1) {
      const nextLevel = allLevels[currentIndex + 1];
      if (!this.currentSave.unlockedLevels.includes(nextLevel.id)) {
        this.currentSave.unlockedLevels.push(nextLevel.id);
      }
    }

    this.save();
  }

  setTutorialCompleted(completed: boolean): void {
    if (!this.currentSave) return;
    this.currentSave.tutorialCompleted = completed;
    this.save();
  }

  updateBestRecord(record: TrainingRecord): boolean {
    if (!this.currentSave) return false;
    
    const key = `${record.taskId}_${record.levelId}`;
    const existing = this.currentSave.bestRecords[key];
    
    if (!existing || record.score > existing.score) {
      this.currentSave.bestRecords[key] = record;
      return true;
    }
    
    return false;
  }

  getBestRecord(taskId: string, levelId: string): TrainingRecord | null {
    if (!this.currentSave) return null;
    const key = `${taskId}_${levelId}`;
    return this.currentSave.bestRecords[key] || null;
  }

  saveTrainingRecord(record: TrainingRecord): boolean {
    try {
      const records = this.loadTrainingRecords();
      records.push(record);
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
      return true;
    } catch (error) {
      console.error('[SaveSystem] Failed to save training record:', error);
      return false;
    }
  }

  loadTrainingRecords(): TrainingRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[SaveSystem] Failed to load training records:', error);
      return [];
    }
  }

  getTrainingRecordsByLevel(levelId: string): TrainingRecord[] {
    return this.loadTrainingRecords().filter(r => r.levelId === levelId);
  }

  getTrainingRecordsByTask(taskId: string): TrainingRecord[] {
    return this.loadTrainingRecords().filter(r => r.taskId === taskId);
  }

  clearTrainingRecords(): void {
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
  }

  saveToSlot(slotId: number, slotName?: string): boolean {
    if (!this.currentSave) return false;
    
    try {
      const slots = this.loadSaveSlots();
      const slot: SaveSlot = {
        id: slotId,
        name: slotName || `存档 ${slotId + 1}`,
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(this.currentSave)),
      };
      
      const existingIndex = slots.findIndex(s => s.id === slotId);
      if (existingIndex >= 0) {
        slots[existingIndex] = slot;
      } else {
        slots.push(slot);
        slots.sort((a, b) => a.id - b.id);
      }
      
      localStorage.setItem(`${STORAGE_KEYS.SAVE}_slots`, JSON.stringify(slots));
      return true;
    } catch (error) {
      console.error('[SaveSystem] Failed to save to slot:', error);
      return false;
    }
  }

  loadFromSlot(slotId: number): boolean {
    try {
      const slots = this.loadSaveSlots();
      const slot = slots.find(s => s.id === slotId);
      
      if (!slot) return false;
      
      this.currentSave = slot.data;
      this.save();
      return true;
    } catch (error) {
      console.error('[SaveSystem] Failed to load from slot:', error);
      return false;
    }
  }

  loadSaveSlots(): SaveSlot[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.SAVE}_slots`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[SaveSystem] Failed to load save slots:', error);
      return [];
    }
  }

  deleteSaveSlot(slotId: number): boolean {
    try {
      const slots = this.loadSaveSlots().filter(s => s.id !== slotId);
      localStorage.setItem(`${STORAGE_KEYS.SAVE}_slots`, JSON.stringify(slots));
      return true;
    } catch (error) {
      console.error('[SaveSystem] Failed to delete save slot:', error);
      return false;
    }
  }

  exportSave(): string | null {
    if (!this.currentSave) return null;
    
    try {
      const exportData = {
        save: this.currentSave,
        records: this.loadTrainingRecords(),
        exportedAt: Date.now(),
      };
      return btoa(JSON.stringify(exportData));
    } catch (error) {
      console.error('[SaveSystem] Failed to export save:', error);
      return null;
    }
  }

  importSave(encodedData: string): boolean {
    try {
      const decoded = JSON.parse(atob(encodedData));
      
      if (!decoded.save || !this.validateSaveData({ metadata: { version: SAVE_VERSION, createdAt: 0, updatedAt: 0, checksum: '' }, data: decoded.save })) {
        throw new Error('Invalid save data');
      }
      
      this.currentSave = decoded.save;
      this.save();
      
      if (decoded.records && Array.isArray(decoded.records)) {
        localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(decoded.records));
      }
      
      return true;
    } catch (error) {
      console.error('[SaveSystem] Failed to import save:', error);
      return false;
    }
  }

  reset(): boolean {
    try {
      this.stopAutoSave();
      localStorage.removeItem(STORAGE_KEYS.SAVE);
      localStorage.removeItem(STORAGE_KEYS.RECORDS);
      localStorage.removeItem(`${STORAGE_KEYS.SAVE}_slots`);
      this.currentSave = null;
      return true;
    } catch (error) {
      console.error('[SaveSystem] Failed to reset:', error);
      return false;
    }
  }

  hasSaveData(): boolean {
    return localStorage.getItem(STORAGE_KEYS.SAVE) !== null;
  }

  getStorageUsage(): { used: number; quota: number } {
    let used = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }
    
    return {
      used,
      quota: 5 * 1024 * 1024,
    };
  }

  startAutoSave(): void {
    this.stopAutoSave();
    this.autoSaveTimer = window.setInterval(() => {
      this.save();
    }, this.autoSaveInterval);
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  private createNewSave(defaultSettings: GameSettings): PlayerSave {
    return {
      playerName: '玩家',
      totalScore: 0,
      completedTasks: [],
      unlockedLevels: ['level_001'],
      completedLevels: [],
      activeTasks: [],
      tutorialCompleted: false,
      bestRecords: {},
      settings: { ...defaultSettings },
      lastPlayed: Date.now(),
    };
  }

  private validateSaveData(parsed: SaveData<PlayerSave>): boolean {
    if (!parsed || !parsed.data || !parsed.metadata) return false;
    if (typeof parsed.data !== 'object') return false;
    if (!('playerName' in parsed.data)) return false;
    if (!('settings' in parsed.data)) return false;
    
    const calculatedChecksum = this.generateChecksum(parsed.data);
    if (parsed.metadata.checksum && parsed.metadata.checksum !== calculatedChecksum) {
      console.warn('[SaveSystem] Checksum mismatch, save data may be corrupted');
    }
    
    return true;
  }

  private migrateSaveData(parsed: SaveData<PlayerSave>): PlayerSave {
    const savedVersion = parsed.metadata.version || 1;
    
    if (savedVersion < SAVE_VERSION) {
      console.log(`[SaveSystem] Migrating save from version ${savedVersion} to ${SAVE_VERSION}`);
    }
    
    return parsed.data;
  }

  private generateChecksum(data: PlayerSave): string {
    const str = `${data.playerName}_${data.totalScore}_${data.lastPlayed}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private getAutoSaveInterval(): number {
    return this.currentSave?.settings.difficulty === 'hard' ? 15000 : 30000;
  }
}

export const saveSystem = SaveSystem.getInstance();
