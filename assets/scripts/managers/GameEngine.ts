import { _decorator, Component, Node } from 'cc';
import {
    GameStats,
    LevelConfig,
    LevelResult,
    Order,
    OrderStatus
} from '../core/GameTypes';
import { OrderProcessingResult } from './OrderProcessor';
import { SeatMapManager } from './SeatMapManager';
const { ccclass } = _decorator;

export type GamePhase = 'ready' | 'countdown' | 'playing' | 'paused' | 'ended';

export interface GameState {
    phase: GamePhase;
    countdownRemaining: number;
    gameTimeRemaining: number;
    currentOrder: Order | null;
    orderQueue: Order[];
    ordersProcessed: number;
    stats: GameStats;
    levelConfig: LevelConfig;
}

@ccclass('GameEngine')
export class GameEngine extends Component {
    private state: GameState | null = null;
    private seatManager: SeatMapManager | null = null;

    private lastOrderSpawnTime: number = 0;
    private lastProcessTime: number = 0;
    private gameStartTime: number = 0;
    private elapsedTime: number = 0;

    onGameStart: (() => void) | null = null;
    onGameEnd: ((result: LevelResult) => void) | null = null;
    onOrderSpawned: ((order: Order) => void) | null = null;
    onOrderProcessed: ((result: OrderProcessingResult) => void) | null = null;
    onTimeUpdated: ((remaining: number, elapsed: number) => void) | null = null;
    onCountdownUpdated: ((remaining: number) => void) | null = null;
    onErrorOccurred: (() => void) | null = null;
    onCorrectAction: ((combo: number) => void) | null = null;

    init(levelConfig: LevelConfig, seatManager: SeatMapManager): void {
        this.seatManager = seatManager;
        this.state = {
            phase: 'ready',
            countdownRemaining: 3,
            gameTimeRemaining: levelConfig.duration,
            currentOrder: null,
            orderQueue: [],
            ordersProcessed: 0,
            stats: {
                levelId: levelConfig.id,
                ordersProcessed: 0,
                ordersCorrect: 0,
                ordersRejected: 0,
                correctRejections: 0,
                errors: 0,
                maxConsecutiveCorrect: 0,
                currentConsecutiveCorrect: 0,
                totalTime: 0,
                processingStartTime: 0,
                averageProcessingTime: 0,
                processingTimes: [],
                ticketsSold: 0,
                revenue: 0,
                seatsUtilization: 0
            },
            levelConfig
        };
    }

    startGame(): void {
        if (!this.state) return;
        this.state.phase = 'countdown';
        this.state.countdownRemaining = 3;
        this.runCountdown();
    }

    private runCountdown(): void {
        const tick = () => {
            if (!this.state || this.state.phase !== 'countdown') return;

            this.onCountdownUpdated?.(this.state.countdownRemaining);

            if (this.state.countdownRemaining <= 0) {
                this.beginPlayPhase();
                return;
            }

            this.state.countdownRemaining--;
            this.scheduleOnce(tick, 1);
        };
        tick();
    }

    private beginPlayPhase(): void {
        if (!this.state) return;

        this.state.phase = 'playing';
        this.gameStartTime = Date.now();
        this.elapsedTime = 0;
        this.lastOrderSpawnTime = 0;

        this.onGameStart?.();
        this.spawnOrder();
    }

    pauseGame(): void {
        if (this.state?.phase === 'playing') {
            this.state.phase = 'paused';
        }
    }

    resumeGame(): void {
        if (this.state?.phase === 'paused') {
            this.state.phase = 'playing';
        }
    }

    restartGame(): void {
        if (!this.state) return;
        this.unscheduleAllCallbacks();
        this.init(this.state.levelConfig, this.seatManager!);
        this.startGame();
    }

    getState(): GameState | null {
        return this.state;
    }

    getCurrentOrder(): Order | null {
        return this.state?.currentOrder || null;
    }

    processCurrentOrder(result: OrderProcessingResult): void {
        if (!this.state || !this.state.currentOrder) return;

        const now = Date.now();
        const processingTime = this.state.stats.processingStartTime > 0
            ? (now - this.state.stats.processingStartTime) / 1000
            : 0;

        if (processingTime > 0) {
            this.state.stats.processingTimes.push(processingTime);
            const total = this.state.stats.processingTimes.reduce((a, b) => a + b, 0);
            this.state.stats.averageProcessingTime = total / this.state.stats.processingTimes.length;
        }

        if (result.success) {
            this.state.stats.ordersCorrect++;
            this.state.stats.currentConsecutiveCorrect++;
            if (this.state.stats.currentConsecutiveCorrect > this.state.stats.maxConsecutiveCorrect) {
                this.state.stats.maxConsecutiveCorrect = this.state.stats.currentConsecutiveCorrect;
            }

            if (result.correctRejection) {
                this.state.stats.correctRejections++;
                this.state.stats.ordersRejected++;
            } else {
                const order = this.state.currentOrder;
                this.state.stats.ticketsSold += order.items.length;
                this.state.stats.revenue += order.totalPrice;
            }

            this.onCorrectAction?.(this.state.stats.currentConsecutiveCorrect);
        } else {
            this.state.stats.errors++;
            this.state.stats.currentConsecutiveCorrect = 0;

            if (this.state.currentOrder.status === OrderStatus.REJECTED) {
                this.state.stats.ordersRejected++;
            }

            this.onErrorOccurred?.();
        }

        this.state.stats.ordersProcessed++;
        this.state.ordersProcessed++;

        this.onOrderProcessed?.(result);

        this.checkGameEndConditions();

        if (this.state.phase === 'playing') {
            this.prepareNextOrder();
        }
    }

