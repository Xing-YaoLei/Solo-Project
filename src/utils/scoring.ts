import type { LevelConfig, ContractDecision, Tenant, MeterReading as MeterReadingType } from '../types';

export function calculateInspectionScore(
  playerRoute: number[],
  correctRoute: number[],
  weight: number
): number {
  if (playerRoute.length !== correctRoute.length) {
    return 0;
  }

  let correctCount = 0;
  for (let i = 0; i < correctRoute.length; i++) {
    if (playerRoute[i] === correctRoute[i]) {
      correctCount++;
    }
  }

  const accuracy = correctCount / correctRoute.length;
  return Math.round(accuracy * 100 * weight);
}

export function calculateContractScore(
  decisions: (ContractDecision | null)[],
  tenants: Tenant[],
  correctAnswers: Record<string, string>,
  weight: number
): number {
  const validDecisions = decisions.filter((d): d is ContractDecision => d !== null);
  let correctCount = 0;

  validDecisions.forEach((decision) => {
    if (decision.optionId === correctAnswers[decision.tenantId]) {
      correctCount++;
    }
  });

  const totalCount = tenants.length;
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;

  return Math.round(accuracy * 100 * weight);
}

export function calculateMeterScore(
  readings: Record<string, number>,
  meters: MeterReadingType[],
  tolerance: number,
  weight: number
): number {
  let correctCount = 0;

  meters.forEach((meter) => {
    const playerReading = readings[meter.id];
    if (playerReading !== undefined) {
      const error = Math.abs(playerReading - meter.correctReading);
      if (error <= tolerance) {
        correctCount++;
      }
    }
  });

  const accuracy = meters.length > 0 ? correctCount / meters.length : 0;
  return Math.round(accuracy * 100 * weight);
}

export function calculateSpeedBonus(
  actualTime: number,
  expectedTime: number,
  bonusWeight: number
): number {
  if (actualTime <= 0) return 0;

  const ratio = expectedTime / actualTime;
  const bonus = Math.min(ratio, 1.5) - 1;
  return Math.round(bonus * 100 * bonusWeight);
}

export function calculateAccuracyBonus(
  overallAccuracy: number,
  bonusWeight: number
): number {
  if (overallAccuracy >= 0.95) {
    return Math.round(100 * bonusWeight);
  }
  if (overallAccuracy >= 0.85) {
    return Math.round(75 * bonusWeight);
  }
  if (overallAccuracy >= 0.7) {
    return Math.round(50 * bonusWeight);
  }
  return 0;
}

export function calculateWorkOrderPenalty(
  timeoutCount: number,
  penaltyPerTimeout: number
): number {
  return timeoutCount * penaltyPerTimeout;
}

export function calculateTotalScore(
  inspectionScore: number,
  contractScore: number,
  meterScore: number,
  speedBonus: number,
  accuracyBonus: number,
  penalties: number
): number {
  const baseScore = inspectionScore + contractScore + meterScore;
  const totalBonus = speedBonus + accuracyBonus;
  return Math.max(0, Math.min(100, baseScore + totalBonus - penalties));
}

export function calculateGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'S', color: 'text-yellow-400' };
  if (score >= 80) return { grade: 'A', color: 'text-green-400' };
  if (score >= 70) return { grade: 'B', color: 'text-blue-400' };
  if (score >= 60) return { grade: 'C', color: 'text-orange-400' };
  return { grade: 'D', color: 'text-red-400' };
}

export function getScoreComment(score: number): string {
  if (score >= 90) return '优秀！你的物业管理能力非常出色！';
  if (score >= 80) return '很好！你已经掌握了物业管理的核心技能。';
  if (score >= 70) return '良好！继续努力，还有提升空间。';
  if (score >= 60) return '及格，但需要加强训练。';
  return '需要更多练习，建议回顾基础流程。';
}

export function calculateLevelScore(
  level: LevelConfig,
  inspectionRoute: number[],
  contractDecisions: (ContractDecision | null)[],
  meterReadings: Record<string, number>,
  totalTime: number,
  timeoutCount: number
): {
  totalScore: number;
  breakdown: {
    inspection: number;
    contract: number;
    meter: number;
    speedBonus: number;
    accuracyBonus: number;
    penalties: number;
  };
  grade: string;
  gradeColor: string;
  comment: string;
} {
  const inspectionScore = calculateInspectionScore(
    inspectionRoute,
    level.inspection.patrolRoute,
    level.scoring.inspectionWeight
  );

  const contractScore = calculateContractScore(
    contractDecisions,
    level.contracts.tenants,
    level.contracts.correctAnswers,
    level.scoring.contractWeight
  );

  const allMeters = [...level.meters.waterMeters, ...level.meters.electricMeters];
  const meterScore = calculateMeterScore(
    meterReadings,
    allMeters,
    level.meters.tolerance,
    level.scoring.meterWeight
  );

  const expectedTime = level.timeLimit * 0.7;
  const speedBonus = calculateSpeedBonus(totalTime, expectedTime, level.scoring.speedBonus);

  const contractCorrect = contractDecisions.filter((d, i) => {
    if (!d) return false;
    return d.optionId === level.contracts.correctAnswers[d.tenantId];
  }).length;
  
  const meterCorrect = allMeters.filter((m) => {
    const r = meterReadings[m.id];
    return r !== undefined && Math.abs(r - m.correctReading) <= level.meters.tolerance;
  }).length;
  
  const totalCorrect = contractCorrect + meterCorrect;
  const totalItems = level.contracts.tenants.length + allMeters.length;
  const overallAccuracy = totalItems > 0 ? totalCorrect / totalItems : 0;
  const accuracyBonus = calculateAccuracyBonus(overallAccuracy, level.scoring.accuracyBonus);

  const penalties = calculateWorkOrderPenalty(timeoutCount, level.workOrders.retryPenalty);

  const totalScore = calculateTotalScore(
    inspectionScore,
    contractScore,
    meterScore,
    speedBonus,
    accuracyBonus,
    penalties
  );

  const { grade, color: gradeColor } = calculateGrade(totalScore);
  const comment = getScoreComment(totalScore);

  return {
    totalScore,
    breakdown: {
      inspection: inspectionScore,
      contract: contractScore,
      meter: meterScore,
      speedBonus,
      accuracyBonus,
      penalties,
    },
    grade,
    gradeColor,
    comment,
  };
}
