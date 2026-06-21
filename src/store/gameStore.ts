import { create } from 'zustand'
import { GameConfig, TrainingRecord, UserProgress, QuestionType, LEVEL_ORDER, QuestionItem } from '@/types'
import { loadConfig, saveConfig, loadRecords, addRecord, loadProgress, saveProgress } from '@/utils/storage'
import { defaultConfig } from '@/data/defaultQuestions'
import { isLevelOpenNow } from '@/lib/gameUtils'

interface GameState {
  config: GameConfig
  records: TrainingRecord[]
  progress: UserProgress
  currentLevel: QuestionType | null
  currentQuestionId: string | null
  isPlaying: boolean

  initGame: () => void
  setCurrentLevel: (level: QuestionType | null) => void
  setCurrentQuestionId: (id: string | null) => void
  setIsPlaying: (playing: boolean) => void
  completeLevel: (record: TrainingRecord) => void
  completeTutorial: () => void
  updateConfig: (config: GameConfig) => void
  isLevelUnlocked: (level: QuestionType) => boolean
  isLevelOpenNow: (level: QuestionType) => boolean
  isLevelAvailable: (level: QuestionType) => boolean
  getQuestionsByType: (type: QuestionType) => QuestionItem[]
  getCurrentQuestion: () => QuestionItem | null
  getNextQuestion: (type: QuestionType) => QuestionItem | null
}

export const useGameStore = create<GameState>((set, get) => ({
  config: defaultConfig,
  records: [],
  progress: {
    userId: 'player_1',
    totalScore: 0,
    completedLevels: [],
    tutorialDone: false,
    stars: {},
  },
  currentLevel: null,
  currentQuestionId: null,
  isPlaying: false,

  initGame: () => {
    const savedConfig = loadConfig()
    const savedRecords = loadRecords()
    const savedProgress = loadProgress()
    set({
      config: savedConfig || defaultConfig,
      records: savedRecords,
      progress: savedProgress,
    })
  },

  setCurrentLevel: (level) => set({ currentLevel: level }),
  setCurrentQuestionId: (id) => set({ currentQuestionId: id }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),

  completeLevel: (record) => {
    addRecord(record)
    const records = loadRecords()
    const progress = { ...get().progress }
    progress.totalScore += record.score
    if (!progress.completedLevels.includes(record.questionType)) {
      progress.completedLevels.push(record.questionType)
    }
    const starPct = record.score / record.maxScore
    const stars = starPct >= 0.9 ? 3 : starPct >= 0.6 ? 2 : 1
    progress.stars[record.questionType] = Math.max(progress.stars[record.questionType] || 0, stars)
    saveProgress(progress)
    set({ records, progress })
  },

  completeTutorial: () => {
    const progress = { ...get().progress, tutorialDone: true }
    saveProgress(progress)
    set({ progress })
  },

  updateConfig: (config) => {
    saveConfig(config)
    set({ config })
  },

  isLevelUnlocked: (level) => {
    const idx = LEVEL_ORDER.indexOf(level)
    if (idx === 0) return true
    const progress = get().progress
    const prevLevel = LEVEL_ORDER[idx - 1]
    return progress.completedLevels.includes(prevLevel)
  },

  isLevelOpenNow: (level) => {
    const config = get().config
    return isLevelOpenNow(level, config.openSchedule)
  },

  isLevelAvailable: (level) => {
    return get().isLevelUnlocked(level) && get().isLevelOpenNow(level)
  },

  getQuestionsByType: (type) => {
    return get().config.questions.filter((q) => q.type === type)
  },

  getCurrentQuestion: () => {
    const { currentQuestionId, currentLevel, config } = get()
    if (currentQuestionId) {
      return config.questions.find((q) => q.id === currentQuestionId) || null
    }
    if (currentLevel) {
      const questions = config.questions.filter((q) => q.type === currentLevel)
      return questions[0] || null
    }
    return null
  },

  getNextQuestion: (type) => {
    const questions = get().config.questions.filter((q) => q.type === type)
    if (questions.length === 0) return null

    const { currentQuestionId } = get()
    if (!currentQuestionId) return questions[0]

    const currentIdx = questions.findIndex((q) => q.id === currentQuestionId)
    if (currentIdx === -1 || currentIdx >= questions.length - 1) {
      return questions[0]
    }
    return questions[currentIdx + 1]
  },
}))
