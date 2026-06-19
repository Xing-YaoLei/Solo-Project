export type Difficulty = 'beginner' | 'advanced' | 'noshow'
export type Position = 'sales' | 'scheduler' | 'service'
export type ClueType = 'test_drive_record' | 'customer_profile' | 'vehicle_archive'

export interface TaskDefinition {
  title: string
  description: string
  customerName: string
  requestedCar: string
  requestedTime: string
}

export interface Clue {
  id: string
  type: ClueType
  title: string
  content: string
  relatedObject3D: string
  isCritical: boolean
}

export interface DecisionOption {
  id: string
  label: string
  description: string
}

export interface DecisionPoint {
  id: string
  question: string
  options: DecisionOption[]
  correctOptionId: string
  knowledgePoint: string
}

export interface Level {
  id: string
  name: string
  difficulty: Difficulty
  position: Position
  task: TaskDefinition
  clues: Clue[]
  decisions: DecisionPoint[]
  timeLimit: number
}

export interface DecisionRecord {
  decisionPointId: string
  selectedOptionId: string | null
  isCorrect: boolean
  timeToDecide: number
  isUnanswered?: boolean
}

export interface ClueConversion {
  clueId: string
  wasViewed: boolean
  ledToCorrectDecision: boolean
}

export interface LevelResult {
  levelId: string
  score: number
  timeUsed: number
  decisions: DecisionRecord[]
  clueConversions: ClueConversion[]
  completedAt: number
}

export interface GameProgress {
  unlockedLevelIds: string[]
  currentLevelId: string | null
  lastPlayedLevelId: string | null
}
