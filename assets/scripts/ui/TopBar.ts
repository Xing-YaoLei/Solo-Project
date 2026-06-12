import { _decorator, Component, Node, Button, Label, Color } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { GameManager } from '../core/GameManager';
import { TimeManager } from '../core/TimeManager';
import { InventoryManager } from '../game/InventoryManager';
const { ccclass, property } = _decorator;

@ccclass('TopBar')
export class TopBar extends Component {
    @property(Button)
    public pauseBtn: Button | null = null;

    @property(Button)
    public inventoryCheckBtn: Button | null = null;

    @property(Button)
    public settingsBtn: Button | null = null;

    @property(Node)
    public pausePanel: Node | null = null;

    @property(Node)
    public inventoryCheckDialog: Node | null = null;

    @property(Label)
    public capitalLabel: Label | null = null;

    @property(Label)
    public dayLabel: Label | null = null;

    @property(Button)
    public resumeBtn: Button | null = null;

    @property(Button)
    public quitBtn: Button | null = null;

    private _isPaused: boolean = false;

    onLoad() {
        if (this.pauseBtn) {
            this.pauseBtn.node.on(Button.EventType.CLICK, this.togglePause, this);
        }
        if (this.inventoryCheckBtn) {
            this.inventoryCheckBtn.node.on(Button.EventType.CLICK, this.showInventoryCheck, this);
        }
        if (this.resumeBtn) {
            this.resumeBtn.node.on(Button.EventType.CLICK, this.togglePause, this);
        }
        if (this.quitBtn) {
            this.quitBtn.node.on(Button.EventType.CLICK, this.onQuit, this);
        }

        if (this.pausePanel) this.pausePanel.active = false;

        EventManager.getInstance().on(GameEvents.GAME_PAUSE, this.onGamePause.bind(this));
        EventManager.getInstance().on(GameEvents.GAME_RESUME, this.onGameResume.bind(this));
    }

    onDestroy() {
        if (this.pauseBtn) {
            this.pauseBtn.node.off(Button.EventType.CLICK, this.togglePause, this);
        }
        if (this.inventoryCheckBtn) {
            this.inventoryCheckBtn.node.off(Button.EventType.CLICK, this.showInventoryCheck, this);
        }
        if (this.resumeBtn) {
            this.resumeBtn.node.off(Button.EventType.CLICK, this.togglePause, this);
        }
        if (this.quitBtn) {
            this.quitBtn.node.off(Button.EventType.CLICK, this.onQuit, this);
        }

        EventManager.getInstance().off(GameEvents.GAME_PAUSE, this.onGamePause.bind(this));
        EventManager.getInstance().off(GameEvents.GAME_RESUME, this.onGameResume.bind(this));
    }

    update(dt: number) {
        if (this.capitalLabel && GameManager.getInstance().isPlaying()) {
            this.capitalLabel.string = `¥${GameManager.getInstance().getCapital().toLocaleString()}`;
        }
        if (this.dayLabel && GameManager.getInstance().isPlaying()) {
            this.dayLabel.string = `第 ${TimeManager.getInstance().getCurrentDay()}/${TimeManager.getInstance().getTotalDays()} 天`;
        }
    }

    public togglePause(): void {
        this._isPaused = !this._isPaused;

        if (this._isPaused) {
            TimeManager.getInstance().pause();
        } else {
            TimeManager.getInstance().resume();
        }

        if (this.pausePanel) {
            this.pausePanel.active = this._isPaused;
        }
    }

    private onGamePause(): void {
        this._isPaused = true;
    }

    private onGameResume(): void {
        this._isPaused = false;
    }

    private showInventoryCheck(): void {
        if (!this.inventoryCheckDialog) return;

        this.inventoryCheckDialog.active = true;
        this.inventoryCheckDialog.emit('show', 'store_main');
    }

    private onQuit(): void {
        const stats = GameManager.getInstance().getStats();
        const levelMgr = (globalThis as any).__LEVEL_MANAGER_CLASS__;
        if (levelMgr) {
            const result = levelMgr.getInstance().evaluateLevel(stats);
            const endResult = GameManager.getInstance().endLevel(
                result.isPassed,
                result.objectiveScores,
                result.totalScore
            );
            levelMgr.getInstance().completeLevel(endResult);
        }
    }
}
