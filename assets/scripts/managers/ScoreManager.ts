import { GameSessionRecord, MismatchRecord, ErrorRecord } from '../core/GameState';
import { StorageManager } from '../utils/StorageManager';

export class ScoreManager {
  private static _instance: ScoreManager | null = null;

  private _currentLevelId: string = '';
  private _sessionStartTime: number = 0;
  private _currentMismatches: MismatchRecord[] = [];
  private _currentErrors: ErrorRecord[] = [];
  private _currentChoices: Record<string, string> = {};
  private _inited = false;

  private _lastSessionRecord: GameSessionRecord | null = null;
  private _sessionHistory: GameSessionRecord[] = [];

  public static get instance(): ScoreManager {
    if (!this._instance) {
      this._instance = new ScoreManager();
    }
    return this._instance;
  }

  public get currentMismatches(): MismatchRecord[] {
    return [...this._currentMismatches];
  }

  public get currentErrors(): ErrorRecord[] {
    return [...this._currentErrors];
  }

  public get lastSessionRecord(): GameSessionRecord | null {
    return this._lastSessionRecord;
  }

  public init(): void {
    if (this._inited) return;
    this._inited = true;
    this._sessionHistory = StorageManager.instance.load<GameSessionRecord[]>('session_history', []);
  }

  public startSession(levelId: string): void {
    this._currentLevelId = levelId;
    this._sessionStartTime = Date.now();
    this._currentMismatches = [];
    this._currentErrors = [];
    this._currentChoices = {};
  }

  public endSession(isVictory: boolean, stars: number, baseScore: number = 1000, totalMoney: number = 0): GameSessionRecord {
    const endTime = Date.now();
    const duration = Math.floor((endTime - this._sessionStartTime) / 1000);

    const finalScore = this.calculateFinalScore(baseScore);

    const record: GameSessionRecord = {
      id: `session_${this._sessionStartTime}_${Math.random().toString(36).substr(2, 9)}`,
      levelId: this._currentLevelId,
      startTime: this._sessionStartTime,
      endTime,
      duration,
      finalScore,
      finalMoney: totalMoney,
      isVictory,
      stars,
      mismatches: [...this._currentMismatches],
      errors: [...this._currentErrors],
      choicesMade: { ...this._currentChoices },
    };

    this._lastSessionRecord = record;
    this._sessionHistory.push(record);
    this.saveHistory();

    return record;
  }

  private calculateFinalScore(baseScore: number): number {
    let score = baseScore;
    score -= this._currentMismatches.length * 50;
    score -= this._currentErrors.length * 30;
    return Math.max(0, score);
  }

  public recordMismatch(mismatch: MismatchRecord): void {
    this._currentMismatches.push(mismatch);
  }

  public recordError(error: ErrorRecord): void {
    this._currentErrors.push(error);
  }

  public recordChoice(nodeId: string, choiceId: string): void {
    this._currentChoices[nodeId] = choiceId;
  }

  private saveHistory(): void {
    const recentHistory = this._sessionHistory.slice(-100);
    StorageManager.instance.save('session_history', recentHistory);
  }

  public getSessionHistory(levelId?: string, limit: number = 20): GameSessionRecord[] {
    let history = [...this._sessionHistory];
    if (levelId) {
      history = history.filter(s => s.levelId === levelId);
    }
    history.sort((a, b) => b.endTime - a.endTime);
    return history.slice(0, limit);
  }

  public getBestScores(levelId: string, limit: number = 10): GameSessionRecord[] {
    const history = this._sessionHistory.filter(s => s.levelId === levelId && s.isVictory);
    history.sort((a, b) => b.finalScore - a.finalScore);
    return history.slice(0, limit);
  }

  public getMismatchSummary(levelId: string): {
    totalMismatches: number;
    byItem: Record<string, number>;
    byPhase: Record<string, number>;
  } {
    const sessions = this._sessionHistory.filter(s => s.levelId === levelId);
    const byItem: Record<string, number> = {};
    const byPhase: Record<string, number> = {};
    let total = 0;

    for (const session of sessions) {
      for (const mismatch of session.mismatches) {
        total++;
        byItem[mismatch.itemId] = (byItem[mismatch.itemId] || 0) + 1;
        byPhase[mismatch.phase] = (byPhase[mismatch.phase] || 0) + 1;
      }
    }

    return { totalMismatches: total, byItem, byPhase };
  }

  public getErrorSummary(levelId: string): {
    totalErrors: number;
    byType: Record<string, number>;
    byNode: Record<string, number>;
  } {
    const sessions = this._sessionHistory.filter(s => s.levelId === levelId);
    const byType: Record<string, number> = {};
    const byNode: Record<string, number> = {};
    let total = 0;

    for (const session of sessions) {
      for (const error of session.errors) {
        total++;
        byType[error.errorType] = (byType[error.errorType] || 0) + 1;
        if (error.nodeId) {
          byNode[error.nodeId] = (byNode[error.nodeId] || 0) + 1;
        }
      }
    }

    return { totalErrors: total, byType, byNode };
  }

  public getRecoveryAnalysis(levelId: string): {
    avgRecoveryTime: number;
    successRate: number;
    totalAttempts: number;
  } {
    const sessions = this._sessionHistory.filter(s => s.levelId === levelId);
    const totalAttempts = sessions.length;
    const victories = sessions.filter(s => s.isVictory).length;
    const successRate = totalAttempts > 0 ? victories / totalAttempts : 0;

    let totalRecoveryTime = 0;
    let recoveryCount = 0;

    for (let i = 1; i < sessions.length; i++) {
      const prev = sessions[i - 1];
      const curr = sessions[i];
      if (!prev.isVictory && curr.isVictory) {
        totalRecoveryTime += curr.duration;
        recoveryCount++;
      }
    }

    const avgRecoveryTime = recoveryCount > 0 ? totalRecoveryTime / recoveryCount : 0;

    return { avgRecoveryTime, successRate, totalAttempts };
  }

  public getImprovementSuggestions(): string[] {
    const suggestions: string[] = [];
    if (this._currentMismatches.length > 2) {
      suggestions.push('仔细阅读每条线索，特别是与价格和数量相关的信息');
      suggestions.push('填写单据时多检查几遍，确保数量和单价正确');
    }
    if (this._currentErrors.length > 2) {
      suggestions.push('审批环节要谨慎思考，不要急于做选择');
      suggestions.push('多练习类似的审批场景，积累经验');
    }
    if (suggestions.length === 0) {
      suggestions.push('表现很棒！继续保持');
      suggestions.push('可以尝试挑战更高难度的关卡');
    }
    return suggestions;
  }

  public clearHistory(): void {
    this._sessionHistory = [];
    StorageManager.instance.remove('session_history');
  }
}
