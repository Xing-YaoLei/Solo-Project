export * from './training'
export * from './records'
export * from './replay'
export * from './config'

export interface RecordsStats {
  totalAttempts: number
  completedCount: number
  averageScore: number
  averageOnTimeRate: number
  levelStats: Array<{
    levelId: string
    levelName: string
    attempts: number
    bestScore: number
    averageOnTimeRate: number
  }>
}