    rejectCurrentOrder(): void {
        if (!this.state || !this.state.currentOrder) return;

        const order = this.state.currentOrder;
        const shouldReject = this.wouldOrderBeValid(order);

        const result: OrderProcessingResult = {
            orderId: order.id,
            success: !shouldReject,
            errors: shouldReject ? [] : ['错误地拒绝了有效订单'],
            processedItems: 0,
            correctRejection: shouldReject,
            validationDetails: {
                ruleChecks: [],
                seatChecks: []
            }
        };

        this.processCurrentOrder(result);
    }

    update(deltaTime: number): void {
        if (!this.state || this.state.phase !== 'playing') return;

        this.elapsedTime += deltaTime;
        this.state.gameTimeRemaining = Math.max(0, this.state.levelConfig.duration - this.elapsedTime);
        this.state.stats.totalTime = this.elapsedTime;

        this.onTimeUpdated?.(this.state.gameTimeRemaining, this.elapsedTime);

        const spawnInterval = this.state.levelConfig.orderSpawnRate;
        if (this.elapsedTime - this.lastOrderSpawnTime >= spawnInterval) {
            this.spawnOrder();
        }

        if (this.state.gameTimeRemaining <= 0) {
            this.endGame();
        }
    }

    private spawnOrder(): void {
        if (!this.state) return;

        this.lastOrderSpawnTime = this.elapsedTime;
    }

    private prepareNextOrder(): void {
        if (!this.state) return;

        this.state.currentOrder = null;
        this.state.stats.processingStartTime = 0;
    }

    setCurrentOrder(order: Order): void {
        if (!this.state) return;
        this.state.currentOrder = order;
        this.state.stats.processingStartTime = Date.now();
        this.onOrderSpawned?.(order);
    }

    private wouldOrderBeValid(order: Order): boolean {
        return !order.items.every(item => item.valid);
    }

    private checkGameEndConditions(): void {
        if (!this.state) return;

        if (this.state.stats.errors >= this.state.levelConfig.maxErrors) {
            this.endGame();
            return;
        }

        if (this.state.stats.ordersProcessed >= this.state.levelConfig.targetOrders) {
            this.endGame();
            return;
        }
    }

    private endGame(): void {
        if (!this.state) return;

        this.unscheduleAllCallbacks();
        this.state.phase = 'ended';

        const seatStats = this.seatManager?.getStatistics();
        if (seatStats) {
            this.state.stats.seatsUtilization = seatStats.total > 0
                ? seatStats.sold / seatStats.total
                : 0;
        }

        const result = this.calculateFinalResult();
        this.onGameEnd?.(result);
    }

    private calculateFinalResult(): LevelResult {
        if (!this.state) {
            return {
                levelId: 0,
                passed: false,
                stats: {} as GameStats,
                score: 0,
                efficiencyScore: 0,
                speedScore: 0,
                accuracyScore: 0,
                timestamp: Date.now()
            };
        }

        const stats = this.state.stats;
        const levelConfig = this.state.levelConfig;

        const targetAccuracy = 0.85;
        const accuracy = stats.ordersProcessed > 0
            ? stats.ordersCorrect / stats.ordersProcessed
            : 0;

        const expectedOrders = levelConfig.targetOrders;
        const targetTime = levelConfig.duration;
        const actualTime = stats.totalTime;

        const speedRatio = expectedOrders > 0 && actualTime > 0
            ? Math.min(2, (stats.ordersProcessed / expectedOrders) * (targetTime / Math.max(actualTime, targetTime)))
            : 0;

        const speedScore = Math.round(speedRatio * 100 * levelConfig.rewardMultiplier);
        const accuracyScore = Math.round(accuracy * 100 * levelConfig.rewardMultiplier);

        const consecutiveBonus = Math.min(100, stats.maxConsecutiveCorrect * 5);
        const efficiencyBase = (speedScore * 0.4 + accuracyScore * 0.5 + consecutiveBonus * 0.1);
        const efficiencyScore = Math.round(efficiencyBase);

        const totalScore = Math.round(efficiencyScore * levelConfig.rewardMultiplier);

        const passed = accuracy >= targetAccuracy &&
            stats.ordersProcessed >= Math.floor(expectedOrders * 0.7) &&
            stats.errors < levelConfig.maxErrors;

        return {
            levelId: levelConfig.id,
            passed,
            stats: { ...stats },
            score: Math.max(0, totalScore),
            efficiencyScore: Math.max(0, efficiencyScore),
            speedScore: Math.max(0, speedScore),
            accuracyScore: Math.max(0, accuracyScore),
            timestamp: Date.now()
        };
    }

    destroy(): void {
        this.unscheduleAllCallbacks();
    }
}
