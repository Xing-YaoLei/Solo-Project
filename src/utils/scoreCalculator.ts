import type { Seat, LockRecord, CheckInRecord, GamePhase, DecisionLog, TicketRule } from '../types';

const CONFLICT_PENALTY = 50;
const TYPE_MISMATCH_PENALTY = 30;
const QUOTA_EXCEED_PENALTY = 40;
const CHECKIN_BONUS_PER_PERSON = 20;
const ACCURACY_BONUS = 15;

export function calculateLockRecordScore(
  record: LockRecord,
  seats: Seat[],
  difficulty: number
): { baseScore: number; penalties: number; details: string[] } {
  const details: string[] = [];
  let baseScore = 0;
  let penalties = 0;

  const assignedSeats = seats.filter((s) => record.assignedSeats.includes(s.id));

  if (assignedSeats.length === 0) {
    return { baseScore: 0, penalties: 0, details: ['未分配座位'] };
  }

  assignedSeats.forEach((seat) => {
    baseScore += seat.price;
  });

  const difficultyMultiplier = 1 + (difficulty - 1) * 0.25;
  baseScore = Math.round(baseScore * difficultyMultiplier);
  details.push(`基础分: ${baseScore} (单价×座位数×难度系数${difficultyMultiplier.toFixed(2)})`);

  const hasTypeMismatch = assignedSeats.some((s) => s.ticketType !== record.ticketType);
  if (hasTypeMismatch) {
    penalties += TYPE_MISMATCH_PENALTY;
    details.push(`票种类型不匹配: -${TYPE_MISMATCH_PENALTY}`);
  }

  if (assignedSeats.length !== record.seatCount) {
    const seatDiff = Math.abs(assignedSeats.length - record.seatCount);
    const seatPenalty = seatDiff * 20;
    penalties += seatPenalty;
    details.push(`座位数不符(需要${record.seatCount}个，分配了${assignedSeats.length}个): -${seatPenalty}`);
  }

  const sameOrderSeats = seats.filter((s) => s.orderId === record.orderId);
  const otherOrderConflict = assignedSeats.filter(
    (s) => s.orderId && s.orderId !== record.orderId
  );
  if (otherOrderConflict.length > 0) {
    const conflictPenalty = otherOrderConflict.length * CONFLICT_PENALTY;
    penalties += conflictPenalty;
    details.push(`座位冲突(与其他订单重复${otherOrderConflict.length}个): -${conflictPenalty}`);
  }

  void sameOrderSeats;

  return { baseScore, penalties, details };
}

export function calculateCheckInScore(
  record: CheckInRecord,
  lockRecords: LockRecord[]
): { bonus: number; details: string[] } {
  const details: string[] = [];
  let bonus = 0;

  const matchedLock = lockRecords.find((l) => l.orderId === record.orderId);
  if (!matchedLock) {
    return { bonus: 0, details: ['未找到对应锁座记录'] };
  }

  const actualBonus = record.actualCount * CHECKIN_BONUS_PER_PERSON;
  bonus += actualBonus;
  details.push(`核销人数加成: ${record.actualCount}人 × ${CHECKIN_BONUS_PER_PERSON}分 = +${actualBonus}`);

  if (record.actualCount === record.expectedCount) {
    const accuracyBonus = record.expectedCount * ACCURACY_BONUS;
    bonus += accuracyBonus;
    details.push(`全员到齐准确率奖励: +${accuracyBonus}`);
  } else if (record.actualCount > 0) {
    details.push(`缺席${record.expectedCount - record.actualCount}人，无额外准确率奖励`);
  }

  return { bonus, details };
}

export function calculateFinalScore(
  lockScores: { baseScore: number; penalties: number }[],
  checkInBonuses: number[],
  disputeScores: number[],
  totalSeats: number,
  checkedInSeats: number,
  difficulty: number
): {
  totalScore: number;
  occupancyRate: number;
  occupancyPercent: number;
  speedBonus: number;
  breakdown: { label: string; value: number }[];
} {
  const totalBase = lockScores.reduce((sum, s) => sum + s.baseScore, 0);
  const totalPenalties = lockScores.reduce((sum, s) => sum + s.penalties, 0);
  const totalCheckIn = checkInBonuses.reduce((sum, b) => sum + b, 0);
  const totalDispute = disputeScores.reduce((sum, d) => sum + d, 0);

  const occupancyRate = totalSeats > 0 ? checkedInSeats / totalSeats : 0;
  const occupancyPercent = Math.round(occupancyRate * 100);

  const occupancyBonus = occupancyPercent >= 85 ? Math.round(occupancyPercent * 2) : 0;
  const speedBonus = 0;

  const subtotal = totalBase + totalCheckIn + totalDispute - totalPenalties;
  const difficultyBonus = Math.round(subtotal * (difficulty - 1) * 0.1);
  const totalScore = Math.max(0, subtotal + occupancyBonus + difficultyBonus + speedBonus);

  return {
    totalScore,
    occupancyRate,
    occupancyPercent,
    speedBonus,
    breakdown: [
      { label: '锁座基础分', value: totalBase },
      { label: '冲突与违规扣分', value: -totalPenalties },
      { label: '核销奖励', value: totalCheckIn },
      { label: '争议处理得分', value: totalDispute },
      { label: '上座率奖励', value: occupancyBonus },
      { label: '难度加成', value: difficultyBonus },
    ],
  };
}

export function generateDecisionLog(
  phase: GamePhase,
  action: string,
  targetId: string,
  seatIds: string[],
  scoreDelta: number,
  occupancyDelta: number,
  description: string,
  canRollback = true
): DecisionLog {
  return {
    id: `decision-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    phase,
    action,
    targetId,
    seatIds,
    scoreDelta,
    occupancyDelta,
    canRollback,
    description,
  };
}

export function checkTicketQuota(
  type: string,
  assignedCount: number,
  rules: TicketRule[]
): { exceeded: boolean; remaining: number } {
  const rule = rules.find((r) => r.type === type);
  if (!rule) return { exceeded: false, remaining: 0 };
  return {
    exceeded: assignedCount >= rule.quota,
    remaining: Math.max(0, rule.quota - assignedCount),
  };
}
