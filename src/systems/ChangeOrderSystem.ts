import {
  ChangeOrder,
  ChangeOrderStatus,
  Action,
  ConstructionPhase,
} from '../models';
import { eventBus, GameEvent } from '../core/EventBus';

interface CreateChangeOrderParams {
  taskId: string;
  levelId: string;
  title: string;
  description: string;
  reason: string;
  originalPlan: string;
  newPlan: string;
  costIncrease: number;
  timeExtension: number;
  qualityImpact: number;
  relatedActionIds: string[];
  additionalCost?: number;
  additionalDuration?: number;
  relatedClueIds?: string[];
}

interface ApprovalResult {
  approved: boolean;
  changeOrder?: ChangeOrder;
  rejectionReason?: string;
}

interface ChangeOrderSystemState {
  changeOrders: Map<string, ChangeOrder>;
  levelChangeOrderIds: Map<string, string[]>;
  currentLevelId: string | null;
  currentPhase: ConstructionPhase | null;
  approvalDelay: number;
  autoApprovalProbability: number;
}

export class ChangeOrderSystem {
  private state: ChangeOrderSystemState;
  private static instance: ChangeOrderSystem;

  private constructor() {
    this.state = {
      changeOrders: new Map(),
      levelChangeOrderIds: new Map(),
      currentLevelId: null,
      currentPhase: null,
      approvalDelay: 1000,
      autoApprovalProbability: 0.7,
    };
  }

  public static getInstance(): ChangeOrderSystem {
    if (!ChangeOrderSystem.instance) {
      ChangeOrderSystem.instance = new ChangeOrderSystem();
    }
    return ChangeOrderSystem.instance;
  }

  public initialize(changeOrders: ChangeOrder[]): void {
    this.state.changeOrders.clear();
    this.state.levelChangeOrderIds.clear();

    const levelId = changeOrders.length > 0 ? changeOrders[0].levelId : null;
    this.state.currentLevelId = levelId;
    this.state.currentPhase = null;

    changeOrders.forEach((order) => {
      this.addChangeOrder(order);
    });

    if (levelId && !this.state.levelChangeOrderIds.has(levelId)) {
      this.state.levelChangeOrderIds.set(levelId, []);
    }
  }

  public addChangeOrder(order: ChangeOrder): void {
    this.state.changeOrders.set(order.id, order);

    const levelIds = this.state.levelChangeOrderIds.get(order.levelId) || [];
    if (!levelIds.includes(order.id)) {
      levelIds.push(order.id);
      this.state.levelChangeOrderIds.set(order.levelId, levelIds);
    }

    eventBus.emit(GameEvent.CHANGE_ORDER_UPDATED, { changeOrder: order });
  }

  public createChangeOrder(
    params: CreateChangeOrderParams
  ): ChangeOrder {
    const id = this.generateId();
    const now = Date.now();

    const changeOrder: ChangeOrder = {
      id,
      taskId: params.taskId,
      levelId: params.levelId,
      title: params.title,
      description: params.description,
      reason: params.reason,
      originalPlan: params.originalPlan,
      newPlan: params.newPlan,
      costIncrease: params.costIncrease,
      timeExtension: params.timeExtension,
      qualityImpact: params.qualityImpact,
      status: 'draft',
      createdAt: now,
      relatedActionIds: params.relatedActionIds,
      additionalCost: params.additionalCost ?? params.costIncrease,
      additionalDuration: params.additionalDuration ?? params.timeExtension,
      relatedClueIds: params.relatedClueIds ?? [],
    };

    this.state.changeOrders.set(id, changeOrder);

    const levelIds = this.state.levelChangeOrderIds.get(params.levelId) || [];
    levelIds.push(id);
    this.state.levelChangeOrderIds.set(params.levelId, levelIds);

    eventBus.emit(GameEvent.CHANGE_ORDER_CREATED, { changeOrder });

    return changeOrder;
  }

  public createFromAction(
    action: Action,
    taskId: string,
    levelId: string,
    extraCost: number,
    extraTime: number,
    reason: string
  ): ChangeOrder {
    return this.createChangeOrder({
      taskId,
      levelId,
      title: `变更单 - ${action.title}`,
      description: `因执行动作"${action.title}"产生的设计变更`,
      reason,
      originalPlan: `按原计划执行，无需额外费用和工期`,
      newPlan: `执行${action.title}，增加费用${extraCost}元，延长工期${extraTime}天`,
      costIncrease: extraCost,
      timeExtension: extraTime,
      qualityImpact: action.qualityImpact,
      relatedActionIds: [action.id],
    });
  }

