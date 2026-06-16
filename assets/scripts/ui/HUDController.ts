import { _decorator, Component, Node, Label, ProgressBar, Color } from 'cc';
import { GameTypes } from '../types/GameTypes';
import { GameManager, GameEvent } from '../core/GameManager';
import { SaveManager } from '../core/SaveManager';

const { ccclass, property } = _decorator;

@ccclass('HUDController')
export class HUDController extends Component {

    @property(Label)
    levelNameLabel: Label | null = null;

    @property(Label)
    scoreLabel: Label | null = null;

    @property(Label)
    timeLabel: Label | null = null;

    @property(ProgressBar)
    timeProgressBar: ProgressBar | null = null;

    @property(Node)
    insuranceWarningIcon: Node | null = null;

    @property(Label)
    insuranceCountLabel: Label | null = null;

    @property(Label)
    phaseLabel: Label | null = null;

    @property(Node)
    abandonButton: Node | null = null;

    @property(Node)
    backToMenuButton: Node | null = null;

    @property(Node)
    replayButton: Node | null = null;

    @property(Node)
    rankingButton: Node | null = null;

    private timerHandle: number | null = null;
    private timeRemaining: number = 0;

    start(): void {
        GameManager.instance.eventTarget.on(GameEvent.SESSION_STARTED, this.onSessionStarted, this);
        GameManager.instance.eventTarget.on(GameEvent.SESSION_COMPLETED, this.onSessionCompleted, this);
        GameManager.instance.eventTarget.on(GameEvent.SCORE_UPDATED, this.onScoreUpdated, this);
        GameManager.instance.eventTarget.on(GameEvent.INSURANCE_TRIGGERED, this.onInsuranceTriggered, this);
        GameManager.instance.eventTarget.on(GameEvent.PHASE_CHANGED, this.onPhaseChanged, this);

        this.abandonButton?.on(Node.EventType.TOUCH_END, this.onAbandonClicked, this);
        this.backToMenuButton?.on(Node.EventType.TOUCH_END, this.onBackToMenuClicked, this);
        this.replayButton?.on(Node.EventType.TOUCH_END, this.onReplayClicked, this);
        this.rankingButton?.on(Node.EventType.TOUCH_END, this.onRankingClicked, this);

        this.updateMainMenuState();
    }

    onDestroy(): void {
        GameManager.instance.eventTarget.off(GameEvent.SESSION_STARTED, this.onSessionStarted, this);
        GameManager.instance.eventTarget.off(GameEvent.SESSION_COMPLETED, this.onSessionCompleted, this);
        GameManager.instance.eventTarget.off(GameEvent.SCORE_UPDATED, this.onScoreUpdated, this);
        GameManager.instance.eventTarget.off(GameEvent.INSURANCE_TRIGGERED, this.onInsuranceTriggered, this);
        GameManager.instance.eventTarget.off(GameEvent.PHASE_CHANGED, this.onPhaseChanged, this);
        this.stopTimer();
    }

    private onSessionStarted(session: GameTypes.LevelSession): void {
        const levelConfig = GameManager.instance.getCurrentLevelConfig();
        if (this.levelNameLabel && levelConfig) {
            this.levelNameLabel.string = levelConfig.name;
        }

        this.timeRemaining = levelConfig?.timeLimit || 600;
        this.startTimer();
        this.onScoreUpdated(session.totalScore);
        this.updateInsuranceCount(0);

        this.abandonButton?.setActive(true);
        this.backToMenuButton?.setActive(false);
    }

    private onSessionCompleted(): void {
        this.stopTimer();
        this.abandonButton?.setActive(false);
        this.backToMenuButton?.setActive(true);
    }

    private onScoreUpdated(score: number): void {
        if (this.scoreLabel) {
            this.scoreLabel.string = `${score.toFixed(1)}分`;
            const session = GameManager.instance.getCurrentSession();
            if (session) {
                if (score >= session.passScore) {
                    this.scoreLabel.color = new Color(46, 125, 50);
                } else if (score >= session.passScore * 0.7) {
                    this.scoreLabel.color = new Color(230, 81, 0);
                } else {
                    this.scoreLabel.color = new Color(198, 40, 40);
                }
            }
        }
    }

