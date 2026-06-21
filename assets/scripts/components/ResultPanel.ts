import { _decorator, Component, Node, Label, Button, Sprite, Color, tween, Vec3 } from 'cc';
import { GameManager } from '../core/GameManager';
import { GameResult, MistakeRecord } from '../models';
import { ActionType } from '../models/GameEnums';
import { director } from 'cc';
import { GameSaveManager } from '../data/GameSaveManager';
const { ccclass, property } = _decorator;

@ccclass('ResultPanel')
export class ResultPanel extends Component {
    @property(Node)
    resultContent: Node | null = null;

    @property(Label)
    titleLabel: Label | null = null;

    @property(Label)
    scoreLabel: Label | null = null;

    @property(Label)
    timeLabel: Label | null = null;

    @property(Label)
    accuracyLabel: Label | null = null;

    @property(Label)
    correctCountLabel: Label | null = null;

    @property(Node)
    starsContainer: Node | null = null;

    @property(Node)
    mistakeList: Node | null = null;

    @property(Button)
    retryBtn: Button | null = null;

    @property(Button)
    nextLevelBtn: Button | null = null;

    @property(Button)
    backBtn: Button | null = null;

    @property(Node)
    passedBadge: Node | null = null;

    @property(Node)
    failedBadge: Node | null = null;

    onLoad() {
        this.registerEvents();
    }

    private registerEvents(): void {
        if (this.retryBtn) {
            this.retryBtn.node.on(Button.EventType.CLICK, this.onRetry, this);
        }
        if (this.nextLevelBtn) {
            this.nextLevelBtn.node.on(Button.EventType.CLICK, this.onNextLevel, this);
        }
        if (this.backBtn) {
            this.backBtn.node.on(Button.EventType.CLICK, this.onBack, this);
        }
    }

    public showResult(result: GameResult): void {
        if (!this.resultContent) return;

        this.resultContent.active = true;
        this.updateResultInfo(result);
        this.updateStars(result.stars);
        this.updateMistakes(result.mistakes);
        this.updateButtons(result.passed);

        GameSaveManager.getInstance().updateLevelProgress(
            result.levelId,
            result.totalScore,
            result.usedTime,
            result.stars,
            result.passed
        );

        this.playShowAnimation();
    }

    private updateResultInfo(result: GameResult): void {
        if (this.titleLabel) {
            this.titleLabel.string = result.passed ? '训练完成！' : '训练结束';
        }
        if (this.scoreLabel) {
            this.scoreLabel.string = `${result.totalScore}`;
        }
        if (this.timeLabel) {
            const mins = Math.floor(result.usedTime / 60);
            const secs = Math.floor(result.usedTime % 60);
            this.timeLabel.string = `${mins}分${secs}秒`;
        }
        if (this.accuracyLabel) {
            this.accuracyLabel.string = `${Math.floor(result.accuracy * 100)}%`;
        }
        if (this.correctCountLabel) {
            this.correctCountLabel.string = `${result.correctCount}/${result.totalTasks}`;
        }
        if (this.passedBadge) {
            this.passedBadge.active = result.passed;
        }
        if (this.failedBadge) {
            this.failedBadge.active = !result.passed;
        }
    }

    private updateStars(stars: number): void {
        if (!this.starsContainer) return;

        const starNodes = this.starsContainer.children;
        for (let i = 0; i < starNodes.length; i++) {
            const star = starNodes[i];
            const sprite = star.getComponent(Sprite);
            if (sprite) {
                sprite.color = i < stars ? new Color(255, 193, 7) : new Color(200, 200, 200);
            }
        }
    }

    private updateMistakes(mistakes: MistakeRecord[]): void {
        if (!this.mistakeList) return;

        this.mistakeList.removeAllChildren();

        if (mistakes.length === 0) {
            const noMistakeNode = new Node('NoMistake');
            const label = noMistakeNode.addComponent(Label);
            label.string = '太棒了！没有错误！';
            label.fontSize = 14;
            label.color = new Color(76, 175, 80);
            this.mistakeList.addChild(noMistakeNode);
            return;
        }

        const actionNames: Record<ActionType, string> = {
            [ActionType.APPROVE_RESERVATION]: '批准',
            [ActionType.REJECT_RESERVATION]: '拒绝',
            [ActionType.RESCHEDULE]: '改约',
            [ActionType.CHECK_IN]: '签到',
            [ActionType.DENY_ENTRY]: '拒绝入园',
            [ActionType.ESCALATE]: '上报'
        };

        for (let i = 0; i < Math.min(mistakes.length, 5); i++) {
            const mistake = mistakes[i];

            const itemNode = new Node(`Mistake_${i}`);
            itemNode.setContentSize(500, 60);

            const nameLabel = new Node('Name');
            const nameComp = nameLabel.addComponent(Label);
            nameComp.string = mistake.visitorName;
            nameComp.fontSize = 14;
            nameLabel.setPosition(-200, 15, 0);
            itemNode.addChild(nameLabel);

            const expectedLabel = new Node('Expected');
            const expectedComp = expectedLabel.addComponent(Label);
            expectedComp.string = `应选: ${actionNames[mistake.expectedAction]}`;
            expectedComp.fontSize = 12;
            expectedComp.color = new Color(76, 175, 80);
            expectedLabel.setPosition(-100, -10, 0);
            itemNode.addChild(expectedLabel);

            const actualLabel = new Node('Actual');
            const actualComp = actualLabel.addComponent(Label);
            actualComp.string = `你选: ${actionNames[mistake.actualAction]}`;
            actualComp.fontSize = 12;
            actualComp.color = new Color(244, 67, 54);
            actualLabel.setPosition(0, -10, 0);
            itemNode.addChild(actualLabel);

            const reasonLabel = new Node('Reason');
            const reasonComp = reasonLabel.addComponent(Label);
            reasonComp.string = mistake.explanation;
            reasonComp.fontSize = 11;
            reasonComp.color = Color.GRAY;
            reasonComp.overflow = Label.Overflow.CLAMP;
            reasonLabel.setContentSize(200, 20);
            reasonLabel.setPosition(150, 0, 0);
            itemNode.addChild(reasonLabel);

            this.mistakeList.addChild(itemNode);
        }

        if (mistakes.length > 5) {
            const moreNode = new Node('MoreMistakes');
            const moreLabel = moreNode.addComponent(Label);
            moreLabel.string = `还有 ${mistakes.length - 5} 个错误...`;
            moreLabel.fontSize = 12;
            moreLabel.color = Color.GRAY;
            this.mistakeList.addChild(moreNode);
        }
    }

    private updateButtons(passed: boolean): void {
        if (this.nextLevelBtn) {
            this.nextLevelBtn.node.active = passed;
        }
    }

    private playShowAnimation(): void {
        if (!this.resultContent) return;

        this.resultContent.setScale(0.8, 0.8, 1);
        tween(this.resultContent)
            .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
    }

    private onRetry(): void {
        const gameManager = GameManager.instance;
        const level = gameManager?.getCurrentLevel();
        if (level) {
            gameManager?.initLevel(level);
            this.hide();
        }
    }

    private onNextLevel(): void {
        director.loadScene('LevelSelect');
    }

    private onBack(): void {
        director.loadScene('LevelSelect');
    }

    public hide(): void {
        if (this.resultContent) {
            this.resultContent.active = false;
        }
    }

    public isVisible(): boolean {
        return this.resultContent?.active || false;
    }
}
