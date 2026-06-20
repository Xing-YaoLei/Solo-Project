export interface GameState {
  currentLevel: string | null;
  totalScore: number;
  currentScene: string;
  isPaused: boolean;
  soundEnabled: boolean;
  volume: number;
}

export interface LevelState {
  levelId: string;
  sponsors: Sponsor[];
  tickets: TicketType[];
  records: VerificationRecord[];
  currentRecordIndex: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  disputeCount: number;
  startTime: number;
  endTime: number;
  efficiencyHistory: EfficiencyPoint[];
  isDisputeActive: boolean;
  disputeRecordIndex: number;
}

export interface VerificationRecord {
  id: string;
  ticketType: string;
  attendeeName: string;
  time: string;
  sponsorId?: string;
  benefits: string[];
  claimedBenefits: string[];
  isValid: boolean;
  invalidReason?: string;
  hasDispute: boolean;
  disputeReason?: string;
  playerResult?: 'pass' | 'reject';
  isChecked: boolean;
}

export interface EfficiencyPoint {
  time: number;
  correctRate: number;
  speed: number;
}

export interface Sponsor {
  id: string;
  name: string;
  logo?: string;
  description: string;
  benefits: SponsorBenefit[];
  color: string;
}

export interface SponsorBenefit {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface TicketType {
  id: string;
  name: string;
  color: string;
  price: number;
  benefits: string[];
  scoringRules: ScoringRule[];
}

export interface ScoringRule {
  id: string;
  condition: string;
  points: number;
  type: 'bonus' | 'penalty';
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targetScore: number;
  timeLimit?: number;
  sponsorIds: string[];
  ticketTypeIds: string[];
  recordCount: number;
  disputeChance: number;
  unlocked: boolean;
  stars: number;
}

export type VerificationResult = 'pass' | 'reject' | 'dispute';

export type SceneTransition = {
  from: string;
  to: string;
  data?: any;
};
