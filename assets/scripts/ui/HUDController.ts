import { _decorator, Component, Node, Label, ProgressBar, Color, Sprite, UIOpacity, tween, Vec3, UITransform, Layout, Graphics } from 'cc';
import { GameStats, LevelResult } from '../core/GameTypes';
import { FeedbackManager } from '../core/FeedbackManager';
const { ccclass, property } = _decorator;

@ccclass('HUDController')
export class HUDController extends Component {
    @property(Node)
    hudRoot: Node | null = null;

    @property(Label)
    timerLabel: Label | null = null;

    @property(Label)
    orderProgressLabel: Label | null = null;

    @property(Label)
    comboLabel: Label | null = null;

    @property(Label)
    errorCountLabel: Label | null = null;

    @property(ProgressBar)
    orderProgressBar: ProgressBar | null = null;

    @property(ProgressBar)
    timerProgressBar: ProgressBar | null = null;

    @property(Node)
    comboDisplay: Node | null = null;

    @property(Node)
    errorFlashNode: Node | null = null;

    @property(Node)
    correctFlashNode: Node | null = null;

    @property(Label)
    scoreLabel: Node | null = null;

    private currentCombo: number = 0;
    private maxComboDisplayed: number = 0;
    private flashTween: any = null;

    updateTimer(remaining: number, total: number): void {
        if (this.timerLabel) {
            const mins = Math.floor(remaining / 60);
            const secs = Math.floor(remaining % 60);
            this.timerLabel.string = `${mins}:${secs.toString().padStart(2, '0')}`;

            if (remaining <= 10) {
                this.timerLabel.color = new Color(231, 76, 60, 255);
            } else if (remaining <= 30) {
                this.timerLabel.color = new Color(241, 196, 15, 255);
            } else {
                this.timerLabel.color = new Color(46, 204, 113, 255);
            }
        }

        if (this.timerProgressBar && total > 0) {
            this.timerProgressBar.progress = remaining / total;
            const fill = this.timerProgressBar.fillRange;
            const barSprite = this.timerProgressBar.barSprite;
            if (barSprite) {
                if (remaining / total <= 0.1) {
                    barSprite.color = new Color(231, 76, 60, 255);
                } else if (remaining / total <= 0.3) {
                    barSprite.color = new Color(241, 196, 15, 255);
                }
            }
        }
    }

    updateOrderProgress(current: number, target: number): void {
        if (this.orderProgressLabel) {
            this.orderProgressLabel.string = `${current} / ${target}`;
        }

        if (this.orderProgressBar) {
            this.orderProgressBar.progress = Math.min(1, current / target);
        }
    }

    updateCombo(combo: number): void {
        this.currentCombo = combo;

        if (this.comboLabel) {
            this.comboLabel.string = `连击 x${combo}`;
        }

        if (combo >= 3) {
            this.showComboAnimation(combo);
        }

        if (combo > this.maxComboDisplayed) {
            this.maxComboDisplayed = combo;
            if (this.comboDisplay) {
                this.pulseNode(this.comboDisplay, 1.15, 0.3);
            }
        }
    }

    updateErrorCount(errors: number, maxErrors: number): void {
        if (this.errorCountLabel) {
            this.errorCountLabel.string = `错误: ${errors}/${maxErrors}`;

            if (errors >= maxErrors - 1) {
                this.errorCountLabel.color = new Color(231, 76, 60, 255);
            } else if (errors >= maxErrors - 2) {
                this.errorCountLabel.color = new Color(241, 196, 15, 255);
            }
        }
    }

    showCorrectFeedback(): void {
        if (this.correctFlashNode) {
            this.flashNode(this.correctFlashNode, new Color(46, 204, 113, 100), 0.4);
        }
        if (FeedbackManager.instance.shouldAnimate()) {
            this.pulseNode(this.node, 1.02, 0.2);
        }
    }

    showErrorFeedback(): void {
        if (this.errorFlashNode) {
            this.flashNode(this.errorFlashNode, new Color(231, 76, 60, 150), 0.5);
        }
        this.shakeNode(this.node, 8, 0.3);
    }

