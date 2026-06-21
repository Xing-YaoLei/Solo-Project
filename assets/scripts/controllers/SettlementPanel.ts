import { _decorator, Component, Node, Label, Button, Sprite, Color, ScrollView, UITransform, Graphics } from 'cc';
import { GameStateSnapshot, AppealEvidence, Order, WrongStep } from '../types/GameTypes';
import { GameController } from './GameController';
import { StorageManager } from '../managers/StorageManager';
import { v4 as uuidv4 } from '../utils/uuid';

const { ccclass, property } = _decorator;

@ccclass('SettlementPanel')
export class SettlementPanel extends Component {
    @property(Node)
    panelRoot: Node | null = null;

    @property(Label)
    resultTitleLabel: Label | null = null;

    @property(Label)
    scoreLabel: Label | null = null;

    @property(Label)
    targetScoreLabel: Label | null = null;

    @property(Label)
    compensationLabel: Label | null = null;

    @property(Label)
    maxCompensationLabel: Label | null = null;

    @property(Label)
    revenueLabel: Label | null = null;

    @property(Label)
    costLabel: Label | null = null;

    @property(Label)
    profitLabel: Label | null = null;

    @property(Node)
    wrongStepsContainer: Node | null = null;

    @property(Node)
    wrongStepItemPrefab: Node | null = null;

    @property(Node)
    appealEvidenceContainer: Node | null = null;

    @property(Node)
    appealEvidencePrefab: Node | null = null;

    @property(Button)
    restartButton: Button | null = null;

    @property(Button)
    reviewButton: Button | null = null;

    @property(Button)
    nextLevelButton: Button | null = null;

    @property(Button)
    appealButton: Button | null = null;

    private gameController: GameController | null = null;
    private storageManager: StorageManager = StorageManager.getInstance();
    private appealEvidences: AppealEvidence[] = [];
    private onRestartCallback: (() => void) | null = null;
    private onReviewCallback: (() => void) | null = null;
    private onNextLevelCallback: (() => void) | null = null;
    private onAppealCallback: ((evidence: AppealEvidence) => void) | null = null;

    onLoad() {
        this.hide();
        this.ensurePanelRoot();
    }

    private ensurePanelRoot() {
        if (!this.panelRoot) {
            this.panelRoot = this.node;
        }
        this.node.active = false;
    }

    setGameController(controller: GameController) {
        this.gameController = controller;
    }

    setCallbacks(
        onRestart: () => void,
        onReview: () => void,
        onNextLevel: () => void,
        onAppeal: (evidence: AppealEvidence) => void
    ) {
        this.onRestartCallback = onRestart;
        this.onReviewCallback = onReview;
        this.onNextLevelCallback = onNextLevel;
        this.onAppealCallback = onAppeal;
    }

