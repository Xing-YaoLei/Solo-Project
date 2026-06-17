import {
    IRepairOrder,
    IActiveOrder,
    IChoice,
    IChoiceResult,
    IClue,
    IOrderStage,
    IOrderContext,
    OrderStatus,
    createActiveOrder,
    getOrderByPriority
} from './OrderTypes';
import { EventManager, GameEventType } from '../core/EventManager';
import { Logger } from '../core/Logger';

export class OrderManager {
    private static instance: OrderManager;
    private activeOrders: Map<string, IActiveOrder> = new Map();
    private completedOrders: IActiveOrder[] = [];
    private eventManager: EventManager;

    private constructor() {
        this.eventManager = EventManager.getInstance();
    }

    public static getInstance(): OrderManager {
        if (!OrderManager.instance) {
            OrderManager.instance = new OrderManager();
        }
        return OrderManager.instance;
    }

    public receiveOrder(order: IRepairOrder): IActiveOrder {
        const activeOrder = createActiveOrder(order);
        this.activeOrders.set(order.id, activeOrder);
        this.eventManager.emit(GameEventType.ORDER_RECEIVED, { order: activeOrder });
        Logger.info(`新工单已接收: ${order.id} - ${order.title}`);
        return activeOrder;
    }

    public acceptOrder(orderId: string): boolean {
        const order = this.activeOrders.get(orderId);
        if (!order || order.status !== 'pending') {
            Logger.warn(`无法接受工单: ${orderId}`);
            return false;
        }
        order.status = 'in_progress';
        order.acceptedAt = Date.now();
        Logger.info(`工单已接受: ${orderId}`);
        return true;
    }

    public assignOrder(orderId: string, workerId: string): boolean {
        const order = this.activeOrders.get(orderId);
        if (!order) {
            Logger.warn(`工单不存在: ${orderId}`);
            return false;
        }
        order.assignedWorkerId = workerId;
        order.status = 'assigned';
        this.eventManager.emit(GameEventType.ORDER_ASSIGNED, { orderId, workerId });
        Logger.info(`工单已派单: ${orderId} -> ${workerId}`);
        return true;
    }

    public getAvailableChoices(orderId: string): IChoice[] {
        const order = this.activeOrders.get(orderId);
        if (!order) return [];

        const currentStage = this.getCurrentStage(order);
        if (!currentStage) return [];

        const context = this.buildOrderContext(order);
        return currentStage.choices.filter(choice => {
            if (choice.requiredClues) {
                const hasAllClues = choice.requiredClues.every(clueId => 
                    order.discoveredClueIds.includes(clueId)
                );
                if (!hasAllClues) return false;
            }
            if (choice.condition && !choice.condition(context)) {
                return false;
            }
            return true;
        });
    }

    public makeChoice(orderId: string, choiceId: string): IChoiceResult | null {
        const order = this.activeOrders.get(orderId);
        if (!order) {
            Logger.error(`工单不存在: ${orderId}`);
            return null;
        }

        const choices = this.getAvailableChoices(orderId);
        const choice = choices.find(c => c.id === choiceId);
        if (!choice) {
            Logger.warn(`无效的选择: ${choiceId}`);
            return null;
        }

        order.decisionHistory.push({
            stageId: order.currentStageId,
            choiceId,
            timestamp: Date.now()
        });

        this.eventManager.emit(GameEventType.CHOICE_MADE, {
            orderId,
            choiceId,
            result: choice.result
        });

        this.processChoiceResult(order, choice.result);
        return choice.result;
    }

    private processChoiceResult(order: IActiveOrder, result: IChoiceResult): void {
        if (result.unlockedClues) {
            result.unlockedClues.forEach(clueId => {
                if (!order.discoveredClueIds.includes(clueId)) {
                    order.discoveredClueIds.push(clueId);
                    const clue = this.findClueById(order, clueId);
                    if (clue) {
                        this.eventManager.emit(GameEventType.CLUE_DISCOVERED, {
                            orderId: order.id,
                            clue
                        });
                    }
                }
            });
        }

        if (result.changeAssignedWorker) {
            order.assignedWorkerId = result.changeAssignedWorker;
        }

        if (result.endOrder) {
            if (result.isCorrect) {
                this.completeOrder(order, result);
            } else {
                this.failOrder(order, result);
            }
            return;
        }

        if (result.nextState) {
            order.currentStageId = result.nextState;
            const nextStage = this.getCurrentStage(order);
            if (nextStage?.autoDiscoverClues) {
                nextStage.autoDiscoverClues.forEach(clueId => {
                    if (!order.discoveredClueIds.includes(clueId)) {
                        order.discoveredClueIds.push(clueId);
                    }
                });
            }
        }
    }

