import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameSettings, LevelRecord, LevelConfig, GameStats, TextbookItem, Slot } from '@/types/game';

interface GameStore {
  settings: GameSettings;
  levelRecords: LevelRecord[];
  currentLevel: LevelConfig | null;
  currentStats: GameStats | null;
  lastCompletedStats: GameStats | null;

  setSettings: (settings: Partial<GameSettings>) => void;
  resetSettings: () => void;

  setCurrentLevel: (level: LevelConfig | null) => void;
  setCurrentStats: (stats: GameStats | null) => void;
  setLastCompletedStats: (stats: GameStats | null) => void;

  recordLevelResult: (levelId: string, levelName: string, mode: 'formal' | 'free', stats: GameStats) => void;
  clearRecords: () => void;

  getLevelRecord: (levelId: string) => LevelRecord | undefined;
  getRecordsByMode: (mode: 'formal' | 'free') => LevelRecord[];
}

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: false,
  soundVolume: 0.5,
  vibrationEnabled: false,
  animationIntensity: 'medium',
  showHints: true,
};

const createInitialStats = (): GameStats => ({
  totalAttempts: 0,
  correctCount: 0,
  wrongCount: 0,
  currentCombo: 0,
  maxCombo: 0,
  totalTime: 0,
  timeRemaining: 0,
  score: 0,
  timeBonus: 0,
  accuracyBonus: 0,
  comboBonus: 0,
  completionRate: 0,
  completed: false,
  passed: false,
});

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      levelRecords: [],
      currentLevel: null,
      currentStats: null,
      lastCompletedStats: null,

      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () =>
        set({
          settings: DEFAULT_SETTINGS,
        }),

      setCurrentLevel: (level) =>
        set({
          currentLevel: level,
          currentStats: level ? createInitialStats() : null,
        }),

      setCurrentStats: (stats) => set({ currentStats: stats }),

      setLastCompletedStats: (stats) => set({ lastCompletedStats: stats }),

      recordLevelResult: (levelId, levelName, mode, stats) => {
        const { levelRecords } = get();
        const existingIndex = levelRecords.findIndex((r) => r.levelId === levelId);
        const accuracy = stats.totalAttempts > 0 ? stats.correctCount / stats.totalAttempts : 0;
        const usedTime = stats.totalTime - stats.timeRemaining;

        if (existingIndex >= 0) {
          const existing = levelRecords[existingIndex];
          const newRecord: LevelRecord = {
            ...existing,
            attempts: existing.attempts + 1,
            bestScore: Math.max(existing.bestScore, stats.score),
            bestAccuracy: Math.max(existing.bestAccuracy, accuracy),
            bestCombo: Math.max(existing.bestCombo, stats.maxCombo),
            bestTime: existing.bestTime > 0 ? Math.min(existing.bestTime, usedTime) : usedTime,
            avgCompletionRate: (existing.avgCompletionRate * existing.attempts + stats.completionRate) / (existing.attempts + 1),
            lastPlayed: Date.now(),
          };
          const newRecords = [...levelRecords];
          newRecords[existingIndex] = newRecord;
          set({ levelRecords: newRecords });
        } else {
          const newRecord: LevelRecord = {
            levelId,
            levelName,
            mode,
            attempts: 1,
            bestScore: stats.score,
            bestAccuracy: accuracy,
            bestCombo: stats.maxCombo,
            bestTime: usedTime,
            avgCompletionRate: stats.completionRate,
            lastPlayed: Date.now(),
          };
          set({ levelRecords: [...levelRecords, newRecord] });
        }
      },

      clearRecords: () => set({ levelRecords: [] }),

      getLevelRecord: (levelId) => get().levelRecords.find((r) => r.levelId === levelId),

      getRecordsByMode: (mode) => get().levelRecords.filter((r) => r.mode === mode),
    }),
    {
      name: 'textbook-dispatch-game-store',
      partialize: (state) => ({
        settings: state.settings,
        levelRecords: state.levelRecords,
        lastCompletedStats: state.lastCompletedStats,
      }),
    },
  ),
);

export interface PlayCanvasGameState {
  textbooks: TextbookItem[];
  slots: Slot[];
  selectedTextbookId: string | null;
  stats: GameStats;
  isRunning: boolean;
  isPaused: boolean;
  feedbackMessage: string | null;
  feedbackType: 'success' | 'error' | 'info' | null;
}

export const createInitialGameState = (level: LevelConfig): PlayCanvasGameState => ({
  textbooks: [],
  slots: [],
  selectedTextbookId: null,
  stats: {
    totalAttempts: 0,
    correctCount: 0,
    wrongCount: 0,
    currentCombo: 0,
    maxCombo: 0,
    totalTime: level.duration,
    timeRemaining: level.duration,
    score: 0,
    timeBonus: 0,
    accuracyBonus: 0,
    comboBonus: 0,
    completionRate: 0,
    completed: false,
    passed: false,
  },
  isRunning: false,
  isPaused: false,
  feedbackMessage: null,
  feedbackType: null,
});
