import type { Seat, OccupancyDataPoint, GamePhase } from '../types';

export function getCurrentOccupancy(seats: Seat[]): { checkedIn: number; sold: number; total: number } {
  const total = seats.length;
  const sold = seats.filter((s) => ['SOLD', 'CHECKED_IN'].includes(s.status)).length;
  const checkedIn = seats.filter((s) => s.status === 'CHECKED_IN').length;
  return { checkedIn, sold, total };
}

export function calculateOccupancyPercent(checkedIn: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((checkedIn / total) * 100);
}

export function getOccupancyByTicketType(seats: Seat[]): Record<string, { checkedIn: number; total: number; percent: number }> {
  const byType: Record<string, { checkedIn: number; total: number }> = {};

  seats.forEach((seat) => {
    if (!byType[seat.ticketType]) {
      byType[seat.ticketType] = { checkedIn: 0, total: 0 };
    }
    byType[seat.ticketType].total++;
    if (seat.status === 'CHECKED_IN') {
      byType[seat.ticketType].checkedIn++;
    }
  });

  const result: Record<string, { checkedIn: number; total: number; percent: number }> = {};
  Object.entries(byType).forEach(([type, data]) => {
    result[type] = {
      ...data,
      percent: calculateOccupancyPercent(data.checkedIn, data.total),
    };
  });

  return result;
}

export function createOccupancyDataPoint(
  phase: GamePhase,
  timeLabel: string,
  seats: Seat[],
  optimalTargetPercent: number
): OccupancyDataPoint {
  const { checkedIn, total } = getCurrentOccupancy(seats);
  const currentPercent = calculateOccupancyPercent(checkedIn, total);
  return {
    timeLabel,
    timestamp: Date.now(),
    currentOccupancy: currentPercent,
    optimalOccupancy: optimalTargetPercent,
    phase,
  };
}

export function buildOccupancyHistory(
  phaseSnapshots: { phase: GamePhase; timeLabel: string; seats: Seat[] }[],
  targetOccupancy: number
): OccupancyDataPoint[] {
  const optimalByPhase: Record<GamePhase, number> = {
    RULES: 0,
    LOCKING: Math.round(targetOccupancy * 0.6),
    CHECKING: Math.round(targetOccupancy * 0.9),
    REVIEW: targetOccupancy,
  };

  return phaseSnapshots.map((snapshot) =>
    createOccupancyDataPoint(
      snapshot.phase,
      snapshot.timeLabel,
      snapshot.seats,
      optimalByPhase[snapshot.phase]
    )
  );
}
