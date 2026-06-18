export function calculateScore(
  speed: number,
  errorCount: number,
  maxConsecutive: number,
  totalTasks: number
): number {
  if (totalTasks === 0) return 0

  const accuracy = Math.max(0, (totalTasks - errorCount) / totalTasks)
  const speedFactor = Math.min(1, speed / 100)
  const streakFactor = Math.min(1, maxConsecutive / totalTasks)

  const raw = accuracy * 60 + speedFactor * 20 + streakFactor * 20
  return Math.round(Math.max(0, Math.min(100, raw)))
}

export function calculateStars(score: number): number {
  if (score >= 80) return 3
  if (score >= 50) return 2
  return 1
}
