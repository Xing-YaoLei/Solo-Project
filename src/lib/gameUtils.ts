import { TrainingMode, OpenSchedule, QuestionType } from '@/types'

export function calculatePaymentCycleDays(
  score: number,
  maxScore: number,
  timeSpent: number,
  timeLimit: number,
  mode: TrainingMode,
): number {
  const baseDays = 45
  const scoreRatio = Math.min(1, Math.max(0, score / maxScore))
  const scoreBonus = scoreRatio * 25

  let speedBonus = 0
  if (timeLimit > 0 && mode !== 'practice') {
    const timeRatio = Math.min(1, Math.max(0, 1 - timeSpent / timeLimit))
    speedBonus = timeRatio * 10
  }

  let cycle = baseDays - scoreBonus - speedBonus

  if (mode === 'exam') {
    cycle *= 0.9
  }

  return Math.max(3, Math.round(cycle))
}

export function isLevelOpenNow(
  levelId: string,
  schedules: OpenSchedule[],
): boolean {
  const schedule = schedules.find((s) => s.levelId === levelId)
  if (!schedule) return true

  const now = new Date()
  const from = new Date(schedule.openFrom)
  const to = new Date(schedule.openTo)
  to.setHours(23, 59, 59, 999)

  return now >= from && now <= to
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getEffectiveTimeLimit(baseLimit: number, mode: TrainingMode): number {
  if (mode === 'exam') {
    return Math.max(15, Math.round(baseLimit * 0.7))
  }
  return baseLimit
}

export function getModeWarningThreshold(mode: TrainingMode): number {
  if (mode === 'exam') return 30
  if (mode === 'timed') return 10
  return 0
}

export function getModeLabel(mode: TrainingMode): string {
  switch (mode) {
    case 'practice': return '练习模式'
    case 'timed': return '限时模式'
    case 'exam': return '考试模式'
  }
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  amount_verify: '金额校验识别',
  payment_flow: '支付流水选择',
  reconcile_sort: '对账差异排序',
  contract_attach: '合同附件处理',
}
