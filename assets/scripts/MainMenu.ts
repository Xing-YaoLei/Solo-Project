import { _decorator, Component, Node, Label, Button, Sprite, Color, tween, Vec3 } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('MainMenu')
export class MainMenu extends Component {
    @property(Node)
    menuNode: Node | null = null;

    @property(Label)
    titleLabel: Label | null = null;

    @property(Label)
    subtitleLabel: Label | null = null;

    @property(Button)
    startButton: Button | null = null;

    @property(Button)
    levelSelectButton: Button | null = null;

    @property(Button)
    reviewButton: Button | null = null;

    @property(Button)
    settingsButton: Button | null = null;

    onLoad() {
        this.setupEventListeners();
        this.playIntroAnimation();
    }

    setupEventListeners(): void {
        if (this.startButton) {
            this.startButton.node.on(Button.EventType.CLICK, this.onStartGame, this);
        }
        if (this.levelSelectButton) {
            this.levelSelectButton.node.on(Button.EventType.CLICK, this.onLevelSelect, this);
        }
        if (this.reviewButton) {
            this.reviewButton.node.on(Button.EventType.CLICK, this.onReview, this);
        }
        if (this.settingsButton) {
            this.settingsButton.node.on(Button.EventType.CLICK, this.onSettings, this);
        }
    }

    playIntroAnimation(): void {
        if (!this.menuNode) return;

        const intensity = GameManager.instance.getAnimationMultiplier();

        this.menuNode.opacity = 0;
        tween(this.menuNode)
            .delay(0.3)
            .to(0.5, { opacity: 255 })
            .start();

        const buttons = [this.startButton, this.levelSelectButton, this.reviewButton, this.settingsButton];
        buttons.forEach((btn, index) => {
            if (btn && btn.node) {
                btn.node.setScale(0, 0, 1);
                tween(btn.node)
                    .delay(0.5 + index * 0.1)
                    .to(0.4 * intensity, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                    .start();
            }
        });
    }

    onStartGame(): void {
        GameManager.instance.playSound('click');
        const currentLevelId = this.findContinueLevel();
        GameManager.instance.currentLevelId = currentLevelId;
        console.log('Start game from level:', currentLevelId);
    }

    findContinueLevel(): number {
        let levelId = 1;
        for (let i = 1; i <= 5; i++) {
            const result = GameManager.instance.getLevelResult(i);
            if (!result || !result.passed) {
                levelId = i;
                break;
            }
            if (i === 5 && result?.passed) {
                levelId = 5;
            }
        }
        return levelId;
    }

    onLevelSelect(): void {
        GameManager.instance.playSound('click');
        console.log('Open level select');
    }

    onReview(): void {
        GameManager.instance.playSound('click');
        console.log('Open review');
    }

    onSettings(): void {
        GameManager.instance.playSound('click');
        console.log('Open settings');
    }
}
