import { Action, ActionType, ActionConsequence, ConstructionPhase, DecisionOutcome } from '../models';
import { eventBus, GameEvent } from '../core/EventBus';

interface ActionExecutionResult {
  success: boolean;
  action?: Action;
  consequences: ActionConsequence[];
  triggeredConsequences: ActionConsequence[];
  totalCost: number;
  totalTime: number;
  qualityChange: number;
  message: string;
  requiresChangeOrder: boolean;
  changeOrderReason?: string;
}

interface ActionSystemState {
  actions: Map<string, Action>;
  executedActionIds: Set<string>;
  levelActionIds: Map<string, string[]>;
  currentLevelId: string | null;
  currentPhase: ConstructionPhase | null;
  executionHistory: Array<{
    actionId: string;
    clueIds: string[];
    timestamp: number;
    result: ActionExecutionResult;
  }>;
}

export class ActionSystem {
  private state: ActionSystemState;
  private static instance: ActionSystem;

  private constructor() {
    this.state = {
      actions: new Map(),
      executedActionIds: new Set(),
      levelActionIds: new Map(),
      currentLevelId: null,
      currentPhase: null,
      executionHistory: [],
    };
  }

  public static getInstance(): ActionSystem {
    if (!ActionSystem.instance) {
      ActionSystem.instance = new ActionSystem();
    }
    return ActionSystem.instance;
  }

  public initialize(actions: Action[]): void {
    this.state.actions.clear();
    this.state.executedActionIds.clear();
    this.state.levelActionIds.clear();
    this.state.executionHistory = [];

    const levelId = actions.length > 0 ? actions[0].levelId : null;
    this.state.currentLevelId = levelId;
    this.state.currentPhase = null;

    const levelActionIds: string[] = [];
    actions.forEach((action) => {
      this.state.actions.set(action.id, action);
      levelActionIds.push(action.id);
    });
    if (levelId) {
      this.state.levelActionIds.set(levelId, levelActionIds);
    }
  }

  public getAvailableActions(
    discoveredClueIds: string[],
    _phase?: ConstructionPhase
  ): Action[] {
    const available: Action[] = [];

    this.state.actions.forEach((action) => {
      if (
        action.levelId === this.state.currentLevelId &&
        !this.state.executedActionIds.has(action.id)
      ) {
        const meetsRequirements = action.requiredClueIds.every((clueId) =>
          discoveredClueIds.includes(clueId)
        );

        if (meetsRequirements) {
          available.push(action);
        }
      }
    });

    return available;
  }

  public getActionsByType(type: ActionType, discoveredClueIds: string[]): Action[] {
    return this.getAvailableActions(discoveredClueIds).filter(
      (action) => action.type === type
    );
  }

  public getActionsForClue(clueId: string, discoveredClueIds: string[]): Action[] {
    return this.getAvailableActions(discoveredClueIds).filter((action) =>
      action.applicableClueIds.includes(clueId)
    );
  }

  public getAction(actionId: string): Action | undefined {
    return this.state.actions.get(actionId);
  }

  public isExecuted(actionId: string): boolean {
    return this.state.executedActionIds.has(actionId);
  }

  public canExecute(
    actionId: string,
    discoveredClueIds: string[],
    remainingBudget: number
  ): { canExecute: boolean; reason?: string } {
    const action = this.state.actions.get(actionId);
    if (!action) {
      return { canExecute: false, reason: `动作 ${actionId} 不存在` };
    }

    if (this.state.executedActionIds.has(actionId)) {
      return { canExecute: false, reason: '该动作已执行' };
    }

    const missingClues = action.requiredClueIds.filter(
      (clueId) => !discoveredClueIds.includes(clueId)
    );
    if (missingClues.length > 0) {
      return {
        canExecute: false,
        reason: `缺少必要线索: ${missingClues.join(', ')}`,
      };
    }

    if (action.cost > remainingBudget) {
      return {
        canExecute: false,
        reason: `预算不足，需要 ${action.cost}，剩余 ${remainingBudget}`,
      };
    }

    return { canExecute: true };
  }

