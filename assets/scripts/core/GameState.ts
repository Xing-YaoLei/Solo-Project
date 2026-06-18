export interface GameState {
  currentLevelId: string;
  currentPhase: GamePhase;
  currentApprovalIndex: number;
  score: number;
  totalMoney: number;
  timeRemaining: number;
  isPaused: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  viewedClueIds: string[];
  selectedChoices: Record<string, string>;
  documentChanges: Record<string, { quantity: number; unitPrice: number }>;
}

export type GamePhase = 'task_briefing' | 'clue_investigation' | 'document_editing' | 'approval' | 'result' | 'review';

export interface MismatchRecord {
  id: string;
  timestamp: number;
  levelId: string;
  itemId: string;
  itemName: string;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  cause: string;
  phase: string;
}

export interface ErrorRecord {
  id: string;
  timestamp: number;
  levelId: string;
  errorType: ErrorType;
  description: string;
  choiceId?: string;
  nodeId?: string;
  feedback: string;
}

export type ErrorType = 'wrong_choice' | 'quantity_mismatch' | 'price_mismatch' | 'total_mismatch' | 'process_error' | 'time_out';

export interface GameSessionRecord {
  id: string;
  levelId: string;
  startTime: number;
  endTime: number;
  duration: number;
  finalScore: number;
  finalMoney: number;
  isVictory: boolean;
  stars: number;
  mismatches: MismatchRecord[];
  errors: ErrorRecord[];
  choicesMade: Record<string, string>;
}
