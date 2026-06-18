import { _decorator, Label, Node, Button } from 'cc';
import { UIBase } from './UIBase';
import { GameManager } from '../managers/GameManager';
import { AudioManager } from '../managers/AudioManager';
import { GameEvents } from '../utils/EventManager';

const { ccclass, property } = _decorator;

@ccclass('HUD')
export class HUD extends UIBase {
    @property(Label)
    scoreLabel: Label | null = null;

    @property(Label)
    moneyLabel: Label | null = null;

    @property(Label)
    timeLabel: Label | null = null;

    @property(Label)
    phaseLabel: Label | null = null;

    @property(Node)
    pauseButton: Node | null = null;

    @property(Node)
    menuButton: Node | null = null;

    private _timeRemaining: number = 0;

    onStart(): void {
        this.on(GameEvents.SCORE_CHANGED, this.onScoreChanged.bind(this));
        this.on(GameEvents.MONEY_CHANGED, this.onMoneyChanged.bind(this));
        this.on(GameEvents.TIME_TICK, this.onTimeTick.bind(this));
        this.on(GameEvents.PHASE_CHANGED, this.onPhaseChanged.bind(this));
        this.on(GameEvents.GAME_START, this.onGameStart.bind(this));
        this.on(GameEvents.GAME_PAUSE, this.onPause.bind(this));
        this.on(GameEvents.GAME_RESUME, this.onResume.bind(this));

        this.registerInput('pause', this.onPauseToggle.bind(this));
        this.registerInput('menu', this.onMenuClicked.bind(this));
    }

    private onGameStart(levelConfig: any): void {
        if (this.scoreLabel) {
            this.scoreLabel.string = '得分：0';
        }
        if (this.moneyLabel) {
            this.moneyLabel.string = `回款：¥${levelConfig.task?.baseReward || 0}`;
        }
        if (this.timeLabel) {
            this.timeLabel.string = `时间：${levelConfig.task?.timeLimit || 0}s`;
        }
        this.show();
    }

    private onScoreChanged(score: number): void {
        if (this.scoreLabel) {
            this.scoreLabel.string = `得分：${score}`;
        }
    }

    private onMoneyChanged(money: number): void {
        if (this.moneyLabel) {
            this.moneyLabel.string = `回款：¥${money}`;
        }
    }

    private onTimeTick(time: number): void {
        this._timeRemaining = time;
        if (this.timeLabel) {
            const minutes = Math.floor(time / 60);
            const seconds = time % 60;
            this.timeLabel.string = `时间：${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    private onPhaseChanged(phase: string): void {
        if (this.phaseLabel) {
            const phaseNames: Record<string, string> = {
                'task_briefing': '任务简报',
                'clue_investigation': '线索调查',
                'document_editing': '单据编辑',
                'approval': '审批流程',
                'result': '结算',
                'review': '复盘',
            };
            this.phaseLabel.string = phaseNames[phase] || phase;
        }

        if (phase === 'result' || phase === 'task_briefing') {
            this.hide();
        } else if (phase !== 'result') {
            this.show();
        }
    }

    private onPauseToggle(source: string): void {
        if (!this.node.active) return;
        const state = GameManager.instance.gameState;
        if (state) {
            if (state.isPaused) {
                GameManager.instance.resumeGame();
            } else {
                GameManager.instance.pauseGame();
            }
        }
    }

    private onPause(): void {
    }

    private onResume(): void {
    }

    public onPauseClicked(): void {
        AudioManager.instance.playClick();
        GameManager.instance.pauseGame();
    }

    public onMenuClicked(): void {
        AudioManager.instance.playClick();
        GameManager.instance.exitToMenu();
        this.emit(GameEvents.UI_SHOW_MENU);
    }

    onShow(): void {
    }
}
