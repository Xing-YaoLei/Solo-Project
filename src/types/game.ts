import type { WorkOrder } from './level';

export type GamePhase = 'menu' | 'loading' | 'inspection' | 'contract' | 'meter' | 'review';

export interface ContractDecision {
  tenantId: string;
  optionId: string;
  timestamp: number;
}

export interface PlayerMeterReading {
  meterId: string;
  value: number;
  timestamp: number;
}

export interface WorkOrderResult {
  orderId: string;
  optionId: string;
  responseTime: number;
  isCorrect: boolean;
  retried: boolean;
}

export interface GameHistory {
  decisions: any[];
  totalTime: number;
  finalScore: number;
  timestamp: number;
}

export interface GameState {
  currentLevelId: string | null;
  currentPhase: GamePhase;
  score: number;
  startTime: number;
  phaseStartTime: number;
  totalTime: number;
  
  inspection: {
    observed: boolean;
    playerRoute: number[];
    score: number;
  };
  
  contracts: {
    currentIndex: number;
    decisions: (ContractDecision | null)[];
    score: number;
  };
  
  meters: {
    readings: (PlayerMeterReading | null)[];
    score: number;
  };
  
  workOrders: {
    activeOrders: WorkOrder[];
    completedOrders: WorkOrderResult[];
    timeoutCount: number;
  };
  
  history: GameHistory;
}

export interface ActiveWorkOrder extends WorkOrder {
  startTime: number;
  remainingTime: number;
  isRetrying: boolean;
}

export interface SettingsState {
  soundEnabled: boolean;
  musicEnabled: boolean;
  inputMode: 'auto' | 'touch' | 'keyboard';
  difficulty: number;
}

export interface KeyboardShortcut {
  keys: string[];
  enabled?: boolean;
  callback: (key: string) => void;
}
