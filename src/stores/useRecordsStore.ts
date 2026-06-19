import { create } from 'zustand'
import type { TrainingRecord } from '@/types/training'
import type { RecordsStats } from '@/types'

interface RecordsState {
  records: TrainingRecord[]
  stats: RecordsStats | null
  fetchRecords: () => void
  addRecord: (record: TrainingRecord) => void
}

const calculateStats = (records: TrainingRecord[]): RecordsStats => {
  const totalAttempts = records.length
  const completedCount = records.filter((r) => r.status === 'completed').length
  const averageScore = totalAttempts > 0 ? records.reduce((sum, r) => sum + r.score, 0) / totalAttempts : 0
  const averageOnTimeRate = totalAttempts > 0 ? records.reduce((sum, r) => sum + r.onTimeRate, 0) / totalAttempts : 0

  const levelMap = new Map<string, TrainingRecord[]>()
  records.forEach((r) => {
    if (!levelMap.has(r.levelId)) {
      levelMap.set(r.levelId, [])
    }
    levelMap.get(r.levelId)!.push(r)
  })

  const levelStats = Array.from(levelMap.entries()).map(([levelId, levelRecords]) => ({
    levelId,
    levelName: levelId,
    attempts: levelRecords.length,
    bestScore: Math.max(...levelRecords.map((r) => r.score)),
    averageOnTimeRate: levelRecords.reduce((sum, r) => sum + r.onTimeRate, 0) / levelRecords.length,
  }))

  return {
    totalAttempts,
    completedCount,
    averageScore,
    averageOnTimeRate,
    levelStats,
  }
}

export const useRecordsStore = create<RecordsState>((set, get) => ({
  records: [],
  stats: null,
  fetchRecords: () => {
    const stored = localStorage.getItem('bnb_records')
    const records: TrainingRecord[] = stored ? JSON.parse(stored) : []
    const stats = calculateStats(records)
    set({ records, stats })
  },
  addRecord: (record) => {
    const currentRecords = get().records
    const updated = [record, ...currentRecords].slice(0, 100)
    localStorage.setItem('bnb_records', JSON.stringify(updated))
    const stats = calculateStats(updated)
    set({ records: updated, stats })
  },
}))