  public submitForApproval(changeOrderId: string): boolean {
    const changeOrder = this.state.changeOrders.get(changeOrderId);
    if (!changeOrder) return false;
    if (changeOrder.status !== 'draft') return false;

    changeOrder.status = 'pending_approval';

    setTimeout(() => {
      this.simulateApproval(changeOrderId);
    }, this.state.approvalDelay);

    return true;
  }

  private simulateApproval(changeOrderId: string): void {
    const changeOrder = this.state.changeOrders.get(changeOrderId);
    if (!changeOrder || changeOrder.status !== 'pending_approval') return;

    const approvalRoll = Math.random();

    if (approvalRoll < this.state.autoApprovalProbability) {
      this.approveChangeOrder(changeOrderId);
    } else {
      const rejectionReasons = [
        '客户认为费用过高，请重新评估',
        '工期延长不可接受，请寻找替代方案',
        '变更方案不合理，请重新设计',
        '质量影响过大，需要重新考虑',
      ];
      const randomReason =
        rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)];
      this.rejectChangeOrder(changeOrderId, randomReason);
    }
  }

  public approveChangeOrder(changeOrderId: string): ApprovalResult {
    const changeOrder = this.state.changeOrders.get(changeOrderId);
    if (!changeOrder) {
      return { approved: false, rejectionReason: '变更单不存在' };
    }
    if (changeOrder.status !== 'pending_approval') {
      return { approved: false, rejectionReason: '变更单状态不正确' };
    }

    changeOrder.status = 'approved';
    changeOrder.approvedAt = Date.now();

    eventBus.emit(GameEvent.CHANGE_ORDER_SIGNED, { changeOrder });

    eventBus.emit(GameEvent.BUDGET_UPDATED, {
      change: -changeOrder.costIncrease,
      reason: '变更单审批通过',
    });

    return { approved: true, changeOrder };
  }

  public rejectChangeOrder(
    changeOrderId: string,
    reason: string
  ): ApprovalResult {
    const changeOrder = this.state.changeOrders.get(changeOrderId);
    if (!changeOrder) {
      return { approved: false, rejectionReason: '变更单不存在' };
    }
    if (changeOrder.status !== 'pending_approval') {
      return { approved: false, rejectionReason: '变更单状态不正确' };
    }

    changeOrder.status = 'rejected';
    changeOrder.rejectionReason = reason;

    eventBus.emit(GameEvent.CHANGE_ORDER_REJECTED, {
      changeOrder,
      reason,
    });

    return { approved: false, changeOrder, rejectionReason: reason };
  }

  public executeChangeOrder(changeOrderId: string): boolean {
    const changeOrder = this.state.changeOrders.get(changeOrderId);
    if (!changeOrder) return false;
    if (changeOrder.status !== 'approved') return false;

    changeOrder.status = 'executed';

    eventBus.emit(GameEvent.ACTION_EXECUTED, {
      changeOrder,
      cost: changeOrder.costIncrease,
      time: changeOrder.timeExtension,
    });

    return true;
  }

  public reviseChangeOrder(
    changeOrderId: string,
    updates: Partial<CreateChangeOrderParams>
  ): ChangeOrder | null {
    const changeOrder = this.state.changeOrders.get(changeOrderId);
    if (!changeOrder) return null;
    if (changeOrder.status !== 'rejected' && changeOrder.status !== 'draft') {
      return null;
    }

    if (updates.title !== undefined) changeOrder.title = updates.title;
    if (updates.description !== undefined)
      changeOrder.description = updates.description;
    if (updates.reason !== undefined) changeOrder.reason = updates.reason;
    if (updates.originalPlan !== undefined)
      changeOrder.originalPlan = updates.originalPlan;
    if (updates.newPlan !== undefined) changeOrder.newPlan = updates.newPlan;
    if (updates.costIncrease !== undefined)
      changeOrder.costIncrease = updates.costIncrease;
    if (updates.timeExtension !== undefined)
      changeOrder.timeExtension = updates.timeExtension;
    if (updates.qualityImpact !== undefined)
      changeOrder.qualityImpact = updates.qualityImpact;

    changeOrder.status = 'draft';
    changeOrder.rejectionReason = undefined;

    return changeOrder;
  }

  public getChangeOrder(changeOrderId: string): ChangeOrder | undefined {
    return this.state.changeOrders.get(changeOrderId);
  }

  public getChangeOrdersByLevel(levelId?: string): ChangeOrder[] {
    const targetLevelId = levelId || this.state.currentLevelId;
    const orderIds = targetLevelId
      ? this.state.levelChangeOrderIds.get(targetLevelId)
      : null;

    if (!orderIds) return [];

    return orderIds
      .map((id) => this.state.changeOrders.get(id))
      .filter((co): co is ChangeOrder => co !== undefined)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  public getChangeOrdersByStatus(
    status: ChangeOrderStatus,
    levelId?: string
  ): ChangeOrder[] {
    return this.getChangeOrdersByLevel(levelId).filter(
      (co) => co.status === status
    );
  }

  public getChangeOrdersByPhase(
    _phase: ConstructionPhase,
    levelId?: string
  ): ChangeOrder[] {
    return this.getChangeOrdersByLevel(levelId).filter((co) => {
      return co.levelId === (levelId || this.state.currentLevelId);
    });
  }

  public getPendingApprovalCount(levelId?: string): number {
    return this.getChangeOrdersByStatus('pending_approval', levelId).length;
  }

  public getTotalCostIncrease(levelId?: string): number {
    return this.getChangeOrdersByLevel(levelId)
      .filter((co) => co.status === 'approved' || co.status === 'executed')
      .reduce((total, co) => total + co.costIncrease, 0);
  }

  public getTotalTimeExtension(levelId?: string): number {
    return this.getChangeOrdersByLevel(levelId)
      .filter((co) => co.status === 'approved' || co.status === 'executed')
      .reduce((total, co) => total + co.timeExtension, 0);
  }

  public getApprovalRate(levelId?: string): number {
    const orders = this.getChangeOrdersByLevel(levelId);
    const decided = orders.filter(
      (co) => co.status === 'approved' || co.status === 'rejected'
    );
    if (decided.length === 0) return 100;

    const approved = decided.filter((co) => co.status === 'approved').length;
    return Math.round((approved / decided.length) * 100);
  }

  public canAfford(
    changeOrder: ChangeOrder,
    remainingBudget: number
  ): boolean {
    return remainingBudget >= changeOrder.costIncrease;
  }

  public checkForRequiredChangeOrder(
    action: Action,
    totalCost: number,
    totalTime: number
  ): {
    required: boolean;
    extraCost: number;
    extraTime: number;
    reason: string;
  } {
    const costThreshold = 5000;
    const timeThreshold = 3;

    let required = false;
    let extraCost = 0;
    let extraTime = 0;
    const reasons: string[] = [];

    if (action.type === 'redesign') {
      required = true;
      reasons.push('设计变更');
      extraCost = action.cost;
      extraTime = action.duration;
    }

    if (totalCost > costThreshold) {
      required = true;
      extraCost = Math.max(extraCost, totalCost - action.cost);
      reasons.push(`费用超出阈值 ${totalCost - costThreshold} 元`);
    }

    if (totalTime > timeThreshold) {
      required = true;
      extraTime = Math.max(extraTime, totalTime - action.duration);
      reasons.push(`工期超出阈值 ${totalTime - timeThreshold} 天`);
    }

    return {
      required,
      extraCost,
      extraTime,
      reason: reasons.join('；'),
    };
  }

  public setCurrentPhase(phase: ConstructionPhase): void {
    this.state.currentPhase = phase;
  }

  public setCurrentLevel(levelId: string): void {
    this.state.currentLevelId = levelId;
    if (!this.state.levelChangeOrderIds.has(levelId)) {
      this.state.levelChangeOrderIds.set(levelId, []);
    }
  }

  public setApprovalParameters(delay: number, probability: number): void {
    this.state.approvalDelay = delay;
    this.state.autoApprovalProbability = Math.max(0, Math.min(1, probability));
  }

  private generateId(): string {
    return `co_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public reset(): void {
    this.state = {
      changeOrders: new Map(),
      levelChangeOrderIds: new Map(),
      currentLevelId: null,
      currentPhase: null,
      approvalDelay: 1000,
      autoApprovalProbability: 0.7,
    };
  }

  public getState(): Readonly<ChangeOrderSystemState> {
    return this.state;
  }
}

export const changeOrderSystem = ChangeOrderSystem.getInstance();
