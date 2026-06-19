import { create } from 'zustand'
import type { Level } from '@/types/training'

interface LevelState {
  levels: Level[]
  currentLevel: Level | null
  setLevels: (levels: Level[]) => void
  setCurrentLevel: (level: Level | null) => void
}

export const useLevelStore = create<LevelState>((set) => ({
  levels: [],
  currentLevel: null,
  setLevels: (levels) => set({ levels }),
  setCurrentLevel: (level) => set({ currentLevel: level }),
}))
