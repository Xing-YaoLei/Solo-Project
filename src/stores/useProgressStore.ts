import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LevelResult } from '@/types'

interface ProgressState {
  levelResults: Record<number, LevelResult>
  bestResults: Record<number, LevelResult>
  unlockedLevel: number

  saveResult: (levelId: number, result: LevelResult) => void
  getResult: (levelId: number) => LevelResult | undefined
  getBestResult: (levelId: number) => LevelResult | undefined
  getAllResults: () => Record<number, LevelResult>
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      levelResults: {},
      bestResults: {},
      unlockedLevel: 1,

      saveResult: (levelId: number, result: LevelResult) => {
        const { bestResults, unlockedLevel, levelResults } = get()
        const existing = bestResults[levelId]
        const isBest = !existing || result.score > existing.score

        const newBestResults = isBest
          ? { ...bestResults, [levelId]: result }
          : bestResults

        const newUnlocked = isBest && levelId >= unlockedLevel ? unlockedLevel + 1 : unlockedLevel

        set({
          levelResults: { ...levelResults, [levelId]: result },
          bestResults: newBestResults,
          unlockedLevel: newUnlocked,
        })
      },

      getResult: (levelId: number) => {
        return get().levelResults[levelId]
      },

      getBestResult: (levelId: number) => {
        return get().bestResults[levelId]
      },

      getAllResults: () => {
        return get().bestResults
      },
    }),
    {
      name: 'used-car-game-progress',
    }
  )
)
