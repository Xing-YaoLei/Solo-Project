import { _decorator, log, error } from 'cc';
import { GameState, GamePhase, GameSessionRecord, MismatchRecord, ErrorRecord, ErrorType } from '../core/GameState';
import { LevelConfig } from '../core/LevelTypes';
import { DataManager } from './DataManager';
import { LevelManager } from './LevelManager';
import { EventManager, GameEvents } from '../utils/EventManager';
import { ScoreManager } from './ScoreManager';

export class GameManager {
  private static _instance: GameManager | null = null;
  private _gameState: GameState | null = null;
  private _currentLevel: LevelConfig | null = null;
  private _startTime: number = 0;
  private _sessionStartTime: number = 0;
  private _timerInterval: any = null;
  private _isRunning: boolean = false;
  private _inited = false;

  public static get instance(): GameManager {
    if (!this._instance) {
      this._instance = new GameManager();
    }
    return this._instance;
  }

  public get gameState(): GameState | null {
    return this._gameState;
  }

  public get currentLevel(): LevelConfig | null {
    return this._currentLevel;
  }

  public get isRunning(): boolean {
    return this._isRunning;
  }

  public init(): void {
    if (this._inited) return;
    this._inited = true;
    LevelManager.instance.init();
    ScoreManager.instance.init();
    log('[GameManager] Initialized');
  }

  public startLevel(levelId: string): boolean {
    const levelConfig = DataManager.instance.getLevel(levelId);
    if (!levelConfig) {
      error(`[GameManager] Level ${levelId} not found`);
      return false;
    }

    if (!LevelManager.instance.isLevelUnlocked(levelId)) {
      error(`[GameManager] Level ${levelId} is locked`);
      return false;
    }

    this._currentLevel = levelConfig;
    this._sessionStartTime = Date.now();

    this._gameState = {
      currentLevelId: levelId,
      currentPhase: 'task_briefing',
      currentApprovalIndex: 0,
      score: 0,
      totalMoney: levelConfig.task.baseReward,
      timeRemaining: levelConfig.task.timeLimit,
      isPaused: false,
      isGameOver: false,
      isVictory: false,
      viewedClueIds: [],
      selectedChoices: {},
      documentChanges: {},
    };

    ScoreManager.instance.startSession(levelId);

    EventManager.instance.emit(GameEvents.GAME_START, levelConfig);
    EventManager.instance.emit(GameEvents.PHASE_CHANGED, 'task_briefing');

    log(`[GameManager] Started level: ${levelId}`);
    return true;
  }

  public startGameplay(): void {
    if (!this._gameState || !this._currentLevel) return;

    this._startTime = Date.now();
    this._isRunning = true;
    this.startTimer();
    this.changePhase('clue_investigation');
  }

