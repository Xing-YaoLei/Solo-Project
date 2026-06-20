import type { ScoringConfig } from '@/config/types';

export class ScoringSystem {
  private config: ScoringConfig;
  private _score = 0;
  private _errors = 0;
  private _streak = 0;
  private _maxStreak = 0;
  private _totalCorrect = 0;
  private _totalAttempts = 0;
  private _startTime = 0;

  constructor(config: ScoringConfig) {
    this.config = config;
  }

  reset(): void {
    this._score = 0;
    this._errors = 0;
    this._streak = 0;
    this._maxStreak = 0;
    this._totalCorrect = 0;
    this._totalAttempts = 0;
    this._startTime = Date.now();
  }

  recordCorrect(): void {
    this._totalCorrect++;
    this._totalAttempts++;
    this._streak++;
    if (this._streak > this._maxStreak) this._maxStreak = this._streak;

    let points = this.config.baseScorePerCorrect;
    if (this._streak >= 3) {
      points = Math.floor(points * this.config.streakBonusMultiplier);
    }
    const elapsed = (Date.now() - this._startTime) / 1000;
    if (elapsed <= this.config.speedBonusThreshold) {
      points += this.config.speedBonusPoints;
    }
    this._score += points;
  }

  recordError(): void {
    this._errors++;
    this._totalAttempts++;
    this._streak = 0;
    this._score = Math.max(0, this._score - this.config.errorPenalty);
  }

  getVerificationEfficiency(): number {
    if (this._totalAttempts === 0) return 0;
    return this._totalCorrect / this._totalAttempts;
  }

  getSpeed(): number {
    return (Date.now() - this._startTime) / 1000;
  }

  get score() { return this._score; }
  get errors() { return this._errors; }
  get streak() { return this._streak; }
  get maxStreak() { return this._maxStreak; }
  get totalCorrect() { return this._totalCorrect; }
  get totalAttempts() { return this._totalAttempts; }
}
