import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameSettings } from '@/types/game';

interface SettingsState extends GameSettings {
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setAnimationEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  resetSettings: () => void;
}

const defaultSettings: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  animationEnabled: true,
  vibrationEnabled: true,
  volume: 0.7,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setMusicEnabled: (enabled) => set({ musicEnabled: enabled }),
      setAnimationEnabled: (enabled) => set({ animationEnabled: enabled }),
      setVibrationEnabled: (enabled) => set({ vibrationEnabled: enabled }),
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'pharmacy-game-settings-v1',
    }
  )
);
