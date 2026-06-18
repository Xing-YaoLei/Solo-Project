import { _decorator, Label, Node, Button, Sprite, Color, instantiate } from 'cc';
import { UIBase } from './UIBase';
import { GameManager } from '../managers/GameManager';
import { DataManager } from '../managers/DataManager';
import { LevelManager } from '../managers/LevelManager';
import { AudioManager } from '../managers/AudioManager';
import { GameEvents } from '../utils/EventManager';

const { ccclass, property } = _decorator;

@ccclass('ResultPanel')
export class ResultPanel extends UIBase {
    @property(Label)
    resultTitleLabel: Label | null = null;

    @property(Label)
    scoreLabel: Label | null = null;

    @property(Label)
    moneyLabel: Label | null = null;

    @property(Label)
    timeLabel: Label | null = null;

    @property(Node)
    starsContainer: Node | null = null;

    @property(Node)
    starTemplate: Node | null = null;

    @property(Node)
    restartButton: Node | null = null;

    @property(Node)
    reviewButton: Node | null = null;

    @property(Node)
    menuButton: Node | null = null;

    @property(Node)
    nextLevelButton: Node | null = null;

    private _isVictory: boolean = false;
    private _stars: number = 0;

    onInit(): void {
        if (this.starTemplate) {
            this.starTemplate.active = false;
        }
    }

    onStart(): void {
        this.on(GameEvents.GAME_VICTORY, this.onVictory.bind(this));
        this.on(GameEvents.GAME_OVER, this.onGameOver.bind(this));
        this.on(GameEvents.PHASE_CHANGED, this.onPhaseChanged.bind(this));

        this.registerInput('confirm', this.onInputConfirm.bind(this));
        this.registerInput('restart', this.onRestartClicked.bind(this));
        this.registerInput('cancel', this.onMenuClicked.bind(this));

        this.bindButtonClick(this.restartButton, this.onRestartClicked.bind(this));
        this.bindButtonClick(this.reviewButton, this.onReviewClicked.bind(this));
        this.bindButtonClick(this.menuButton, this.onMenuClicked.bind(this));
        this.bindButtonClick(this.nextLevelButton, this.onNextLevelClicked.bind(this));
    }

    private onPhaseChanged(phase: string): void {
        if (phase === 'result') {
            this.show();
        } else {
            this.hide();
        }
    }

    private onVictory(data: any): void {
        this._isVictory = true;
        this._stars = data.stars || 0;
        this.updateResult(true, data.score, data.money, data.time, data.stars);
    }

    private onGameOver(data: any): void {
        this._isVictory = false;
        this.updateResult(false, data.score, data.money, data.time, 0);
    }

    private updateResult(isVictory: boolean, score: number, money: number, time: number, stars: number): void {
        if (this.resultTitleLabel) {
            this.resultTitleLabel.string = isVictory ? '任务完成！' : '任务失败';
            this.resultTitleLabel.color = isVictory
                ? new Color(50, 180, 50, 255)
                : new Color(200, 50, 50, 255);
        }

        if (this.scoreLabel) {
            this.scoreLabel.string = `得分：${score}`;
        }
        if (this.moneyLabel) {
            this.moneyLabel.string = `回款：¥${money}`;
        }
        if (this.timeLabel) {
            const minutes = Math.floor(time / 60);
            const seconds = time % 60;
            this.timeLabel.string = `用时：${minutes}分${seconds}秒`;
        }

        this.updateStars(stars);

        if (this.nextLevelButton) {
            this.nextLevelButton.active = isVictory;
        }

        if (isVictory) {
            AudioManager.instance.playSuccess();
        } else {
            AudioManager.instance.playError();
        }
    }

    private updateStars(stars: number): void {
        if (!this.starsContainer || !this.starTemplate) return;

        this.starsContainer.removeAllChildren();

        for (let i = 0; i < 3; i++) {
            const starNode = instantiate(this.starTemplate);
            starNode.active = true;
            starNode.setPosition(i * 60 - 60, 0, 0);

            const starSprite = starNode.getComponent(Sprite);
            if (starSprite) {
                starSprite.color = i < stars
                    ? new Color(255, 200, 0, 255)
                    : new Color(200, 200, 200, 255);
            }

            this.starsContainer.addChild(starNode);
        }
    }

    private onInputConfirm(source: string): void {
        if (!this.node.active) return;
        this.onRestartClicked();
    }

    public onRestartClicked(): void {
        AudioManager.instance.playClick();
        GameManager.instance.restartLevel();
    }

    public onReviewClicked(): void {
        AudioManager.instance.playClick();
        GameManager.instance.showReview();
    }

    public onMenuClicked(): void {
        AudioManager.instance.playClick();
        GameManager.instance.exitToMenu();
        this.emit(GameEvents.UI_SHOW_MENU);
    }

    public onNextLevelClicked(): void {
        AudioManager.instance.playClick();
        const state = GameManager.instance.gameState;
        if (!state) return;

        const allLevels = DataManager.instance ? DataManager.instance.getAllLevels() : [];
        const currentIndex = allLevels.findIndex(l => l.id === state.currentLevelId);

        if (currentIndex >= 0 && currentIndex < allLevels.length - 1) {
            const nextLevel = allLevels[currentIndex + 1];
            if (LevelManager.instance.isLevelUnlocked(nextLevel.id)) {
                GameManager.instance.startLevel(nextLevel.id);
            }
        }
    }

    onShow(): void {
        this.playShowAnimation();
    }
}
