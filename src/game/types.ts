export interface Patient {
  id: string
  name: string
  age: number
  gender: 'male' | 'female'
  diagnosis: string
  insuranceType: 'basic' | 'supplementary' | 'commercial'
  symptoms: string[]
  requiredTreatments: string[]
  avatar: string
}

export interface Treatment {
  id: string
  name: string
  duration: number
  cost: number
  insuranceCovered: boolean
  insuranceRatio: number
  requiredInstrument: string
  category: string
}

export interface Instrument {
  id: string
  name: string
  status: 'available' | 'in-use' | 'maintenance' | 'broken'
  durability: number
  maxDurability: number
  maintenanceCost: number
  icon: string
}

export interface Task {
  id: string
  patient: Patient
  assignedDate: string
  deadline: number
  difficulty: 1 | 2 | 3 | 4 | 5
  reward: number
  hints: string[]
  treatments: string[]
  isCompleted: boolean
  isAccepted: boolean
}

export interface CalendarDay {
  date: string
  treatments: ScheduledTreatment[]
  maxSlots: number
}

export interface ScheduledTreatment {
  id: string
  treatmentId: string
  patientId: string
  timeSlot: number
  instrumentId: string
  isCompleted: boolean
  isInsuranceApproved: boolean
  rejectionReason?: string
}

export interface GameState {
  currentDay: number
  money: number
  reputation: number
  tasks: Task[]
  calendar: CalendarDay[]
  instruments: Instrument[]
  completedTasks: string[]
  currentLevel: number
  tutorialCompleted: boolean
  sessionScore: number
  errors: ErrorRecord[]
  rejections: RejectionRecord[]
}

export interface TrainingRecord {
  id: string
  date: string
  level: number
  score: number
  completedTasks: number
  totalTasks: number
  errors: ErrorRecord[]
  rejections: RejectionRecord[]
  completionRate: number
}

export interface ErrorRecord {
  taskId: string
  treatmentId: string
  patientName: string
  treatmentName: string
  reason: string
  timestamp: number
}

export interface RejectionRecord {
  taskId: string
  treatmentId: string
  patientName: string
  treatmentName: string
  reason: string
  amount: number
  timestamp: number
}

export interface LeaderboardEntry {
  id: string
  playerName: string
  score: number
  level: number
  completionRate: number
  date: string
}

export interface LevelConfig {
  id: number
  name: string
  description: string
  taskCount: number
  complexity: number
  unlockInstruments: string[]
  unlockTreatments: string[]
  targetScore: number
}

export interface TutorialStep {
  id: string
  title: string
  description: string
  targetElement: string
  highlightArea?: { x: number; y: number; width: number; height: number }
  action: 'click' | 'observe' | 'next'
}

export interface Clue {
  id: string
  content: string
  type: 'symptom' | 'history' | 'insurance' | 'risk'
  isRevealed: boolean
}
