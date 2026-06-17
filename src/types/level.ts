export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type TenantType = 'office' | 'retail' | 'restaurant' | 'warehouse';

export type CreditRating = 'A' | 'B' | 'C';

export type ApprovalType = 'approve' | 'reject' | 'negotiate' | 'escalate';

export type WorkOrderType = 'repair' | 'complaint' | 'maintenance' | 'emergency';

export type Urgency = 'low' | 'medium' | 'high' | 'critical';

export interface PatrolPoint {
  id: string;
  x: number;
  y: number;
  name: string;
  description: string;
}

export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  industry: string;
  size: string;
  area: number;
  rentOffer: number;
  contractTerm: number;
  deposit: number;
  businessScope: string;
  creditRating: CreditRating;
  specialRequirements?: string;
}

export interface ApprovalOption {
  id: string;
  label: string;
  type: ApprovalType;
  description: string;
  requiresComment: boolean;
}

export interface MeterReading {
  id: string;
  location: string;
  tenantId: string;
  previousReading: number;
  currentReading: number;
  correctReading: number;
  displayValue: number;
  tolerance: number;
}

export interface WorkOrderOption {
  id: string;
  label: string;
  description: string;
}

export interface WorkOrder {
  id: string;
  type: WorkOrderType;
  title: string;
  description: string;
  urgency: Urgency;
  triggerAt: number;
  options: WorkOrderOption[];
  correctOptionId: string;
}

export interface HistoryEntry {
  phase: string;
  action: string;
  time: number;
  correct: boolean;
  details: Record<string, unknown>;
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  timeLimit: number;
  
  inspection: {
    mapLayout: string;
    patrolPoints: PatrolPoint[];
    patrolRoute: number[];
    observeTime: number;
    memoryTest: boolean;
  };
  
  contracts: {
    tenants: Tenant[];
    approvalOptions: ApprovalOption[];
    correctAnswers: Record<string, string>;
    timePerContract: number;
  };
  
  meters: {
    waterMeters: MeterReading[];
    electricMeters: MeterReading[];
    unitPrices: {
      water: number;
      electric: number;
    };
    tolerance: number;
  };
  
  workOrders: {
    enabled: boolean;
    orders: WorkOrder[];
    timeout: number;
    retryPenalty: number;
  };
  
  scoring: {
    inspectionWeight: number;
    contractWeight: number;
    meterWeight: number;
    speedBonus: number;
    accuracyBonus: number;
  };
}
