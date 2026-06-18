import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AnimationIntensity } from '@/types'

interface SettingsState {
  soundEnabled: boolean
  vibrationEnabled: boolean
  animationIntensity: AnimationIntensity
  tutorialCompleted: boolean

  setSoundEnabled: (enabled: boolean) => void
  setVibrationEnabled: (enabled: boolean) => void
  setAnimationIntensity: (intensity: AnimationIntensity) => void
  setTutorialCompleted: (completed: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      vibrationEnabled: true,
      animationIntensity: 'medium',
      tutorialCompleted: false,

      setSoundEnabled: (enabled: boolean) => set({ soundEnabled: enabled }),
      setVibrationEnabled: (enabled: boolean) => set({ vibrationEnabled: enabled }),
      setAnimationIntensity: (intensity: AnimationIntensity) => set({ animationIntensity: intensity }),
      setTutorialCompleted: (completed: boolean) => set({ tutorialCompleted: completed }),
    }),
    {
      name: 'used-car-game-settings',
    }
  )
)
