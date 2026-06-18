import type { Difficulty, Rating } from '../models';

export interface GameDimensions {
  width: number;
  height: number;
}

export interface PhysicsConfig {
  gravity: { x: number; y: number };
  friction: number;
  frictionAir: number;
  frictionStatic: number;
  restitution: number;
  density: number;
  enableSleeping: boolean;
}

export interface ColorTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  border: string;
  overlay: string;
}

export interface FontConfig {
  family: string;
  sizes: {
    tiny: string;
    small: string;
    medium: string;
    large: string;
    xlarge: string;
    huge: string;
  };
  weights: {
    normal: string;
    bold: string;
  };
}

export interface ScoringConfig {
  qualityWeight: number;
  costWeight: number;
  timeWeight: number;
  perfectThreshold: number;
  ratingThresholds: Record<Rating, number>;
}

export interface DifficultyConfig {
  timeMultiplier: number;
  costMultiplier: number;
  mistakePenaltyMultiplier: number;
  clueVisibility: number;
  materialDelayChance: number;
}

export interface TransitionConfig {
  duration: number;
  ease: string;
  fadeColor: string;
}

export interface GameConfigData {
  dimensions: GameDimensions;
  physics: PhysicsConfig;
  colors: ColorTheme;
  fonts: FontConfig;
  scoring: ScoringConfig;
  difficulty: Record<Difficulty, DifficultyConfig>;
  defaultDifficulty: Difficulty;
  transition: TransitionConfig;
  autoSaveInterval: number;
  maxSaveSlots: number;
}

export const GAME_DIMENSIONS: GameDimensions = {
  width: 1280,
  height: 720,
};

export const PHYSICS_CONFIG: PhysicsConfig = {
  gravity: { x: 0, y: 1 },
  friction: 0.1,
  frictionAir: 0.01,
  frictionStatic: 0.5,
  restitution: 0.2,
  density: 0.001,
  enableSleeping: true,
};

export const COLOR_THEME: ColorTheme = {
  primary: '#3B82F6',
  secondary: '#6366F1',
  accent: '#F59E0B',
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  border: '#334155',
  overlay: 'rgba(15, 23, 42, 0.85)',
};

export const FONT_CONFIG: FontConfig = {
  family: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
  sizes: {
    tiny: '12px',
    small: '14px',
    medium: '16px',
    large: '20px',
    xlarge: '24px',
    huge: '32px',
  },
  weights: {
    normal: '400',
    bold: '700',
  },
};

export const SCORING_CONFIG: ScoringConfig = {
  qualityWeight: 0.4,
  costWeight: 0.3,
  timeWeight: 0.3,
  perfectThreshold: 95,
  ratingThresholds: { S: 90, A: 80, B: 70, C: 60, D: 0 },
};

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    timeMultiplier: 1.5,
    costMultiplier: 0.8,
    mistakePenaltyMultiplier: 0.5,
    clueVisibility: 1.0,
    materialDelayChance: 0.1,
  },
  medium: {
    timeMultiplier: 1.0,
    costMultiplier: 1.0,
    mistakePenaltyMultiplier: 1.0,
    clueVisibility: 0.8,
    materialDelayChance: 0.3,
  },
  hard: {
    timeMultiplier: 0.7,
    costMultiplier: 1.2,
    mistakePenaltyMultiplier: 1.5,
    clueVisibility: 0.5,
    materialDelayChance: 0.5,
  },
};

export const TRANSITION_CONFIG: TransitionConfig = {
  duration: 300,
  ease: 'Power2',
  fadeColor: '#000000',
};

export const GAME_CONFIG: GameConfigData = {
  dimensions: GAME_DIMENSIONS,
  physics: PHYSICS_CONFIG,
  colors: COLOR_THEME,
  fonts: FONT_CONFIG,
  scoring: SCORING_CONFIG,
  difficulty: DIFFICULTY_CONFIG,
  defaultDifficulty: 'medium',
  transition: TRANSITION_CONFIG,
  autoSaveInterval: 30000,
  maxSaveSlots: 5,
};

export function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
}

export function calculateRating(score: number): Rating {
  const thresholds = SCORING_CONFIG.ratingThresholds;
  if (score >= thresholds.S) return 'S';
  if (score >= thresholds.A) return 'A';
  if (score >= thresholds.B) return 'B';
  if (score >= thresholds.C) return 'C';
  return 'D';
}

export function isPerfectScore(score: number): boolean {
  return score >= SCORING_CONFIG.perfectThreshold;
}
