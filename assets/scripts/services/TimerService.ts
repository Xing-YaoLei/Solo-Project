import { EventBus } from '../core/EventBus';
import { GameEventType } from '../data/enums/GameEventType';

export class TimerService {
    private static _instance: TimerService | null = null;
    private remainingTime: number = 0;
    private isRunning: boolean = false;
    private intervalId: number | null = null;
    private lastUpdateTime: number = 0;

    public static get instance(): TimerService {
        if (!TimerService._instance) {
            TimerService._instance = new TimerService();
        }
        return TimerService._instance;
    }

    public start(seconds: number): void {
        this.remainingTime = seconds;
        this.isRunning = true;
        this.lastUpdateTime = Date.now();
        this.startInterval();
    }

    public pause(): void {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.stopInterval();
        EventBus.instance.emit(GameEventType.PAUSE);
    }

    public resume(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastUpdateTime = Date.now();
        this.startInterval();
        EventBus.instance.emit(GameEventType.RESUME);
    }

    public stop(): void {
        this.isRunning = false;
        this.stopInterval();
        this.remainingTime = 0;
    }

    public reset(seconds: number): void {
        this.stop();
        this.start(seconds);
    }

    public getRemainingTime(): number {
        return Math.max(0, Math.ceil(this.remainingTime));
    }

    public isTimerRunning(): boolean {
        return this.isRunning;
    }

    public formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    private startInterval(): void {
        this.stopInterval();
        this.intervalId = window.setInterval(() => {
            this.tick();
        }, 100);
    }

    private stopInterval(): void {
        if (this.intervalId !== null) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private tick(): void {
        if (!this.isRunning) return;

        const now = Date.now();
        const delta = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;
        this.remainingTime -= delta;

        if (this.remainingTime <= 0) {
            this.remainingTime = 0;
            this.stop();
            EventBus.instance.emit(GameEventType.TIME_UP);
        }

        EventBus.instance.emit(GameEventType.DATA_UPDATED, 'timer', this.remainingTime);
    }

    public getTimePercentage(): number {
        return Math.max(0, this.remainingTime / 300);
    }
}
