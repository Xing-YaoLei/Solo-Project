import { _decorator, Component } from "cc";
import { AppointmentSystem } from "../appointment/AppointmentSystem";
import { LevelManager } from "./LevelManager";
import { TimerManager } from "./TimerManager";
import { ScoreManager, ScoreRecord } from "./ScoreManager";
import { LevelConfig, ScenarioEvent } from "./LevelConfig";
import { ArrivalStatus } from "../appointment/Customer";
import { SlotStatus } from "../appointment/TimeSlot";

const { ccclass, property } = _decorator;

export enum GamePhase {
    IDLE = "idle",
    LOADING = "loading",
    PLAYING = "playing",
    PAUSED = "paused",
    CHECKING_ARRIVAL = "checking_arrival",
    ASSIGNING = "assigning",
    SETTLING = "settling",
    REPLAY = "replay",
    STATISTICS = "statistics"
}

@ccclass("GameManager")
export class GameManager extends Component {
    private _phase: GamePhase = GamePhase.IDLE;
    private _appointmentSystem: AppointmentSystem | null = null;
    private _levelManager: LevelManager | null = null;
    private _timerManager: TimerManager | null = null;
    private _scoreManager: ScoreManager | null = null;
    private _scenarioEvents: ScenarioEvent[] = [];
    private _eventIndex: number = 0;
    private _gameTime: number = 0;
    private _onPhaseChange: ((phase: GamePhase) => void)[] = [];

    get phase(): GamePhase { return this._phase; }
    get appointmentSystem(): AppointmentSystem | null { return this._appointmentSystem; }
    get levelManager(): LevelManager | null { return this._levelManager; }
    get timerManager(): TimerManager | null { return this._timerManager; }
    get scoreManager(): ScoreManager | null { return this._scoreManager; }
    get gameTime(): number { return this._gameTime; }

    onPhaseChange(callback: (phase: GamePhase) => void): void {
        this._onPhaseChange.push(callback);
    }

    initialize(
        appointmentSystem: AppointmentSystem,
        levelManager: LevelManager,
        timerManager: TimerManager,
        scoreManager: ScoreManager
    ): void {
        this._appointmentSystem = appointmentSystem;
        this._levelManager = levelManager;
        this._timerManager = timerManager;
        this._scoreManager = scoreManager;
    }

    startLevel(levelId: string): boolean {
        if (!this._levelManager || !this._appointmentSystem || !this._timerManager || !this._scoreManager) {
            return false;
        }

        if (!this._levelManager.selectLevel(levelId)) return false;

        const level = this._levelManager.currentLevel!;
        const scenario = this._levelManager.currentScenario!;
        const rule = this._levelManager.currentCapacityRule!;
        const customers = this._levelManager.getLevelCustomers();
        const services = this._levelManager.getLevelServices();

        this._appointmentSystem.initialize(
            customers,
            services,
            rule,
            level.stationCount,
            scenario.timeRange.start,
            scenario.timeRange.end,
            scenario.slotIntervalMinutes
        );

        this._timerManager.start(level.timeLimitSeconds, 10);
        this._scoreManager.beginLevel(levelId);

        this._scenarioEvents = [...scenario.events].sort((a, b) => {
            const aMin = this._timeToMinutes(a.time);
            const bMin = this._timeToMinutes(b.time);
            return aMin - bMin;
        });
        this._eventIndex = 0;
        this._gameTime = 0;

        this._setPhase(GamePhase.PLAYING);
        return true;
    }

    update(dt: number): void {
        if (this._phase !== GamePhase.PLAYING && this._phase !== GamePhase.CHECKING_ARRIVAL) return;

        if (this._timerManager && this._timerManager.isRunning && !this._timerManager.isPaused) {
            this._timerManager.update(dt);
        }

        this._gameTime += dt;
        this._processScenarioEvents();
    }

