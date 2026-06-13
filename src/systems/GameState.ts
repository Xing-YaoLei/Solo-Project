import {
  GameSession,
  GameStep,
  ErrorType,
  ErrorSummary,
  ReplayRecord,
  TutorialState,
  Consumable,
  Supplier,
  RequisitionRecord,
  InventoryCheck,
} from '../models/types';
import { SUPPLIERS, CONSUMABLES } from '../models/gameData';

class GameStateManager {
  private static instance: GameStateManager;
  currentSession: GameSession | null = null;
  consumables: Consumable[] = [];
  suppliers: Supplier[] = [];
  requisitionHistory: RequisitionRecord[] = [];
  inventoryChecks: InventoryCheck[] = [];
  replayRecords: ReplayRecord[] = [];
  tutorialState: TutorialState = {
    completed: false,
    currentStep: 0,
    supplierIntroDone: false,
    firstRequisitionDone: false,
    firstInventoryDone: false,
    firstWarningHandled: false,
  };
  gameDay: number = 0;
  maxDays: number = 14;
  score: number = 100;
  stepCounter: number = 0;
  warningItems: Set<string> = new Set();
  shortageImminent: Map<string, number> = new Map();

  private constructor() {
    this.resetGame();
  }

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  resetGame(): void {
    this.consumables = JSON.parse(JSON.stringify(CONSUMABLES));
    this.suppliers = JSON.parse(JSON.stringify(SUPPLIERS));
    this.requisitionHistory = [];
    this.inventoryChecks = [];
    this.gameDay = 0;
    this.score = 100;
    this.stepCounter = 0;
    this.warningItems.clear();
    this.shortageImminent.clear();
    this.currentSession = {
      id: `session_${Date.now()}`,
      startTime: Date.now(),
      totalDays: 0,
      steps: [],
      finalScore: 0,
      errorSummary: [],
      turnoverDays: 0,
      completed: false,
    };
  }

  advanceDay(): void {
    this.gameDay++;
    for (const c of this.consumables) {
      c.currentStock = Math.max(0, c.currentStock - c.dailyUsage);
      c.receivedDate++;
    }
    this.checkWarnings();
    this.checkForArrivals();
  }

  private checkForArrivals(): void {
    for (const rec of this.requisitionHistory) {
      if (rec.arrived) continue;
      const supplier = this.suppliers.find((s) => s.id === rec.supplierId);
      if (!supplier) continue;
      const daysSinceOrder = this.gameDay - rec.gameDay;
      if (daysSinceOrder >= supplier.leadTime) {
        const consumable = this.consumables.find((c) => c.id === rec.consumableId);
        if (consumable) {
          consumable.currentStock = Math.min(consumable.maxStock, consumable.currentStock + rec.qty);
          rec.arrived = true;
        }
      }
    }
  }

  private checkWarnings(): void {
    this.warningItems.clear();
    this.shortageImminent.clear();
    for (const c of this.consumables) {
      const daysUntilShortage = c.dailyUsage > 0 ? c.currentStock / c.dailyUsage : 999;
      if (daysUntilShortage <= 2 && c.currentStock > 0) {
        this.shortageImminent.set(c.id, Math.round(daysUntilShortage * 10) / 10);
      }
      if (c.currentStock <= 0) {
        this.shortageImminent.set(c.id, 0);
      }
      if (c.currentStock <= c.safetyStock * 1.5 && c.currentStock > c.safetyStock) {
        this.warningItems.add(c.id);
      }
    }
  }

  recordStep(step: GameStep): void {
    this.stepCounter++;
    if (!this.currentSession) return;
    this.currentSession.steps.push(step);
    if (!step.isCorrect) {
      this.score = Math.max(0, this.score - this.getPenalty(step.errorType));
    }
  }

  private getPenalty(errorType?: ErrorType): number {
    switch (errorType) {
      case 'STOCKOUT':
        return 20;
      case 'SAFETY_STOCK_BREACH':
        return 15;
      case 'WRONG_SUPPLIER':
        return 10;
      case 'OVER_ORDER':
      case 'UNDER_ORDER':
        return 8;
      case 'EXPIRED_BATCH':
        return 12;
      case 'INVENTORY_MISMATCH':
        return 10;
      case 'LEAD_TIME_MISJUDGMENT':
        return 8;
      default:
        return 5;
    }
  }

  calculateTurnoverDays(): number {
    let totalUsage = 0;
    let totalAvgStock = 0;
    for (const c of this.consumables) {
      totalUsage += c.dailyUsage * this.gameDay;
      totalAvgStock += (c.maxStock + c.currentStock) / 2;
    }
    if (totalUsage === 0) return 0;
    return Math.round((totalAvgStock / totalUsage) * this.gameDay * 10) / 10;
  }

  buildErrorSummary(): ErrorSummary[] {
    if (!this.currentSession) return [];
    const errorMap = new Map<ErrorType, ErrorSummary>();
    for (const step of this.currentSession.steps) {
      if (step.isCorrect || !step.errorType) continue;
      const existing = errorMap.get(step.errorType);
      if (existing) {
        existing.count++;
      } else {
        const isSafetyRelated = ['SAFETY_STOCK_BREACH', 'STOCKOUT', 'UNDER_ORDER', 'LEAD_TIME_MISJUDGMENT'].includes(step.errorType);
        errorMap.set(step.errorType, {
          errorType: step.errorType,
          count: 1,
          relatedSafetyStock: isSafetyRelated,
          description: this.getErrorDescription(step.errorType),
        });
      }
    }
    return Array.from(errorMap.values()).sort((a, b) => b.count - a.count);
  }

  private getErrorDescription(type: ErrorType): string {
    const descriptions: Record<ErrorType, string> = {
      WRONG_SUPPLIER: '选错供应商，未综合考虑交期/最低量/可靠性',
      OVER_ORDER: '超额领用，超出合理用量',
      UNDER_ORDER: '领用不足，低于安全库存补货线',
      SAFETY_STOCK_BREACH: '安全库存被突破，门店有断货风险',
      EXPIRED_BATCH: '批次已过期或即将过期未处理',
      STOCKOUT: '耗材断货，门店运营受影响',
      INVENTORY_MISMATCH: '盘点数量差异未正确处理',
      LEAD_TIME_MISJUDGMENT: '未正确预估供应商交货周期',
    };
    return descriptions[type];
  }

  endSession(): void {
    if (!this.currentSession) return;
    this.currentSession.endTime = Date.now();
    this.currentSession.totalDays = this.gameDay;
    this.currentSession.finalScore = this.score;
    this.currentSession.errorSummary = this.buildErrorSummary();
    this.currentSession.turnoverDays = this.calculateTurnoverDays();
    this.currentSession.completed = true;

    if (!this.currentSession.steps.every((s) => s.isCorrect)) {
      const failedStep = this.currentSession.steps.findIndex((s) => !s.isCorrect);
      this.replayRecords.push({
        sessionId: this.currentSession.id,
        steps: [...this.currentSession.steps],
        failedAtStep: failedStep >= 0 ? failedStep : this.currentSession.steps.length - 1,
        failureReason: this.currentSession.steps[failedStep]?.errorType ?? 'STOCKOUT',
        timestamp: Date.now(),
      });
      if (this.replayRecords.length > 5) {
        this.replayRecords = this.replayRecords.slice(-5);
      }
    }
  }

  isGameOver(): boolean {
    if (this.gameDay >= this.maxDays) return true;
    if (this.score <= 0) return true;
    for (const c of this.consumables) {
      if (c.currentStock <= 0) return true;
    }
    return false;
  }
}

export const gameState = GameStateManager.getInstance();
