import { SCORING_CONFIG } from '../config/gameConfig';
import type { GameResult, GameTask, GameState } from '../types/game';

export function calculateScore(
  basePoints: number,
  responseTime: number,
  combo: number,
  timeLimit: number
): number {
  let score = basePoints;

  const timeRatio = Math.max(0, (timeLimit - responseTime) / timeLimit);
  const timeBonus = Math.floor(basePoints * timeRatio * SCORING_CONFIG.timeBonusRatio);
  score += timeBonus;

  const comboMultiplier = Math.min(
    1 + combo * SCORING_CONFIG.comboMultiplier,
    1 + SCORING_CONFIG.maxComboMultiplier
  );
  score = Math.floor(score * comboMultiplier);

  return score;
}

export function calculateErrorPenalty(basePoints: number): number {
  return -Math.floor(basePoints * SCORING_CONFIG.errorPenaltyRatio);
}

export function calculateStars(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  const ratio = score / maxScore;
  if (ratio >= SCORING_CONFIG.stars.three) return 3;
  if (ratio >= SCORING_CONFIG.stars.two) return 2;
  if (ratio >= SCORING_CONFIG.stars.one) return 1;
  return 0;
}

export function calculateMaxScore(tasks: GameTask[]): number {
  return tasks.reduce((sum, task) => {
    const maxTaskScore = task.points * (1 + SCORING_CONFIG.timeBonusRatio) * (1 + SCORING_CONFIG.maxComboMultiplier);
    return sum + Math.floor(maxTaskScore);
  }, 0);
}

export function generateGameResult(gameState: GameState, tasks: GameTask[]): GameResult {
  const maxScore = calculateMaxScore(tasks);
  const stars = calculateStars(gameState.score, maxScore);
  const accuracy = gameState.totalCount > 0
    ? Math.round((gameState.correctCount / gameState.totalCount) * 100)
    : 0;
  const avgResponseTime = gameState.totalCount > 0
    ? Math.round(gameState.elapsedTime / gameState.totalCount * 10) / 10
    : 0;

  return {
    score: gameState.score,
    maxScore,
    stars,
    totalTime: gameState.elapsedTime,
    correctCount: gameState.correctCount,
    totalCount: gameState.totalCount,
    accuracy,
    avgResponseTime,
    maxCombo: gameState.maxCombo,
    errors: gameState.errors,
    passed: gameState.currentLevel
      ? gameState.score >= gameState.currentLevel.passingScore
      : false,
  };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getErrorCategory(
  selectedAction: string,
  correctAction: string
): string {
  if (selectedAction === 'archive' && correctAction !== 'archive') {
    return 'wrong_archive';
  }
  if (selectedAction !== 'follow_up' && correctAction === 'follow_up') {
    return 'missed_followup';
  }
  if (
    (selectedAction === 'forward_doctor' && correctAction === 'forward_front') ||
    (selectedAction === 'forward_front' && correctAction === 'forward_doctor')
  ) {
    return 'wrong_forward';
  }
  if (
    (selectedAction === 'return_missing' || selectedAction === 'return_quality') &&
    !correctAction.startsWith('return_')
  ) {
    return 'unnecessary_return';
  }
  if (selectedAction !== 'missed_appointment' && correctAction === 'missed_appointment') {
    return 'missed_missed_appointment';
  }
  if (selectedAction !== 'return_quality' && correctAction === 'return_quality') {
    return 'quality_issue';
  }
  if (selectedAction !== 'return_missing' && correctAction === 'return_missing') {
    return 'missing_documents';
  }
  return 'other';
}