  public executeAction(
    actionId: string,
    clueIds: string[],
    discoveredClueIds: string[]
  ): ActionExecutionResult {
    const action = this.state.actions.get(actionId);

    if (!action) {
      return {
        success: false,
        consequences: [],
        triggeredConsequences: [],
        totalCost: 0,
        totalTime: 0,
        qualityChange: 0,
        message: `动作 ${actionId} 不存在`,
        requiresChangeOrder: false,
      };
    }

    const canExecuteResult = this.canExecute(
      actionId,
      discoveredClueIds,
      Infinity
    );
    if (!canExecuteResult.canExecute) {
      eventBus.emit(GameEvent.ACTION_FAILED, {
        action,
        reason: canExecuteResult.reason,
      });

      return {
        success: false,
        consequences: [],
        triggeredConsequences: [],
        totalCost: 0,
        totalTime: 0,
        qualityChange: 0,
        message: canExecuteResult.reason || '执行失败',
        requiresChangeOrder: false,
      };
    }

    const triggeredConsequences = this.rollConsequences(action.consequences);

    let totalCost = action.cost;
    let totalTime = action.duration;
    let qualityChange = action.qualityImpact;

    triggeredConsequences.forEach((consequence) => {
      switch (consequence.type) {
        case 'cost':
          totalCost += consequence.value;
          break;
        case 'time':
          totalTime += consequence.value;
          break;
        case 'quality':
          qualityChange += consequence.value;
          break;
      }
    });

    const requiresChangeOrder = this.requiresChangeOrder(
      action,
      totalCost,
      totalTime
    );
    let changeOrderReason: string | undefined;

    if (requiresChangeOrder) {
      changeOrderReason = this.generateChangeOrderReason(
        action,
        totalCost,
        totalTime
      );
    }

    this.state.executedActionIds.add(actionId);

    const outcome = this.determineOutcome(qualityChange, action.risk);

    const executionResult: ActionExecutionResult = {
      success: true,
      action,
      consequences: action.consequences,
      triggeredConsequences,
      totalCost,
      totalTime,
      qualityChange,
      message: `成功执行: ${action.title}`,
      requiresChangeOrder,
      changeOrderReason,
    };

    this.state.executionHistory.push({
      actionId,
      clueIds,
      timestamp: Date.now(),
      result: executionResult,
    });

    eventBus.emit(GameEvent.ACTION_EXECUTED, {
      action,
      clueIds,
      result: executionResult,
      outcome,
    });

    eventBus.emit(GameEvent.DECISION_MADE, {
      action,
      clueIds,
      phase: this.state.currentPhase,
      outcome,
      timestamp: Date.now(),
    });

    return executionResult;
  }

  private rollConsequences(
    consequences: ActionConsequence[]
  ): ActionConsequence[] {
    return consequences.filter((consequence) => {
      const roll = Math.random();
      return roll <= consequence.probability;
    });
  }

  private requiresChangeOrder(
    action: Action,
    totalCost: number,
    totalTime: number
  ): boolean {
    const costThreshold = 5000;
    const timeThreshold = 3;

    return (
      totalCost > costThreshold ||
      totalTime > timeThreshold ||
      action.type === 'redesign'
    );
  }

  private generateChangeOrderReason(
    action: Action,
    totalCost: number,
    totalTime: number
  ): string {
    const reasons: string[] = [];

    if (action.type === 'redesign') {
      reasons.push('设计变更需要客户确认');
    }
    if (totalCost > 5000) {
      reasons.push(`费用增加 ${totalCost - action.cost} 元，超出阈值`);
    }
    if (totalTime > 3) {
      reasons.push(`工期延长 ${totalTime - action.duration} 天，超出阈值`);
    }

    return reasons.join('；');
  }

  private determineOutcome(
    qualityChange: number,
    risk: number
  ): DecisionOutcome {
    const riskFactor = (6 - risk) / 5;
    const qualityFactor = (qualityChange + 10) / 20;
    const score = riskFactor * 0.4 + qualityFactor * 0.6;

    if (score >= 0.7) return 'positive';
    if (score >= 0.4) return 'neutral';
    return 'negative';
  }

  public getExecutedActions(levelId?: string): Action[] {
    const targetLevelId = levelId || this.state.currentLevelId;
    const actionIds = targetLevelId
      ? this.state.levelActionIds.get(targetLevelId)
      : null;

    const actions: Action[] = [];
    this.state.executedActionIds.forEach((id) => {
      if (!actionIds || actionIds.includes(id)) {
        const action = this.state.actions.get(id);
        if (action) {
          actions.push(action);
        }
      }
    });
    return actions;
  }

  public getExecutionCount(levelId?: string): number {
    return this.getExecutedActions(levelId).length;
  }

  public getTotalCost(levelId?: string): number {
    return this.state.executionHistory
      .filter(
        (entry) =>
          entry.result.action?.levelId === (levelId || this.state.currentLevelId)
      )
      .reduce((total, entry) => total + entry.result.totalCost, 0);
  }

  public getTotalTime(levelId?: string): number {
    return this.state.executionHistory
      .filter(
        (entry) =>
          entry.result.action?.levelId === (levelId || this.state.currentLevelId)
      )
      .reduce((total, entry) => total + entry.result.totalTime, 0);
  }

  public getTotalQualityChange(levelId?: string): number {
    return this.state.executionHistory
      .filter(
        (entry) =>
          entry.result.action?.levelId === (levelId || this.state.currentLevelId)
      )
      .reduce((total, entry) => total + entry.result.qualityChange, 0);
  }

  public setCurrentPhase(phase: ConstructionPhase): void {
    this.state.currentPhase = phase;
    eventBus.emit(GameEvent.PHASE_CHANGED, { phase });
  }

  public setCurrentLevel(levelId: string): void {
    this.state.currentLevelId = levelId;
  }

  public getExecutionHistory() {
    return [...this.state.executionHistory];
  }

  public getDecisionStats(): Record<DecisionOutcome, number> {
    const stats: Record<DecisionOutcome, number> = { positive: 0, neutral: 0, negative: 0 };
    this.state.executionHistory.forEach((entry) => {
      const outcome = this.determineOutcome(
        entry.result.qualityChange,
        entry.result.action?.risk || 3
      );
      stats[outcome]++;
    });
    return stats;
  }

  public reset(): void {
    this.state = {
      actions: new Map(),
      executedActionIds: new Set(),
      levelActionIds: new Map(),
      currentLevelId: null,
      currentPhase: null,
      executionHistory: [],
    };
  }

  public getState(): Readonly<ActionSystemState> {
    return this.state;
  }
}

export const actionSystem = ActionSystem.getInstance();
