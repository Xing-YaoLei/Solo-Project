import { _decorator, Label, Node, Button } from 'cc';
import { UIBase } from './UIBase';
import { GameManager } from '../managers/GameManager';
import { AudioManager } from '../managers/AudioManager';
import { GameEvents } from '../utils/EventManager';

const { ccclass, property } = _decorator;

@ccclass('TaskBriefingPanel')
export class TaskBriefingPanel extends UIBase {
    @property(Label)
    levelTitleLabel: Label | null = null;

    @property(Label)
    descriptionLabel: Label | null = null;

    @property(Label)
    objectiveLabel: Label | null = null;

    @property(Label)
    rewardLabel: Label | null = null;

    @property(Label)
    timeLimitLabel: Label | null = null;

    @property(Label)
    difficultyLabel: Label | null = null;

    @property(Node)
    startButton: Node | null = null;

    onStart(): void {
        this.on(GameEvents.GAME_START, this.onGameStart.bind(this));
        this.on(GameEvents.PHASE_CHANGED, this.onPhaseChanged.bind(this));

        this.registerInput('confirm', this.onStartClicked.bind(this));
    }

    private onGameStart(levelConfig: any): void {
        this.updateInfo(levelConfig);
        this.show();
    }

    private onPhaseChanged(phase: string): void {
        if (phase === 'task_briefing') {
            this.show();
        } else if (this.node.active) {
            this.hide();
        }
    }

    public updateInfo(levelConfig: any): void {
        if (this.levelTitleLabel) {
            this.levelTitleLabel.string = levelConfig.name;
        }
        if (this.descriptionLabel) {
            this.descriptionLabel.string = levelConfig.description;
        }
        if (this.objectiveLabel) {
            this.objectiveLabel.string = `目标：${levelConfig.task.objective}`;
        }
        if (this.rewardLabel) {
            this.rewardLabel.string = `基础奖励：¥${levelConfig.task.baseReward}`;
        }
        if (this.timeLimitLabel) {
            this.timeLimitLabel.string = `时间限制：${levelConfig.task.timeLimit}秒`;
        }
        if (this.difficultyLabel) {
            const stars = '★'.repeat(levelConfig.difficulty) + '☆'.repeat(5 - levelConfig.difficulty);
            this.difficultyLabel.string = `难度：${stars}`;
        }
    }

    public onStartClicked(): void {
        AudioManager.instance.playConfirm();
        GameManager.instance.startGameplay();
    }

    public onBackClicked(): void {
        AudioManager.instance.playClick();
        this.emit(GameEvents.UI_SHOW_MENU);
    }

    onShow(): void {
        this.playShowAnimation();
    }
}
