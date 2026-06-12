import { _decorator, Component, Node, Label, ProgressBar, Color, Sprite } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { TimeManager } from '../core/TimeManager';
import { GameManager } from '../core/GameManager';
const { ccclass, property } = _decorator;

@ccclass('GameTimer')
export class GameTimer extends Component {
    @property(Label)
    public dayLabel: Label | null = null;

    @property(Label)
    public timeLabel: Label | null = null;

    @property(Label)
    public capitalLabel: Label | null = null;

    @property(Label)
    public remainingLabel: Label | null = null;

    @property(ProgressBar)
    public dayProgressBar: ProgressBar | null = null;

    @property(Sprite)
    public urgencyIndicator: Sprite | null = null;

    @property
    public updateInterval: number = 0.2;

    private _accumulator: number = 0;

    onLoad() {
        EventManager.getInstance().on(GameEvents.TIME_TICK, this.onTimeTick.bind(this));
        EventManager.getInstance().on(GameEvents.DAY_PASSED, this.onDayPassed.bind(this));
        EventManager.getInstance().on(GameEvents.GAME_START, this.onGameStart.bind(this));
    }

    update(dt: number) {
        this._accumulator += dt;
        if (this._accumulator >= this.updateInterval) {
            this._accumulator = 0;
            this.updateDisplay();
        }
    }

    onDestroy() {
        EventManager.getInstance().off(GameEvents.TIME_TICK, this.onTimeTick.bind(this));
        EventManager.getInstance().off(GameEvents.DAY_PASSED, this.onDayPassed.bind(this));
        EventManager.getInstance().off(GameEvents.GAME_START, this.onGameStart.bind(this));
    }

    private onGameStart(data: any): void {
        this.updateDisplay();
    }

    private onTimeTick(data: { currentDay: number; dayProgress: number }): void {
        this.updateDisplay();
    }

    private onDayPassed(day: number): void {
        this.updateDisplay();
    }

    private updateDisplay(): void {
        const timeMgr = TimeManager.getInstance();
        const gameMgr = GameManager.getInstance();

        if (this.dayLabel) {
            this.dayLabel.string = `第 ${timeMgr.getCurrentDay()} / ${timeMgr.getTotalDays()} 天`;
        }

        if (this.timeLabel) {
            const progress = timeMgr.getDayProgress();
            const hour = Math.floor(progress * 24);
            const minute = Math.floor((progress * 24 - hour) * 60);
            this.timeLabel.string = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        }

        if (this.capitalLabel) {
            const capital = gameMgr.getCapital();
            this.capitalLabel.string = `资金: ¥${capital.toLocaleString()}`;
            this.capitalLabel.color = capital < 1000 ? new Color(255, 100, 100) : Color.WHITE;
        }

        if (this.remainingLabel) {
            const remaining = timeMgr.getRemainingDays();
            this.remainingLabel.string = `剩余 ${remaining} 天`;
        }

        if (this.dayProgressBar) {
            this.dayProgressBar.progress = timeMgr.getDayProgress();
        }

        this.updateUrgency();
    }

    private updateUrgency(): void {
        if (!this.urgencyIndicator) return;

        const remaining = TimeManager.getInstance().getRemainingDays();
        const total = TimeManager.getInstance().getTotalDays();
        const ratio = remaining / total;

        let color: Color;
        if (ratio <= 0.1) {
            color = new Color(255, 50, 50, 255);
        } else if (ratio <= 0.25) {
            color = new Color(255, 180, 50, 255);
        } else {
            color = new Color(100, 200, 100, 255);
        }

        this.urgencyIndicator.color = color;
    }
}
