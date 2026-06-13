interface ScoreParams {
  accuracy: number;
  timeUsed: number;
  timeLimit: number;
  anomalyScore: number;
  difficulty: number;
}

export function calculateScore(params: ScoreParams): number {
  const { accuracy, timeUsed, timeLimit, anomalyScore, difficulty } = params;

  const accuracyWeight = 0.4;
  const timeWeight = 0.2;
  const anomalyWeight = 0.2;
  const difficultyWeight = 0.2;

  const timeScore = Math.max(0, 1 - timeUsed / timeLimit);
  const difficultyFactor = difficulty / 5;

  const raw =
    accuracyWeight * accuracy +
    timeWeight * timeScore +
    anomalyWeight * anomalyScore +
    difficultyWeight * difficultyFactor;

  return Math.round(Math.min(100, Math.max(0, raw * 100)));
}

export function calculateStars(score: number, passingScore: number): 1 | 2 | 3 {
  if (score >= passingScore + 30) return 3;
  if (score >= passingScore + 15) return 2;
  return 1;
}

interface TechnicianOutputParams {
  tasksCompleted: number;
  anomaliesHandled: number;
  avgResponseTime: number;
  difficulty: number;
}

export function calculateTechnicianOutput(params: TechnicianOutputParams): number {
  const { tasksCompleted, anomaliesHandled, avgResponseTime, difficulty } = params;

  const taskValue = tasksCompleted * 10;
  const anomalyValue = anomaliesHandled * 15;
  const timeFactor = Math.max(0.1, 1 / (1 + avgResponseTime / 1000));
  const difficultyBonus = 1 + (difficulty - 1) * 0.1;

  return Math.round((taskValue + anomalyValue) * timeFactor * difficultyBonus);
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return correct / total;
}
