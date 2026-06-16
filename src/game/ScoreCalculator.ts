import type { GameResult, GameState, Level } from '@/types/game';
import { PromotionRuleEngine } from './PromotionRuleEngine';
import type { ShelfCell, Medicine } from '@/types/game';

export class ScoreCalculator {
  static calculateFinalScore(
    gameState: GameState,
    level: Level,
    ruleEngine: PromotionRuleEngine,
    placements: { cardId: string; medicine: Medicine; cell: ShelfCell }[]
  ): GameResult {
    const timeTaken = level.timeLimit - gameState.timeRemaining;
    const accuracyRate = gameState.totalPlacements > 0
      ? gameState.correctPlacements / gameState.totalPlacements
      : 0;
    const avgPlacementTime = gameState.placementTimes.length > 0
      ? gameState.placementTimes.reduce((a, b) => a + b, 0) / gameState.placementTimes.length
      : 0;
    const speedScore = this.calculateSpeedScore(avgPlacementTime, level.difficulty);
    const accuracyScore = this.calculateAccuracyScore(accuracyRate, gameState.correctPlacements);
    const comboScore = this.calculateComboScore(gameState.maxCombo);
    const totalScore = speedScore + accuracyScore + comboScore + gameState.score;
    const promotionAchievement = ruleEngine.calculatePromotionAchievement(placements);
    const isWin = totalScore >= level.targetScore;
    return {
      levelId: level.id,
      levelName: level.name,
      totalScore,
      speedScore,
      accuracyScore,
      comboScore,
      timeTaken,
      errors: gameState.errors,
      maxCombo: gameState.maxCombo,
      correctCount: gameState.correctPlacements,
      totalCount: gameState.totalPlacements,
      promotionAchievement,
      timestamp: Date.now(),
      isWin,
    };
  }

  private static calculateSpeedScore(avgTime: number, difficulty: string): number {
    const difficultyMultiplier: Record<string, number> = {
      easy: 1,
      medium: 1.5,
      hard: 2,
    };
    const multiplier = difficultyMultiplier[difficulty] || 1;
    if (avgTime <= 1000) return Math.floor(300 * multiplier);
    if (avgTime <= 2000) return Math.floor(200 * multiplier);
    if (avgTime <= 3000) return Math.floor(100 * multiplier);
    if (avgTime <= 5000) return Math.floor(50 * multiplier);
    return 0;
  }

  private static calculateAccuracyScore(accuracyRate: number, correctCount: number): number {
    if (accuracyRate >= 0.95) return 300 + correctCount * 10;
    if (accuracyRate >= 0.85) return 200 + correctCount * 8;
    if (accuracyRate >= 0.7) return 100 + correctCount * 5;
    if (accuracyRate >= 0.5) return 50 + correctCount * 3;
    return Math.max(0, correctCount * 2);
  }

  private static calculateComboScore(maxCombo: number): number {
    if (maxCombo >= 10) return 500;
    if (maxCombo >= 7) return 300;
    if (maxCombo >= 5) return 200;
    if (maxCombo >= 3) return 100;
    if (maxCombo >= 2) return 50;
    return 0;
  }

  static calculateStars(score: number, targetScore: number): number {
    if (score >= targetScore * 1.2) return 3;
    if (score >= targetScore) return 2;
    if (score >= targetScore * 0.6) return 1;
    return 0;
  }

  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  static getGrade(score: number, targetScore: number): { grade: string; color: string } {
    const ratio = score / targetScore;
    if (ratio >= 1.5) return { grade: 'S', color: 'text-purple-500' };
    if (ratio >= 1.2) return { grade: 'A', color: 'text-health-500' };
    if (ratio >= 1.0) return { grade: 'B', color: 'text-pharmacy-500' };
    if (ratio >= 0.8) return { grade: 'C', color: 'text-promo-500' };
    if (ratio >= 0.6) return { grade: 'D', color: 'text-orange-500' };
    return { grade: 'F', color: 'text-alert-500' };
  }
}
