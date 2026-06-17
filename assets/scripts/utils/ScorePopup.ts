import { _decorator, Component, Node, Label, tween, Vec3, UIOpacity, Color } from 'cc';
import { GameManager } from '../GameManager';
const { ccclass, property } = _decorator;

@ccclass('ScorePopup')
export class ScorePopup extends Component {
    @property(Label)
    scoreLabel: Label | null = null;

    @property(Node)
    popupNode: Node | null = null;

    showScore(score: number, isPositive: boolean = true, position?: Vec3): void {
        if (!this.popupNode) return;

        if (position) {
            this.popupNode.setPosition(position);
        }

        if (this.scoreLabel) {
            this.scoreLabel.string = isPositive ? `+${score}` : `-${score}`;
            this.scoreLabel.color = isPositive
                ? new Color(80, 200, 80, 255)
                : new Color(220, 80, 80, 255);
        }

        this.node.active = true;

        const intensity = GameManager.instance.getAnimationMultiplier();
        const startY = this.popupNode.position.y;

        const opacity = this.popupNode.getComponent(UIOpacity) || this.popupNode.addComponent(UIOpacity);
        opacity.opacity = 255;

        this.popupNode.setScale(0.5 * intensity, 0.5 * intensity, 1);

        tween(this.popupNode)
            .to(0.1 * intensity, { scale: new Vec3(1.2 * intensity, 1.2 * intensity, 1) })
            .to(0.1 * intensity, { scale: Vec3.ONE })
            .delay(0.3)
            .by(0.5 * intensity, { position: new Vec3(0, 60 * intensity, 0) })
            .call(() => {
                this.node.active = false;
                this.popupNode.setPosition(this.popupNode.position.x, startY, this.popupNode.position.z);
            })
            .start();

        tween(opacity)
            .delay(0.5 * intensity)
            .to(0.3 * intensity, { opacity: 0 })
            .start();
    }

    showCombo(combo: number): void {
        if (!this.popupNode || !this.scoreLabel) return;

        this.scoreLabel.string = `${combo}连击!`;
        this.scoreLabel.color = new Color(255, 180, 50, 255);
        this.node.active = true;

        const intensity = GameManager.instance.getAnimationMultiplier();
        const startY = this.popupNode.position.y;

        const opacity = this.popupNode.getComponent(UIOpacity) || this.popupNode.addComponent(UIOpacity);
        opacity.opacity = 255;

        this.popupNode.setScale(0.3 * intensity, 0.3 * intensity, 1);

        tween(this.popupNode)
            .to(0.2 * intensity, { scale: new Vec3(1.5 * intensity, 1.5 * intensity, 1) }, { easing: 'backOut' })
            .to(0.1 * intensity, { scale: new Vec3(1, 1, 1) })
            .delay(0.5)
            .by(0.6 * intensity, { position: new Vec3(0, 80 * intensity, 0) })
            .call(() => {
                this.node.active = false;
                this.popupNode.setPosition(this.popupNode.position.x, startY, this.popupNode.position.z);
            })
            .start();

        tween(opacity)
            .delay(0.7 * intensity)
            .to(0.3 * intensity, { opacity: 0 })
            .start();
    }
}
