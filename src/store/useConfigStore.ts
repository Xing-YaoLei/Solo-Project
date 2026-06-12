import { create } from 'zustand';
import type { DifficultyLevel } from '@/types/game';
import type { DifficultyConfig, ItemConfig, TrackingRule, GameConfig } from '@/types/config';
import { defaultDifficultyConfig } from '@/config/difficulty';
import { defaultItemConfig } from '@/config/items';
import { defaultTrackingRules } from '@/config/tracking';

interface ConfigState extends GameConfig {
  setDifficulty: (level: DifficultyLevel) => void;
  updateDifficultyConfig: (level: DifficultyLevel, config: Partial<DifficultyConfig>) => void;
  updateItemCooldown: (itemId: string, cooldown: number) => void;
  updateTrackingRules: (rules: Partial<TrackingRule>) => void;
  resetToDefaults: () => void;
  getCurrentDifficultyConfig: () => DifficultyConfig;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  difficulty: defaultDifficultyConfig,
  items: defaultItemConfig,
  tracking: defaultTrackingRules,
  currentDifficulty: 'normal',

  setDifficulty: (level) => set({ currentDifficulty: level }),

  updateDifficultyConfig: (level, config) =>
    set((state) => ({
      difficulty: {
        ...state.difficulty,
        [level]: { ...state.difficulty[level], ...config },
      },
    })),

  updateItemCooldown: (itemId, cooldown) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, cooldown } : item
      ),
    })),

  updateTrackingRules: (rules) =>
    set((state) => ({
      tracking: { ...state.tracking, ...rules },
    })),

  resetToDefaults: () =>
    set({
      difficulty: defaultDifficultyConfig,
      items: defaultItemConfig,
      tracking: defaultTrackingRules,
      currentDifficulty: 'normal',
    }),

  getCurrentDifficultyConfig: () => {
    const state = get();
    return state.difficulty[state.currentDifficulty];
  },
}));
