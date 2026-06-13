import { create } from 'zustand'
import type {
  LevelConfig,
  GamePhase,
  ConsumptionRecord,
  Technician,
  InventoryItem,
  EventConfig,
  Bottleneck,
  GameSession,
  TechnicianOutput,
  RecordStatus,
  ItemEffect,
} from '@/types'
import { calculateScore, calculateStars, calculateTechnicianOutput, calculateAccuracy } from '@/utils/scoring'
import { detectBottleneck } from '@/utils/bottleneck'
import { useConfigStore } from './useConfigStore'

const MOCK_TECHNICIANS: Technician[] = [
  { id: 'tech-1', name: '李美琳', avatar: '', specialty: '面部护理', level: 3 },
  { id: 'tech-2', name: '张晓婷', avatar: '', specialty: '美甲', level: 2 },
  { id: 'tech-3', name: '王丽华', avatar: '', specialty: '按摩', level: 4 },
  { id: 'tech-4', name: '陈思雨', avatar: '', specialty: '发型设计', level: 3 },
  { id: 'tech-5', name: '赵雅芝', avatar: '', specialty: 'SPA', level: 5 },
]

const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: '面膜', category: '护肤品', quantity: 20, status: 'available' },
  { id: 'inv-2', name: '精华液', category: '护肤品', quantity: 15, status: 'available' },
  { id: 'inv-3', name: '按摩油', category: '身体护理', quantity: 10, status: 'available' },
  { id: 'inv-4', name: '洗发水', category: '美发用品', quantity: 25, status: 'available' },
  { id: 'inv-5', name: '护甲油', category: '美甲用品', quantity: 30, status: 'available' },
  { id: 'inv-6', name: 'SPA精油', category: '身体护理', quantity: 12, status: 'available' },
  { id: 'inv-7', name: '染发剂', category: '美发用品', quantity: 18, status: 'available' },
]

const CUSTOMER_NAMES = [
  '小红', '小芳', '小丽', '小云', '小雪',
  '小慧', '小娟', '小萍', '小琳', '小莹',
  '小薇', '小凤', '小兰', '小梅', '小琴',
]

function generateRecords(levelConfig: LevelConfig, technicians: Technician[]): ConsumptionRecord[] {
  const matchTasks = levelConfig.tasks.filter((t) => t.type === 'match-record')
  const records: ConsumptionRecord[] = []

  for (const task of matchTasks) {
    const count = task.params.recordCount ?? 5
    const techCount = task.params.technicianCount ?? technicians.length
    const availableTechs = technicians.slice(0, techCount)

    for (let i = 0; i < count; i++) {
      const tech = availableTechs[Math.floor(Math.random() * availableTechs.length)]
      const customerName = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)]
      const amount = Math.floor(Math.random() * 500) + 100

      records.push({
        id: `record-${levelConfig.id}-${i + 1}`,
        customerName,
        service: tech.specialty,
        amount,
        technicianId: tech.id,
        status: 'pending',
      })
    }
  }

  return records
}

interface GameState {
  currentLevel: LevelConfig | null
  phase: GamePhase
  timeRemaining: number
  records: ConsumptionRecord[]
  technicians: Technician[]
  inventory: InventoryItem[]
  activeEvent: EventConfig | null
  score: number
  bottlenecks: Bottleneck[]
  matchedCount: number
  wrongCount: number
  itemsUsed: Record<string, number>
  cooldownTimestamps: Record<string, number>
  isTimerFrozen: boolean
  shieldActive: boolean
  technicianOutputs: TechnicianOutput[]
  eventsHandledSuccess: number
  eventsHandledFail: number
}

interface GameActions {
  startLevel: (levelConfig: LevelConfig) => void
  setPhase: (phase: GamePhase) => void
  setTimeRemaining: (time: number) => void
  tickTimer: () => void
  matchRecord: (recordId: string, technicianId: string) => void
  handleEvent: (eventConfig: EventConfig, correct: boolean) => void
  useItem: (itemId: string) => boolean
  addBottleneck: (bottleneck: Bottleneck) => void
  dispatchEffect: (effect: ItemEffect) => void
  recordCooldown: (itemId: string, timestamp: number) => void
  completeLevel: () => GameSession
  resetGame: () => void
}

