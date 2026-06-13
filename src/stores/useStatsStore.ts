import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { GameSession, TechnicianOutput, Bottleneck, PlayerStats } from '@/types'
import * as persistence from '@/utils/persistence'

interface LevelComparison {
  levelId: string
  avgScore: number
  avgAccuracy: number
  avgTimeUsed: number
  avgStars: number
  avgAnomalyScore: number
}

interface StatsState {
  sessions: GameSession[]
  technicianOutputs: TechnicianOutput[]
  bottlenecks: Bottleneck[]
}

interface StatsActions {
  addSession: (session: GameSession) => void
  addTechnicianOutput: (output: TechnicianOutput) => void
  addBottlenecks: (bottlenecks: Bottleneck[]) => void
  getSessionsByLevel: (levelId: string) => GameSession[]
  getOutputsByLevel: (levelId: string) => TechnicianOutput[]
  getBottlenecksBySession: (sessionId: string) => Bottleneck[]
  getLevelComparison: (levelIds: string[]) => LevelComparison[]
  getPlayerStats: () => PlayerStats
  clearAll: () => void
}

const customStorage = {
  getItem: (name: string): string | null => {
    const data = persistence.load<unknown>(name)
    return data !== null ? JSON.stringify(data) : null
  },
  setItem: (name: string, value: string): void => {
    persistence.save(name, JSON.parse(value))
  },
  removeItem: (name: string): void => {
    persistence.remove(name)
  },
}

export const useStatsStore = create<StatsState & StatsActions>()(
  persist(
    (set, get) => ({
      sessions: [],
      technicianOutputs: [],
      bottlenecks: [],

      addSession: (session) => {
        set((state) => ({
          sessions: [...state.sessions, session],
        }))
      },

      addTechnicianOutput: (output) => {
        set((state) => ({
          technicianOutputs: [...state.technicianOutputs, output],
        }))
      },

      addBottlenecks: (bottlenecks) => {
        set((state) => ({
          bottlenecks: [...state.bottlenecks, ...bottlenecks],
        }))
      },

      getSessionsByLevel: (levelId) => {
        return get().sessions.filter((s) => s.levelId === levelId)
      },

      getOutputsByLevel: (levelId) => {
        return get().technicianOutputs.filter((o) => o.levelId === levelId)
      },

      getBottlenecksBySession: (sessionId) => {
        return get().bottlenecks.filter((b) => b.sessionId === sessionId)
      },

      getLevelComparison: (levelIds) => {
        return levelIds.map((levelId) => {
          const levelSessions = get().sessions.filter((s) => s.levelId === levelId)
          if (levelSessions.length === 0) {
            return { levelId, avgScore: 0, avgAccuracy: 0, avgTimeUsed: 0, avgStars: 0, avgAnomalyScore: 0 }
          }

          const total = levelSessions.length
          const avgScore = levelSessions.reduce((sum, s) => sum + s.score, 0) / total
          const avgAccuracy = levelSessions.reduce((sum, s) => sum + s.accuracy, 0) / total
          const avgTimeUsed = levelSessions.reduce((sum, s) => sum + s.timeUsed, 0) / total
          const avgStars = levelSessions.reduce((sum, s) => sum + s.stars, 0) / total
          const avgAnomalyScore = levelSessions.reduce((sum, s) => sum + s.anomalyScore, 0) / total

          return { levelId, avgScore, avgAccuracy, avgTimeUsed, avgStars, avgAnomalyScore }
        })
      },

      getPlayerStats: () => {
        const { sessions } = get()
        if (sessions.length === 0) {
          return { playerId: 'player-1', totalLevels: 0, avgTime: 0, avgAccuracy: 0, achievementProgress: 0 }
        }

        const uniqueLevels = new Set(sessions.map((s) => s.levelId)).size
        const avgTime = sessions.reduce((sum, s) => sum + s.timeUsed, 0) / sessions.length
        const avgAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length
        const threeStarSessions = sessions.filter((s) => s.stars === 3).length
        const achievementProgress = (threeStarSessions / sessions.length) * 100

        return {
          playerId: 'player-1',
          totalLevels: uniqueLevels,
          avgTime,
          avgAccuracy,
          achievementProgress,
        }
      },

      clearAll: () => {
        set({ sessions: [], technicianOutputs: [], bottlenecks: [] })
      },
    }),
    {
      name: 'stats-store',
      storage: createJSONStorage(() => customStorage),
    }
  )
)
