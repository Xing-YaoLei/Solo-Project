import { create } from 'zustand'
import type { Question } from '@/types/training'
import type { Asset, ConfigBundle, RewardItem, TimeSlot, ModeParam } from '@/types/config'
import { getConfig, setConfig } from '@/utils/storage'
import { mockQuestions, mockRewards, mockSchedule, mockModes } from '@/utils/mockData'

interface ConfigState {
  questions: Question[]
  assets: Asset[]
  rewards: RewardItem[]
  schedules: TimeSlot[]
  modes: ModeParam[]
  addQuestion: (question: Omit<Question, 'id'>) => void
  updateQuestion: (id: string, updates: Partial<Question>) => void
  deleteQuestion: (id: string) => void
  updateRewards: (rewards: RewardItem[]) => void
  updateSchedules: (schedules: TimeSlot[]) => void
  updateModes: (modes: ModeParam[]) => void
  updateAssets: (assets: Asset[]) => void
  saveConfig: () => void
  loadConfig: () => void
}

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11)
}

const convertMockQuestion = (q: typeof mockQuestions[0]): Question => ({
  id: q.id,
  levelId: q.levelId,
  type: q.type,
  description: q.description,
  score: q.score,
  correctReason: q.correctReason,
})

const initializeConfig = (): ConfigBundle & { questions: Question[] } => {
  const stored = getConfig()
  if (stored && 'rewards' in stored) {
    const mockQs = mockQuestions.map(convertMockQuestion)
    return { ...stored, questions: mockQs } as ConfigBundle & { questions: Question[] }
  }
  const defaultConfig: ConfigBundle & { questions: Question[] } = {
    questions: mockQuestions.map(convertMockQuestion),
    assets: [],
    rewards: mockRewards.map((r) => ({
      id: r.id,
      type: r.type as 'points' | 'badge' | 'level',
      threshold: r.threshold,
      value: r.value,
    })),
    schedule: mockSchedule.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      maxAttempts: s.maxAttempts,
    })),
    modes: mockModes.map((m) => ({
      id: m.id,
      key: m.key,
      value: m.value,
    })),
  }
  setConfig(defaultConfig)
  return defaultConfig
}

export const useConfigStore = create<ConfigState>((set, get) => {
  const initial = initializeConfig()
  
  return {
    questions: initial.questions,
    assets: initial.assets,
    rewards: initial.rewards,
    schedules: initial.schedule,
    modes: initial.modes,
    
    addQuestion: (question) => {
      const newQuestion: Question = {
        ...question,
        id: generateId(),
      }
      set((state) => ({
        questions: [...state.questions, newQuestion],
      }))
      get().saveConfig()
    },
    
    updateQuestion: (id, updates) => {
      set((state) => ({
        questions: state.questions.map((q) =>
          q.id === id ? { ...q, ...updates } : q
        ),
      }))
      get().saveConfig()
    },
    
    deleteQuestion: (id) => {
      set((state) => ({
        questions: state.questions.filter((q) => q.id !== id),
      }))
      get().saveConfig()
    },
    
    updateRewards: (rewards) => {
      set({ rewards })
      get().saveConfig()
    },
    
    updateSchedules: (schedules) => {
      set({ schedules })
      get().saveConfig()
    },
    
    updateModes: (modes) => {
      set({ modes })
      get().saveConfig()
    },
    
    updateAssets: (assets) => {
      set({ assets })
      get().saveConfig()
    },
    
    saveConfig: () => {
      const { questions, assets, rewards, schedules, modes } = get()
      const bundle: ConfigBundle = {
        assets,
        rewards,
        schedule: schedules,
        modes,
      }
      setConfig(bundle)
    },
    
    loadConfig: () => {
      const config = initializeConfig()
      set({
        questions: config.questions,
        assets: config.assets,
        rewards: config.rewards,
        schedules: config.schedule,
        modes: config.modes,
      })
    },
  }
})
