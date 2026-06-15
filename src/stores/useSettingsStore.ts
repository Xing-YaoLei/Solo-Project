import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SettingsStore } from '../types';

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      isTouchMode: false,
      sensitivity: 1,
      soundEnabled: true,
      musicVolume: 0.7,
      sfxVolume: 0.8,

      setTouchMode: (enabled: boolean) => set({ isTouchMode: enabled }),
      setSensitivity: (value: number) => set({ sensitivity: Math.max(0.1, Math.min(3, value)) }),
      setSoundEnabled: (enabled: boolean) => set({ soundEnabled: enabled }),
      setMusicVolume: (value: number) => set({ musicVolume: Math.max(0, Math.min(1, value)) }),
      setSfxVolume: (value: number) => set({ sfxVolume: Math.max(0, Math.min(1, value)) }),
    }),
    {
      name: 'game-settings-storage',
    }
  )
);
