export interface HeatPoint {
  id: string
  position: [number, number, number]
  name: string
  visitorCount: number
  waitTime: number
  secondarySpendPotential: number
  heatLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface GuideRoute {
  id: string
  name: string
  duration: number
  attractions: string[]
  secondarySpendRate: number
  riskLevel: 'safe' | 'moderate' | 'high'
  nodePositions: [number, number, number][]
}

export interface SeatAssignment {
  seatId: string
  grade: 'VIP' | 'A' | 'B' | 'C'
  price: number
  viewScore: number
  assigned: boolean
  conflict: boolean
  row: number
  col: number
}

export interface PerformanceTask {
  id: string
  name: string
  totalSeats: number
  seats: SeatAssignment[]
  satisfactionScore: number
  revenue: number
}

export interface GameRound {
  id: string
  timestamp: number
  selectedRouteId: string
  seatSnapshots: SeatAssignment[]
  secondarySpendRate: number
  completionTime: number
  success: boolean
  score: number
}

export interface ReplayRecord {
  id: string
  roundId: string
  timestamp: number
  seatSnapshot: SeatAssignment[]
  failureReason: string
}

export interface LeaderboardEntry {
  rank: number
  playerName: string
  secondarySpendRate: number
  completionTime: number
  accuracy: number
}

export type GamePhase = 'idle' | 'observing' | 'route-select' | 'seat-assign' | 'feedback' | 'complete'

export interface TutorialStep {
  id: string
  title: string
  description: string
  targetElement?: string
}

export interface FeedbackResult {
  score: number
  secondarySpendRate: number
  timeBonus: number
  riskWarnings: string[]
  seatSuccess: boolean
  seatSatisfaction: number
  overallGrade: 'S' | 'A' | 'B' | 'C' | 'D'
}