    private completeOrder(order: IActiveOrder, result: IChoiceResult): void {
        order.status = 'completed';
        order.completedAt = Date.now();
        this.activeOrders.delete(order.id);
        this.completedOrders.push(order);

        this.eventManager.emit(GameEventType.ORDER_COMPLETED, {
            orderId: order.id,
            reward: result.reward,
            score: result.reward?.score || 0
        });

        if (result.reward?.unlockRule) {
            this.eventManager.emit(GameEventType.RULE_UNLOCKED, {
                ruleId: result.reward.unlockRule
            });
        }

        Logger.info(`工单完成: ${order.id}, 得分: ${result.reward?.score || 0}`);
    }

    private failOrder(order: IActiveOrder, result: IChoiceResult): void {
        order.status = 'failed';
        order.failedAt = Date.now();
        this.activeOrders.delete(order.id);
        this.completedOrders.push(order);

        this.eventManager.emit(GameEventType.ORDER_FAILED, {
            orderId: order.id,
            penalty: result.penalty,
            scoreDeduction: result.penalty?.scoreDeduction || 0
        });

        if (result.penalty?.requiresReview) {
            this.eventManager.emit(GameEventType.REVIEW_FAILED, {
                orderId: order.id,
                errorType: result.penalty.errorType,
                description: result.penalty.description
            });
        }

        Logger.warn(`工单失败: ${order.id}, 扣分: ${result.penalty?.scoreDeduction || 0}`);
    }

    public checkTimeoutOrders(): IActiveOrder[] {
        const now = Date.now();
        const timeoutOrders: IActiveOrder[] = [];

        this.activeOrders.forEach(order => {
            if (order.status !== 'completed' && order.status !== 'failed' && order.status !== 'timeout') {
                if (now > order.deadline) {
                    order.status = 'timeout';
                    timeoutOrders.push(order);
                    this.eventManager.emit(GameEventType.ORDER_TIMEOUT, { orderId: order.id });
                    Logger.warn(`工单超时: ${order.id}`);
                }
            }
        });

        return timeoutOrders;
    }

    public getCurrentStage(order: IActiveOrder): IOrderStage | undefined {
        return order.stages.find(stage => stage.id === order.currentStageId);
    }

    public getDiscoveredClues(order: IActiveOrder): IClue[] {
        return order.initialClues.filter(clue => 
            order.discoveredClueIds.includes(clue.id)
        );
    }

    public getHiddenClues(order: IActiveOrder): IClue[] {
        return order.initialClues.filter(clue => 
            clue.isHidden && !order.discoveredClueIds.includes(clue.id)
        );
    }

    private findClueById(order: IActiveOrder, clueId: string): IClue | undefined {
        return order.initialClues.find(c => c.id === clueId);
    }

    private buildOrderContext(order: IActiveOrder): IOrderContext {
        return {
            order,
            discoveredClues: order.discoveredClueIds,
            currentStage: order.currentStageId,
            assignedWorkerId: order.assignedWorkerId,
            decisionHistory: order.decisionHistory,
            elapsedTime: (Date.now() - order.acceptedAt) / 1000
        };
    }

    public getActiveOrder(orderId: string): IActiveOrder | undefined {
        return this.activeOrders.get(orderId);
    }

    public getAllActiveOrders(): IActiveOrder[] {
        return Array.from(this.activeOrders.values()).sort((a, b) => 
            getOrderByPriority(b.priority) - getOrderByPriority(a.priority)
        );
    }

    public getCompletedOrders(): IActiveOrder[] {
        return [...this.completedOrders];
    }

    public getPendingOrders(): IActiveOrder[] {
        return this.getAllActiveOrders().filter(o => o.status === 'pending');
    }

    public getInProgressOrders(): IActiveOrder[] {
        return this.getAllActiveOrders().filter(o => o.status === 'in_progress' || o.status === 'assigned');
    }

    public getRemainingTime(orderId: string): number {
        const order = this.activeOrders.get(orderId);
        if (!order) return 0;
        return Math.max(0, (order.deadline - Date.now()) / 1000);
    }

    public isOrderPathCorrect(order: IActiveOrder): boolean {
        if (order.status !== 'completed') return false;
        const decisionPath = order.decisionHistory.map(d => d.choiceId);
        if (decisionPath.length !== order.correctPath.length) return false;
        return decisionPath.every((choiceId, index) => choiceId === order.correctPath[index]);
    }

    public clearAllOrders(): void {
        this.activeOrders.clear();
        this.completedOrders = [];
    }

    public removeOrder(orderId: string): boolean {
        return this.activeOrders.delete(orderId);
    }
}