    show(
        isVictory: boolean,
        reason?: string,
        finalScore?: number,
        totalCompensation?: number
    ) {
        if (!this.gameController) return;

        const gameState = this.gameController.getGameState();
        const level = this.gameController.getCurrentLevel();
        const snapshots = this.gameController.getStateSnapshots();
        const riderStats = this.collectRiderStats();
        const subsidyStats = this.collectSubsidyStats();

        const score = finalScore ?? gameState?.score ?? 0;
        const compensation = totalCompensation ?? gameState?.totalCompensation ?? 0;
        const revenue = gameState?.totalRevenue ?? 0;
        const cost = gameState?.totalCost ?? 0;
        const wrongSteps = gameState?.wrongSteps ?? [];

        if (this.resultTitleLabel) {
            if (isVictory) {
                this.resultTitleLabel.string = '🎉 训练通过！';
                this.resultTitleLabel.color = new Color(0, 255, 100);
            } else {
                this.resultTitleLabel.string = reason === 'compensation_exceeded' ?
                    '💔 赔付超标，训练失败' : '⏱️ 时间到，未达标';
                this.resultTitleLabel.color = new Color(255, 100, 100);
            }
        }

        if (this.scoreLabel) {
            this.scoreLabel.string = `最终得分: ${score}`;
        }
        if (this.targetScoreLabel) {
            this.targetScoreLabel.string = `目标分数: ${level?.targetScore ?? 0}`;
            this.targetScoreLabel.color = score >= (level?.targetScore ?? 0) ?
                new Color(0, 255, 100) : new Color(255, 100, 100);
        }
        if (this.compensationLabel) {
            this.compensationLabel.string = `赔付总额: ${compensation}`;
        }
        if (this.maxCompensationLabel) {
            this.maxCompensationLabel.string = `赔付上限: ${level?.maxCompensation ?? 0}`;
            this.maxCompensationLabel.color = compensation <= (level?.maxCompensation ?? 0) ?
                new Color(0, 255, 100) : new Color(255, 100, 100);
        }
        if (this.revenueLabel) {
            this.revenueLabel.string = `总收入: ${revenue}`;
        }
        if (this.costLabel) {
            this.costLabel.string = `总成本: ${cost}`;
        }
        if (this.profitLabel) {
            const profit = revenue - cost;
            this.profitLabel.string = `净利润: ${profit}`;
            this.profitLabel.color = profit >= 0 ? new Color(0, 255, 100) : new Color(255, 100, 100);
        }

        this.renderWrongSteps(wrongSteps);
        this.generateAppealEvidences(wrongSteps, snapshots);
        this.renderAppealEvidences();

        this.updateNextLevelButton(isVictory);
        this.saveReplayRecord(isVictory, score, compensation, snapshots, wrongSteps);
        this.updateStatistics(isVictory, score, wrongSteps.length, compensation, subsidyStats, riderStats);

        this.node.active = true;
        if (this.panelRoot) {
            this.panelRoot.active = true;
        }
    }

    private updateNextLevelButton(isVictory: boolean) {
        if (!this.nextLevelButton) return;

        const currentLevel = this.gameController?.getCurrentLevel();
        const hasNextLevel = currentLevel && currentLevel.id < 3;

        this.nextLevelButton.node.active = isVictory && !!hasNextLevel;
    }

    private collectRiderStats(): Record<string, { orders: number; rejections: number }> {
        const stats: Record<string, { orders: number; rejections: number }> = {};
        const riders = this.gameController?.getGameState()?.riders ?? [];

        riders.forEach(rider => {
            stats[rider.id] = {
                orders: rider.totalOrders,
                rejections: rider.rejectionCount,
            };
        });

        return stats;
    }

    private collectSubsidyStats(): Record<string, { used: number; saved: number }> {
        const subsidyManager = this.gameController?.node.getComponent('SubsidyManager');
        if (subsidyManager && 'getSubsidyStats' in subsidyManager) {
            return (subsidyManager as any).getSubsidyStats();
        }
        return {};
    }

    private renderWrongSteps(wrongSteps: WrongStep[]) {
        const container = this.wrongStepsContainer || this.node.getChildByName('WrongStepsInfo');
        if (!container) return;
        container.removeAllChildren();

        if (wrongSteps.length === 0) {
            const label = this.makeChildLabel('EmptyLabel', container, '太棒了！没有操作失误', 14, new Color(0, 255, 100));
            return;
        }

        const typeNames: Record<string, string> = {
            address: '地址错误',
            rider: '骑手拒单',
            subsidy: '补贴误用',
            timing: '超时',
        };

        wrongSteps.forEach((wrongStep, index) => {
            const text = `[${typeNames[wrongStep.type] || wrongStep.type}] ${wrongStep.description} → ${wrongStep.correctAction} (¥${wrongStep.impact.cost} / ${wrongStep.impact.delay}s / 满意度${wrongStep.impact.satisfaction})`;
            this.makeChildLabel(`WrongStep_${index}`, container, text, 13, new Color(255, 180, 100));
        });
    }

