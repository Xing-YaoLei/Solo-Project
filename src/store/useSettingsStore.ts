import { create } from 'zustand';
import type { SettingsState } from '../types';
import { storage } from '../utils/storage';

const STORAGE_KEY = 'game-settings';

const getInitialState = (): SettingsState => {
  const saved = storage.get<SettingsState>(STORAGE_KEY);
  return saved ?? {
    soundEnabled: true,
    musicEnabled: true,
    inputMode: 'auto',
    difficulty: 3,
  };
};

interface SettingsActions {
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setInputMode: (mode: 'auto' | 'touch' | 'keyboard') => void;
  setDifficulty: (difficulty: 1 | 2 | 3 | 4 | 5) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>(
  (set, get) => ({
    ...getInitialState(),

    setSoundEnabled: (enabled: boolean) => {
      set({ soundEnabled: enabled });
      storage.set(STORAGE_KEY, get());
    },

    setMusicEnabled: (enabled: boolean) => {
      set({ musicEnabled: enabled });
      storage.set(STORAGE_KEY, get());
    },

    setInputMode: (mode: 'auto' | 'touch' | 'keyboard') => {
      set({ inputMode: mode });
      storage.set(STORAGE_KEY, get());
    },

    setDifficulty: (difficulty: 1 | 2 | 3 | 4 | 5) => {
      set({ difficulty });
      storage.set(STORAGE_KEY, get());
    },

    resetSettings: () => {
      const defaults: SettingsState = {
        soundEnabled: true,
        musicEnabled: true,
        inputMode: 'auto',
        difficulty: 3,
      };
      set(defaults);
      storage.set(STORAGE_KEY, defaults);
    },
  })
);

export default useSettingsStore;