    showCountdown(number: number): void {
        if (!this.hudRoot) return;

        let countdownNode = this.hudRoot.getChildByName('Countdown');
        if (!countdownNode) {
            countdownNode = new Node('Countdown');
            countdownNode.addComponent(UITransform).setContentSize(400, 400);
            countdownNode.setPosition(0, 0, 0);
            this.hudRoot.addChild(countdownNode);

            const labelNode = new Node('Number');
            const ui = labelNode.addComponent(UITransform);
            ui.setContentSize(400, 400);
            const label = labelNode.addComponent(Label);
            label.fontSize = 200;
            label.lineHeight = 400;
            labelNode.name = 'Number';
            countdownNode.addChild(labelNode);
        }

        const label = countdownNode.getChildByName('Number')?.getComponent(Label);
        if (label) {
            label.string = number > 0 ? number.toString() : '开始!';
            countdownNode.setScale(0.5, 0.5, 1);
            countdownNode.active = true;

            tween(countdownNode)
                .to(0.5, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'backOut' })
                .to(0.3, { scale: new Vec3(1.5, 1.5, 1), opacity: 0 })
                .call(() => {
                    countdownNode.active = false;
                    countdownNode.setScale(1, 1, 1);
                    const op = countdownNode.getComponent(UIOpacity) || countdownNode.addComponent(UIOpacity);
                    op.opacity = 255;
                })
                .start();
        }
    }

    updateScore(score: number): void {
        if (this.scoreLabel && this.scoreLabel instanceof Label) {
            this.scoreLabel.string = `得分: ${score}`;
        }
    }

    private showComboAnimation(combo: number): void {
        if (!this.hudRoot || !FeedbackManager.instance.shouldAnimate()) return;

        let comboPopNode = this.hudRoot.getChildByName('ComboPop');
        if (!comboPopNode) {
            comboPopNode = new Node('ComboPop');
            comboPopNode.addComponent(UITransform).setContentSize(600, 100);
            const label = comboPopNode.addComponent(Label);
            label.fontSize = 48;
            label.color = new Color(241, 196, 15, 255);
            this.hudRoot.addChild(comboPopNode);
        }

        comboPopNode.setPosition(0, 100, 0);
        comboPopNode.active = true;
        const label = comboPopNode.getComponent(Label);
        if (label) {
            label.string = `🔥 ${combo} 连击!`;
        }
        const op = comboPopNode.getComponent(UIOpacity) || comboPopNode.addComponent(UIOpacity);
        op.opacity = 255;

        tween(comboPopNode)
            .to(0.5, { position: new Vec3(0, 180, 0), scale: new Vec3(1.2, 1.2, 1) })
            .delay(0.3)
            .to(0.3, { opacity: 0 })
            .call(() => {
                comboPopNode.active = false;
            })
            .start();
    }

    private flashNode(node: Node, color: Color, duration: number): void {
        if (!FeedbackManager.instance.shouldAnimate()) {
            node.active = true;
            setTimeout(() => { node.active = false; }, 100);
            return;
        }

        const op = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
        const sprite = node.getComponent(Sprite) || node.addComponent(Sprite);
        sprite.color = color;

        node.active = true;
        op.opacity = 255;

        const actualDuration = FeedbackManager.instance.getAnimationDuration(duration);
        tween(op)
            .to(actualDuration, { opacity: 0 })
            .call(() => {
                node.active = false;
                op.opacity = 255;
            })
            .start();
    }

    private pulseNode(node: Node, scale: number, duration: number): void {
        if (!FeedbackManager.instance.shouldAnimate()) return;

        const actualDuration = FeedbackManager.instance.getAnimationDuration(duration);
        const actualScale = FeedbackManager.instance.getAnimationScale(scale);

        tween(node)
            .to(actualDuration * 0.5, { scale: new Vec3(actualScale, actualScale, 1) }, { easing: 'sineOut' })
            .to(actualDuration * 0.5, { scale: new Vec3(1, 1, 1) }, { easing: 'sineIn' })
            .start();
    }

    private shakeNode(node: Node, magnitude: number, duration: number): void {
        if (!FeedbackManager.instance.shouldAnimate()) return;

        const actualDuration = FeedbackManager.instance.getAnimationDuration(duration);
        const originalPos = node.position.clone();
        const steps = 10;
        const stepDuration = actualDuration / steps;

        let currentStep = 0;
        const shakeStep = () => {
            if (currentStep >= steps) {
                node.setPosition(originalPos);
                return;
            }

            const offsetX = (Math.random() - 0.5) * magnitude * 2;
            const offsetY = (Math.random() - 0.5) * magnitude * 2;
            node.setPosition(originalPos.x + offsetX, originalPos.y + offsetY);
            currentStep++;
            this.scheduleOnce(shakeStep, stepDuration);
        };
        shakeStep();
    }

    reset(): void {
        this.currentCombo = 0;
        this.maxComboDisplayed = 0;
        if (this.comboLabel) {
            this.comboLabel.string = '连击 x0';
        }
    }
}
