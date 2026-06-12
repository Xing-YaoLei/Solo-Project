export interface Player {
  id: string;
  name: string;
  totalScore: number;
  currentLevel: number;
  createdAt: string;
}

export interface Save {
  id: string;
  playerId: string;
  gameState: GameState;
  savedAt: string;
}

export interface Level {
  id: string;
  name: string;
  difficulty: number;
  minScore: number;
  description: string;
  taskIds: string[];
  unlockHint: string;
  backgroundStory: string;
}

export interface Task {
  id: string;
  levelId: string;
  title: string;
  description: string;
  timeLimit: number;
  points: number;
  memberId: string;
  clueIds: string[];
  decisionIds: string[];
  correctDecisionId: string;
  errorCategory: string;
}

export interface Clue {
  id: string;
  taskId: string;
  title: string;
  content: string;
  type: 'transaction' | 'refund' | 'benefit' | 'profile';
  importance: number;
}

export interface Decision {
  id: string;
  taskId: string;
  text: string;
  consequence: string;
  isCorrect: boolean;
}

export interface GameState {
  currentLevelId: string | null;
  currentTaskId: string | null;
  score: number;
  timeRemaining: number;
  isPaused: boolean;
  isGameOver: boolean;
  decisionHistory: DecisionLog[];
  viewedClues: string[];
  hesitationStartTimes: Record<string, number>;
}

export interface GameRecord {
  id: string;
  playerId: string;
  levelId: string;
  memberId: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  avgDecisionTime: number;
  playedAt: string;
  errorCategories: Record<string, number>;
}

export interface DecisionLog {
  id: string;
  recordId: string;
  taskId: string;
  decisionId: string;
  isCorrect: boolean;
  hesitationTime: number;
  madeAt: string;
  errorReason: string;
}

export interface FailureReplay {
  id: string;
  recordId: string;
  memberId: string;
  replayIndex: number;
  timeline: ReplayEvent[];
  hesitationPoints: HesitationPoint[];
  createdAt: string;
}

export interface ReplayEvent {
  timestamp: number;
  type: 'clue_view' | 'decision_start' | 'decision_made' | 'task_start' | 'task_end';
  data: Record<string, unknown>;
}

export interface HesitationPoint {
  timestamp: number;
  duration: number;
  clueId?: string;
  description: string;
}

export interface UnlockedLevel {
  saveId: string;
  levelId: string;
  isUnlocked: boolean;
  bestScore: number;
  stars: number;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  completedLevels: number;
  renewalRate: number;
  rank: number;
}

export type ErrorCategory = 
  | 'missed_benefit_expiry'
  | 'wrong_refund_handling'
  | 'poor_recharge_timing'
  | 'ignored_member_pattern'
  | 'insufficient_clue_analysis';
