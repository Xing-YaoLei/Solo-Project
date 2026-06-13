export type TaskType = 'match-record' | 'inventory-requisition' | 'timed-challenge'

export type EventType = 'consumable-expired' | 'inventory-shortage' | 'model-error'

export type RecordStatus = 'pending' | 'matched' | 'wrong'

export type InventoryStatus = 'available' | 'expired' | 'shortage'

export type BottleneckType = 'hesitation' | 'mismatch' | 'timeout' | 'event-fail'

export type GamePhase = 'idle' | 'matching' | 'inventory' | 'event' | 'settlement'

export type EffectType = 'reveal' | 'freeze' | 'auto-match' | 'shield'

export type AchievementConditionType = 'accuracy' | 'time' | 'event' | 'stars' | 'level-clear'

export interface TaskParams {
  recordCount?: number
  technicianCount?: number
  allowMismatch?: boolean
  itemCount?: number
  timeLimitSeconds?: number
}

export interface TaskConfig {
  id: string
  levelId: string
  type: TaskType
  params: TaskParams
  order: number
}

export interface EventParams {
  itemId?: string
  category?: string
  shortageAmount?: number
  errorMessage?: string
}

export interface EventConfig {
  id: string
  levelId: string
  type: EventType
  triggerProbability: number
  params: EventParams
}

export interface ItemEffect {
  type: EffectType
  value: number
}

export interface ItemConfig {
  id: string
  name: string
  description: string
  icon: string
  cooldownMs: number
  effect: ItemEffect
}

export interface AchievementCondition {
  type: AchievementConditionType
  threshold: number
}

export interface AchievementConfig {
  id: string
  name: string
  description: string
  icon: string
  condition: AchievementCondition
  reward: number
}

export interface LevelConfig {
  id: string
  name: string
  description: string
  difficulty: number
  timeLimit: number
  passingScore: number
  requiredLevels: string[]
  tasks: TaskConfig[]
  events: EventConfig[]
}

export interface GameSession {
  id: string
  levelId: string
  score: number
  stars: number
  timeUsed: number
  accuracy: number
  anomalyScore: number
  completedAt: string
}

export interface TechnicianOutput {
  id: string
  sessionId: string
  technicianId: string
  levelId: string
  outputValue: number
  tasksCompleted: number
  anomaliesHandled: number
}

export interface Bottleneck {
  id: string
  sessionId: string
  type: BottleneckType
  timestamp: number
  duration: number
  description: string
}

export interface PlayerStats {
  playerId: string
  totalLevels: number
  avgTime: number
  avgAccuracy: number
  achievementProgress: number
}

export interface Technician {
  id: string
  name: string
  avatar: string
  specialty: string
  level: number
}

export interface ConsumptionRecord {
  id: string
  customerName: string
  service: string
  amount: number
  technicianId?: string
  status: RecordStatus
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  status: InventoryStatus
}
