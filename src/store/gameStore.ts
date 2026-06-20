import { create } from 'zustand';
import type {
  GameState,
  Seat,
  LockRecord,
  CheckInRecord,
  RefundDispute,
  PlayMode,
  GamePhase,
  DecisionLog,
  OccupancyDataPoint,
  Level,
} from '../types';
import { getLevelById } from '../data/levels';
import { generateSeats } from '../data/seatGenerator';
import { calculateLockRecordScore, calculateCheckInScore, generateDecisionLog } from '../utils/scoreCalculator';
import { detectLockConflicts } from '../utils/conflictDetector';
import { generateDispute } from '../utils/disputeGenerator';
import { buildOccupancyHistory, getCurrentOccupancy, calculateOccupancyPercent } from '../utils/occupancyTracker';

interface GameStore extends GameState {
  initializeLevel: (levelId: string, mode: PlayMode) => void;
  setMode: (mode: PlayMode) => void;
  setPhase: (phase: GamePhase) => void;
  setLoadingProgress: (progress: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  selectSeat: (seatId: string) => void;
  deselectSeat: (seatId: string) => void;
  clearSelectedSeats: () => void;
  setActiveLockRecord: (id: string | null) => void;
  setActiveCheckIn: (id: string | null) => void;
  assignSeatsToLockRecord: () => { success: boolean; scoreDelta: number; message?: string };
  unassignLockRecord: (recordId: string) => void;
  processCheckIn: (recordId: string, seatIds: string[]) => { success: boolean; scoreDelta: number; dispute?: RefundDispute | null };
  resolveDispute: (optionId: string) => { scoreDelta: number; occupancyDelta: number; needsReselect: boolean };
  addDecisionLog: (log: DecisionLog) => void;
  rollbackToDecision: (decisionId: string) => void;
  computeFinalScore: () => { totalScore: number; occupancyPercent: number; breakdown: { label: string; value: number }[] };
  resetGame: () => void;
  setHoveredSeat: (seatId: string | null) => void;
  snapshotOccupancy: (timeLabel: string) => void;
  getOccupancyHistory: () => OccupancyDataPoint[];
}

const initialState: GameState = {
  mode: 'FORMAL',
  currentLevelId: null,
  phase: 'RULES',
  score: 0,
  targetScore: 0,
  targetOccupancy: 85,
  seats: [],
  lockRecords: [],
  checkInRecords: [],
  activeLockRecordId: null,
  activeCheckInId: null,
  currentDispute: null,
  decisionHistory: [],
  occupancyHistory: [],
  loadingProgress: 0,
  isLoading: false,
  selectedSeatIds: [],
  hoveredSeatId: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),
  setPhase: (phase) => set({ phase }),
  setLoadingProgress: (loadingProgress) => set({ loadingProgress }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setActiveLockRecord: (id) => set({ activeLockRecordId: id, selectedSeatIds: [] }),
  setActiveCheckIn: (id) => set({ activeCheckInId: id }),
  setHoveredSeat: (hoveredSeatId) => set({ hoveredSeatId }),

  initializeLevel: (levelId, mode) => {
    const level = getLevelById(levelId);
    if (!level) return;

    const seats = generateSeats(level.venueConfig);

    set({
      mode,
      currentLevelId: levelId,
      phase: 'RULES',
      score: 0,
      targetScore: level.targetScore,
      targetOccupancy: level.targetOccupancy,
      seats,
      lockRecords: level.lockRecords.map((r) => ({ ...r, assignedSeats: [], isConflict: false, processed: false })),
      checkInRecords: level.checkInRecords.map((r) => ({ ...r, checkedSeats: [], processed: false })),
      activeLockRecordId: null,
      activeCheckInId: null,
      currentDispute: null,
      decisionHistory: [],
      occupancyHistory: [],
      selectedSeatIds: [],
      hoveredSeatId: null,
    });

    get().snapshotOccupancy('初始状态');
  },

  selectSeat: (seatId) => {
    const state = get();
    if (state.selectedSeatIds.includes(seatId)) return;
    set((s) => ({ selectedSeatIds: [...s.selectedSeatIds, seatId] }));
  },

  deselectSeat: (seatId) => {
    set((s) => ({ selectedSeatIds: s.selectedSeatIds.filter((id) => id !== seatId) }));
  },

  clearSelectedSeats: () => set({ selectedSeatIds: [] }),

  assignSeatsToLockRecord: () => {
    const state = get();
    const record = state.lockRecords.find((r) => r.id === state.activeLockRecordId);
    if (!record || state.selectedSeatIds.length === 0) {
      return { success: false, scoreDelta: 0, message: '请先选择锁座记录和座位' };
    }

    const level = state.currentLevelId ? getLevelById(state.currentLevelId) : null;
    const detection = detectLockConflicts(
      record,
      state.selectedSeatIds,
      state.seats,
      state.lockRecords,
      level?.ticketRules || []
    );

    if (detection.hasConflict) {
      const errorMsgs = detection.conflicts.filter((c) => c.severity === 'error').map((c) => c.message);
      return { success: false, scoreDelta: 0, message: errorMsgs.join('；') };
    }

    const { baseScore, penalties } = calculateLockRecordScore(
      { ...record, assignedSeats: state.selectedSeatIds },
      state.seats,
      level?.difficulty || 1
    );
    const scoreDelta = baseScore - penalties;

    const newSeats = state.seats.map((s) => {
      if (state.selectedSeatIds.includes(s.id)) {
        return { ...s, status: 'LOCKED' as const, orderId: record.orderId };
      }
      return s;
    });

    const newLockRecords = state.lockRecords.map((r) => {
      if (r.id === record.id) {
        return {
          ...r,
          assignedSeats: state.selectedSeatIds,
          isConflict: detection.conflicts.some((c) => c.severity === 'error'),
          conflictReason: detection.conflicts.map((c) => c.message).join('；') || undefined,
          processed: true,
        };
      }
      return r;
    });

    const log = generateDecisionLog(
      'LOCKING',
      'ASSIGN_SEATS',
      record.id,
      state.selectedSeatIds,
      scoreDelta,
      0,
      `为订单 ${record.orderId}(${record.customerName}) 分配 ${state.selectedSeatIds.length} 个${record.ticketType}座位，得分 ${scoreDelta}`,
      true
    );

    set((s) => ({
      seats: newSeats,
      lockRecords: newLockRecords,
      score: s.score + scoreDelta,
      selectedSeatIds: [],
      activeLockRecordId: null,
      decisionHistory: [...s.decisionHistory, log],
    }));

    return { success: true, scoreDelta, message: '分配成功' };
  },

  unassignLockRecord: (recordId) => {
    const state = get();
    const record = state.lockRecords.find((r) => r.id === recordId);
    if (!record) return;

    const newSeats = state.seats.map((s) => {
      if (record.assignedSeats.includes(s.id)) {
        return { ...s, status: 'AVAILABLE' as const, orderId: undefined };
      }
      return s;
    });

    const newLockRecords = state.lockRecords.map((r) => {
      if (r.id === recordId) {
        return { ...r, assignedSeats: [], isConflict: false, conflictReason: undefined, processed: false };
      }
      return r;
    });

    set({
      seats: newSeats,
      lockRecords: newLockRecords,
    });
  },

  processCheckIn: (recordId, seatIds) => {
    const state = get();
    const record = state.checkInRecords.find((r) => r.id === recordId);
    if (!record) return { success: false, scoreDelta: 0, dispute: null };

    const { bonus } = calculateCheckInScore(
      { ...record, checkedSeats: seatIds },
      state.lockRecords
    );

    const newSeats = state.seats.map((s) => {
      if (seatIds.includes(s.id)) {
        return { ...s, status: 'CHECKED_IN' as const };
      }
      return s;
    });

    const newCheckInRecords = state.checkInRecords.map((r) => {
      if (r.id === recordId) {
        return { ...r, checkedSeats: seatIds, processed: true };
      }
      return r;
    });

    const dispute = record.hasDispute ? generateDispute({ ...record, checkedSeats: seatIds }) : null;

    const log = generateDecisionLog(
      'CHECKING',
      'CHECK_IN',
      record.id,
      seatIds,
      bonus,
      seatIds.length,
      `核销订单 ${record.orderId}，${seatIds.length} 人入场，奖励 ${bonus} 分${dispute ? '，触发退票争议' : ''}`,
      false
    );

    set((s) => ({
      seats: newSeats,
      checkInRecords: newCheckInRecords,
      score: s.score + bonus,
      currentDispute: dispute,
      decisionHistory: [...s.decisionHistory, log],
    }));

    return { success: true, scoreDelta: bonus, dispute };
  },

  resolveDispute: (optionId) => {
    const state = get();
    const dispute = state.currentDispute;
    if (!dispute) return { scoreDelta: 0, occupancyDelta: 0, needsReselect: false };

    const option = dispute.options.find((o) => o.id === optionId);
    if (!option) return { scoreDelta: 0, occupancyDelta: 0, needsReselect: false };

    const beforeSnapshot = `争议前(订单${dispute.orderId.slice(-4)})`;
    get().snapshotOccupancy(beforeSnapshot);

    const relatedCheckIn = state.checkInRecords.find((c) => c.id === dispute.checkInId);
    const relatedLock = relatedCheckIn
      ? state.lockRecords.find((l) => l.orderId === relatedCheckIn.orderId)
      : null;

    let newSeats = state.seats.map((s) => {
      if (relatedLock && relatedLock.assignedSeats.includes(s.id)) {
        return { ...s, status: 'AVAILABLE' as const, orderId: undefined };
      }
      if (relatedCheckIn && relatedCheckIn.checkedSeats.includes(s.id)) {
        return { ...s, status: 'AVAILABLE' as const, orderId: undefined };
      }
      return s;
    });

    if (option.occupancyImpact < 0) {
      const affectedCount = Math.abs(Math.round(option.occupancyImpact));
      const toRefund = dispute.affectedSeats.slice(0, affectedCount);
      newSeats = newSeats.map((s) => {
        if (toRefund.includes(s.id)) {
          return { ...s, status: 'AVAILABLE' as const, orderId: undefined };
        }
        return s;
      });
    }

    const newLockRecords = state.lockRecords.map((r) => {
      if (relatedLock && r.id === relatedLock.id) {
        return { ...r, assignedSeats: [], isConflict: false, conflictReason: undefined, processed: false };
      }
      return r;
    });

    const newCheckInRecords = state.checkInRecords.map((r) => {
      if (relatedCheckIn && r.id === relatedCheckIn.id) {
        return { ...r, checkedSeats: [], processed: false, hasDispute: false, disputeReason: undefined };
      }
      return r;
    });

    const log = generateDecisionLog(
      'CHECKING',
      'RESOLVE_DISPUTE_RESELECT',
      dispute.id,
      dispute.affectedSeats,
      option.scoreDelta,
      option.occupancyImpact,
      `处理争议：${option.label} → 恢复订单 ${dispute.orderId} 的锁座/核销，回到场景重新选座，得分 ${option.scoreDelta}`,
      true
    );

    set((s) => ({
      seats: newSeats,
      lockRecords: newLockRecords,
      checkInRecords: newCheckInRecords,
      currentDispute: null,
      score: s.score + option.scoreDelta,
      decisionHistory: [...s.decisionHistory, log],
      phase: 'LOCKING',
      activeLockRecordId: relatedLock?.id || null,
      activeCheckInId: null,
      selectedSeatIds: [],
    }));

    return { scoreDelta: option.scoreDelta, occupancyDelta: option.occupancyImpact, needsReselect: true };
  },

  addDecisionLog: (log) => {
    set((s) => ({ decisionHistory: [...s.decisionHistory, log] }));
  },

  rollbackToDecision: (decisionId) => {
    const state = get();
    const idx = state.decisionHistory.findIndex((d) => d.id === decisionId);
    if (idx === -1) return;

    const decisionsToRevert = state.decisionHistory.slice(idx);
    let revertedScore = state.score;
    const revertedSeatIds = new Set<string>();

    decisionsToRevert.forEach((d) => {
      if (d.canRollback) {
        revertedScore -= d.scoreDelta;
        d.seatIds.forEach((id) => revertedSeatIds.add(id));
      }
    });

    const level = state.currentLevelId ? getLevelById(state.currentLevelId) : null;
    const freshSeats = level ? generateSeats(level.venueConfig) : state.seats;

    const newDecisionHistory = state.decisionHistory.slice(0, idx);

    newDecisionHistory.forEach((d) => {
      if (d.phase === 'LOCKING' && d.action === 'ASSIGN_SEATS') {
        const record = state.lockRecords.find((r) => r.id === d.targetId);
        if (record) {
          d.seatIds.forEach((sid) => {
            const seatIdx = freshSeats.findIndex((s) => s.id === sid);
            if (seatIdx !== -1) {
              freshSeats[seatIdx] = { ...freshSeats[seatIdx], status: 'LOCKED', orderId: record.orderId };
            }
          });
        }
      } else if (d.phase === 'CHECKING' && d.action === 'CHECK_IN') {
        d.seatIds.forEach((sid) => {
          const seatIdx = freshSeats.findIndex((s) => s.id === sid);
          if (seatIdx !== -1) {
            freshSeats[seatIdx] = { ...freshSeats[seatIdx], status: 'CHECKED_IN' };
          }
        });
      }
    });

    const revertedLockRecordIds = new Set(decisionsToRevert.filter((d) => d.action === 'ASSIGN_SEATS').map((d) => d.targetId));
    const revertedCheckInIds = new Set(decisionsToRevert.filter((d) => d.action === 'CHECK_IN').map((d) => d.targetId));

    const newLockRecords = state.lockRecords.map((r) => {
      if (revertedLockRecordIds.has(r.id)) {
        return { ...r, assignedSeats: [], isConflict: false, processed: false };
      }
      return r;
    });

    const newCheckInRecords = state.checkInRecords.map((r) => {
      if (revertedCheckInIds.has(r.id)) {
        return { ...r, checkedSeats: [], processed: false };
      }
      return r;
    });

    set({
      seats: freshSeats,
      score: revertedScore,
      decisionHistory: newDecisionHistory,
      lockRecords: newLockRecords,
      checkInRecords: newCheckInRecords,
      phase: 'LOCKING',
    });

    void revertedSeatIds;
  },

  computeFinalScore: () => {
    const state = get();
    const level = state.currentLevelId ? getLevelById(state.currentLevelId) : null;
    const difficulty = level?.difficulty || 1;

    const lockScores = state.lockRecords
      .filter((r) => r.processed)
      .map((r) => calculateLockRecordScore(r, state.seats, difficulty));

    const checkInBonuses = state.checkInRecords
      .filter((r) => r.processed)
      .map((r) => calculateCheckInScore(r, state.lockRecords).bonus);

    const disputeScores = state.decisionHistory
      .filter((d) => d.action === 'RESOLVE_DISPUTE')
      .map((d) => d.scoreDelta);

    const { checkedIn, total } = getCurrentOccupancy(state.seats);
    const occupancyPercent = calculateOccupancyPercent(checkedIn, total);

    const totalBase = lockScores.reduce((sum, s) => sum + s.baseScore, 0);
    const totalPenalties = lockScores.reduce((sum, s) => sum + s.penalties, 0);
    const totalCheckIn = checkInBonuses.reduce((sum, b) => sum + b, 0);
    const totalDispute = disputeScores.reduce((sum, d) => sum + d, 0);
    const occupancyBonus = occupancyPercent >= 85 ? Math.round(occupancyPercent * 2) : 0;
    const subtotal = totalBase + totalCheckIn + totalDispute - totalPenalties;
    const difficultyBonus = Math.round(subtotal * (difficulty - 1) * 0.1);
    const totalScore = Math.max(0, subtotal + occupancyBonus + difficultyBonus);

    return {
      totalScore,
      occupancyPercent,
      breakdown: [
        { label: '锁座基础分', value: totalBase },
        { label: '违规扣分', value: -totalPenalties },
        { label: '核销奖励', value: totalCheckIn },
        { label: '争议处理得分', value: totalDispute },
        { label: '上座率奖励', value: occupancyBonus },
        { label: '难度加成', value: difficultyBonus },
      ],
    };
  },

  snapshotOccupancy: (timeLabel) => {
    const state = get();
    const level = state.currentLevelId ? getLevelById(state.currentLevelId) : null;
    if (!level) return;

    const occupancyPoints = buildOccupancyHistory(
      [{ phase: state.phase, timeLabel, seats: state.seats }],
      level.targetOccupancy
    );

    set((s) => ({ occupancyHistory: [...s.occupancyHistory, ...occupancyPoints] }));
  },

  getOccupancyHistory: () => {
    const state = get();
    return state.occupancyHistory;
  },

  resetGame: () => {
    set(initialState);
  },
}));

export { initialState };
export type { Level };
