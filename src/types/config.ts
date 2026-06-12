import type { DifficultyLevel } from './game';

export interface DifficultyConfig {
  totalTime: number;
  pointCount: number;
  faultProbability: number;
  cleanProbability: number;
  decisionTimeLimit: number;
  eventFrequency: number;
}

export interface ItemConfig {
  id: string;
  name: string;
  icon: string;
  cooldown: number;
  effect: string;
}

export interface TrackingRule {
  stuckThreshold: number;
  trackDecisionTime: boolean;
  trackErrorTypes: boolean;
  trackOperationPath: boolean;
  trackItemUsage: boolean;
  trackEventHandling: boolean;
}

export interface GameConfig {
  difficulty: Record<DifficultyLevel, DifficultyConfig>;
  items: ItemConfig[];
  tracking: TrackingRule;
  currentDifficulty: DifficultyLevel;
}
