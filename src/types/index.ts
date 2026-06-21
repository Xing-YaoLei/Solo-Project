export interface GameSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  tutorialCompleted: boolean;
}

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  duration: number;
  difficulty: 'easy' | 'normal' | 'hard';
  billCount: number;
  errorRate: number;
  payoutCycle: number;
  baseScore: number;
  unlocked: boolean;
}

export interface BillData {
  id: string;
  merchantName: string;
  orderCount: number;
  expectedAmount: number;
  actualAmount: number;
  hasDiscrepancy: boolean;
  discrepancyReason?: string;
  timestamp: number;
}

export interface GameStats {
  score: number;
  correctCount: number;
  wrongCount: number;
  combo: number;
  maxCombo: number;
  avgResponseTime: number;
  totalBills: number;
  levelId: number;
}

export interface LevelRecord {
  levelId: number;
  levelName: string;
  bestScore: number;
  bestCombo: number;
  accuracy: number;
  payoutCycle: number;
  playCount: number;
}

export type GameScene = 'boot' | 'mainMenu' | 'levelSelect' | 'game' | 'review' | 'tutorial' | 'settings';
