export type ElderlyStatus = 'healthy' | 'at_risk' | 'critical' | 'medication_due'

export interface ElderlyProfile {
  id: string
  name: string
  age: number
  avatar: string
  room: string
  medicalConditions: string[]
  medications: Medication[]
  allergies: string[]
  dietaryRestrictions: string[]
  activityLevel: 'low' | 'medium' | 'high'
  notes: string
}

export interface Medication {
  id: string
  name: string
  dosage: string
  time: string
  frequency: 'daily' | 'twice_daily' | 'three_times_daily' | 'as_needed'
  type: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'patch'
  withFood: boolean
  sideEffects: string[]
}

export interface Activity {
  id: string
  name: string
  time: string
  duration: number
  location: string
  description: string
  requiredFor: string[]
}

export interface RiskEvent {
  id: string
  type: 'fall' | 'confusion' | 'medication_error' | 'agitation' | 'health_decline'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  elderlyId: string
  timeLimit: number
  correctActions: string[]
  wrongActions: string[]
}

export interface GameTask {
  id: string
  type: 'activity_checkin' | 'risk_event' | 'medication_reminder' | 'profile_review'
  title: string
  description: string
  elderlyId: string
  timestamp: number
  timeLimit: number
  options: TaskOption[]
  correctOptionId: string
  points: number
}

export interface TaskOption {
  id: string
  text: string
  icon: string
  consequence: string
}

export interface PlayerAction {
  taskId: string
  optionId: string
  timestamp: number
  isCorrect: boolean
  timeSpent: number
  combo: number
}

export interface ReplayRecord {
  id: string
  timestamp: number
  levelId: string
  score: number
  accuracy: number
  combo: number
  actions: PlayerAction[]
  completedTasks: GameTask[]
  finalStats: GameStats
}

export interface GameStats {
  score: number
  correctCount: number
  wrongCount: number
  totalTasks: number
  accuracy: number
  maxCombo: number
  averageResponseTime: number
  speedBonus: number
  comboBonus: number
  penalty: number
}

export interface LevelConfig {
  id: string
  name: string
  description: string
  difficulty: 1 | 2 | 3 | 4 | 5
  duration: number
  elderlyCount: number
  taskFrequency: number
  maxConcurrentTasks: number
  targetAccuracy: number
  unlocked: boolean
  starThresholds: [number, number, number]
}

export interface GameSettings {
  soundEnabled: boolean
  soundVolume: number
  animationEnabled: boolean
  vibrationEnabled: boolean
  musicEnabled: boolean
  musicVolume: number
}

export type GameState = 'menu' | 'playing' | 'paused' | 'review' | 'replay' | 'settings'
