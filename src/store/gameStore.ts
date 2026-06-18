import { create } from 'zustand'
import type { LevelResult, GameProgress, DecisionRecord, ClueConversion } from '@/types/game'
import { levels } from '@/data/levels'

const PROGRESS_KEY = 'game_progress'
const RESULTS_KEY = 'level_results'

interface GameState {
  currentLevelId: string | null
  isPlaying: boolean
  collectedClueIds: string[]
  decisions: DecisionRecord[]
  clueConversions: ClueConversion[]
  startTime: number | null
  remainingTime: number
  gameProgress: GameProgress
  results: LevelResult[]

  startLevel: (levelId: string) => void
  collectClue: (clueId: string) => void
  makeDecision: (decisionPointId: string, optionId: string, timeToDecide: number) => void
  endLevel: () => LevelResult
  loadProgress: () => void
  saveProgress: () => void
  resetLevel: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  currentLevelId: null,
  isPlaying: false,
  collectedClueIds: [],
  decisions: [],
  clueConversions: [],
  startTime: null,
  remainingTime: 0,
  gameProgress: {
    unlockedLevelIds: [levels[0].id],
    currentLevelId: null,
    lastPlayedLevelId: null,
  },
  results: [],

  startLevel: (levelId: string) => {
    const level = levels.find((l) => l.id === levelId)
    if (!level) return

    set({
      currentLevelId: levelId,
      isPlaying: true,
      collectedClueIds: [],
      decisions: [],
      clueConversions: [],
      startTime: Date.now(),
      remainingTime: level.timeLimit,
      gameProgress: {
        ...get().gameProgress,
        currentLevelId: levelId,
      },
    })
    get().saveProgress()
  },

  collectClue: (clueId: string) => {
    const { collectedClueIds } = get()
    if (collectedClueIds.includes(clueId)) return
    set({ collectedClueIds: [...collectedClueIds, clueId] })
  },

  makeDecision: (decisionPointId: string, optionId: string, timeToDecide: number) => {
    const { currentLevelId, decisions } = get()
    if (!currentLevelId) return

    const level = levels.find((l) => l.id === currentLevelId)
    if (!level) return

    const decisionPoint = level.decisions.find((d) => d.id === decisionPointId)
    if (!decisionPoint) return

    const isCorrect = decisionPoint.correctOptionId === optionId

    const record: DecisionRecord = {
      decisionPointId,
      selectedOptionId: optionId,
      isCorrect,
      timeToDecide,
    }

    set({ decisions: [...decisions, record] })
  },

  endLevel: () => {
    const { currentLevelId, startTime, decisions, collectedClueIds, results, gameProgress } = get()
    if (!currentLevelId || !startTime) {
      throw new Error('No active level to end')
    }

    const level = levels.find((l) => l.id === currentLevelId)
    if (!level) {
      throw new Error('Level not found')
    }

    const timeUsed = Math.floor((Date.now() - startTime) / 1000)

    const wrongCount = decisions.filter((d) => !d.isCorrect).length
    const score = Math.max(0, 100 - wrongCount * 25)

    const allDecisionsCorrect = decisions.length > 0 && decisions.every((d) => d.isCorrect)

    const clueConversions: ClueConversion[] = level.clues.map((clue) => {
      const wasViewed = collectedClueIds.includes(clue.id)
      let ledToCorrectDecision = false

      if (wasViewed) {
        if (clue.isCritical) {
          ledToCorrectDecision = allDecisionsCorrect
        } else {
          ledToCorrectDecision = decisions.some((d) => d.isCorrect)
        }
      }

      return {
        clueId: clue.id,
        wasViewed,
        ledToCorrectDecision,
      }
    })

    const levelResult: LevelResult = {
      levelId: currentLevelId,
      score,
      timeUsed,
      decisions,
      clueConversions,
      completedAt: Date.now(),
    }

    const existingResults = results.filter((r) => r.levelId !== currentLevelId)
    const updatedResults = [...existingResults, levelResult]

    const currentLevelIndex = levels.findIndex((l) => l.id === currentLevelId)
    const nextLevel = levels[currentLevelIndex + 1]
    const unlockedLevelIds = [...gameProgress.unlockedLevelIds]
    if (nextLevel && !unlockedLevelIds.includes(nextLevel.id)) {
      unlockedLevelIds.push(nextLevel.id)
    }

    set({
      isPlaying: false,
      currentLevelId: null,
      startTime: null,
      remainingTime: 0,
      decisions: [],
      collectedClueIds: [],
      clueConversions: [],
      results: updatedResults,
      gameProgress: {
        unlockedLevelIds,
        currentLevelId: null,
        lastPlayedLevelId: currentLevelId,
      },
    })

    try {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(updatedResults))
    } catch {
      /* empty */
    }

    get().saveProgress()

    return levelResult
  },

  loadProgress: () => {
    try {
      const progressJson = localStorage.getItem(PROGRESS_KEY)
      if (progressJson) {
        const progress: GameProgress = JSON.parse(progressJson)
        set({ gameProgress: progress })
      }

      const resultsJson = localStorage.getItem(RESULTS_KEY)
      if (resultsJson) {
        const savedResults: LevelResult[] = JSON.parse(resultsJson)
        set({ results: savedResults })
      }
    } catch {
      /* empty */
    }
  },

  saveProgress: () => {
    const { gameProgress } = get()
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(gameProgress))
    } catch {
      /* empty */
    }
  },

  resetLevel: () => {
    const { currentLevelId } = get()
    if (!currentLevelId) return

    const level = levels.find((l) => l.id === currentLevelId)
    if (!level) return

    set({
      isPlaying: true,
      collectedClueIds: [],
      decisions: [],
      clueConversions: [],
      startTime: Date.now(),
      remainingTime: level.timeLimit,
    })
  },
}))
