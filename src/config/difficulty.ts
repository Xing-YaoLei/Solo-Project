import type { DifficultyConfig } from '@/types/config';
import type { DifficultyLevel } from '@/types/game';

export const defaultDifficultyConfig: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    totalTime: 600,
    pointCount: 8,
    faultProbability: 0.15,
    cleanProbability: 0.25,
    decisionTimeLimit: 15,
    eventFrequency: 1,
  },
  normal: {
    totalTime: 420,
    pointCount: 12,
    faultProbability: 0.25,
    cleanProbability: 0.35,
    decisionTimeLimit: 10,
    eventFrequency: 2,
  },
  hard: {
    totalTime: 300,
    pointCount: 16,
    faultProbability: 0.40,
    cleanProbability: 0.45,
    decisionTimeLimit: 7,
    eventFrequency: 3,
  },
};
