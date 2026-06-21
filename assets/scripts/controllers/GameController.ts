import { _decorator, Component, Node, Label, Input, EventKeyboard, KeyCode } from 'cc';
import { GameState, Order, Rider, WrongStep, LevelConfig, GameStateSnapshot } from '../types/GameTypes';
import { OrderManager } from '../managers/OrderManager';
import { RiderManager } from '../managers/RiderManager';
import { SubsidyManager } from '../managers/SubsidyManager';
import { MapController } from './MapController';
import { AddressInputController } from './AddressInputController';
import { RiderWarningSystem } from './RiderWarningSystem';
import { TrajectoryRenderer } from './TrajectoryRenderer';
import { LEVELS, WEATHER_EFFECTS, KEYBOARD_SHORTCUTS } from '../config/GameConfig';
import { EventDispatcher } from '../utils/EventDispatcher';

const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    @property(Node)
    uiRoot: Node | null = null;

    @property(Label)
    scoreLabel: Label | null = null;

    @property(Label)
    timeLabel: Label | null = null;

    @property(Label)
    levelLabel: Label | null = null;

    @property(Label)
    weatherLabel: Label | null = null;

    @property(Label)
    compensationLabel: Label | null = null;

    @property(OrderManager)
    orderManager: OrderManager | null = null;

    @property(RiderManager)
    riderManager: RiderManager | null = null;

    @property(SubsidyManager)
    subsidyManager: SubsidyManager | null = null;

    @property(MapController)
    mapController: MapController | null = null;

    @property(AddressInputController)
    addressInputController: AddressInputController | null = null;

    @property(RiderWarningSystem)
    riderWarningSystem: RiderWarningSystem | null = null;

    @property(TrajectoryRenderer)
    trajectoryRenderer: TrajectoryRenderer | null = null;

    private gameState: GameState | null = null;
    private currentLevel: LevelConfig | null = null;
    private gameTime: number = 0;
    private lastOrderTime: number = 0;
    private snapshotInterval: number = 2;
    private lastSnapshotTime: number = 0;
    private gameSpeed: number = 1;
    private eventDispatcher: EventDispatcher = EventDispatcher.getInstance();
    private stateSnapshots: GameStateSnapshot[] = [];
    private isRestarting: boolean = false;

    onLoad() {
        this.initEventListeners();
        this.initKeyboardControls();
    }

    private initEventListeners() {
        this.eventDispatcher.on('order-generated', this.onOrderGenerated, this);
        this.eventDispatcher.on('order-completed', this.onOrderCompleted, this);
        this.eventDispatcher.on('order-failed', this.onOrderFailed, this);
        this.eventDispatcher.on('rider-moved', this.onRiderMoved, this);
        this.eventDispatcher.on('rider-rejection', this.onRiderRejection, this);
        this.eventDispatcher.on('wrong-step', this.onWrongStep, this);
    }

    private initKeyboardControls() {
        this.node.on(Input.EventType.KEY_DOWN, this.handleKeyDown, this);
    }

    private handleKeyDown(event: EventKeyboard) {
        if (!this.gameState || this.gameState.isGameOver) return;

        const key = event.keyCode;

        if (KEYBOARD_SHORTCUTS.assign_rider.includes(KeyCode[key as keyof typeof KeyCode])) {
            const index = parseInt(KeyCode[key as keyof typeof KeyCode].replace('DIGIT_', '')) - 1;
            this.assignRiderByIndex(index);
        }

        if (key === KeyCode.KEY_Q || key === KeyCode.KEY_W ||
            key === KeyCode.KEY_E || key === KeyCode.KEY_R) {
            const subsidyIndex = [KeyCode.KEY_Q, KeyCode.KEY_W, KeyCode.KEY_E, KeyCode.KEY_R].indexOf(key);
            this.toggleSubsidyByIndex(subsidyIndex);
        }

        if (key === KeyCode.KEY_P) {
            this.togglePause();
        }

        if (key === KeyCode.ARROW_UP) {
            this.adjustGameSpeed(1);
        }

        if (key === KeyCode.ARROW_DOWN) {
            this.adjustGameSpeed(-1);
        }

        if (key === KeyCode.KEY_R && event.ctrlKey) {
            this.restartLevel();
        }
    }

    startLevel(levelId: number): boolean {
        const level = LEVELS.find(l => l.id === levelId);
        if (!level) return false;

        this.currentLevel = level;
        this.isRestarting = true;

        setTimeout(() => {
            this.performRestart();
        }, 0);

        return true;
    }

    private performRestart() {
        this.clearGameState();

        if (!this.currentLevel) return;

        this.gameState = {
            level: this.currentLevel.id,
            score: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalCompensation: 0,
            orders: [],
            riders: [],
            activeSubsidies: [],
            currentTime: 0,
            isPaused: false,
            isGameOver: false,
            isVictory: false,
            wrongSteps: [],
            gameSpeed: 1,
            weather: this.currentLevel.weather,
        };

        this.gameTime = 0;
        this.lastOrderTime = 0;
        this.lastSnapshotTime = 0;
        this.gameSpeed = 1;
        this.stateSnapshots = [];

        if (this.riderManager) {
            this.gameState.riders = this.riderManager.initRiders(this.currentLevel.riderCount);
        }

        if (this.subsidyManager) {
            this.subsidyManager.setActiveSubsidies(this.currentLevel.initialSubsidies);
            this.gameState.activeSubsidies = this.subsidyManager.getActiveSubsidies();
        }

        if (this.riderWarningSystem) {
            this.riderWarningSystem.clearAllWarnings();
        }

        if (this.trajectoryRenderer) {
            this.trajectoryRenderer.clearAllTrajectories();
        }

        if (this.orderManager) {
            this.orderManager.clearAll();
        }

        if (this.subsidyManager) {
            this.subsidyManager.clearHistory();
        }

        this.updateUI();
        this.isRestarting = false;

        this.eventDispatcher.emit('level-started', { level: this.currentLevel });
    }

    private clearGameState() {
        if (this.orderManager) {
            this.orderManager.clearAll();
        }
        if (this.riderManager) {
            this.riderManager.clearAll();
        }
        if (this.riderWarningSystem) {
            this.riderWarningSystem.clearAllWarnings();
        }
        if (this.trajectoryRenderer) {
            this.trajectoryRenderer.clearAllTrajectories();
        }
        this.stateSnapshots = [];
        this.gameState = null;
    }

    restartLevel(): boolean {
        if (!this.currentLevel) return false;
        return this.startLevel(this.currentLevel.id);
    }

    update(deltaTime: number) {
        if (!this.gameState || this.gameState.isPaused || this.gameState.isGameOver || this.isRestarting) return;

        const adjustedDelta = deltaTime * this.gameSpeed;
        this.gameTime += adjustedDelta;
        this.gameState.currentTime = this.gameTime;

        this.checkGameOver();
        this.generateOrdersIfNeeded();
        this.updateRiders(adjustedDelta);
        this.takeSnapshotIfNeeded();
        this.updateUI();
    }

    private checkGameOver() {
        if (!this.gameState || !this.currentLevel) return;

        if (this.gameTime >= this.currentLevel.duration) {
            this.gameState.isGameOver = true;
            this.gameState.isVictory =
                this.gameState.score >= this.currentLevel.targetScore &&
                this.gameState.totalCompensation <= this.currentLevel.maxCompensation;

            this.eventDispatcher.emit('game-over', {
                isVictory: this.gameState.isVictory,
                score: this.gameState.score,
                totalCompensation: this.gameState.totalCompensation,
                wrongSteps: this.gameState.wrongSteps,
                snapshots: this.stateSnapshots,
            });
        }

        if (this.gameState.totalCompensation > this.currentLevel.maxCompensation) {
            this.gameState.isGameOver = true;
            this.gameState.isVictory = false;

            this.eventDispatcher.emit('game-over', {
                isVictory: false,
                reason: 'compensation_exceeded',
                score: this.gameState.score,
                totalCompensation: this.gameState.totalCompensation,
                wrongSteps: this.gameState.wrongSteps,
                snapshots: this.stateSnapshots,
            });
        }
    }

    private generateOrdersIfNeeded() {
        if (!this.gameState || !this.currentLevel || !this.orderManager) return;

        const pendingOrders = this.orderManager.getPendingOrders().length;
        const activeOrders = this.orderManager.getActiveOrders().length;
        const totalOrders = pendingOrders + activeOrders;

        if (totalOrders >= this.currentLevel.maxOrders) return;

        if (this.gameTime - this.lastOrderTime >= this.currentLevel.orderFrequency) {
            const newOrder = this.orderManager.generateOrder(
                this.gameTime,
                this.gameState.weather
            );

            this.gameState.orders.push(newOrder);
            this.lastOrderTime = this.gameTime;

            this.eventDispatcher.emit('order-generated', { order: newOrder });
        }
    }

    private updateRiders(deltaTime: number) {
        if (!this.gameState || !this.riderManager || !this.orderManager) return;

        const riders = this.riderManager.getAllRiders();

        for (const rider of riders) {
            if (rider.status !== 'busy' || !rider.currentOrderId) continue;

            const order = this.orderManager.getOrderById(rider.currentOrderId);
            if (!order) continue;

            const targetPos = order.status === 'assigned' ? order.pickup : order.delivery;

            const arrived = this.riderManager.moveRiderToTarget(
                rider.id,
                targetPos,
                deltaTime,
                this.gameState.weather
            );

            if (this.trajectoryRenderer) {
                const trajectory = this.riderManager.getRiderById(rider.id)?.trajectory;
                if (trajectory && trajectory.length > 0) {
                    this.trajectoryRenderer.addTrajectoryPoint(
                        rider.id,
                        trajectory[trajectory.length - 1]
                    );
                }
            }

            if (arrived) {
                if (order.status === 'assigned') {
                    this.orderManager.updateOrderStatus(order.id, 'picked');
                    order.pickedAt = this.gameTime;
                } else if (order.status === 'picked') {
                    this.completeOrder(order);
                }
            }

            this.eventDispatcher.emit('rider-moved', { rider, position: rider.position });
        }
    }

    private completeOrder(order: Order) {
        if (!this.gameState || !this.orderManager || !this.subsidyManager || !this.riderManager) return;

        const deliveryTime = this.gameTime - order.createdAt;
        const isOnTime = deliveryTime <= order.expectedTime;

        const subsidy = this.subsidyManager.calculateSubsidy(
            order,
            this.gameTime,
            this.gameState.weather
        );

        const revenue = order.basePrice + subsidy;

        const { total: compensation, breakdown } = this.subsidyManager.calculateCompensation(
            order,
            order.wrongSteps,
            isOnTime ? undefined : deliveryTime
        );

        const scoreEarned = Math.max(0, Math.floor(
            (revenue - compensation) * (isOnTime ? 1.5 : 0.5)
        ));

        this.gameState.score += scoreEarned;
        this.gameState.totalRevenue += revenue;
        this.gameState.totalCost += compensation;
        this.gameState.totalCompensation += compensation;

        this.orderManager.updateOrderStatus(order.id, 'delivered');

        if (order.riderId) {
            this.riderManager.setRiderStatus(order.riderId, 'idle');
        }

        this.orderManager.removeCompletedOrders();

        this.eventDispatcher.emit('order-completed', {
            order,
            revenue,
            compensation,
            compensationBreakdown: breakdown,
            scoreEarned,
            isOnTime,
        });
    }

    assignOrderToRider(orderId: string, riderId: string): boolean {
        if (!this.gameState || !this.orderManager || !this.riderManager || !this.subsidyManager) return false;

        const order = this.orderManager.getOrderById(orderId);
        const rider = this.riderManager.getRiderById(riderId);

        if (!order || !rider || rider.status !== 'idle') return false;

        const rejectRisk = this.riderManager.checkRejectionRisk(
            riderId,
            this.gameState.weather,
            order.distance
        );

        if (this.riderWarningSystem) {
            this.riderWarningSystem.showRejectionWarning(
                rider,
                rejectRisk.warningLevel,
                this.gameTime
            );
        }

        if (rejectRisk.willReject) {
            this.handleRiderRejection(order, rider);
            return false;
        }

        this.orderManager.updateOrderStatus(orderId, 'assigned', riderId);
        this.riderManager.setRiderStatus(riderId, 'busy', orderId);

        this.eventDispatcher.emit('order-assigned', { order, rider });

        return true;
    }

    private handleRiderRejection(order: Order, rider: Rider) {
        if (!this.gameState || !this.riderManager || !this.orderManager) return;

        this.riderManager.recordRejection(rider.id);

        const wrongStep: Omit<WrongStep, 'time'> = {
            type: 'rider',
            description: `${rider.name} 拒接了订单 ${order.id.substring(0, 8)}`,
            correctAction: `选择拒单风险更低的骑手，或提高补贴`,
            impact: { cost: 15, delay: 60, satisfaction: -15 },
        };

        this.orderManager.addWrongStep(order.id, wrongStep);
        this.gameState.wrongSteps.push({
            ...wrongStep,
            time: Date.now(),
        });

        const compensation = this.subsidyManager!.calculateCompensation(
            order,
            [{ ...wrongStep, time: Date.now() }]
        );

        this.gameState.totalCompensation += compensation.total;

        this.eventDispatcher.emit('rider-rejection', {
            order,
            rider,
            wrongStep,
            compensation: compensation.total,
        });
    }

    private assignRiderByIndex(index: number) {
        if (!this.gameState || !this.orderManager || !this.riderManager) return;

        const pendingOrders = this.orderManager.getPendingOrders();
        const idleRiders = this.riderManager.getIdleRiders();

        if (pendingOrders.length > 0 && index >= 0 && index < idleRiders.length) {
            this.assignOrderToRider(pendingOrders[0].id, idleRiders[index].id);
        }
    }

    private toggleSubsidyByIndex(index: number) {
        if (!this.subsidyManager) return;

        const allSubsidies = this.subsidyManager.getAllSubsidyRules();
        if (index >= 0 && index < allSubsidies.length) {
            this.subsidyManager.toggleSubsidy(allSubsidies[index].id);
        }
    }

    private takeSnapshotIfNeeded() {
        if (!this.gameState || !this.orderManager || !this.riderManager || !this.subsidyManager) return;

        if (this.gameTime - this.lastSnapshotTime >= this.snapshotInterval) {
            const snapshot: GameStateSnapshot = {
                time: this.gameTime,
                orders: JSON.parse(JSON.stringify(this.orderManager.getAllOrders())),
                riders: JSON.parse(JSON.stringify(this.riderManager.getAllRiders())),
                activeSubsidies: this.subsidyManager.getActiveSubsidies(),
                score: this.gameState.score,
                totalCompensation: this.gameState.totalCompensation,
            };

            this.stateSnapshots.push(snapshot);
            this.lastSnapshotTime = this.gameTime;
        }
    }

    togglePause() {
        if (!this.gameState) return;
        this.gameState.isPaused = !this.gameState.isPaused;
    }

    adjustGameSpeed(direction: number) {
        this.gameSpeed = Math.max(0.5, Math.min(3, this.gameSpeed + direction * 0.5));
        if (this.gameState) {
            this.gameState.gameSpeed = this.gameSpeed;
        }
    }

    private onOrderGenerated(event: any) {
    }

    private onOrderCompleted(event: any) {
    }

    private onOrderFailed(event: any) {
    }

    private onRiderMoved(event: any) {
    }

    private onRiderRejection(event: any) {
    }

    private onWrongStep(wrongStep: WrongStep) {
        if (this.gameState) {
            this.gameState.wrongSteps.push(wrongStep);
        }
    }

    private updateUI() {
        if (!this.gameState || !this.currentLevel) return;

        if (this.scoreLabel) {
            this.scoreLabel.string = `分数: ${this.gameState.score}/${this.currentLevel.targetScore}`;
        }

        if (this.timeLabel) {
            const remaining = Math.max(0, this.currentLevel.duration - this.gameTime);
            const minutes = Math.floor(remaining / 60);
            const seconds = Math.floor(remaining % 60);
            this.timeLabel.string = `时间: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        if (this.levelLabel) {
            this.levelLabel.string = `关卡 ${this.currentLevel.id}: ${this.currentLevel.name}`;
        }

        if (this.weatherLabel) {
            const weatherInfo = WEATHER_EFFECTS[this.gameState.weather];
            this.weatherLabel.string = `天气: ${weatherInfo.name}`;
        }

        if (this.compensationLabel) {
            const remaining = Math.max(0, this.currentLevel.maxCompensation - this.gameState.totalCompensation);
            this.compensationLabel.string = `赔付: ${this.gameState.totalCompensation}/${this.currentLevel.maxCompensation}`;
        }
    }

    getGameState(): GameState | null {
        return this.gameState;
    }

    getCurrentLevel(): LevelConfig | null {
        return this.currentLevel;
    }

    getStateSnapshots(): GameStateSnapshot[] {
        return [...this.stateSnapshots];
    }

    getGameTime(): number {
        return this.gameTime;
    }

    getGameSpeed(): number {
        return this.gameSpeed;
    }

    onDestroy() {
        this.eventDispatcher.off('order-generated', this.onOrderGenerated, this);
        this.eventDispatcher.off('order-completed', this.onOrderCompleted, this);
        this.eventDispatcher.off('order-failed', this.onOrderFailed, this);
        this.eventDispatcher.off('rider-moved', this.onRiderMoved, this);
        this.eventDispatcher.off('rider-rejection', this.onRiderRejection, this);
        this.eventDispatcher.off('wrong-step', this.onWrongStep, this);
        this.node.off(Input.EventType.KEY_DOWN, this.handleKeyDown, this);
    }
}
