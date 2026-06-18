import { create } from 'zustand'
import type { ChecklistTask, TestDriveTask, QuotationTask, TaskTab } from '@/types'
import { checklistTasks, testDriveTasks, quotationTasks, levels } from '@/data/levels'
import { calculateScore } from '@/utils/scoring'

export type ResolveResult = 'correct' | 'wrong' | null

interface GameState {
  currentLevel: number
  timeRemaining: number
  isPlaying: boolean
  isPaused: boolean
  score: number
  errorCount: number
  consecutiveCorrect: number
  maxConsecutive: number
  checklistTasks: ChecklistTask[]
  testDriveTasks: TestDriveTask[]
  quotationTasks: QuotationTask[]
  activeTab: TaskTab
  lastResult: ResolveResult
  lastResultTaskId: string | null

  startGame: (levelId: number) => void
  pauseGame: () => void
  resumeGame: () => void
  endGame: () => void
  tickTimer: () => void
  resolveChecklist: (taskId: string, playerAnswer: boolean) => ResolveResult
  resolveTestDrive: (taskId: string, playerAnswer: boolean) => ResolveResult
  resolveQuotation: (taskId: string, selectedIndex: number) => ResolveResult
  setActiveTab: (tab: TaskTab) => void
  clearLastResult: () => void
  resetGame: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  currentLevel: 0,
  timeRemaining: 0,
  isPlaying: false,
  isPaused: false,
  score: 0,
  errorCount: 0,
  consecutiveCorrect: 0,
  maxConsecutive: 0,
  checklistTasks: [],
  testDriveTasks: [],
  quotationTasks: [],
  activeTab: 'checklist',
  lastResult: null,
  lastResultTaskId: null,

  startGame: (levelId: number) => {
    const level = levels.find((l) => l.id === levelId)
    if (!level) return

    const cl = (checklistTasks[levelId] ?? []).map((t) => ({ ...t, resolved: false }))
    const td = (testDriveTasks[levelId] ?? []).map((t) => ({ ...t, resolved: false }))
    const qt = (quotationTasks[levelId] ?? []).map((t) => ({ ...t, resolved: false, selectedIndex: null }))

    set({
      currentLevel: levelId,
      timeRemaining: level.timeLimit,
      isPlaying: true,
      isPaused: false,
      score: 0,
      errorCount: 0,
      consecutiveCorrect: 0,
      maxConsecutive: 0,
      checklistTasks: cl,
      testDriveTasks: td,
      quotationTasks: qt,
      activeTab: 'checklist',
      lastResult: null,
      lastResultTaskId: null,
    })
  },

  pauseGame: () => {
    set({ isPaused: true })
  },

  resumeGame: () => {
    set({ isPaused: false })
  },

  endGame: () => {
    set({ isPlaying: false, isPaused: false })
  },

  tickTimer: () => {
    const { timeRemaining, isPlaying, isPaused } = get()
    if (!isPlaying || isPaused) return
    if (timeRemaining <= 0) {
      set({ isPlaying: false, timeRemaining: 0 })
      return
    }
    set({ timeRemaining: timeRemaining - 1 })
  },

  resolveChecklist: (taskId: string, playerAnswer: boolean): ResolveResult => {
    const state = get()
    const task = state.checklistTasks.find((t) => t.id === taskId)
    if (!task || task.resolved) return null

    const isCorrect = playerAnswer === task.actualOk
    const result: ResolveResult = isCorrect ? 'correct' : 'wrong'
    const newConsecutive = isCorrect ? state.consecutiveCorrect + 1 : 0
    const newMaxConsecutive = Math.max(state.maxConsecutive, newConsecutive)
    const newErrorCount = isCorrect ? state.errorCount : state.errorCount + 1

    const newChecklist = state.checklistTasks.map((t) =>
      t.id === taskId ? { ...t, resolved: true } : t
    )
    const totalTasks = newChecklist.length + state.testDriveTasks.length + state.quotationTasks.length
    const lv = levels.find((l) => l.id === state.currentLevel)
    const speed = lv ? (state.timeRemaining / lv.timeLimit) * 100 : 50
    const newScore = calculateScore(speed, newErrorCount, newMaxConsecutive, totalTasks)

    set({
      checklistTasks: newChecklist,
      consecutiveCorrect: newConsecutive,
      maxConsecutive: newMaxConsecutive,
      errorCount: newErrorCount,
      score: newScore,
      lastResult: result,
      lastResultTaskId: taskId,
    })
    return result
  },

