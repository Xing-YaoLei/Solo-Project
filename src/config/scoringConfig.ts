import type { ScoringConfig } from './types';

const scoringConfig: ScoringConfig = {
  baseScorePerCorrect: 10,
  streakBonusMultiplier: 1.5,
  speedBonusThreshold: 3,
  speedBonusPoints: 5,
  errorPenalty: 15,
  timeDecayRate: 0.5,
};

export default scoringConfig;
