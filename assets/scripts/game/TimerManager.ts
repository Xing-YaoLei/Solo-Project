import { _decorator, Component } from "cc";

const { ccclass, property } = _decorator;

export interface TimerState {
    remaining: number;
    total: number;
    isRunning: boolean;
    isPaused: boolean;
}

@ccclass("TimerManager")
export class TimerManager extends Component {
    private _remaining: number = 0;
    private _total: number = 0;
    private _isRunning: boolean = false;
    private _isPaused: boolean = false;
    private _onTick: ((remaining: number) => void)[] = [];
    private _onWarning: ((remaining: number) => void)[] = [];
    private _onExpired: (() => void)[] = [];
    private _warningThreshold: number = 10;
    private _warningFired: boolean = false;

    get remaining(): number { return this._remaining; }
    get total(): number { return this._total; }
    get isRunning(): boolean { return this._isRunning; }
    get isPaused(): boolean { return this._isPaused; }
    get progress(): number { return this._total > 0 ? this._remaining / this._total : 0; }

    onTick(callback: (remaining: number) => void): void {
        this._onTick.push(callback);
    }

    onWarning(callback: (remaining: number) => void): void {
        this._onWarning.push(callback);
    }

    onExpired(callback: () => void): void {
        this._onExpired.push(callback);
    }

    start(totalSeconds: number, warningThreshold: number = 10): void {
        this._total = totalSeconds;
        this._remaining = totalSeconds;
        this._isRunning = true;
        this._isPaused = false;
        this._warningThreshold = warningThreshold;
        this._warningFired = false;
    }

    pause(): void {
        if (this._isRunning && !this._isPaused) {
            this._isPaused = true;
        }
    }

    resume(): void {
        if (this._isRunning && this._isPaused) {
            this._isPaused = false;
        }
    }

    addTime(seconds: number): void {
        this._remaining = Math.max(0, this._remaining + seconds);
    }

    getState(): TimerState {
        return {
            remaining: this._remaining,
            total: this._total,
            isRunning: this._isRunning,
            isPaused: this._isPaused
        };
    }

    update(dt: number): void {
        if (!this._isRunning || this._isPaused) return;

        this._remaining -= dt;

        for (const cb of this._onTick) {
            cb(this._remaining);
        }

        if (!this._warningFired && this._remaining <= this._warningThreshold) {
            this._warningFired = true;
            for (const cb of this._onWarning) {
                cb(this._remaining);
            }
        }

        if (this._remaining <= 0) {
            this._remaining = 0;
            this._isRunning = false;
            for (const cb of this._onExpired) {
                cb();
            }
        }
    }

    stop(): void {
        this._isRunning = false;
        this._isPaused = false;
    }

    reset(): void {
        this._remaining = this._total;
        this._isRunning = false;
        this._isPaused = false;
        this._warningFired = false;
    }
}
