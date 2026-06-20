export interface TicketRule {
  id: string;
  name: string;
  color: number;
  discountRate: number;
  validSlots: string[];
  maxPerOrder: number;
  requiresSponsor: boolean;
}

export interface SponsorItem {
  id: string;
  name: string;
  tier: 'gold' | 'silver' | 'bronze';
  preferredSlots: string[];
  budget: number;
  requiresVerification: boolean;
}

export interface PerformanceSlot {
  id: string;
  name: string;
  time: string;
  capacity: number;
  basePrice: number;
  category: string;
}

export interface TicketOrder {
  id: string;
  ticketRuleId: string;
  slotId: string;
  quantity: number;
  sponsorId?: string;
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  timeLimitSec: number;
  performanceSlots: PerformanceSlot[];
  ticketRules: TicketRule[];
  sponsors: SponsorItem[];
  ticketOrders: TicketOrder[];
  targetScore: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface LevelResult {
  levelId: string;
  score: number;
  speed: number;
  errors: number;
  maxStreak: number;
  verificationEfficiency: number;
  completedAt: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  animationIntensity: 'off' | 'low' | 'medium' | 'high';
  vibrationEnabled: boolean;
}

export interface ScoringConfig {
  baseScorePerCorrect: number;
  streakBonusMultiplier: number;
  speedBonusThreshold: number;
  speedBonusPoints: number;
  errorPenalty: number;
  timeDecayRate: number;
}