const initialState: GameState = {
  currentLevel: null,
  phase: 'idle',
  timeRemaining: 0,
  records: [],
  technicians: [],
  inventory: [],
  activeEvent: null,
  score: 0,
  bottlenecks: [],
  matchedCount: 0,
  wrongCount: 0,
  itemsUsed: {},
  cooldownTimestamps: {},
  isTimerFrozen: false,
  shieldActive: false,
  technicianOutputs: [],
  eventsHandledSuccess: 0,
  eventsHandledFail: 0,
}

export const useGameStore = create<GameState & GameActions>()((set, get) => ({
  ...initialState,

  startLevel: (levelConfig) => {
    const matchTask = levelConfig.tasks.find((t) => t.type === 'match-record')
    const techCount = matchTask?.params.technicianCount ?? MOCK_TECHNICIANS.length
    const technicians = MOCK_TECHNICIANS.slice(0, techCount)
    const records = generateRecords(levelConfig, technicians)
    const inventory = [...MOCK_INVENTORY]

    set({
      currentLevel: levelConfig,
      phase: 'matching',
      timeRemaining: levelConfig.timeLimit,
      records,
      technicians,
      inventory,
      activeEvent: null,
      score: 0,
      bottlenecks: [],
      matchedCount: 0,
      wrongCount: 0,
      itemsUsed: {},
      isTimerFrozen: false,
      shieldActive: false,
      technicianOutputs: [],
      eventsHandledSuccess: 0,
      eventsHandledFail: 0,
    })
  },

  setPhase: (phase) => {
    set({ phase })
  },

  setTimeRemaining: (time) => {
    set({ timeRemaining: time })
  },

  tickTimer: () => {
    const { isTimerFrozen, timeRemaining, phase } = get()
    if (isTimerFrozen || phase !== 'matching') return

    const next = timeRemaining - 1
    if (next <= 0) {
      set({ timeRemaining: 0, phase: 'settlement' })
    } else {
      set({ timeRemaining: next })
    }
  },

  matchRecord: (recordId, technicianId) => {
    set((state) => {
      const record = state.records.find((r) => r.id === recordId)
      if (!record || record.status !== 'pending') return state

      const isCorrect = record.technicianId === technicianId
      const newStatus: RecordStatus = isCorrect ? 'matched' : 'wrong'
      const records = state.records.map((r) =>
        r.id === recordId ? { ...r, status: newStatus } : r
      )
      const matchedCount = state.matchedCount + (isCorrect ? 1 : 0)
      const wrongCount = state.wrongCount + (isCorrect ? 0 : 1)

      const detected = detectBottleneck({
        actionType: isCorrect ? 'hesitation' : 'mismatch',
        responseTime: 0,
        isCorrect,
        threshold: 0,
      })
      const bottlenecks = detected
        ? [...state.bottlenecks, { ...detected, sessionId: '' }]
        : state.bottlenecks

      return { records, matchedCount, wrongCount, bottlenecks }
    })
  },

  handleEvent: (eventConfig, correct) => {
    set((state) => {
      if (state.shieldActive && !correct) {
        return { activeEvent: null, shieldActive: false, eventsHandledSuccess: state.eventsHandledSuccess + 1 }
      }

      const bottlenecks = !correct
        ? [
            ...state.bottlenecks,
            {
              id: crypto.randomUUID(),
              sessionId: '',
              type: 'event-fail' as const,
              timestamp: Date.now(),
              duration: 0,
              description: `事件处理失败: ${eventConfig.type}`,
            },
          ]
        : state.bottlenecks

      return {
        activeEvent: null,
        bottlenecks,
        eventsHandledSuccess: correct ? state.eventsHandledSuccess + 1 : state.eventsHandledSuccess,
        eventsHandledFail: correct ? state.eventsHandledFail : state.eventsHandledFail + 1,
      }
    })
  },

  useItem: (itemId) => {
    const state = get()
    const configState = useConfigStore.getState()
    const item = configState.items.find((i) => i.id === itemId)
    if (!item) return false

    const lastUsed = state.itemsUsed[itemId]
    if (lastUsed !== undefined && Date.now() - lastUsed < item.cooldownMs) {
      return false
    }

    const itemsUsed = { ...state.itemsUsed, [itemId]: Date.now() }
    const cooldownTimestamps = { ...itemsUsed }

    switch (item.effect.type) {
      case 'reveal':
        set({ itemsUsed, cooldownTimestamps })
        break

      case 'freeze': {
        set({ itemsUsed, cooldownTimestamps, isTimerFrozen: true })
        setTimeout(() => {
          useGameStore.setState({ isTimerFrozen: false })
        }, item.effect.value)
        break
      }

      case 'auto-match': {
        const pendingRecord = state.records.find((r) => r.status === 'pending')
        if (pendingRecord && pendingRecord.technicianId) {
          const records = state.records.map((r) =>
            r.id === pendingRecord.id ? { ...r, status: 'matched' as const } : r
          )
          set({ itemsUsed, cooldownTimestamps, records, matchedCount: state.matchedCount + 1 })
        } else {
          set({ itemsUsed, cooldownTimestamps })
        }
        break
      }

      case 'shield':
        set({ itemsUsed, cooldownTimestamps, shieldActive: true })
        break
    }

    return true
  },

  addBottleneck: (bottleneck) => {
    set((state) => ({
      bottlenecks: [...state.bottlenecks, bottleneck],
    }))
  },

  dispatchEffect: (effect) => {
    switch (effect.type) {
      case 'reveal':
        break

      case 'freeze': {
        set({ isTimerFrozen: true })
        setTimeout(() => {
          useGameStore.setState({ isTimerFrozen: false })
        }, effect.value)
        break
      }

      case 'auto-match': {
        const state = get()
        const pendingRecord = state.records.find((r) => r.status === 'pending')
        if (pendingRecord && pendingRecord.technicianId) {
          const records = state.records.map((r) =>
            r.id === pendingRecord.id ? { ...r, status: 'matched' as const } : r
          )
          set({ records, matchedCount: state.matchedCount + 1 })
        }
        break
      }

      case 'shield':
        set({ shieldActive: true })
        break
    }
  },

  recordCooldown: (itemId, timestamp) => {
    set((state) => ({
      itemsUsed: { ...state.itemsUsed, [itemId]: timestamp },
      cooldownTimestamps: { ...state.cooldownTimestamps, [itemId]: timestamp },
    }))
  },

  completeLevel: () => {
    const state = get()
    if (!state.currentLevel) {
      throw new Error('No active level')
    }

    const total = state.matchedCount + state.wrongCount
    const accuracy = calculateAccuracy(state.matchedCount, total)
    const timeUsed = Math.max(0, state.currentLevel.timeLimit - state.timeRemaining)
    const totalEvents = state.eventsHandledSuccess + state.eventsHandledFail
    const anomalyScore = totalEvents > 0
      ? state.eventsHandledSuccess / totalEvents
      : 1

    const score = calculateScore({
      accuracy,
      timeUsed,
      timeLimit: state.currentLevel.timeLimit,
      anomalyScore,
      difficulty: state.currentLevel.difficulty,
    })

    const stars = calculateStars(score, state.currentLevel.passingScore)

    const session: GameSession = {
      id: crypto.randomUUID(),
      levelId: state.currentLevel.id,
      score,
      stars,
      timeUsed,
      accuracy,
      anomalyScore,
      completedAt: new Date().toISOString(),
    }

    const successEventsPerTech = state.technicians.length > 0
      ? state.eventsHandledSuccess / state.technicians.length
      : 0

    const technicianOutputs: TechnicianOutput[] = state.technicians.map((tech) => {
      const tasksCompleted = state.records.filter(
        (r) => r.technicianId === tech.id && r.status === 'matched'
      ).length
      const anomaliesHandled = Math.round(successEventsPerTech)
      const outputValue = calculateTechnicianOutput({
        tasksCompleted,
        anomaliesHandled,
        avgResponseTime: 500,
        difficulty: state.currentLevel!.difficulty,
      })

      return {
        id: crypto.randomUUID(),
        sessionId: session.id,
        technicianId: tech.id,
        levelId: state.currentLevel!.id,
        outputValue,
        tasksCompleted,
        anomaliesHandled,
      }
    })

    const bottlenecks = state.bottlenecks.map((b) => ({
      ...b,
      sessionId: session.id,
    }))

    set({
      phase: 'settlement',
      score,
      technicianOutputs,
      bottlenecks,
    })

    return session
  },

  resetGame: () => {
    set(initialState)
  },
}))
