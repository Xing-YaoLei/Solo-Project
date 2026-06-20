export type TicketType = 'VIP' | 'PREMIUM' | 'STANDARD' | 'ECONOMY';

export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'SOLD' | 'CHECKED_IN' | 'REFUNDED' | 'CONFLICT' | 'SELECTED' | 'HOVERED';

export type GamePhase = 'RULES' | 'LOCKING' | 'CHECKING' | 'REVIEW';

export type PlayMode = 'FORMAL' | 'PRACTICE';

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface Seat {
  id: string;
  row: string;
  number: number;
  x: number;
  y: number;
  z: number;
  ticketType: TicketType;
  status: SeatStatus;
  orderId?: string;
  price: number;
  instanceIndex: number;
}

export interface TicketRule {
  type: TicketType;
  name: string;
  price: number;
  color: string;
  description: string;
  quota: number;
  specialRules?: string[];
  rowRange: [string, string];
}

export interface LockRecord {
  id: string;
  orderId: string;
  ticketType: TicketType;
  seatCount: number;
  timestamp: number;
  customerName: string;
  note?: string;
  assignedSeats: string[];
  isConflict: boolean;
  conflictReason?: string;
  processed: boolean;
}

export interface CheckInRecord {
  id: string;
  code: string;
  orderId: string;
  expectedCount: number;
  actualCount: number;
  checkedSeats: string[];
  timestamp: number;
  hasDispute: boolean;
  disputeReason?: string;
  processed: boolean;
}

export interface RefundOption {
  id: string;
  label: string;
  description: string;
  scoreDelta: number;
  occupancyImpact: number;
}

export interface RefundDispute {
  id: string;
  checkInId: string;
  orderId: string;
  reason: string;
  affectedSeats: string[];
  options: RefundOption[];
}

export interface VenueConfig {
  rows: string[];
  seatsPerRow: number;
  stagePosition: { x: number; y: number; z: number };
  sections: { name: string; rows: string[]; ticketType: TicketType }[];
}

export interface Level {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  venueConfig: VenueConfig;
  ticketRules: TicketRule[];
  lockRecords: LockRecord[];
  checkInRecords: CheckInRecord[];
  targetScore: number;
  targetOccupancy: number;
  unlockCondition?: string;
}

export interface DecisionLog {
  id: string;
  timestamp: number;
  phase: GamePhase;
  action: string;
  targetId: string;
  seatIds: string[];
  scoreDelta: number;
  occupancyDelta: number;
  canRollback: boolean;
  description: string;
}

export interface LevelProgress {
  levelId: string;
  bestScore: number;
  bestOccupancy: number;
  completedCount: number;
  isUnlocked: boolean;
}

export interface OccupancyDataPoint {
  timeLabel: string;
  timestamp: number;
  currentOccupancy: number;
  optimalOccupancy: number;
  phase: GamePhase;
}

export interface GameState {
  mode: PlayMode;
  currentLevelId: string | null;
  phase: GamePhase;
  score: number;
  targetScore: number;
  targetOccupancy: number;
  seats: Seat[];
  lockRecords: LockRecord[];
  checkInRecords: CheckInRecord[];
  activeLockRecordId: string | null;
  activeCheckInId: string | null;
  currentDispute: RefundDispute | null;
  decisionHistory: DecisionLog[];
  occupancyHistory: OccupancyDataPoint[];
  loadingProgress: number;
  isLoading: boolean;
  selectedSeatIds: string[];
  hoveredSeatId: string | null;
}
