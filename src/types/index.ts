export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type SkillTag =
  | 'engine'
  | 'transmission'
  | 'brake'
  | 'brakes'
  | 'suspension'
  | 'electrical'
  | 'body'
  | 'tires'
  | 'ac'
  | 'exhaust'
  | 'cooling'
  | 'fuel'
  | 'diagnosis';

export type SkillType = SkillTag;

export type WorkOrderStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'rework'
  | 'reworked'
  | 'skipped';

export type ShortageSolution = 'wait' | 'alternative' | 'skip';

export type ActivePanel = 'archive' | 'diagnosis' | 'dispatch' | 'inventory' | null;

export interface DispatchConstraintResult {
  valid: boolean;
  reasons: string[];
  skillMatch: boolean;
  timeConflict: boolean;
  dependenciesMet: boolean;
}

export interface ScoringInput {
  completedOrders: WorkOrder[];
  totalOrders: WorkOrder[];
  timeRemaining: number;
  timeLimit: number;
  skillMatchCount: number;
  totalAssigned: number;
}

export interface ScoringResult {
  totalScore: number;
  completionScore: number;
  skillBonus: number;
  timeBonus: number;
  reworkPenalty: number;
  stars: number;
  completionRate: number;
  reworkRate: number;
}

export interface ReworkCalculationInput {
  diagnosis: Diagnosis;
  skillMatched: boolean;
  usedAlternative: boolean;
  skippedSteps: boolean;
  additionalRisk?: number;
}

export interface ReworkResult {
  reworkProbability: number;
  riskFactors: string[];
  willRework: boolean;
  reworkReason?: string;
}

export interface ShortageModalState {
  open: boolean;
  partId: string | null;
  workOrderId: string | null;
  partName?: string;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  targetVehicleCount: number;
  timeLimitSeconds: number;
  targetRepairRate: number;
  unlocked: boolean;
  bestStars: number;
  bestScore: number;
  vehicleIds: string[];
  stationIds: string[];
  partInventory: { partId: string; stockCount: number }[];
  story?: string;
}

export interface Vehicle {
  id: string;
  levelId: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  ownerDescription: string;
  plateNumber: string;
  color: string;
  historyRecords: string[];
  diagnosisIds: string[];
}

export interface Diagnosis {
  id: string;
  vehicleId: string;
  faultName: string;
  faultCode: string;
  description: string;
  severity: Severity;
  estimatedMinutes: number;
  requiredSkills: SkillTag[];
  requiredSkill?: SkillTag;
  requiredParts: string[];
  dependencies: string[];
  reworkRisk: number;
}

export interface Station {
  id: string;
  levelId: string;
  name: string;
  description: string;
  skills: SkillTag[];
  positionX: number;
  positionZ: number;
  efficiencyMultiplier: number;
  busy?: boolean;
  currentWorkOrderId?: string;
}

export interface Part {
  id: string;
  name: string;
  category: string;
  compatibleVehicles: string[];
  price: number;
  isAlternativeAvailable: boolean;
  alternativePartId?: string;
  description: string;
  stockCount?: number;
}

export interface WorkOrder {
  id: string;
  vehicleId: string;
  diagnosisId: string;
  stationId: string | null;
  status: WorkOrderStatus;
  startTime: number | null;
  endTime: number | null;
  reworked: boolean;
  reworkReason: string | null;
  actualMinutes: number | null;
  partsUsed?: string[];
  shortageHandled?: boolean;
  shortageSolution?: ShortageSolution;
  usedAlternativePartId?: string | null;
  shortagePartId?: string | null;
}

export interface ShortageStats {
  waitCount: number;
  alternativeCount: number;
  skipCount: number;
  totalCount: number;
  waitReworkRate: number;
  alternativeReworkRate: number;
  skipReworkRate: number;
  waitScoreDeducted: number;
  alternativeScoreDeducted: number;
  skipScoreDeducted: number;
}

export interface GameRecord {
  id: string;
  levelId: string;
  score: number;
  stars: number;
  repairRate: number;
  completionRate: number;
  timestamp: number;
  timeUsedSeconds: number;
  totalVehicles: number;
  completedVehicles: number;
  reworkCount: number;
  skipCount: number;
  shortageWaitCount: number;
  shortageAlternativeCount: number;
  shortageSkipCount: number;
}

export interface VehicleWithDetails extends Vehicle {
  diagnoses: Diagnosis[];
  workOrders: WorkOrder[];
}
