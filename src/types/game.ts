export type QuestionType = 'rule' | 'evidence' | 'settlement' | 'compensation';

export type GamePhase = 'intro' | 'rule' | 'evidence' | 'settlement' | 'compensation' | 'result';

export type GameMode = 'level' | 'practice';

export interface SubsidyCondition {
  distance?: [number, number];
  timeSlot?: [string, string];
  weather?: string[];
  orderType?: string[];
  area?: string[];
}

export interface SubsidyRule {
  id: string;
  name: string;
  description: string;
  conditions: SubsidyCondition;
  amount: number;
  type: 'fixed' | 'per_km' | 'multiplier';
  icon: string;
  color: string;
}

export interface OrderScene {
  id: string;
  orderNo: string;
  distance: number;
  time: string;
  weather: string;
  orderType: string;
  area: string;
  startAddress: string;
  endAddress: string;
  fromPoint: [number, number, number];
  toPoint: [number, number, number];
  description: string;
}

export interface EvidenceItem {
  id: string;
  type: 'image' | 'text' | 'audio';
  title: string;
  content: string;
  thumbnail?: string;
  isValid: boolean;
  invalidReason?: string;
  category: 'time' | 'route' | 'weather' | 'customer' | 'rider';
}

export interface SettlementItem {
  id: string;
  type: 'base' | 'subsidy' | 'bonus' | 'penalty' | 'refund';
  amount: number;
  time: string;
  description: string;
  orderNo?: string;
  correctOrder: number;
}

export interface DamageCause {
  id: string;
  name: string;
  description: string;
  category: 'packaging' | 'rider' | 'product' | 'external';
  compensationRatio: number;
}

export interface CompensationCase {
  id: string;
  productName: string;
  productValue: number;
  damageDegree: 'minor' | 'moderate' | 'severe';
  damageImage: string;
  possibleCauses: DamageCause[];
  correctCauseId: string;
  correctAmount: number;
  customerNote: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description: string;
  score: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  timeLimit: number;
  hint?: string;
}

export interface RuleQuestion extends BaseQuestion {
  type: 'rule';
  orderScene: OrderScene;
  availableRules: SubsidyRule[];
  correctRuleIds: string[];
}

export interface EvidenceQuestion extends BaseQuestion {
  type: 'evidence';
  scenario: string;
  evidencePool: EvidenceItem[];
  correctEvidenceIds: string[];
  minRequired: number;
  maxAllowed: number;
}

export interface SettlementQuestion extends BaseQuestion {
  type: 'settlement';
  items: SettlementItem[];
  sortBy: 'time' | 'amount' | 'logic';
  ascending: boolean;
}

export interface CompensationQuestion extends BaseQuestion {
  type: 'compensation';
  caseData: CompensationCase;
  amountOptions: QuestionOption[];
}

export type Question = RuleQuestion | EvidenceQuestion | SettlementQuestion | CompensationQuestion;

export interface Level {
  id: string;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  totalScore: number;
  questionIds: string[];
  unlocked: boolean;
  stars: number;
  bestScore: number;
  completed: boolean;
  icon: string;
  color: string;
}

export interface UserAnswer {
  questionId: string;
  answer: string[] | string;
  isCorrect: boolean;
  timeSpent: number;
  scoreEarned: number;
  submittedAt: number;
}

export interface RiderPosition {
  position: [number, number, number];
  rotation: number;
  speed: number;
}
