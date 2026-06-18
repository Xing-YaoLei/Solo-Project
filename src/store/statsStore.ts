import { create } from 'zustand'
import type { LevelResult } from '@/types/game'

const RESULTS_KEY = 'level_results'

interface StatsState {
  results: LevelResult[]
  loadResults: () => void
  getAverageScore: () => number
  getAverageTime: () => number
  getClueConversionRate: () => number
  getLevelResult: (levelId: string) => LevelResult | undefined
  getConversionTrend: () => { levelId: string; rate: number }[]
}

export const useStatsStore = create<StatsState>((set, get) => ({
  results: [],

  loadResults: () => {
    try {
      const json = localStorage.getItem(RESULTS_KEY)
      if (json) {
        const saved: LevelResult[] = JSON.parse(json)
        set({ results: saved })
      }
    } catch {
      /* empty */
    }
  },

  getAverageScore: () => {
    const { results } = get()
    if (results.length === 0) return 0
    const total = results.reduce((sum, r) => sum + r.score, 0)
    return Math.round(total / results.length)
  },

  getAverageTime: () => {
    const { results } = get()
    if (results.length === 0) return 0
    const total = results.reduce((sum, r) => sum + r.timeUsed, 0)
    return Math.round(total / results.length)
  },

  getClueConversionRate: () => {
    const { results } = get()
    if (results.length === 0) return 0

    let totalViewed = 0
    let totalConverted = 0

    for (const result of results) {
      for (const cc of result.clueConversions) {
        if (cc.wasViewed) {
          totalViewed++
          if (cc.ledToCorrectDecision) {
            totalConverted++
          }
        }
      }
    }

    if (totalViewed === 0) return 0
    return Math.round((totalConverted / totalViewed) * 100)
  },

  getLevelResult: (levelId: string) => {
    const { results } = get()
    return results.find((r) => r.levelId === levelId)
  },

  getConversionTrend: () => {
    const { results } = get()
    const sortedResults = [...results].sort((a, b) => a.completedAt - b.completedAt)
    return sortedResults.map((result) => {
      const viewedClues = result.clueConversions.filter((cc) => cc.wasViewed)
      const convertedCount = viewedClues.filter((cc) => cc.ledToCorrectDecision).length
      const rate = viewedClues.length === 0 ? 0 : Math.round((convertedCount / viewedClues.length) * 100)
      return { levelId: result.levelId, rate }
    })
  },
}))
