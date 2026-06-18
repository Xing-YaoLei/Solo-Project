export interface Level {
  id: number
  name: string
  timeLimit: number
  carCount: number
  difficulty: number
}

export interface ChecklistTask {
  id: string
  levelId: number
  carModel: string
  item: string
  actualOk: boolean
  displayOk: boolean
  detail: string
  resolved: boolean
}

export interface TestDriveTask {
  id: string
  levelId: number
  carModel: string
  field: string
  actualValue: string
  displayValue: string
  hasError: boolean
  resolved: boolean
}

export interface QuotationTask {
  id: string
  levelId: number
  carModel: string
  marketPrice: number
  options: number[]
  correctIndex: number
  resolved: boolean
  selectedIndex: number | null
}

export interface LevelResult {
  score: number
  stars: number
  errorCount: number
  maxConsecutive: number
  timeUsed: number
  inventoryTurnoverDays: number
  timestamp: number
}

export type AnimationIntensity = 'low' | 'medium' | 'high'

export type TaskTab = 'checklist' | 'testDrive' | 'quotation'