    private onInsuranceTriggered(): void {
        const session = GameManager.instance.getCurrentSession();
        if (session) {
            this.updateInsuranceCount(session.insuranceRejectionCount);
        }
    }

    private updateInsuranceCount(count: number): void {
        if (this.insuranceWarningIcon && this.insuranceCountLabel) {
            this.insuranceWarningIcon.active = count > 0;
            this.insuranceCountLabel.string = count > 0 ? `${count}` : '';
        }
    }

    private onPhaseChanged(phase: GameTypes.GamePhase): void {
        if (this.phaseLabel) {
            this.phaseLabel.string = this.getPhaseDisplay(phase);
        }
    }

    private getPhaseDisplay(phase: GameTypes.GamePhase): string {
        const map: Record<GameTypes.GamePhase, string> = {
            'MENU': '主菜单',
            'LEVEL_SELECT': '关卡选择',
            'TASK_ACCEPT': '接任务',
            'CLUE_OBSERVATION': '观察线索',
            'ACTION_SELECTION': '选择动作',
            'FEEDBACK': '结果反馈',
            'QUESTION_SET': '评估题组',
            'SETTLEMENT': '关卡结算',
            'NURSING_LOG': '护理日志',
            'BILLING_DETAIL': '结算明细'
        };
        return map[phase] || phase;
    }

    private startTimer(): void {
        this.stopTimer();
        this.updateTimeDisplay();

        this.timerHandle = window.setInterval(() => {
            this.timeRemaining--;
            this.updateTimeDisplay();

            if (this.timeRemaining <= 0) {
                this.stopTimer();
            }
        }, 1000);
    }

    private stopTimer(): void {
        if (this.timerHandle !== null) {
            clearInterval(this.timerHandle);
            this.timerHandle = null;
        }
    }

    private updateTimeDisplay(): void {
        if (this.timeLabel) {
            const mins = Math.floor(Math.max(0, this.timeRemaining) / 60);
            const secs = Math.floor(Math.max(0, this.timeRemaining) % 60);
            this.timeLabel.string = `${mins}:${secs.toString().padStart(2, '0')}`;

            if (this.timeRemaining < 60) {
                this.timeLabel.color = new Color(198, 40, 40);
            } else if (this.timeRemaining < 180) {
                this.timeLabel.color = new Color(230, 81, 0);
            } else {
                this.timeLabel.color = new Color(33, 33, 33);
            }
        }

        if (this.timeProgressBar) {
            const session = GameManager.instance.getCurrentSession();
            const levelConfig = GameManager.instance.getCurrentLevelConfig();
            if (levelConfig) {
                this.timeProgressBar.progress = Math.max(0, this.timeRemaining / levelConfig.timeLimit);
            }
        }
    }

    private onAbandonClicked(): void {
        GameManager.instance.abandonSession();
        this.updateMainMenuState();
    }

    private onBackToMenuClicked(): void {
        GameManager.instance.setPhase('LEVEL_SELECT');
    }

    private onReplayClicked(): void {
        const replays = SaveManager.instance.getAllReplaySummaries();
        console.log('可用回放:', replays.length);
    }

    private onRankingClicked(): void {
        GameManager.instance.setPhase('MENU');
    }

    private updateMainMenuState(): void {
        this.abandonButton?.setActive(false);
        this.backToMenuButton?.setActive(false);
        if (this.scoreLabel) this.scoreLabel.string = '0分';
        if (this.timeLabel) this.timeLabel.string = '--:--';
        this.updateInsuranceCount(0);
        if (this.levelNameLabel) this.levelNameLabel.string = '康复中心模拟训练';
        if (this.phaseLabel) this.phaseLabel.string = '主菜单';
    }
}
