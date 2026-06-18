import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LevelResult } from '@/types'

interface ProgressState {
  levelResults: Record<number, LevelResult>
  unlockedLevel: number

  saveResult: (levelId: number, result: LevelResult) => void
  getResult: (levelId: number) => LevelResult | undefined
  getAllResults: () => Record<number, LevelResult>
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      levelResults: {},
      unlockedLevel: 1,

      saveResult: (levelId: number, result: LevelResult) => {
        const { levelResults, unlockedLevel } = get()
        const existing = levelResults[levelId]
        const shouldUpdate = !existing || result.score > existing.score
        if (!shouldUpdate) return

        const newUnlocked = levelId >= unlockedLevel ? unlockedLevel + 1 : unlockedLevel

        set({
          levelResults: { ...levelResults, [levelId]: result },
          unlockedLevel: newUnlocked,
        })
      },

      getResult: (levelId: number) => {
        return get().levelResults[levelId]
      },

      getAllResults: () => {
        return get().levelResults
      },
    }),
    {
      name: 'used-car-game-progress',
    }
  )
)