  private startTimer(): void {
    this.stopTimer();
    this._timerInterval = setInterval(() => {
      if (this._gameState && !this._gameState.isPaused && this._isRunning) {
        this._gameState.timeRemaining -= 1;
        EventManager.instance.emit(GameEvents.TIME_TICK, this._gameState.timeRemaining);

        if (this._gameState.timeRemaining <= 0) {
          this._gameState.timeRemaining = 0;
          this.gameOver('time_out');
        }
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }

  public pauseGame(): void {
    if (!this._gameState || this._gameState.isPaused) return;
    this._gameState.isPaused = true;
    EventManager.instance.emit(GameEvents.GAME_PAUSE);
  }

  public resumeGame(): void {
    if (!this._gameState || !this._gameState.isPaused) return;
    this._gameState.isPaused = false;
    EventManager.instance.emit(GameEvents.GAME_RESUME);
  }

  public changePhase(phase: GamePhase): void {
    if (!this._gameState) return;
    this._gameState.currentPhase = phase;
    EventManager.instance.emit(GameEvents.PHASE_CHANGED, phase);
    log(`[GameManager] Phase changed: ${phase}`);
  }

  public viewClue(clueId: string): void {
    if (!this._gameState) return;
    if (!this._gameState.viewedClueIds.includes(clueId)) {
      this._gameState.viewedClueIds.push(clueId);
      EventManager.instance.emit(GameEvents.CLUE_VIEWED, clueId);
    }
  }

  public goToDocumentEditing(): void {
    this.changePhase('document_editing');
  }

  public updateDocumentItem(itemId: string, quantity: number, unitPrice: number): void {
    if (!this._gameState || !this._currentLevel) return;

    this._gameState.documentChanges[itemId] = { quantity, unitPrice };
    EventManager.instance.emit(GameEvents.DOCUMENT_UPDATED, itemId, quantity, unitPrice);

    this.checkDocumentMismatch(itemId, quantity, unitPrice);
  }

  private checkDocumentMismatch(itemId: string, quantity: number, unitPrice: number): void {
    if (!this._currentLevel || !this._gameState) return;

    const item = this._currentLevel.document.items.find(i => i.id === itemId);
    if (!item) return;

    const actualAmount = quantity * unitPrice;
    const expectedAmount = (item.correctQuantity ?? item.quantity) * (item.correctUnitPrice ?? item.unitPrice);
    const diff = Math.abs(actualAmount - expectedAmount);
    const tolerance = item.tolerance * expectedAmount;

    if (diff > tolerance && diff > 0) {
      const mismatch: MismatchRecord = {
        id: `mismatch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        levelId: this._gameState.currentLevelId,
        itemId,
        itemName: item.name,
        expectedAmount,
        actualAmount,
        difference: actualAmount - expectedAmount,
        cause: this.getMismatchCause(item, quantity, unitPrice),
        phase: this._gameState.currentPhase,
      };

      ScoreManager.instance.recordMismatch(mismatch);
      EventManager.instance.emit(GameEvents.MISMATCH_DETECTED, mismatch);
    }
  }

  private getMismatchCause(item: any, quantity: number, unitPrice: number): string {
    const expectedQty = item.correctQuantity ?? item.quantity;
    const expectedPrice = item.correctUnitPrice ?? item.unitPrice;

    if (Math.abs(quantity - expectedQty) > 0.01) {
      return '数量填写错误';
    }
    if (Math.abs(unitPrice - expectedPrice) > 0.01) {
      return '单价填写错误';
    }
    return '金额计算错误';
  }

  public goToApproval(): void {
    this.changePhase('approval');
  }

  public makeChoice(choiceId: string): void {
    if (!this._gameState || !this._currentLevel) return;

    const currentNode = this._currentLevel.approvalNodes[this._gameState.currentApprovalIndex];
    if (!currentNode) return;

    const choice = currentNode.choices.find(c => c.id === choiceId);
    if (!choice) return;

    this._gameState.selectedChoices[currentNode.id] = choiceId;
    ScoreManager.instance.recordChoice(currentNode.id, choiceId);

    const scoreDelta = choice.scoreDelta;
    const moneyDelta = choice.moneyDelta;

    this._gameState.score += scoreDelta;
    this._gameState.totalMoney += moneyDelta;

    EventManager.instance.emit(GameEvents.SCORE_CHANGED, this._gameState.score);
    EventManager.instance.emit(GameEvents.MONEY_CHANGED, this._gameState.totalMoney);
    EventManager.instance.emit(GameEvents.CHOICE_MADE, choiceId, choice);

    if (!choice.isCorrect) {
      const error: ErrorRecord = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        levelId: this._gameState.currentLevelId,
        errorType: 'wrong_choice',
        description: choice.feedback,
        choiceId,
        nodeId: currentNode.id,
        feedback: choice.feedback,
      };
      ScoreManager.instance.recordError(error);
      EventManager.instance.emit(GameEvents.ERROR_RECORDED, error);
    }

    if (choice.nextNodeId) {
      const nextIndex = this._currentLevel.approvalNodes.findIndex(n => n.id === choice.nextNodeId);
      if (nextIndex >= 0) {
        this._gameState.currentApprovalIndex = nextIndex;
      }
    }
  }

  public advanceApproval(): void {
    if (!this._gameState || !this._currentLevel) return;

    const nextIndex = this._gameState.currentApprovalIndex + 1;
    if (nextIndex >= this._currentLevel.approvalNodes.length) {
      this.checkVictory();
    } else {
      this._gameState.currentApprovalIndex = nextIndex;
    }
  }

  private checkVictory(): void {
    if (!this._gameState || !this._currentLevel) return;

    const totalScore = this.calculateFinalScore();
    this._gameState.score = totalScore;

    const isVictory = totalScore >= this._currentLevel.starThresholds[0];
    this._gameState.isVictory = isVictory;
    this._gameState.isGameOver = true;

    if (isVictory) {
      this.victory();
    } else {
      this.gameOver('low_score');
    }
  }

  private calculateFinalScore(): number {
    if (!this._gameState || !this._currentLevel) return 0;

    let score = this._gameState.score;

    const timeBonus = Math.floor(this._gameState.timeRemaining * 2);
    score += timeBonus;

    const totalMismatches = ScoreManager.instance.currentMismatches.length;
    score -= totalMismatches * 50;

    const totalErrors = ScoreManager.instance.currentErrors.length;
    score -= totalErrors * 30;

    return Math.max(0, score);
  }

  private victory(): void {
    if (!this._gameState || !this._currentLevel) return;

    this._isRunning = false;
    this.stopTimer();

    const duration = Math.floor((Date.now() - this._sessionStartTime) / 1000);
    const stars = LevelManager.instance.calculateStars(this._gameState.score, this._currentLevel.starThresholds);

    const progress = LevelManager.instance.updateLevelProgress(
      this._gameState.currentLevelId,
      this._gameState.score,
      duration,
      true
    );

    this.unlockNextLevel();

    const sessionRecord = ScoreManager.instance.endSession(
      true,
      stars,
      this._gameState.score,
      this._gameState.totalMoney
    );

    EventManager.instance.emit(GameEvents.GAME_VICTORY, {
      score: this._gameState.score,
      stars,
      money: this._gameState.totalMoney,
      time: duration,
      progress,
      sessionRecord,
    });

    this.changePhase('result');
    log(`[GameManager] Victory! Score: ${this._gameState.score}, Stars: ${stars}`);
  }

  private gameOver(reason: string): void {
    if (!this._gameState || !this._currentLevel) return;

    this._isRunning = false;
    this.stopTimer();
    this._gameState.isGameOver = true;
    this._gameState.isVictory = false;

    const duration = Math.floor((Date.now() - this._sessionStartTime) / 1000);

    let errorType: ErrorType = 'process_error';
    if (reason === 'time_out') {
      errorType = 'time_out';
    }

    const error: ErrorRecord = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      levelId: this._gameState.currentLevelId,
      errorType,
      description: reason,
      feedback: this.getGameOverFeedback(reason),
    };
    ScoreManager.instance.recordError(error);

    LevelManager.instance.updateLevelProgress(
      this._gameState.currentLevelId,
      this._gameState.score,
      duration,
      false
    );

    const sessionRecord = ScoreManager.instance.endSession(
      false,
      0,
      this._gameState.score,
      this._gameState.totalMoney
    );

    EventManager.instance.emit(GameEvents.GAME_OVER, {
      score: this._gameState.score,
      money: this._gameState.totalMoney,
      time: duration,
      reason,
      sessionRecord,
    });

    this.changePhase('result');
    log(`[GameManager] Game over. Reason: ${reason}, Score: ${this._gameState.score}`);
  }

  private getGameOverFeedback(reason: string): string {
    switch (reason) {
      case 'time_out':
        return '时间用完了！合理分配时间很重要，注意看线索和做选择的节奏。';
      case 'low_score':
        return '分数不足！仔细分析每条线索，注意单据明细的准确性。';
      default:
        return '任务失败了，再接再厉！';
    }
  }

  private unlockNextLevel(): void {
    if (!this._currentLevel) return;

    const allLevels = DataManager.instance.getAllLevels();
    const currentIndex = allLevels.findIndex(l => l.id === this._currentLevel!.id);

    if (currentIndex >= 0 && currentIndex < allLevels.length - 1) {
      const nextLevel = allLevels[currentIndex + 1];
      if (nextLevel.difficulty <= this._currentLevel.difficulty + 1) {
        LevelManager.instance.unlockLevel(nextLevel.id);
        EventManager.instance.emit(GameEvents.LEVEL_UNLOCKED, nextLevel.id);
        log(`[GameManager] Unlocked level: ${nextLevel.id}`);
      }
    }
  }

  public restartLevel(): void {
    if (!this._gameState) return;
    this.stopTimer();
    this.startLevel(this._gameState.currentLevelId);
  }

  public showReview(): void {
    this.changePhase('review');
  }

  public exitToMenu(): void {
    this.stopTimer();
    this._isRunning = false;
    this._gameState = null;
    this._currentLevel = null;
    EventManager.instance.emit(GameEvents.UI_SHOW_MENU);
  }

  public getSessionRecord(): GameSessionRecord | null {
    return ScoreManager.instance.lastSessionRecord;
  }

  public getCurrentNode(): any {
    if (!this._gameState || !this._currentLevel) return null;
    return this._currentLevel.approvalNodes[this._gameState.currentApprovalIndex] || null;
  }

  public getDocumentItems(): any[] {
    if (!this._currentLevel) return [];
    return this._currentLevel.document.items;
  }

  public getClues(): any[] {
    if (!this._currentLevel) return [];
    return this._currentLevel.clues;
  }
}
