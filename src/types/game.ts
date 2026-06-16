export interface Medicine {
  id: string;
  name: string;
  category: string;
  color: string;
  icon: string;
  photoUrl: string;
}

export type PromotionRuleType = 'category-zone' | 'endcap' | 'stack' | 'price-tag';

export interface PromotionRule {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: PromotionRuleType;
  targetPositions: { row: number; col: number }[];
  targetCategory?: string;
  targetMedicineId?: string;
  points: number;
}

export interface ShelfCell {
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  occupiedBy: string | null;
  isHighlighted: boolean;
  isCorrect?: boolean;
  isError?: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Level {
  id: number;
  name: string;
  description: string;
  difficulty: Difficulty;
  timeLimit: number;
  shelfRows: number;
  shelfCols: number;
  promotionRules: string[];
  medicines: string[];
  targetScore: number;
}

export interface GameState {
  currentLevelId: number;
  timeRemaining: number;
  score: number;
  combo: number;
  maxCombo: number;
  errors: number;
  totalPlacements: number;
  correctPlacements: number;
  startTime: number;
  placementTimes: number[];
  lastPlacementTime: number;
  isPaused: boolean;
  isGameOver: boolean;
}

export interface GameResult {
  levelId: number;
  levelName: string;
  totalScore: number;
  speedScore: number;
  accuracyScore: number;
  comboScore: number;
  timeTaken: number;
  errors: number;
  maxCombo: number;
  correctCount: number;
  totalCount: number;
  promotionAchievement: Record<string, number>;
  timestamp: number;
  isWin: boolean;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  animationEnabled: boolean;
  vibrationEnabled: boolean;
  volume: number;
}

export interface LevelProgress {
  levelId: number;
  bestScore: number;
  bestStars: number;
  completed: boolean;
  playCount: number;
}

export interface PlayerData {
  levelProgress: Record<number, LevelProgress>;
  gameHistory: GameResult[];
  totalScore: number;
  totalPlays: number;
}

export interface DisplayCardData {
  id: string;
  medicineId: string;
  medicine: Medicine;
  isPlaced: boolean;
  isSelected: boolean;
  isDragging: boolean;
  placedCell?: { row: number; col: number };
}

export interface PlacementResult {
  isCorrect: boolean;
  matchedRule?: PromotionRule;
  points: number;
  message: string;
}

export type SceneKey = 'Boot' | 'Preload' | 'MainMenu' | 'Game' | 'Result' | 'Review' | 'Settings';

export const SCENE_KEYS: Record<SceneKey, SceneKey> = {
  Boot: 'Boot',
  Preload: 'Preload',
  MainMenu: 'MainMenu',
  Game: 'Game',
  Result: 'Result',
  Review: 'Review',
  Settings: 'Settings',
};