    private _processScenarioEvents(): void {
        if (!this._appointmentSystem || !this._levelManager) return;

        const level = this._levelManager.currentLevel;
        if (!level) return;

        while (this._eventIndex < this._scenarioEvents.length) {
            const event = this._scenarioEvents[this._eventIndex];
            const eventTime = this._timeToMinutes(event.time);
            const startMin = this._timeToMinutes(this._levelManager.currentScenario!.timeRange.start);
            const elapsedGameMinutes = (this._gameTime / (level.timeLimitSeconds)) *
                (this._timeToMinutes(this._levelManager.currentScenario!.timeRange.end) - startMin);
            const currentGameTime = startMin + elapsedGameMinutes;

            if (currentGameTime < eventTime) break;

            this._handleScenarioEvent(event);
            this._eventIndex++;
        }
    }

    private _handleScenarioEvent(event: ScenarioEvent): void {
        if (!this._appointmentSystem) return;

        switch (event.type) {
            case "arrival_check":
                this._setPhase(GamePhase.CHECKING_ARRIVAL);
                break;
            case "customer_arrive":
                if (event.customerId) {
                    const customer = this._appointmentSystem.customers.get(event.customerId);
                    if (customer) {
                        customer.arrivalStatus = ArrivalStatus.ARRIVED;
                    }
                }
                break;
            case "batch_arrive":
                if (event.customerIds) {
                    for (const cid of event.customerIds) {
                        const customer = this._appointmentSystem.customers.get(cid);
                        if (customer) {
                            customer.arrivalStatus = ArrivalStatus.ARRIVED;
                        }
                    }
                }
                break;
            case "walk_in":
                if (event.customerId) {
                    const customer = this._appointmentSystem.customers.get(event.customerId);
                    if (customer) {
                        customer.arrivalStatus = ArrivalStatus.WALK_IN;
                    }
                }
                break;
            case "late_arrival":
                if (event.customerId) {
                    const customer = this._appointmentSystem.customers.get(event.customerId);
                    if (customer) {
                        customer.arrivalStatus = ArrivalStatus.LATE;
                        customer.lateMinutes = event.lateMinutes ?? 0;
                    }
                }
                break;
            case "cancel":
                if (event.customerId) {
                    const customer = this._appointmentSystem.customers.get(event.customerId);
                    if (customer) {
                        customer.arrivalStatus = ArrivalStatus.CANCELLED;
                        this._appointmentSystem.removeAssignment(event.customerId);
                    }
                }
                break;
            case "peak_start":
                break;
        }
    }

    judgeArrival(customerId: string, status: ArrivalStatus): void {
        if (!this._appointmentSystem || !this._scoreManager) return;

        const result = this._appointmentSystem.checkArrival(customerId, status);
        this._scoreManager.recordArrivalCheck(result);

        if (this._phase === GamePhase.CHECKING_ARRIVAL) {
            this._setPhase(GamePhase.PLAYING);
        }
    }

    assignAppointment(customerId: string, stationIndex: number, time: string): boolean {
        if (!this._appointmentSystem || !this._scoreManager || !this._levelManager) return false;

        const result = this._appointmentSystem.assignCustomer(customerId, stationIndex, time);

        if (!result.success) {
            for (const conflict of result.conflicts) {
                this._scoreManager.recordConflict(conflict, this._levelManager.currentCapacityRule?.id ?? "");
            }
            return false;
        }

        return true;
    }

    removeAppointment(customerId: string): boolean {
        if (!this._appointmentSystem) return false;
        return this._appointmentSystem.removeAssignment(customerId);
    }

    finishLevel(): ScoreRecord {
        if (!this._appointmentSystem || !this._scoreManager || !this._levelManager) {
            throw new Error("Game not initialized");
        }

        if (this._timerManager) {
            this._timerManager.stop();
        }

        const arrivalRate = this._appointmentSystem.calculateArrivalRate();
        const level = this._levelManager.currentLevel!;

        if (this._timerManager && this._timerManager.remaining <= 0) {
            this._scoreManager.recordTimeout();
        }

        const record = this._scoreManager.finishLevel(arrivalRate, level);
        this._setPhase(GamePhase.SETTLING);
        return record;
    }

    showStatistics(): void {
        this._setPhase(GamePhase.STATISTICS);
    }

    returnToIdle(): void {
        this._setPhase(GamePhase.IDLE);
    }

    private _setPhase(phase: GamePhase): void {
        this._phase = phase;
        for (const cb of this._onPhaseChange) {
            cb(phase);
        }
    }

    private _timeToMinutes(time: string): number {
        const parts = time.split(":");
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
}