    private generateAppealEvidences(
        wrongSteps: WrongStep[],
        snapshots: GameStateSnapshot[]
    ) {
        this.appealEvidences = [];

        const gameState = this.gameController?.getGameState();
        if (!gameState) return;

        wrongSteps.forEach((wrongStep, index) => {
            const relatedOrder = this.findRelatedOrder(wrongStep, gameState.orders);
            if (!relatedOrder) return;

            const rider = relatedOrder.riderId ?
                gameState.riders.find(r => r.id === relatedOrder.riderId) : null;

            const appealable = this.checkAppealable(wrongStep, relatedOrder, rider);

            const evidence: AppealEvidence = {
                orderId: relatedOrder.id,
                wrongStep,
                riderTrajectory: rider?.trajectory ?? [],
                orderTimeline: this.buildOrderTimeline(relatedOrder, snapshots),
                subsidyApplied: this.checkSubsidyApplied(relatedOrder, snapshots),
                compensationAmount: wrongStep.impact.cost,
                appealable,
                appealSuccessRate: this.calculateAppealSuccessRate(wrongStep, relatedOrder, rider),
            };

            this.appealEvidences.push(evidence);
        });
    }

    private findRelatedOrder(wrongStep: WrongStep, orders: Order[]): Order | undefined {
        const description = wrongStep.description;
        const orderIdMatch = description.match(/订单\s*(\w+)/);

        if (orderIdMatch) {
            return orders.find(o => o.id.startsWith(orderIdMatch[1]));
        }

        for (const order of orders) {
            if (order.wrongSteps.some(ws => ws.description === wrongStep.description)) {
                return order;
            }
        }

        return orders[0];
    }

    private checkAppealable(
        wrongStep: WrongStep,
        order: Order,
        rider: any
    ): boolean {
        if (wrongStep.type === 'rider') {
            return rider && rider.rejectWarningLevel >= 2;
        }

        if (wrongStep.type === 'subsidy') {
            return true;
        }

        if (wrongStep.type === 'address') {
            return order.wrongSteps.filter(ws => ws.type === 'address').length <= 1;
        }

        return false;
    }

    private calculateAppealSuccessRate(
        wrongStep: WrongStep,
        order: Order,
        rider: any
    ): number {
        let rate = 0.3;

        if (wrongStep.type === 'rider' && rider) {
            rate = 0.2 + rider.rejectWarningLevel * 0.2;
        }

        if (wrongStep.type === 'subsidy') {
            rate = 0.7;
        }

        if (order.priority === 'vip') {
            rate += 0.1;
        }

        return Math.min(0.95, Math.max(0.1, rate));
    }

    private buildOrderTimeline(
        order: Order,
        snapshots: GameStateSnapshot[]
    ): Array<{ time: number; event: string }> {
        const timeline: Array<{ time: number; event: string }> = [];

        timeline.push({ time: order.createdAt, event: '订单创建' });

        if (order.acceptedAt) {
            timeline.push({ time: order.acceptedAt, event: '骑手接单' });
        }
        if (order.pickedAt) {
            timeline.push({ time: order.pickedAt, event: '取货完成' });
        }
        if (order.deliveredAt) {
            timeline.push({ time: order.deliveredAt, event: '送达完成' });
        }

        order.wrongSteps.forEach(ws => {
            timeline.push({ time: ws.time, event: `错误: ${ws.description}` });
        });

        timeline.sort((a, b) => a.time - b.time);

        return timeline;
    }

    private checkSubsidyApplied(order: Order, snapshots: GameStateSnapshot[]): boolean {
        const orderId = order.id;
        for (const snapshot of snapshots) {
            const snapOrder = snapshot.orders.find(o => o.id === orderId);
            if (snapOrder && snapOrder.status === 'delivered') {
                return true;
            }
        }
        return false;
    }

    private renderAppealEvidences() {
        const container = this.appealEvidenceContainer || this.node.getChildByName('AppealInfo');
        if (!container) return;
        container.removeAllChildren();

        if (this.appealEvidences.length === 0) {
            this.makeChildLabel('EmptyLabel', container, '无申诉项', 14, new Color(150, 150, 150));
            return;
        }

        this.appealEvidences.forEach((evidence, index) => {
            const text = `订单${evidence.orderId.substring(0, 8)} | 错因: ${evidence.wrongStep.description} | 赔付¥${evidence.compensationAmount} | 成功率${Math.floor(evidence.appealSuccessRate * 100)}% | ${evidence.appealable ? '可申诉' : '不可申诉'}`;
            this.makeChildLabel(`Evidence_${index}`, container, text, 13, new Color(200, 200, 255));
        });
    }

