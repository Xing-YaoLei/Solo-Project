import { _decorator } from 'cc';
import { Singleton } from '../core/Singleton';
import { EventBus, GameEvents } from '../core/EventBus';
import { ConfigManager } from '../config/ConfigManager';
import { ItemService } from '../services/ItemService';
import { ItemEffect } from '../types';
const { ccclass } = _decorator;

@ccclass('TimeManager')
export class TimeManager extends Singleton<TimeManager> {
  private _timeRemaining: number = 0;
  private _timeLimit: number = 0;
  private _running: boolean = false;
  private _paused: boolean = false;
  private _lastUpdateTime: number = 0;
  private _reviewStartTime: number = 0;
  private _gameStartTime: number = 0;
  private _gameEndTime: number = 0;
  private _warningThreshold: number = 60;

  get timeRemaining(): number {
    return Math.max(0, this._timeRemaining);
  }

  get timeLimit(): number {
    return this._timeLimit;
  }

  get timeElapsed(): number {
    return this._timeLimit - this._timeRemaining;
  }

  get progress(): number {
    if (this._timeLimit <= 0) return 0;
    return this.timeElapsed / this._timeLimit;
  }

  get isRunning(): boolean {
    return this._running && !this._paused;
  }

  get isPaused(): boolean {
    return this._paused;
  }

  get isWarning(): boolean {
    return this._timeRemaining <= this._warningThreshold && this._timeRemaining > 0;
  }

  get isTimeUp(): boolean {
    return this._timeRemaining <= 0;
  }

  get reviewStartTime(): number {
    return this._reviewStartTime;
  }

  get gameStartTime(): number {
    return this._gameStartTime;
  }

  get gameEndTime(): number {
    return this._gameEndTime;
  }

  get totalGameDuration(): number {
    if (this._gameEndTime > 0 && this._gameStartTime > 0) {
      return this._gameEndTime - this._gameStartTime;
    }
    return this.timeElapsed;
  }

  init(): void {
    const config = ConfigManager.getInstance().difficultyConfig;
    this._timeLimit = config.timeLimit;
    this._timeRemaining = config.timeLimit;
    this._running = false;
    this._paused = false;
    this._warningThreshold = 60;
  }

  start(): void {
    this._running = true;
    this._paused = false;
    this._lastUpdateTime = Date.now();
    this._gameStartTime = Date.now();
    this._reviewStartTime = 0;
    this._gameEndTime = 0;
  }

  pause(): void {
    if (!this._running || this._paused) return;
    this._paused = true;
    this._reviewStartTime = Date.now();
    EventBus.instance.emit(GameEvents.GAME_PAUSE);
  }

  resume(): void {
    if (!this._running || !this._paused) return;
    this._paused = false;
    this._lastUpdateTime = Date.now();
    
    if (this._reviewStartTime > 0) {
      this._reviewStartTime = 0;
    }
    
    EventBus.instance.emit(GameEvents.GAME_RESUME);
  }

  stop(): void {
    this._running = false;
    this._paused = false;
    this._gameEndTime = Date.now();
  }

  update(): void {
    if (!this._running || this._paused) return;

    const now = Date.now();
    const deltaTime = (now - this._lastUpdateTime) / 1000;
    this._lastUpdateTime = now;

    if (deltaTime > 0 && deltaTime < 1) {
      this._timeRemaining -= deltaTime;
      EventBus.instance.emit(GameEvents.TIME_UPDATE, this._timeRemaining, deltaTime);
    }

    if (this._timeRemaining <= 0) {
      this._timeRemaining = 0;
      this.onTimeUp();
    }
  }

  private onTimeUp(): void {
    this.stop();
    EventBus.instance.emit(GameEvents.GAME_END, false, { reason: 'time_up' });
  }

  addTime(seconds: number): void {
    this._timeRemaining = Math.min(this._timeLimit, this._timeRemaining + seconds);
  }

  applyItemEffect(effect: ItemEffect): void {
    switch (effect.type) {
      case 'extend_time':
        this.addTime(effect.value);
        break;
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getFormattedTimeRemaining(): string {
    return this.formatTime(this.timeRemaining);
  }

  getFormattedTimeElapsed(): string {
    return this.formatTime(this.timeElapsed);
  }

  getReviewDuration(): number {
    if (this._reviewStartTime <= 0) return 0;
    return (Date.now() - this._reviewStartTime) / 1000;
  }

  reset(): void {
    this.init();
    this._gameStartTime = 0;
    this._gameEndTime = 0;
    this._reviewStartTime = 0;
  }
}
