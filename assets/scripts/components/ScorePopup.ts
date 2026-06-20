import { _decorator, Component, Node, Label, Sprite, Color, tween, Vec3, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScorePopup')
export class ScorePopup extends Component {
    @property(Label)
    scoreLabel: Label | null = null;

    @property(Sprite)
    background: Sprite | null = null;

    private targetY: number = 100;
    private duration: number = 1.0;
    private startY: number = 0;

    public show(score: number, message: string, isPositive: boolean = true): void {
        if (this.scoreLabel) {
            const sign = isPositive ? '+' : '';
            this.scoreLabel.string = `${sign}${score} ${message}`;
            this.scoreLabel.color = isPositive ? new Color(76, 175, 80, 255) : new Color(244, 67, 54, 255);
        }

        this.startY = this.node.position.y;
        this.targetY = this.startY + 80;

        const opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        opacity.opacity = 0;

        tween(opacity)
            .to(0.1, { opacity: 255 })
            .start();

        tween(this.node)
            .to(this.duration, { position: new Vec3(this.node.position.x, this.targetY, 0) })
            .call(() => {
                tween(opacity)
                    .to(0.2, { opacity: 0 })
                    .call(() => {
                        this.node.destroy();
                    })
                    .start();
            })
            .start();
    }
}