  resolveTestDrive: (taskId: string, playerAnswer: boolean): ResolveResult => {
    const state = get()
    const task = state.testDriveTasks.find((t) => t.id === taskId)
    if (!task || task.resolved) return null

    const isCorrect = playerAnswer === task.hasError
    const result: ResolveResult = isCorrect ? 'correct' : 'wrong'
    const newConsecutive = isCorrect ? state.consecutiveCorrect + 1 : 0
    const newMaxConsecutive = Math.max(state.maxConsecutive, newConsecutive)
    const newErrorCount = isCorrect ? state.errorCount : state.errorCount + 1

    const newTestDrive = state.testDriveTasks.map((t) =>
      t.id === taskId ? { ...t, resolved: true } : t
    )
    const totalTasks = state.checklistTasks.length + newTestDrive.length + state.quotationTasks.length
    const lv = levels.find((l) => l.id === state.currentLevel)
    const speed = lv ? (state.timeRemaining / lv.timeLimit) * 100 : 50
    const newScore = calculateScore(speed, newErrorCount, newMaxConsecutive, totalTasks)

    set({
      testDriveTasks: newTestDrive,
      consecutiveCorrect: newConsecutive,
      maxConsecutive: newMaxConsecutive,
      errorCount: newErrorCount,
      score: newScore,
      lastResult: result,
      lastResultTaskId: taskId,
    })
    return result
  },

  resolveQuotation: (taskId: string, selectedIndex: number): ResolveResult => {
    const state = get()
    const task = state.quotationTasks.find((t) => t.id === taskId)
    if (!task || task.resolved) return null

    const isCorrect = selectedIndex === task.correctIndex
    const result: ResolveResult = isCorrect ? 'correct' : 'wrong'
    const newConsecutive = isCorrect ? state.consecutiveCorrect + 1 : 0
    const newMaxConsecutive = Math.max(state.maxConsecutive, newConsecutive)
    const newErrorCount = isCorrect ? state.errorCount : state.errorCount + 1

    const newQuotation = state.quotationTasks.map((t) =>
      t.id === taskId ? { ...t, resolved: true, selectedIndex } : t
    )
    const totalTasks = state.checklistTasks.length + state.testDriveTasks.length + newQuotation.length
    const lv = levels.find((l) => l.id === state.currentLevel)
    const speed = lv ? (state.timeRemaining / lv.timeLimit) * 100 : 50
    const newScore = calculateScore(speed, newErrorCount, newMaxConsecutive, totalTasks)

    set({
      quotationTasks: newQuotation,
      consecutiveCorrect: newConsecutive,
      maxConsecutive: newMaxConsecutive,
      errorCount: newErrorCount,
      score: newScore,
      lastResult: result,
      lastResultTaskId: taskId,
    })
    return result
  },

  setActiveTab: (tab: TaskTab) => {
    set({ activeTab: tab })
  },

  clearLastResult: () => {
    set({ lastResult: null, lastResultTaskId: null })
  },

  resetGame: () => {
    set({
      currentLevel: 0,
      timeRemaining: 0,
      isPlaying: false,
      isPaused: false,
      score: 0,
      errorCount: 0,
      consecutiveCorrect: 0,
      maxConsecutive: 0,
      checklistTasks: [],
      testDriveTasks: [],
      quotationTasks: [],
      activeTab: 'checklist',
      lastResult: null,
      lastResultTaskId: null,
    })
  },
}))
