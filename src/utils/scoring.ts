import type { ErrorCategory } from '@/types/game';

export interface ScoringConfig {
  basePoints: number;
  timeBonusMultiplier: number;
  hesitationPenalty: number;
  comboBonus: number;
  perfectBonus: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  basePoints: 100,
  timeBonusMultiplier: 2,
  hesitationPenalty: 10,
  comboBonus: 50,
  perfectBonus: 200,
};

export function calculateScore(
  basePoints: number,
  timeRemaining: number,
  timeLimit: number,
  hesitationTime: number,
  comboCount: number,
  isCorrect: boolean,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): number {
  if (!isCorrect) return 0;

  const timeRatio = timeRemaining / timeLimit;
  const timeBonus = Math.floor(timeRatio * config.timeBonusMultiplier * basePoints);
  const hesitationPenalty = Math.max(0, Math.floor(hesitationTime / 1000) * config.hesitationPenalty);
  const comboBonus = comboCount > 1 ? config.comboBonus * (comboCount - 1) : 0;

  return Math.max(0, basePoints + timeBonus - hesitationPenalty + comboBonus);
}

export function calculateRenewalRate(correctCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return Math.round((correctCount / totalCount) * 100);
}

export function getErrorCategoryLabel(category: ErrorCategory): string {
  const labels: Record<ErrorCategory, string> = {
    missed_benefit_expiry: '错过权益过期提醒',
    wrong_refund_handling: '退款处理不当',
    poor_recharge_timing: '续充时机不佳',
    ignored_member_pattern: '忽略会员行为模式',
    insufficient_clue_analysis: '线索分析不充分',
  };
  return labels[category] || category;
}

export function getStars(score: number, maxScore: number): number {
  const ratio = score / maxScore;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
