import { create } from 'zustand'
import { GameConfig, TrainingRecord, UserProgress, QuestionType, LEVEL_ORDER } from '@/types'
import { loadConfig, saveConfig, loadRecords, addRecord, loadProgress, saveProgress } from '@/utils/storage'
import { defaultConfig } from '@/data/defaultQuestions'

interface GameState {
  config: GameConfig
  records: TrainingRecord[]
  progress: UserProgress
  currentLevel: QuestionType | null
  isPlaying: boolean

  initGame: () => void
  setCurrentLevel: (level: QuestionType | null) => void
  setIsPlaying: (playing: boolean) => void
  completeLevel: (record: TrainingRecord) => void
  completeTutorial: () => void
  updateConfig: (config: GameConfig) => void
  isLevelUnlocked: (level: QuestionType) => boolean
  getQuestionsByType: (type: QuestionType) => GameConfig['questions']
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

  getQuestionsByType: (type) => {
    return get().config.questions.filter((q) => q.type === type)
  },
}))
