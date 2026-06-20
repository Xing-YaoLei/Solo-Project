import { create } from 'zustand'
import type { GamePhase, SeatAssignment, ReplayRecord, FeedbackResult, GuideRoute } from '@/types'
import { guideRoutes, performanceTask } from '@/data/gameData'

interface GameState {
  phase: GamePhase
  selectedRouteId: string | null
  seats: SeatAssignment[]
  replays: ReplayRecord[]
  roundStartTime: number
  feedback: FeedbackResult | null
  tutorialCompleted: boolean
  tutorialStep: number
  showTutorial: boolean
  playerName: string

  setPhase: (phase: GamePhase) => void
  selectRoute: (routeId: string) => void
  toggleSeat: (seatId: string) => void
  assignAllSeats: () => void
  clearAllSeats: () => void
  submitDecision: () => FeedbackResult
  saveReplay: (failureReason: string) => void
  startRound: () => void
  completeTutorial: () => void
  setTutorialStep: (step: number) => void
  setShowTutorial: (show: boolean) => void
  setPlayerName: (name: string) => void
  resetGame: () => void
}

const MAX_REPLAYS = 3

function calculateFeedback(route: GuideRoute | undefined, seats: SeatAssignment[], completionTime: number): FeedbackResult {
  if (!route) {
    return { score: 0, secondarySpendRate: 0, timeBonus: 0, riskWarnings: ['未选择路线'], seatSuccess: false, seatSatisfaction: 0, overallGrade: 'D' }
  }

  const assignedSeats = seats.filter(s => s.assigned)
  const seatSuccess = assignedSeats.length >= 20
  const avgViewScore = assignedSeats.length > 0
    ? assignedSeats.reduce((sum, s) => sum + s.viewScore, 0) / assignedSeats.length
    : 0
  const seatSatisfaction = avgViewScore / 100
  const revenue = assignedSeats.reduce((sum, s) => sum + s.price, 0)

  const secondarySpendRate = route.secondarySpendRate * (seatSuccess ? 1.1 : 0.7)
  const timeBonus = Math.max(0, 100 - completionTime) / 100
  const conflictCount = seats.filter(s => s.conflict).length
  const conflictPenalty = conflictCount * 0.05

  const riskWarnings: string[] = []
  if (route.riskLevel === 'high') riskWarnings.push('路线风险等级较高')
  if (route.duration > 150) riskWarnings.push('路线时长过长，游客可能疲劳')
  if (conflictCount > 0) riskWarnings.push(`存在${conflictCount}个座位冲突`)
  if (assignedSeats.length < 15) riskWarnings.push('座位分配不足')

  const rawScore = (secondarySpendRate * 40 + seatSatisfaction * 30 + timeBonus * 20 + (seatSuccess ? 10 : 0)) - conflictPenalty * 100
  const score = Math.min(100, Math.max(0, Math.round(rawScore)))

  let overallGrade: 'S' | 'A' | 'B' | 'C' | 'D'
  if (score >= 90) overallGrade = 'S'
  else if (score >= 75) overallGrade = 'A'
  else if (score >= 60) overallGrade = 'B'
  else if (score >= 40) overallGrade = 'C'
  else overallGrade = 'D'

  void revenue

  return { score, secondarySpendRate, timeBonus, riskWarnings, seatSuccess, seatSatisfaction, overallGrade }
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'idle',
  selectedRouteId: null,
  seats: performanceTask.seats.map(s => ({ ...s })),
  replays: [],
  roundStartTime: 0,
  feedback: null,
  tutorialCompleted: localStorage.getItem('tutorial_completed') === 'true',
  tutorialStep: 0,
  showTutorial: false,
  playerName: localStorage.getItem('player_name') || '',

  setPhase: (phase) => set({ phase }),

  selectRoute: (routeId) => set({ selectedRouteId: routeId }),

  toggleSeat: (seatId) => set((state) => ({
    seats: state.seats.map(s =>
      s.seatId === seatId ? { ...s, assigned: !s.assigned } : s
    ),
  })),

  assignAllSeats: () => set((state) => ({
    seats: state.seats.map(s => ({ ...s, assigned: true })),
  })),

  clearAllSeats: () => set((state) => ({
    seats: state.seats.map(s => ({ ...s, assigned: false, conflict: false })),
  })),

  submitDecision: () => {
    const state = get()
    const route = guideRoutes.find(r => r.id === state.selectedRouteId)
    const completionTime = Math.round((Date.now() - state.roundStartTime) / 1000)
    const feedback = calculateFeedback(route, state.seats, completionTime)
    set({ feedback, phase: 'feedback' })

    if (!feedback.seatSuccess) {
      get().saveReplay(feedback.riskWarnings.join('；') || '座位分配不达标')
    }

    return feedback
  },

  saveReplay: (failureReason) => set((state) => {
    const newReplay: ReplayRecord = {
      id: `replay-${Date.now()}`,
      roundId: `round-${Date.now()}`,
      timestamp: Date.now(),
      seatSnapshot: state.seats.map(s => ({ ...s })),
      failureReason,
    }
    const replays = [...state.replays, newReplay].slice(-MAX_REPLAYS)
    return { replays }
  }),

  startRound: () => set({
    phase: 'observing',
    selectedRouteId: null,
    seats: performanceTask.seats.map(s => ({ ...s })),
    feedback: null,
    roundStartTime: Date.now(),
  }),

  completeTutorial: () => {
    localStorage.setItem('tutorial_completed', 'true')
    set({ tutorialCompleted: true, showTutorial: false })
  },

  setTutorialStep: (step) => set({ tutorialStep: step }),

  setShowTutorial: (show) => set({ showTutorial: show }),

  setPlayerName: (name) => {
    localStorage.setItem('player_name', name)
    set({ playerName: name })
  },

  resetGame: () => set({
    phase: 'idle',
    selectedRouteId: null,
    seats: performanceTask.seats.map(s => ({ ...s })),
    feedback: null,
  }),
}))
