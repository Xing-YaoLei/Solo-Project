import { _decorator, Component, Label, Node, ProgressBar, Color, Sprite, tween, Vec3 } from 'cc';
import { GameManager } from '../core/GameManager';
import { GameMode } from '../models/GameEnums';
const { ccclass, property } = _decorator;

@ccclass('GameHUD')
export class GameHUD extends Component {
    @property(Label)
    scoreLabel: Label | null = null;

    @property(Label)
    comboLabel: Label | null = null;

    @property(Label)
    timeLabel: Label | null = null;

    @property(ProgressBar)
    timeProgress: ProgressBar | null = null;

    @property(Label)
    levelNameLabel: Label | null = null;

    @property(Label)
    modeLabel: Label | null = null;

    @property(Node)
    comboContainer: Node | null = null;

    @property(Sprite)
    timeBarSprite: Sprite | null = null;

    private lastScore: number = 0;

    update(deltaTime: number) {
        this.updateHUD();
    }

    private updateHUD(): void {
        const gameManager = GameManager.instance;
        if (!gameManager) return;

        const currentScore = gameManager.getScore();
        if (this.scoreLabel && currentScore !== this.lastScore) {
            this.scoreLabel.string = `${currentScore}`;
            this.lastScore = currentScore;
        }

        const combo = gameManager.getCombo();
        if (this.comboLabel) {
            this.comboLabel.string = `x${combo}`;
        }
        if (this.comboContainer) {
            this.comboContainer.active = combo >= 2;
        }

        const gameTime = gameManager.getGameTime();
        const level = gameManager.getCurrentLevel();
        if (this.timeLabel && level) {
            const remaining = Math.max(0, level.timeLimit - gameTime);
            this.timeLabel.string = gameManager.formatTime(remaining);

            if (this.timeProgress) {
                this.timeProgress.progress = remaining / level.timeLimit;
            }

            if (this.timeBarSprite) {
                const ratio = remaining / level.timeLimit;
                if (ratio < 0.2) {
                    this.timeBarSprite.color = new Color(244, 67, 54);
                } else if (ratio < 0.5) {
                    this.timeBarSprite.color = new Color(255, 193, 7);
                } else {
                    this.timeBarSprite.color = new Color(76, 175, 80);
                }
            }
        }

        if (this.levelNameLabel && level) {
            this.levelNameLabel.string = level.name;
        }

        if (this.modeLabel) {
            const mode = gameManager.getGameMode();
            const modeNames: Record<GameMode, string> = {
                [GameMode.FORMAL_TRAINING]: '正式训练',
                [GameMode.FREE_PRACTICE]: '自由练习',
                [GameMode.CHALLENGE]: '挑战模式'
            };
            this.modeLabel.string = modeNames[mode] || '';
        }
    }

    public animateScoreChange(delta: number): void {
        if (!this.scoreLabel || !this.node) return;

        const popupNode = new Node('ScorePopup');
        const popupLabel = popupNode.addComponent(Label);
        popupLabel.string = delta > 0 ? `+${delta}` : `${delta}`;
        popupLabel.fontSize = 24;
        popupLabel.color = delta > 0 ? new Color(76, 175, 80) : new Color(244, 67, 54);

        popupNode.setPosition(this.scoreLabel.node.position.x, this.scoreLabel.node.position.y + 30, 0);
        this.node.addChild(popupNode);

        tween(popupNode)
            .by(0.5, { position: new Vec3(0, 40, 0) })
            .call(() => {
                popupNode.destroy();
            })
            .start();
    }
}
