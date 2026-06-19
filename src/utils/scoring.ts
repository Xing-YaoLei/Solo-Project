import type { QuestionResult, TrainingRecord } from './storage'

const BASE_SCORE = 100

export function calculateQuestionScore(
  isCorrect: boolean,
  timeSpent: number,
  recommendedTime: number
): number {
  if (!isCorrect) {
    return 0
  }

  const ratio = timeSpent / recommendedTime
  let multiplier = 1

  if (ratio <= 0.5) {
    multiplier = 1.5
  } else if (ratio <= 0.8) {
    multiplier = 1.2
  } else if (ratio <= 1) {
    multiplier = 1
  } else if (ratio <= 1.5) {
    multiplier = 0.8
  } else {
    multiplier = 0.5
  }

  return Math.round(BASE_SCORE * multiplier)
}

export function calculateOnTimeRate(results: QuestionResult[]): number {
  if (results.length === 0) {
    return 0
  }

  let onTimeCount = 0
  for (const result of results) {
    if (result.timeSpent <= result.recommendedTime) {
      onTimeCount++
    }
  }

  return Math.round((onTimeCount / results.length) * 100)
}

export interface OverallStats {
  totalRecords: number
  totalScore: number
  averageScore: number
  averageOnTimeRate: number
  completedCount: number
  failedCount: number
  bestScore: number
  worstScore: number
}

export function calculateOverallStats(records: TrainingRecord[]): OverallStats {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      totalScore: 0,
      averageScore: 0,
      averageOnTimeRate: 0,
      completedCount: 0,
      failedCount: 0,
      bestScore: 0,
      worstScore: 0
    }
  }

  let totalScore = 0
  let totalOnTimeRate = 0
  let completedCount = 0
  let failedCount = 0
  let bestScore = Number.NEGATIVE_INFINITY
  let worstScore = Number.POSITIVE_INFINITY

  for (const record of records) {
    totalScore += record.score
    totalOnTimeRate += record.onTimeRate

    if (record.status === 'completed') {
      completedCount++
    } else {
      failedCount++
    }

    if (record.score > bestScore) {
      bestScore = record.score
    }
    if (record.score < worstScore) {
      worstScore = record.score
    }
  }

  return {
    totalRecords: records.length,
    totalScore,
    averageScore: Math.round(totalScore / records.length),
    averageOnTimeRate: Math.round(totalOnTimeRate / records.length),
    completedCount,
    failedCount,
    bestScore: bestScore === Number.NEGATIVE_INFINITY ? 0 : bestScore,
    worstScore: worstScore === Number.POSITIVE_INFINITY ? 0 : worstScore
  }
}
