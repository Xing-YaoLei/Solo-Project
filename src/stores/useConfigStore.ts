import { create } from 'zustand'
import type { Question } from '@/types/training'
import type { Asset, RewardConfig, ScheduleConfig, ModeConfig, ConfigBundle } from '@/types/config'

interface ConfigState {
  questions: Question[]
  assets: Asset[]
  rewards: RewardConfig[]
  schedules: ScheduleConfig[]
  modes: ModeConfig[]
  addQuestion: (question: Omit<Question, 'id'>) => void
  updateQuestion: (id: string, updates: Partial<Question>) => void
  deleteQuestion: (id: string) => void
  saveConfig: () => void
}

const loadConfig = (): ConfigBundle => {
  const stored = localStorage.getItem('bnb_config')
  if (stored) {
    return JSON.parse(stored)
  }
  return {
    questions: [],
    evidences: [],
    tagOptions: [],
    calendarTasks: [],
    cleaningTasks: [],
    assets: [],
    rewardConfigs: [],
    rewardItems: [],
    scheduleConfigs: [],
    timeSlots: [],
    modeConfigs: [],
    modeParams: [],
  }
}

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11)
}

export const useConfigStore = create<ConfigState>((set, get) => {
  const initial = loadConfig()
  return {
    questions: initial.questions,
    assets: initial.assets,
    rewards: initial.rewardConfigs,
    schedules: initial.scheduleConfigs,
    modes: initial.modeConfigs,
    addQuestion: (question) => {
      const newQuestion: Question = {
        ...question,
        id: generateId(),
      }
      set((state) => ({
        questions: [...state.questions, newQuestion],
      }))
    },
    updateQuestion: (id, updates) => {
      set((state) => ({
        questions: state.questions.map((q) =>
          q.id === id ? { ...q, ...updates } : q
        ),
      }))
    },
    deleteQuestion: (id) => {
      set((state) => ({
        questions: state.questions.filter((q) => q.id !== id),
      }))
    },
    saveConfig: () => {
      const { questions, assets, rewards, schedules, modes } = get()
      const currentBundle = loadConfig()
      const bundle: ConfigBundle = {
        ...currentBundle,
        questions,
        assets,
        rewardConfigs: rewards,
        scheduleConfigs: schedules,
        modeConfigs: modes,
      }
      localStorage.setItem('bnb_config', JSON.stringify(bundle))
    },
  }
})
