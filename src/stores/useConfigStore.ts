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
  recommendedTime: q.recommendedTime,
  correctReason: q.correctReason,
  reviewText: q.reviewText,
  evidences: q.evidences?.map((ev) => ({
    id: ev.id,
    questionId: q.id,
    name: ev.name,
    description: ev.description,
    isCorrect: ev.isCorrect,
    position: { ...ev.position },
  })),
  tagOptions: q.tagOptions?.map((t) => ({
    id: t.id,
    questionId: q.id,
    label: t.label,
    isCorrect: t.isCorrect,
  })),
  calendarTasks: q.calendarTasks?.map((ct) => ({
    id: ct.id,
    questionId: q.id,
    roomId: ct.roomId,
    checkOut: ct.checkOut,
    nextCheckIn: ct.nextCheckIn,
    priority: ct.priority,
    requiredMinutes: ct.requiredMinutes,
    assignedTo: ct.assignedTo,
  })),
  cleaningTasks: q.cleaningTasks?.map((clt) => ({
    id: clt.id,
    questionId: q.id,
    roomId: clt.roomId,
    type: clt.type,
    priority: clt.priority,
    deadline: clt.deadline,
    assignedTo: clt.assignedTo,
  })),
})

const initializeConfig = (): ConfigBundle => {
  const stored = getConfig() as ConfigBundle | null
  if (stored && stored.questions && stored.questions.length > 0) {
    return stored
  }
  const defaultConfig: ConfigBundle = {
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
        questions,
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
