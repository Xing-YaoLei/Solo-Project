import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { LevelProgress, PlayMode } from '../types';
import { LEVELS } from '../data/levels';

interface ProgressState {
  selectedMode: PlayMode;
  progress: Record<string, LevelProgress>;
  setSelectedMode: (mode: PlayMode) => void;
  getProgress: (levelId: string) => LevelProgress;
  updateScore: (levelId: string, score: number, occupancy: number) => void;
  unlockNextLevel: (currentLevelId: string) => void;
  isLevelUnlocked: (levelId: string) => boolean;
  getCompletedLevels: () => string[];
  resetProgress: () => void;
}

function createInitialProgress(): Record<string, LevelProgress> {
  const result: Record<string, LevelProgress> = {};
  LEVELS.forEach((level, index) => {
    result[level.id] = {
      levelId: level.id,
      bestScore: 0,
      bestOccupancy: 0,
      completedCount: 0,
      isUnlocked: index === 0,
    };
  });
  return result;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      selectedMode: 'FORMAL',
      progress: createInitialProgress(),

      setSelectedMode: (mode) => set({ selectedMode: mode }),

      getProgress: (levelId) => {
        const state = get();
        return state.progress[levelId] || {
          levelId,
          bestScore: 0,
          bestOccupancy: 0,
          completedCount: 0,
          isUnlocked: false,
        };
      },

      updateScore: (levelId, score, occupancy) => {
        set((state) => {
          const existing = state.progress[levelId];
          const newProgress = {
            ...existing,
            bestScore: Math.max(existing.bestScore, score),
            bestOccupancy: Math.max(existing.bestOccupancy, occupancy),
            completedCount: existing.completedCount + 1,
            isUnlocked: true,
          };
          return {
            progress: { ...state.progress, [levelId]: newProgress },
          };
        });
        get().unlockNextLevel(levelId);
      },

      unlockNextLevel: (currentLevelId) => {
        const levelIndex = LEVELS.findIndex((l) => l.id === currentLevelId);
        if (levelIndex === -1 || levelIndex >= LEVELS.length - 1) return;
        const nextLevelId = LEVELS[levelIndex + 1].id;
        set((state) => {
          if (state.progress[nextLevelId]?.isUnlocked) return {};
          return {
            progress: {
              ...state.progress,
              [nextLevelId]: { ...state.progress[nextLevelId], isUnlocked: true },
            },
          };
        });
      },

      isLevelUnlocked: (levelId) => {
        const state = get();
        return state.progress[levelId]?.isUnlocked ?? false;
      },

      getCompletedLevels: () => {
        const state = get();
        return Object.values(state.progress)
          .filter((p) => p.completedCount > 0)
          .map((p) => p.levelId);
      },

      resetProgress: () => set({ progress: createInitialProgress() }),
    }),
    {
      name: 'seat-allocation-progress',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
