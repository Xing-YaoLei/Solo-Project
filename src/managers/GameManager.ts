import type { GameState, LevelState, LevelConfig, VerificationRecord, EfficiencyPoint, ScoringRule } from '../types/game';
import { levels, sponsors, ticketTypes, generateRecords } from '../config/gameConfig';

export class GameManager {
  private static instance: GameManager;
  private gameState: GameState;
  private levelState: LevelState | null = null;

  private constructor() {
    this.gameState = {
      currentLevel: null,
      totalScore: 0,
      currentScene: 'BootScene',
      isPaused: false,
      soundEnabled: true,
      volume: 0.7,
    };
  }

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }

  getLevelState(): LevelState | null {
    return this.levelState ? { ...this.levelState } : null;
  }

  getLevels(): LevelConfig[] {
    return levels.map(l => ({ ...l }));
  }

  getLevelConfig(levelId: string): LevelConfig | undefined {
    return levels.find(l => l.id === levelId);
  }

  getSponsors(ids?: string[]): typeof sponsors {
    if (!ids) return sponsors;
    return sponsors.filter(s => ids.includes(s.id));
  }

  getTicketTypes(ids?: string[]): typeof ticketTypes {
    if (!ids) return ticketTypes;
    return ticketTypes.filter(t => ids.includes(t.id));
  }

  startLevel(levelId: string): boolean {
    const levelConfig = this.getLevelConfig(levelId);
    if (!levelConfig || !levelConfig.unlocked) return false;

    const levelSponsors = this.getSponsors(levelConfig.sponsorIds);
    const levelTickets = this.getTicketTypes(levelConfig.ticketTypeIds);
    const records = generateRecords(levelConfig);

    this.levelState = {
      levelId,
      sponsors: levelSponsors,
      tickets: levelTickets,
      records,
      currentRecordIndex: 0,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      disputeCount: 0,
      startTime: Date.now(),
      endTime: 0,
      efficiencyHistory: [],
      isDisputeActive: false,
      disputeRecordIndex: -1,
    };

    this.gameState.currentLevel = levelId;
    return true;
  }

  getCurrentRecord(): VerificationRecord | null {
    if (!this.levelState) return null;
    const { records, currentRecordIndex } = this.levelState;
    if (currentRecordIndex >= records.length) return null;
    return records[currentRecordIndex];
  }

  private getScoringRulesForRecord(record: VerificationRecord): ScoringRule[] {
    const ticket = ticketTypes.find(t => t.id === record.ticketType);
    return ticket?.scoringRules || [];
  }

  private calculatePoints(record: VerificationRecord, isCorrect: boolean): number {
    const rules = this.getScoringRulesForRecord(record);
    let points = 0;

    if (isCorrect) {
      const bonusRules = rules.filter(r => r.type === 'bonus');
      points = bonusRules.reduce((sum, r) => sum + r.points, 0);

      if (record.sponsorId) {
        const sponsor = sponsors.find(s => s.id === record.sponsorId);
        const ticket = ticketTypes.find(t => t.id === record.ticketType);
        if (sponsor && ticket) {
          const sponsorMatchRule = rules.find(r => r.condition.includes('赞助商'));
          if (sponsorMatchRule) {
            // already counted above
          }
        }
      }
    } else {
      const penaltyRules = rules.filter(r => r.type === 'penalty');
      points = penaltyRules.reduce((sum, r) => sum + r.points, 0);
    }

    return points;
  }

  verifyRecord(result: 'pass' | 'reject'): { correct: boolean; points: number; hasDispute: boolean; appliedRules: ScoringRule[] } {
    if (!this.levelState) return { correct: false, points: 0, hasDispute: false, appliedRules: [] };

    const record = this.getCurrentRecord();
    if (!record) return { correct: false, points: 0, hasDispute: false, appliedRules: [] };

    record.playerResult = result;
    record.isChecked = true;

    const isCorrect = (result === 'pass' && record.isValid) || (result === 'reject' && !record.isValid);
    const points = this.calculatePoints(record, isCorrect);
    const appliedRules = isCorrect
      ? this.getScoringRulesForRecord(record).filter(r => r.type === 'bonus')
      : this.getScoringRulesForRecord(record).filter(r => r.type === 'penalty');

    if (isCorrect) {
      this.levelState.correctCount++;
      this.levelState.score += points;
    } else {
      this.levelState.wrongCount++;
      this.levelState.score = Math.max(0, this.levelState.score + points);
    }

    this.updateEfficiencyHistory();

    const hasDispute = record.hasDispute && isCorrect;
    if (hasDispute) {
      this.levelState.isDisputeActive = true;
      this.levelState.disputeRecordIndex = this.levelState.currentRecordIndex;
      this.levelState.disputeCount++;
    }

    return { correct: isCorrect, points, hasDispute, appliedRules };
  }

  nextRecord(): boolean {
    if (!this.levelState) return false;
    this.levelState.currentRecordIndex++;
    this.levelState.isDisputeActive = false;
    
    if (this.levelState.currentRecordIndex >= this.levelState.records.length) {
      this.levelState.endTime = Date.now();
      return false;
    }
    return true;
  }

  resolveDispute(decision: 'uphold' | 'reverse'): { points: number } {
    if (!this.levelState) return { points: 0 };

    const record = this.levelState.records[this.levelState.disputeRecordIndex];
    if (!record) return { points: 0 };

    if (decision === 'uphold') {
      const rules = this.getScoringRulesForRecord(record).filter(r => r.type === 'bonus');
      const sponsorBonus = rules.find(r => r.condition.includes('赞助商'));
      const points = sponsorBonus ? sponsorBonus.points : 20;
      this.levelState.score += points;
      this.levelState.correctCount++;
      this.levelState.isDisputeActive = false;
      this.updateEfficiencyHistory();
      return { points };
    } else {
      this.levelState.isDisputeActive = false;
      this.levelState.records[this.levelState.disputeRecordIndex].isChecked = false;
      this.levelState.records[this.levelState.disputeRecordIndex].playerResult = undefined;
      this.levelState.currentRecordIndex = this.levelState.disputeRecordIndex;
      return { points: 0 };
    }
  }

  private updateEfficiencyHistory(): void {
    if (!this.levelState) return;

    const elapsed = (Date.now() - this.levelState.startTime) / 1000;
    const total = this.levelState.correctCount + this.levelState.wrongCount;
    const correctRate = total > 0 ? this.levelState.correctCount / total : 0;
    const speed = elapsed > 0 ? total / elapsed : 0;

    const point: EfficiencyPoint = {
      time: elapsed,
      correctRate,
      speed,
    };

    this.levelState.efficiencyHistory.push(point);
  }

  calculateStars(): number {
    if (!this.levelState) return 0;

    const config = this.getLevelConfig(this.levelState.levelId);
    if (!config) return 0;

    const scoreRatio = this.levelState.score / config.targetScore;
    
    if (scoreRatio >= 1.5) return 3;
    if (scoreRatio >= 1.0) return 2;
    if (scoreRatio >= 0.6) return 1;
    return 0;
  }

  completeLevel(): void {
    if (!this.levelState) return;

    const stars = this.calculateStars();
    const levelIndex = levels.findIndex(l => l.id === this.levelState!.levelId);
    
    if (levelIndex >= 0) {
      levels[levelIndex].stars = Math.max(levels[levelIndex].stars, stars);
      
      if (levelIndex + 1 < levels.length && stars >= 1) {
        levels[levelIndex + 1].unlocked = true;
      }
    }

    this.gameState.totalScore += this.levelState.score;
  }

  resetLevel(): void {
    if (this.gameState.currentLevel) {
      this.startLevel(this.gameState.currentLevel);
    }
  }

  setSoundEnabled(enabled: boolean): void {
    this.gameState.soundEnabled = enabled;
  }

  setVolume(volume: number): void {
    this.gameState.volume = Math.max(0, Math.min(1, volume));
  }
}
