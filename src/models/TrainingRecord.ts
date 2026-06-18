import type { ConstructionPhase, MistakeReason, ChangeOrder, Rating, DecisionOutcome } from './index';

export interface MistakeRecord {
  id: string;
  reason: MistakeReason;
  description: string;
  phase: ConstructionPhase;
  clueId?: string;
  actionId?: string;
  penalty: number;
  timestamp: number;
}

export interface MaterialDelayRecord {
  id: string;
  materialName: string;
  plannedDate: number;
  actualDate: number;
  delayDays: number;
  impact: string;
  phase: ConstructionPhase;
}

export interface DecisionRecord {
  id: string;
  phase: ConstructionPhase;
  clueId?: string;
  clueIds?: string[];
  actionId: string;
  timestamp: number;
  outcome: DecisionOutcome;
}

export interface TrainingRecord {
  id: string;
  taskId: string;
  levelId: string;
  playerName: string;
  startTime: number;
  endTime: number;
  score: number;
  qualityScore: number;
  costScore: number;
  timeScore: number;
  actualCost: number;
  budget: number;
  actualDuration: number;
  plannedDuration: number;
  timeDeviation: number;
  costDeviation: number;
  mistakes: MistakeRecord[];
  materialDelays: MaterialDelayRecord[];
  decisions: DecisionRecord[];
  changeOrders: ChangeOrder[];
  isPerfect: boolean;
  rating: Rating;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  levelId: string;
  score: number;
  rating: Rating;
  timestamp: number;
}
