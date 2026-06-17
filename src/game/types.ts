export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type GameMode = 'training' | 'practice';

export type GameAction = 'full_refund' | 'partial_deduction' | 'full_deduction' | 'escalate';

export type ItemStatus = 'normal' | 'damaged' | 'missing' | 'dirty';

export type Severity = 'minor' | 'major' | 'critical';

export type PaymentStatus = 'paid' | 'overdue' | 'partial';

export type PaymentType = 'rent' | 'utility' | 'deposit' | 'other';

export type TagCategory = 'facility' | 'payment' | 'behavior' | 'document';

export interface RoomInfo {
  roomNumber: string;
  tenantName: string;
  moveInDate: string;
  moveOutDate: string;
  deposit: number;
  monthlyRent: number;
}

export interface UtilityData {
  electricityStart: number;
  electricityEnd: number;
  electricityRate: number;
  waterStart: number;
  waterEnd: number;
  waterRate: number;
  hasAbnormality: boolean;
  abnormalityHint?: string;
}

export interface InspectionItem {
  id: string;
  name: string;
  category: string;
  status: ItemStatus;
  severity: Severity;
  description: string;
  deductionAmount: number;
  isHidden?: boolean;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  description: string;
}

export interface DeductionDetail {
  itemId: string;
  reason: string;
  amount: number;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  complaintTags: string[];
  estimatedTime: number;
  roomInfo: RoomInfo;
  utilityData: UtilityData;
  inspectionItems: InspectionItem[];
  paymentRecords: PaymentRecord[];
  correctAction: GameAction;
  correctDeductions: DeductionDetail[];
  timeLimit?: number;
}

export interface ComplaintTag {
  id: string;
  name: string;
  category: TagCategory;
  color: string;
  description: string;
}

export interface PlayerAnswers {
  utilityJudgment: boolean;
  inspectionMarks: Record<string, boolean>;
  paymentJudgment: boolean;
  selectedAction: GameAction | null;
  deductionAmount: number;
}

export interface GameError {
  type: 'utility' | 'inspection' | 'payment' | 'action';
  itemId?: string;
  description: string;
  correctAnswer: string;
  playerAnswer: string;
  pointDeduction: number;
}

export interface GameState {
  currentLevel: Level | null;
  gameMode: GameMode;
  startTime: number;
  endTime: number | null;
  score: number;
  errors: GameError[];
  playerAnswers: PlayerAnswers;
}

export interface GamePhase {
  id: string;
  name: string;
  completed: boolean;
}
