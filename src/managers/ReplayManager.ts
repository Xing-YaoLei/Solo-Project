import { ReplaySession, ReplayFrame, GameResult, Level, PlayerAction } from '../models';

const STORAGE_KEY = 'replay_sessions';
const MAX_REPLAYS = 3;
const STALL_THRESHOLD_MS = 30000;

export class ReplayManager {
  private sessions: ReplaySession[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.sessions = JSON.parse(data) as ReplaySession[];
      }
    } catch {
      this.sessions = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions));
    } catch {
      // Storage full or unavailable
    }
  }

  saveReplay(level: Level, result: GameResult, actions: PlayerAction[]): ReplaySession {
    const frames: ReplayFrame[] = [];
    let cumulativeScore = 0;
    let cumulativeErrors = 0;

    result.actions.forEach((action, index) => {
      cumulativeScore += action.pointsEarned - action.pointsDeducted;
      if (!action.isCorrect) cumulativeErrors++;

      frames.push({
        timestamp: action.timestamp,
        stepIndex: index,
        action,
        score: Math.max(0, cumulativeScore),
        errorCount: cumulativeErrors
      });
    });

    const session: ReplaySession = {
      id: `replay_${Date.now()}`,
      levelId: level.id,
      result,
      frames,
      createdAt: new Date().toISOString()
    };

    this.sessions = [session, ...this.sessions].slice(0, MAX_REPLAYS);
    this.saveToStorage();

    return session;
  }

  getAllReplays(): ReplaySession[] {
    return this.sessions;
  }

  getReplayById(id: string): ReplaySession | undefined {
    return this.sessions.find((s) => s.id === id);
  }

  getReplaysByLevel(levelId: string): ReplaySession[] {
    return this.sessions.filter((s) => s.levelId === levelId);
  }

  getLatestReplay(): ReplaySession | undefined {
    return this.sessions[0];
  }

  getStallPoints(result: GameResult): Array<{
    stepNumber: number;
    stepPrompt: string;
    timeSpentMs: number;
    thresholdMs: number;
    isOverThreshold: boolean;
  }> {
    return result.actions.map((action) => ({
      stepNumber: result.actions.indexOf(action) + 1,
      stepPrompt: action.stepId,
      timeSpentMs: action.timeSpentMs,
      thresholdMs: STALL_THRESHOLD_MS,
      isOverThreshold: action.timeSpentMs >= STALL_THRESHOLD_MS
    }));
  }

  findStallDetails(result: GameResult, stepNumber: number, steps: any[]): {
    step: any;
    timeSpentMs: number;
    recommendedImprovement: string;
  } | null {
    const action = result.actions[stepNumber - 1];
    const step = steps[stepNumber - 1];

    if (!action || !step) return null;

    let recommendation = '';
    if (action.timeSpentMs >= STALL_THRESHOLD_MS * 2) {
      recommendation = '在此步骤严重卡顿，建议加强相关流程学习，多做同类练习';
    } else if (action.timeSpentMs >= STALL_THRESHOLD_MS) {
      recommendation = '在此步骤耗时较长，建议复习相关知识点';
    } else if (!action.isCorrect) {
      recommendation = '虽未超时但判断错误，需注意区分相似操作的适用场景';
    } else {
      recommendation = '表现正常';
    }

    return {
      step,
      timeSpentMs: action.timeSpentMs,
      recommendedImprovement: recommendation
    };
  }

  getReplayFrames(replayId: string): ReplayFrame[] {
    const session = this.getReplayById(replayId);
    return session?.frames ?? [];
  }

  clearAllReplays(): void {
    this.sessions = [];
    this.saveToStorage();
  }

  canSaveMoreReplays(): boolean {
    return this.sessions.length < MAX_REPLAYS;
  }

  getMaxReplays(): number {
    return MAX_REPLAYS;
  }

  getStallThreshold(): number {
    return STALL_THRESHOLD_MS;
  }
}
