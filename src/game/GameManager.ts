import { GameState, Level, GameMode, GameError, PlayerAnswers, GameAction } from './types';

class GameManager {
  private state: GameState;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      currentLevel: null,
      gameMode: 'training',
      startTime: 0,
      endTime: null,
      score: 100,
      errors: [],
      playerAnswers: {
        utilityJudgment: false,
        inspectionMarks: {},
        paymentJudgment: false,
        selectedAction: null,
        deductionAmount: 0
      }
    };
  }

  startLevel(level: Level, mode: GameMode): void {
    this.state = this.createInitialState();
    this.state.currentLevel = level;
    this.state.gameMode = mode;
    this.state.startTime = Date.now();
  }

  getState(): GameState {
    return this.state;
  }

  getCurrentLevel(): Level | null {
    return this.state.currentLevel;
  }

  getGameMode(): GameMode {
    return this.state.gameMode;
  }

  getElapsedTime(): number {
    if (!this.state.startTime) return 0;
    const endTime = this.state.endTime || Date.now();
    return Math.floor((endTime - this.state.startTime) / 1000);
  }

  setUtilityJudgment(judgment: boolean): void {
    this.state.playerAnswers.utilityJudgment = judgment;
  }

  toggleInspectionItem(itemId: string): void {
    this.state.playerAnswers.inspectionMarks[itemId] = 
      !this.state.playerAnswers.inspectionMarks[itemId];
  }

  setPaymentJudgment(judgment: boolean): void {
    this.state.playerAnswers.paymentJudgment = judgment;
  }

  setSelectedAction(action: GameAction, deductionAmount: number = 0): void {
    this.state.playerAnswers.selectedAction = action;
    this.state.playerAnswers.deductionAmount = deductionAmount;
  }

  calculateScore(): { score: number; errors: GameError[]; timeBonus: number } {
    const { currentLevel, playerAnswers } = this.state;
    if (!currentLevel) return { score: 0, errors: [], timeBonus: 0 };

    const errors: GameError[] = [];
    let totalDeduction = 0;

    if (playerAnswers.utilityJudgment !== currentLevel.utilityData.hasAbnormality) {
      const error: GameError = {
        type: 'utility',
        description: '水电异常判断错误',
        correctAnswer: currentLevel.utilityData.hasAbnormality ? '存在异常' : '无异常',
        playerAnswer: playerAnswers.utilityJudgment ? '存在异常' : '无异常',
        pointDeduction: 20
      };
      errors.push(error);
      totalDeduction += 20;
    }

    currentLevel.inspectionItems.forEach(item => {
      const shouldMark = item.status !== 'normal';
      const playerMarked = !!playerAnswers.inspectionMarks[item.id];

      if (shouldMark !== playerMarked) {
        const error: GameError = {
          type: 'inspection',
          itemId: item.id,
          description: playerMarked 
            ? `误判：${item.name} - 标记为异常但实际正常`
            : `漏判：${item.name} - ${item.status === 'damaged' ? '损坏' : item.status === 'missing' ? '缺失' : '脏污'}未检出`,
          correctAnswer: shouldMark ? '应标记为异常' : '应为正常',
          playerAnswer: playerMarked ? '标记为异常' : '标记为正常',
          pointDeduction: 10
        };
        errors.push(error);
        totalDeduction += 10;
      }
    });

    const hasPaymentIssue = currentLevel.paymentRecords.some(
      r => r.status === 'overdue' || r.status === 'partial'
    );
    if (playerAnswers.paymentJudgment !== hasPaymentIssue) {
      const error: GameError = {
        type: 'payment',
        description: '收款流水判断错误',
        correctAnswer: hasPaymentIssue ? '存在收款问题' : '收款正常',
        playerAnswer: playerAnswers.paymentJudgment ? '存在收款问题' : '收款正常',
        pointDeduction: 20
      };
      errors.push(error);
      totalDeduction += 20;
    }

    if (playerAnswers.selectedAction !== currentLevel.correctAction) {
      const actionLabels: Record<GameAction, string> = {
        'full_refund': '全额退还押金',
        'partial_deduction': '部分扣除押金',
        'full_deduction': '全额扣除押金',
        'escalate': '上报上级处理'
      };
      const error: GameError = {
        type: 'action',
        description: '最终处理动作判断错误',
        correctAnswer: actionLabels[currentLevel.correctAction],
        playerAnswer: playerAnswers.selectedAction ? actionLabels[playerAnswers.selectedAction] : '未选择',
        pointDeduction: 30
      };
      errors.push(error);
      totalDeduction += 30;
    }

    const elapsed = this.getElapsedTime();
    const estimated = currentLevel.estimatedTime;
    let timeBonus = 0;
    if (elapsed < estimated) {
      timeBonus = Math.min(20, Math.floor((estimated - elapsed) / estimated * 20));
    }

    const score = Math.max(0, 100 - totalDeduction + timeBonus);

    this.state.score = score;
    this.state.errors = errors;
    this.state.endTime = Date.now();

    return { score, errors, timeBonus };
  }

  reset(): void {
    this.state = this.createInitialState();
  }
}

export const gameManager = new GameManager();
