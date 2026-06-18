import {
  GameState,
  Level,
  PlayerAction,
  TaskStep,
  ActionOption,
  GameResult,
  GamePhase
} from '../models';

export interface GameStateChangeListener {
  onStateChange?(state: GameState): void;
  onActionSubmitted?(action: PlayerAction, step: TaskStep): void;
  onGameComplete?(result: GameResult): void;
  onStepChange?(currentStep: TaskStep, stepIndex: number): void;
}

export class GameManager {
  private state: GameState;
  private listeners: Set<GameStateChangeListener> = new Set();
  private stepStartTime: number = 0;
  private readonly STALL_THRESHOLD_MS = 30000;
  private readonly POINTS_PER_CORRECT = 100;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      phase: 'menu',
      currentLevel: null,
      currentStepIndex: 0,
      actions: [],
      startTime: null,
      endTime: null,
      totalScore: 0,
      errorCount: 0,
      isPaused: false,
      isReplayMode: false,
      replaySpeed: 1,
      currentReplayIndex: 0
    };
  }

  addListener(listener: GameStateChangeListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: GameStateChangeListener): void {
    this.listeners.delete(listener);
  }

  private notifyStateChange(): void {
    this.listeners.forEach((l) => l.onStateChange?.(this.state));
  }

  private notifyActionSubmitted(action: PlayerAction, step: TaskStep): void {
    this.listeners.forEach((l) => l.onActionSubmitted?.(action, step));
  }

  private notifyGameComplete(result: GameResult): void {
    this.listeners.forEach((l) => l.onGameComplete?.(result));
  }

  private notifyStepChange(step: TaskStep, index: number): void {
    this.listeners.forEach((l) => l.onStepChange?.(step, index));
  }

  getState(): Readonly<GameState> {
    return this.state;
  }

  goToMenu(): void {
    this.state = this.createInitialState();
    this.notifyStateChange();
  }

  goToLevelSelect(): void {
    this.state.phase = 'level_select';
    this.notifyStateChange();
  }

  startLevel(level: Level): void {
    this.state = {
      ...this.createInitialState(),
      phase: 'briefing',
      currentLevel: level,
      startTime: Date.now()
    };
    this.notifyStateChange();
  }

  startGameplay(): void {
    if (!this.state.currentLevel) return;
    this.state.phase = 'playing';
    this.state.currentStepIndex = 0;
    this.stepStartTime = Date.now();
    const firstStep = this.state.currentLevel.task.steps[0];
    this.notifyStateChange();
    this.notifyStepChange(firstStep, 0);
  }

  getCurrentStep(): TaskStep | null {
    if (!this.state.currentLevel) return null;
    return this.state.currentLevel.task.steps[this.state.currentStepIndex] ?? null;
  }

  getTotalSteps(): number {
    return this.state.currentLevel?.task.steps.length ?? 0;
  }

  getElapsedTimeMs(): number {
    if (!this.state.startTime) return 0;
    return (this.state.endTime ?? Date.now()) - this.state.startTime;
  }

  submitAction(actionId: string): PlayerAction {
    const step = this.getCurrentStep();
    if (!step) {
      throw new Error('No current step');
    }

    const actionOption = step.availableActions.find((a) => a.id === actionId);
    if (!actionOption) {
      throw new Error(`Action ${actionId} not found`);
    }

    const timeSpentMs = Date.now() - this.stepStartTime;
    const isCorrect = actionOption.isCorrect;

    const action: PlayerAction = {
      stepId: step.id,
      actionId,
      isCorrect,
      timestamp: Date.now(),
      timeSpentMs,
      pointsEarned: isCorrect ? this.POINTS_PER_CORRECT : 0,
      pointsDeducted: isCorrect ? 0 : actionOption.penaltyPoints
    };

    this.state.actions.push(action);

    if (!isCorrect) {
      this.state.errorCount++;
    }

    this.state.totalScore = Math.max(0, this.state.totalScore + action.pointsEarned - action.pointsDeducted);

    this.notifyActionSubmitted(action, step);

    if (this.state.currentLevel && this.state.currentStepIndex < this.state.currentLevel.task.steps.length - 1) {
      this.state.currentStepIndex++;
      this.stepStartTime = Date.now();
      const nextStep = this.getCurrentStep()!;
      this.notifyStateChange();
      this.notifyStepChange(nextStep, this.state.currentStepIndex);
    } else {
      this.endGame();
    }

    return action;
  }

  getActionOption(actionId: string, step: TaskStep): ActionOption | undefined {
    return step.availableActions.find((a) => a.id === actionId);
  }

  private endGame(): void {
    this.state.endTime = Date.now();
    this.state.phase = 'result';
    const result = this.calculateResult();
    this.notifyStateChange();
    this.notifyGameComplete(result);
  }

  calculateResult(): GameResult {
    if (!this.state.currentLevel) {
      throw new Error('No active level');
    }

    const level = this.state.currentLevel;
    const task = level.task;
    const steps = task.steps;
    const maxScore = steps.length * this.POINTS_PER_CORRECT;
    const totalTimeMs = this.getElapsedTimeMs();
    const expectedTimeMs = task.expectedDurationSeconds * 1000;
    const accuracy = this.state.errorCount === 0 ? 100 : Math.max(0, 100 - (this.state.errorCount / steps.length) * 100);

    const errors = this.state.actions
      .filter((a) => !a.isCorrect)
      .map((a) => {
        const step = steps.find((s) => s.id === a.stepId)!;
        const wrongAction = step.availableActions.find((act) => act.id === a.actionId)!;
        const correctAction = step.availableActions.find((act) => act.isCorrect)!;
        return {
          stepNumber: step.stepNumber,
          stepPrompt: step.prompt,
          wrongAction: wrongAction.label,
          correctAction: correctAction.label,
          reason: wrongAction.feedbackWrong,
          timeSpentMs: a.timeSpentMs
        };
      });

    const stallPoints = this.state.actions
      .filter((a) => a.timeSpentMs >= this.STALL_THRESHOLD_MS)
      .map((a) => {
        const step = steps.find((s) => s.id === a.stepId)!;
        return {
          stepNumber: step.stepNumber,
          stepPrompt: step.prompt,
          timeSpentMs: a.timeSpentMs,
          thresholdMs: this.STALL_THRESHOLD_MS
        };
      });

    const grade = this.calculateGrade(this.state.totalScore, maxScore, totalTimeMs, expectedTimeMs);

    return {
      levelId: level.id,
      levelName: level.name,
      totalScore: this.state.totalScore,
      maxScore,
      accuracyPercentage: Math.round(accuracy),
      totalTimeMs,
      expectedTimeMs,
      errorCount: this.state.errorCount,
      actions: [...this.state.actions],
      errors,
      stallPoints,
      passed: grade !== 'F',
      grade,
      completedAt: new Date().toISOString()
    };
  }

  private calculateGrade(score: number, maxScore: number, timeMs: number, expectedMs: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
    const scoreRatio = score / maxScore;
    const timeBonus = timeMs <= expectedMs ? 0.1 : 0;
    const totalRatio = Math.min(1, scoreRatio + timeBonus);

    if (totalRatio >= 0.95 && this.state.errorCount === 0) return 'S';
    if (totalRatio >= 0.85) return 'A';
    if (totalRatio >= 0.70) return 'B';
    if (totalRatio >= 0.55) return 'C';
    if (totalRatio >= 0.40) return 'D';
    return 'F';
  }

  retryLevel(): void {
    if (this.state.currentLevel) {
      this.startLevel(this.state.currentLevel);
    }
  }

  getHint(): string | null {
    const step = this.getCurrentStep();
    return step?.hint ?? null;
  }

  formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
