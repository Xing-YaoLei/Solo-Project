export function calculateTurnoverDays(
  score: number,
  errorCount: number,
  timeUsed: number,
  carCount: number
): number {
  const baseDays = 30
  const scoreReduction = (score / 100) * 12
  const errorPenalty = errorCount * 2
  const timePenalty = timeUsed > 0 ? (timeUsed / 90) * 3 : 0
  const scaleBonus = carCount > 0 ? Math.min(5, carCount * 0.8) : 0

  const days = baseDays - scoreReduction - scaleBonus + errorPenalty + timePenalty
  return Math.round(Math.max(7, days) * 10) / 10
}
