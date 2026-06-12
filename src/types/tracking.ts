import type { DeviceStatus } from './game';

export interface PointTracking {
  pointId: string;
  viewedAt: number;
  decisionMadeAt: number;
  decisionTime: number;
  playerDecision: DeviceStatus;
  actualStatus: DeviceStatus;
  isCorrect: boolean;
  errorType?: string;
  decisionSwitchCount: number;
}

export interface ItemUsageTracking {
  itemId: string;
  usedAt: number;
  usedOnPoint?: string;
  effectApplied: boolean;
}

export interface EventTracking {
  eventId: string;
  triggeredAt: number;
  playerChoice: string;
  choiceMadeAt: number;
  choiceTime: number;
}

export interface GameResult {
  totalPoints: number;
  completedPoints: number;
  correctDecisions: number;
  accuracyRate: number;
  totalTime: number;
  timeUsed: number;
  averageDecisionTime: number;
  stuckPoints: string[];
  errorPoints: string[];
  pointTrackings: PointTracking[];
  itemUsages: ItemUsageTracking[];
  events: EventTracking[];
  isTimeOut: boolean;
  finalScore: number;
}