    private makeChildLabel(name: string, parent: Node, text: string, fontSize: number, color: Color): Label {
        const n = new Node(name);
        n.addComponent(UITransform).setContentSize(900, fontSize + 6);
        const label = n.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 4;
        label.color = color;
        label.overflow = Label.Overflow.CLAMP;
        parent.addChild(n);
        return label;
    }

    private attemptAppeal(evidence: AppealEvidence) {
        if (!evidence.appealable) return;

        const success = Math.random() < evidence.appealSuccessRate;

        if (success && this.onAppealCallback) {
            this.onAppealCallback(evidence);
        }

        this.showAppealResult(success, evidence.compensationAmount);
    }

    private showAppealResult(success: boolean, amount: number) {
        const resultNode = new Node('AppealResult');
        resultNode.addComponent(UITransform).setContentSize(400, 30);
        const label = resultNode.addComponent(Label);

        if (success) {
            label.string = `申诉成功！退回赔付 ¥${amount}`;
            label.color = new Color(0, 255, 100);
        } else {
            label.string = '申诉失败';
            label.color = new Color(255, 100, 100);
        }
        label.fontSize = 18;

        resultNode.setPosition(0, -200, 0);
        this.panelRoot?.addChild(resultNode);

        setTimeout(() => {
            resultNode.destroy();
        }, 2000);
    }

    private saveReplayRecord(
        isVictory: boolean,
        score: number,
        compensation: number,
        snapshots: GameStateSnapshot[],
        wrongSteps: WrongStep[]
    ) {
        const level = this.gameController?.getCurrentLevel();
        if (!level) return;

        const record = {
            id: uuidv4(),
            levelId: level.id,
            timestamp: Date.now(),
            score,
            isVictory,
            totalCompensation: compensation,
            wrongSteps: JSON.parse(JSON.stringify(wrongSteps)),
            gameStateSnapshots: JSON.parse(JSON.stringify(snapshots)),
            duration: this.gameController?.getGameTime() ?? 0,
        };

        this.storageManager.saveReplayRecord(record);
    }

    private updateStatistics(
        isVictory: boolean,
        score: number,
        ordersProcessed: number,
        compensation: number,
        subsidyStats: Record<string, { used: number; saved: number }>,
        riderStats: Record<string, { orders: number; rejections: number }>
    ) {
        const gameState = this.gameController?.getGameState();

        this.storageManager.updateStatistics({
            isVictory,
            score,
            ordersProcessed,
            compensation,
            wrongSteps: gameState?.wrongSteps ?? [],
            subsidyStats,
            riderStats,
        });
    }

    private onRestartClicked() {
        if (this.onRestartCallback) {
            this.onRestartCallback();
        }
        this.hide();
    }

    private onReviewClicked() {
        if (this.onReviewCallback) {
            this.onReviewCallback();
        }
    }

    private onNextLevelClicked() {
        if (this.onNextLevelCallback) {
            this.onNextLevelCallback();
        }
        this.hide();
    }

    private onAppealClicked() {
    }

    hide() {
        this.node.active = false;
        if (this.panelRoot) {
            this.panelRoot.active = false;
        }
    }

    getAppealEvidences(): AppealEvidence[] {
        return [...this.appealEvidences];
    }

    onDestroy() {
        if (this.restartButton) {
            this.restartButton.node.off(Button.EventType.CLICK, this.onRestartClicked, this);
        }
        if (this.reviewButton) {
            this.reviewButton.node.off(Button.EventType.CLICK, this.onReviewClicked, this);
        }
        if (this.nextLevelButton) {
            this.nextLevelButton.node.off(Button.EventType.CLICK, this.onNextLevelClicked, this);
        }
    }
}
