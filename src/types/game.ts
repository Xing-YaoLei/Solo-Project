export type Subject = 'math' | 'chinese' | 'english' | 'physics' | 'chemistry' | 'biology' | 'history' | 'geography';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameMode = 'formal' | 'free';

export interface SubjectInfo {
  id: Subject;
  name: string;
  color: string;
  icon: string;
}

export interface TextbookItem {
  id: string;
  subject: Subject;
  grade: number;
  label: string;
  quantity: number;
  targetSlot: number;
}

export interface Slot {
  id: number;
  subject: Subject;
  grade: number;
  capacity: number;
  current: number;
}

export interface LevelConfig {
  id: string;
  name: string;
  mode: GameMode;
  difficulty: Difficulty;
  description: string;
  duration: number;
  textbookCount: number;
  slotCount: number;
  subjects: Subject[];
  gradeRange: [number, number];
  minAccuracy: number;
  minCombo: number;
  timeBonusMultiplier: number;
  accuracyBonusMultiplier: number;
  comboBonusMultiplier: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  soundVolume: number;
  vibrationEnabled: boolean;
  animationIntensity: 'off' | 'low' | 'medium' | 'high';
  showHints: boolean;
}

export interface GameStats {
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  currentCombo: number;
  maxCombo: number;
  totalTime: number;
  timeRemaining: number;
  score: number;
  timeBonus: number;
  accuracyBonus: number;
  comboBonus: number;
  completionRate: number;
  completed: boolean;
  passed: boolean;
}

export interface LevelRecord {
  levelId: string;
  levelName: string;
  mode: GameMode;
  attempts: number;
  bestScore: number;
  bestAccuracy: number;
  bestCombo: number;
  bestTime: number;
  avgCompletionRate: number;
  lastPlayed: number;
}

export interface GameState {
  textbooks: TextbookItem[];
  slots: Slot[];
  selectedTextbookId: string | null;
  stats: GameStats;
  isRunning: boolean;
  isPaused: boolean;
}
