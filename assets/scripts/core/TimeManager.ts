import { EventManager, GameEvents } from './EventManager';

export class TimeManager {
    private static _instance: TimeManager | null = null;

    private _isPaused: boolean = false;
    private _gameTime: number = 0;
    private _realStartTime: number = 0;
    private _timeScale: number = 1;
    private _dayDurationMinutes: number = 1;
    private _currentDay: number = 1;
    private _totalDays: number = 30;
    private _tickIntervalMs: number = 100;
    private _lastTickTime: number = 0;

    public static getInstance(): TimeManager {
        if (!this._instance) {
            this._instance = new TimeManager();
        }
        return this._instance;
    }

    public init(totalDays: number, dayDurationMinutes: number = 1): void {
        this._totalDays = totalDays;
        this._dayDurationMinutes = dayDurationMinutes;
        this._gameTime = 0;
        this._currentDay = 1;
        this._realStartTime = Date.now();
        this._lastTickTime = Date.now();
        this._isPaused = false;
        this._timeScale = 1;
    }

    public update(): void {
        if (this._isPaused) return;

        const now = Date.now();
        const deltaRealMs = now - this._lastTickTime;

        if (deltaRealMs >= this._tickIntervalMs) {
            this._lastTickTime = now;
            const deltaGameMs = deltaRealMs * this._timeScale;
            this._gameTime += deltaGameMs;

            const dayMs = this._dayDurationMinutes * 60 * 1000;
            const newDay = Math.min(
                Math.floor(this._gameTime / dayMs) + 1,
                this._totalDays
            );

            if (newDay !== this._currentDay) {
                this._currentDay = newDay;
                EventManager.getInstance().emit(GameEvents.DAY_PASSED, this._currentDay);
            }

            EventManager.getInstance().emit(GameEvents.TIME_TICK, {
                gameTime: this._gameTime,
                currentDay: this._currentDay,
                dayProgress: (this._gameTime % dayMs) / dayMs
            });
        }
    }

    public pause(): void {
        this._isPaused = true;
        EventManager.getInstance().emit(GameEvents.GAME_PAUSE);
    }

    public resume(): void {
        this._isPaused = false;
        this._lastTickTime = Date.now();
        EventManager.getInstance().emit(GameEvents.GAME_RESUME);
    }

    public setTimeScale(scale: number): void {
        this._timeScale = Math.max(0, Math.min(scale, 10));
    }

    public getTimeScale(): number {
        return this._timeScale;
    }

    public getCurrentDay(): number {
        return this._currentDay;
    }

    public getTotalDays(): number {
        return this._totalDays;
    }

    public getGameTime(): number {
        return this._gameTime;
    }

    public getDayProgress(): number {
        const dayMs = this._dayDurationMinutes * 60 * 1000;
        return (this._gameTime % dayMs) / dayMs;
    }

    public getRemainingDays(): number {
        return this._totalDays - this._currentDay + 1;
    }

    public isPaused(): boolean {
        return this._isPaused;
    }

    public isGameOver(): boolean {
        return this._currentDay >= this._totalDays && this.getDayProgress() >= 1;
    }

    public getDayDurationMinutes(): number {
        return this._dayDurationMinutes;
    }

    public reset(): void {
        this._gameTime = 0;
        this._currentDay = 1;
        this._isPaused = false;
        this._timeScale = 1;
    }
}
