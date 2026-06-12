import { create } from 'zustand';
import type { PointTracking, ItemUsageTracking, EventTracking, GameResult } from '@/types/tracking';
import type { DeviceStatus } from '@/types/game';
import { useConfigStore } from './useConfigStore';

interface TrackingState {
  pointTrackings: PointTracking[];
  itemUsages: ItemUsageTracking[];
  eventTrackings: EventTracking[];
  operationPath: string[];
  recordPointView: (pointId: string) => void;
  recordPointDecision: (tracking: PointTracking) => void;
  recordItemUsage: (tracking: ItemUsageTracking) => void;
  recordEvent: (tracking: EventTracking) => void;
  recordOperation: (operation: string) => void;
  generateResult: (totalPoints: number, completedPoints: number, totalTime: number, timeUsed: number, isTimeOut: boolean, finalScore: number) => GameResult;
  clear: () => void;
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  pointTrackings: [],
  itemUsages: [],
  eventTrackings: [],
  operationPath: [],

  recordPointView: (pointId) =>
    set((state) => ({
      operationPath: [...state.operationPath, `view:${pointId}:${Date.now()}`],
    })),

  recordPointDecision: (tracking) =>
    set((state) => ({
      pointTrackings: [...state.pointTrackings, tracking],
      operationPath: [...state.operationPath, `decision:${tracking.pointId}:${Date.now()}`],
    })),

  recordItemUsage: (tracking) =>
    set((state) => ({
      itemUsages: [...state.itemUsages, tracking],
      operationPath: [...state.operationPath, `item:${tracking.itemId}:${Date.now()}`],
    })),

  recordEvent: (tracking) =>
    set((state) => ({
      eventTrackings: [...state.eventTrackings, tracking],
      operationPath: [...state.operationPath, `event:${tracking.eventId}:${Date.now()}`],
    })),

  recordOperation: (operation) =>
    set((state) => ({
      operationPath: [...state.operationPath, `${operation}:${Date.now()}`],
    })),

  generateResult: (totalPoints, completedPoints, totalTime, timeUsed, isTimeOut, finalScore) => {
    const state = get();
    const config = useConfigStore.getState();
    const trackingRules = config.tracking;

    const correctDecisions = state.pointTrackings.filter((t) => t.isCorrect).length;
    const accuracyRate = completedPoints > 0 ? correctDecisions / completedPoints : 0;

    const decisionTimes = state.pointTrackings.map((t) => t.decisionTime);
    const averageDecisionTime =
      decisionTimes.length > 0
        ? decisionTimes.reduce((a, b) => a + b, 0) / decisionTimes.length
        : 0;

    const stuckPoints = state.pointTrackings
      .filter((t) => t.decisionTime > trackingRules.stuckThreshold || t.decisionSwitchCount > 2)
      .map((t) => t.pointId);

    const errorPoints = state.pointTrackings
      .filter((t) => !t.isCorrect)
      .map((t) => t.pointId);

    return {
      totalPoints,
      completedPoints,
      correctDecisions,
      accuracyRate,
      totalTime,
      timeUsed,
      averageDecisionTime,
      stuckPoints,
      errorPoints,
      pointTrackings: state.pointTrackings,
      itemUsages: state.itemUsages,
      events: state.eventTrackings,
      isTimeOut,
      finalScore,
    };
  },

  clear: () =>
    set({
      pointTrackings: [],
      itemUsages: [],
      eventTrackings: [],
      operationPath: [],
    }),
}));

export const getErrorType = (
  playerDecision: DeviceStatus,
  actualStatus: DeviceStatus
): string | undefined => {
  if (playerDecision === actualStatus) return undefined;

  if (actualStatus === 'normal' && playerDecision === 'fault') return 'false_positive';
  if (actualStatus === 'fault' && playerDecision === 'normal') return 'false_negative';
  if (actualStatus === 'need_clean' && playerDecision === 'normal') return 'missed_clean';
  if (actualStatus === 'need_clean' && playerDecision === 'fault') return 'clean_as_fault';
  if (actualStatus === 'normal' && playerDecision === 'need_clean') return 'unnecessary_clean';
  if (actualStatus === 'fault' && playerDecision === 'need_clean') return 'fault_as_clean';

  return 'unknown';
};
