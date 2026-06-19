import { _decorator, Component } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('TimerTask')
export class TimerTask extends Component {

    @property({ type: CCFloat })
    totalSeconds: number = 60;

    @property({ type: CCBoolean })
    autoStart: boolean = false;

    @property({ type: CCBoolean })
    countDown: boolean = true;

    private _elapsed: number = 0;
    private _isRunning: boolean = false;
    private _isPaused: boolean = false;

    onLoad(): void {
        if (this.autoStart) {
            this.startTimer();
        }
    }

    startTimer(): void {
        this._elapsed = 0;
        this._isRunning = true;
        this._isPaused = false;
    }

    pauseTimer(): void {
        if (this._isRunning && !this._isPaused) {
            this._isPaused = true;
        }
    }

    resumeTimer(): void {
        if (this._isRunning && this._isPaused) {
            this._isPaused = false;
        }
    }

    resetTimer(): void {
        this._elapsed = 0;
        this._isRunning = false;
        this._isPaused = false;
    }

    update(dt: number): void {
        if (!this._isRunning || this._isPaused) return;

        this._elapsed += dt;

        if (this.countDown) {
            const remaining = this.totalSeconds - this._elapsed;
            if (remaining <= 0) {
                this._elapsed = this.totalSeconds;
                this._isRunning = false;
                this.node.emit('timer-expired');
                return;
            }
        }

        this.node.emit('timer-tick', {
            elapsed: this.getElapsed(),
            remaining: this.getRemaining(),
            progress: this.getProgress(),
        });
    }

    getElapsed(): number {
        return this._elapsed;
    }

    getRemaining(): number {
        if (this.countDown) {
            return Math.max(0, this.totalSeconds - this._elapsed);
        }
        return 0;
    }

    getProgress(): number {
        if (this.totalSeconds <= 0) return 1;
        const progress = this._elapsed / this.totalSeconds;
        return Math.min(1, Math.max(0, progress));
    }

    addTime(seconds: number): void {
        this.totalSeconds += seconds;
        if (this.totalSeconds < 0) {
            this.totalSeconds = 0;
        }
    }
}
