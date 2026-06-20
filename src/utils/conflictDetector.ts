import type { Seat, LockRecord, TicketRule } from '../types';

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: ConflictDetail[];
}

export interface ConflictDetail {
  type: 'SEAT_OVERLAP' | 'TICKET_TYPE_MISMATCH' | 'QUOTA_EXCEEDED' | 'SEAT_COUNT_MISMATCH' | 'VIP_MISUSE';
  seatIds: string[];
  message: string;
  severity: 'error' | 'warning';
}

export function detectLockConflicts(
  record: LockRecord,
  seatIds: string[],
  allSeats: Seat[],
  allLockRecords: LockRecord[],
  ticketRules: TicketRule[]
): ConflictResult {
  const conflicts: ConflictDetail[] = [];

  const selectedSeats = allSeats.filter((s) => seatIds.includes(s.id));

  if (seatIds.length !== record.seatCount) {
    conflicts.push({
      type: 'SEAT_COUNT_MISMATCH',
      seatIds: [],
      message: `座位数不符：需要 ${record.seatCount} 个，已选择 ${seatIds.length} 个`,
      severity: seatIds.length === 0 ? 'warning' : 'error',
    });
  }

  const typeMismatchSeats = selectedSeats.filter((s) => s.ticketType !== record.ticketType);
  if (typeMismatchSeats.length > 0) {
    conflicts.push({
      type: 'TICKET_TYPE_MISMATCH',
      seatIds: typeMismatchSeats.map((s) => s.id),
      message: `票种类型不匹配：订单要求 ${record.ticketType}，但 ${typeMismatchSeats.length} 个座位属于其他票种`,
      severity: 'error',
    });
  }

  if (record.ticketType !== 'VIP') {
    const vipMisuse = selectedSeats.filter((s) => s.ticketType === 'VIP');
    if (vipMisuse.length > 0) {
      conflicts.push({
        type: 'VIP_MISUSE',
        seatIds: vipMisuse.map((s) => s.id),
        message: `VIP区域座位不可分配给 ${record.ticketType} 票种订单`,
        severity: 'error',
      });
    }
  }

  const otherLockRecords = allLockRecords.filter((r) => r.id !== record.id && r.assignedSeats.length > 0);
  const overlappingSeatIds: string[] = [];

  for (const other of otherLockRecords) {
    for (const sid of seatIds) {
      if (other.assignedSeats.includes(sid)) {
        overlappingSeatIds.push(sid);
      }
    }
  }

  const uniqueOverlaps = [...new Set(overlappingSeatIds)];
  if (uniqueOverlaps.length > 0) {
    conflicts.push({
      type: 'SEAT_OVERLAP',
      seatIds: uniqueOverlaps,
      message: `座位冲突：${uniqueOverlaps.length} 个座位已被其他订单锁定`,
      severity: 'error',
    });
  }

  const rule = ticketRules.find((r) => r.type === record.ticketType);
  if (rule) {
    const allAssignedOfType = allLockRecords
      .filter((r) => r.id !== record.id && r.ticketType === record.ticketType)
      .reduce((sum, r) => sum + r.assignedSeats.length, 0);
    const totalWithNew = allAssignedOfType + selectedSeats.filter((s) => s.ticketType === record.ticketType).length;

    if (totalWithNew > rule.quota) {
      conflicts.push({
        type: 'QUOTA_EXCEEDED',
        seatIds: [],
        message: `票种配额超限：${rule.name} 配额 ${rule.quota}，已分配 ${allAssignedOfType}，本次新增 ${selectedSeats.length}，总计 ${totalWithNew}`,
        severity: 'warning',
      });
    }
  }

  return {
    hasConflict: conflicts.some((c) => c.severity === 'error'),
    conflicts,
  };
}

export function findAdjacentSeats(
  allSeats: Seat[],
  ticketType: string,
  count: number
): Seat[] | null {
  const available = allSeats.filter((s) => s.status === 'AVAILABLE' && s.ticketType === ticketType);

  const byRow: Record<string, Seat[]> = {};
  available.forEach((seat) => {
    if (!byRow[seat.row]) byRow[seat.row] = [];
    byRow[seat.row].push(seat);
  });

  Object.values(byRow).forEach((rowSeats) => {
    rowSeats.sort((a, b) => a.number - b.number);
  });

  for (const rowSeats of Object.values(byRow)) {
    for (let i = 0; i <= rowSeats.length - count; i++) {
      const candidate = rowSeats.slice(i, i + count);
      const firstNum = candidate[0].number;
      const isConsecutive = candidate.every((s, idx) => s.number === firstNum + idx);
      if (isConsecutive) {
        return candidate;
      }
    }
  }

  return null;
}
