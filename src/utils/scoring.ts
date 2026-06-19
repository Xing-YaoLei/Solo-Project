import type { ScoringInput, ScoringResult, WorkOrder } from '../types';

const BASE_SCORE_PER_ORDER = 100;
const SKILL_MATCH_BONUS_RATE = 0.15;
const REWORK_PENALTY_RATE = 0.3;
const TIME_BONUS_MAX_RATE = 0.2;
const TIME_USED_PENALTY_RATE = 0.1;

export function calculateScore(input: ScoringInput): ScoringResult {
  const {
    completedOrders,
    totalOrders,
    timeRemaining,
    timeLimit,
    skillMatchCount,
    totalAssigned,
  } = input;

  const totalCount = totalOrders.length;
  const completedCount = completedOrders.length;

  const completionRate = totalCount > 0 ? completedCount / totalCount : 0;

  const reworkCount = completedOrders.filter((o) => o.reworked).length;
  const reworkRate = completedCount > 0 ? reworkCount / completedCount : 0;

  const completionScore = completedCount * BASE_SCORE_PER_ORDER * completionRate;

  const skillMatchRate = totalAssigned > 0 ? skillMatchCount / totalAssigned : 0;
  const skillBonus = completionScore * skillMatchRate * SKILL_MATCH_BONUS_RATE;

  const timeUsedRate = timeLimit > 0 ? Math.min(1 - timeRemaining / timeLimit, 1) : 0;
  const timeBonus =
    completionScore * Math.max(0, 1 - timeUsedRate) * TIME_BONUS_MAX_RATE;
  const timePenalty = completionScore * timeUsedRate * TIME_USED_PENALTY_RATE;

  const reworkPenalty = completionScore * reworkRate * REWORK_PENALTY_RATE;

  const totalScore = Math.max(
    0,
    completionScore + skillBonus + timeBonus - timePenalty - reworkPenalty
  );

  const stars = determineStars(completionRate, reworkRate);

  return {
    totalScore: Math.round(totalScore),
    completionScore: Math.round(completionScore),
    skillBonus: Math.round(skillBonus),
    timeBonus: Math.round(Math.max(0, timeBonus - timePenalty)),
    reworkPenalty: Math.round(reworkPenalty),
    stars,
    completionRate,
    reworkRate,
  };
}

export function determineStars(completionRate: number, reworkRate: number): number {
  if (completionRate >= 0.95 && reworkRate <= 0.1) {
    return 3;
  }
  if (completionRate >= 0.8 && reworkRate <= 0.25) {
    return 2;
  }
  if (completionRate >= 0.6 && reworkRate <= 0.4) {
    return 1;
  }
  return 0;
}

export function getStarsDescription(stars: number): string {
  switch (stars) {
    case 3:
      return '完美调度大师';
    case 2:
      return '优秀调度员';
    case 1:
      return '合格学徒';
    default:
      return '继续努力';
  }
}

export function calculateOrderScore(
  order: WorkOrder,
  skillMatched: boolean,
  completedOnTime: boolean
): number {
  let score = BASE_SCORE_PER_ORDER;

  if (skillMatched) {
    score *= 1 + SKILL_MATCH_BONUS_RATE;
  }

  if (!completedOnTime) {
    score *= 0.85;
  }

  if (order.reworked) {
    score *= 1 - REWORK_PENALTY_RATE;
  }

  if (order.status === 'skipped') {
    score = 0;
  }

  return Math.round(Math.max(0, score));
}
