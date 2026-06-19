import { _decorator, Component, Node, Label, Sprite, Color, Vec3, tween, UITransform, Button } from "cc";
import { ConflictEvent, ConflictOption } from "../models/Config";
import { GameManager, GameState } from "../managers/GameManager";
import { AudioManager } from "../utils/AudioManager";
import { VibrationManager } from "../utils/VibrationManager";
import { ConflictManager } from "../managers/ConflictManager";

const { ccclass } = _decorator;

@ccclass("ConflictDialog")
export class ConflictDialog extends Component {
    private conflictData: ConflictEvent | null = null;
    private onResolved: ((conflictId: string, optionId: string) => void) | null = null;

    public init(conflict: ConflictEvent): void {
        this.conflictData = conflict;

        const gm = GameManager.instance;
        const settings = gm?.getSettings();

        if (settings?.soundEnabled) {
            AudioManager.instance?.playSfx("conflict_alert");
        }

        if (settings?.vibrationEnabled) {
            VibrationManager.instance?.heavy();
        }

        const titleNode = this.node.getChildByName("title");
        if (titleNode) {
            const label = titleNode.getComponent(Label);
            if (label) {
                label.string = "⚠ 房态冲突";
                label.color = Color.RED;
            }
        }

        const descNode = this.node.getChildByName("description");
        if (descNode) {
            const label = descNode.getComponent(Label);
            if (label) {
                label.string = conflict.description;
            }
        }

        const timerNode = this.node.getChildByName("timer");
        if (timerNode) {
            const label = timerNode.getComponent(Label);
            if (label) {
                label.string = `限时: ${conflict.timeLimit}s`;
            }
        }

        const optionsParent = this.node.getChildByName("options");
        if (optionsParent) {
            const existing = optionsParent.children;
            for (let i = existing.length - 1; i >= 0; i--) {
                existing[i].destroy();
            }

            for (let i = 0; i < conflict.options.length; i++) {
                const option = conflict.options[i];
                this.createOptionButton(optionsParent, option, i);
            }
        }

        this.playEntranceAnimation(settings?.animationIntensity ?? 1.0);
    }

    private createOptionButton(parent: Node, option: ConflictOption, index: number): void {
        const btnNode = new Node(`option_${option.id}`);
        btnNode.addComponent(UITransform).setContentSize(250, 60);
        btnNode.addComponent(Sprite);

        const labelNode = new Node("label");
        labelNode.addComponent(UITransform).setContentSize(230, 20);
        const nameLabel = labelNode.addComponent(Label);
        nameLabel.fontSize = 14;
        nameLabel.string = option.label;
        nameLabel.color = Color.WHITE;
        labelNode.setPosition(0, 10, 0);
        labelNode.parent = btnNode;

        const descLabelNode = new Node("desc");
        descLabelNode.addComponent(UITransform).setContentSize(230, 16);
        const descLabel = descLabelNode.addComponent(Label);
        descLabel.fontSize = 11;
        descLabel.string = option.description;
        descLabel.color = new Color(200, 200, 200, 255);
        descLabelNode.setPosition(0, -10, 0);
        descLabelNode.parent = btnNode;

        const penaltyLabelNode = new Node("penalty");
        penaltyLabelNode.addComponent(UITransform).setContentSize(80, 14);
        const penaltyLabel = penaltyLabelNode.addComponent(Label);
        penaltyLabel.fontSize = 10;
        if (option.outcome.penalty > 0) {
            penaltyLabel.string = `扣罚: ¥${option.outcome.penalty}`;
            penaltyLabel.color = Color.RED;
        } else {
            penaltyLabel.string = "无扣罚";
            penaltyLabel.color = Color.GREEN;
        }
        penaltyLabelNode.setPosition(0, -25, 0);
        penaltyLabelNode.parent = btnNode;

        btnNode.setPosition(0, -index * 75, 0);
        btnNode.parent = parent;

        btnNode.on(Node.EventType.TOUCH_END, () => {
            this.selectOption(option);
        });
    }

    private selectOption(option: ConflictOption): void {
        if (!this.conflictData) return;

        if (this.onResolved) {
            this.onResolved(this.conflictData.id, option.id);
        }
    }

    private playEntranceAnimation(intensity: number): void {
        const animIntensity = Math.min(1.0, Math.max(0.0, intensity));
        if (animIntensity <= 0) return;

        this.node.setScale(0, 0, 1);
        tween(this.node)
            .to(0.3 * animIntensity, { scale: new Vec3(1.05, 1.05, 1) }, { easing: "backOut" })
            .to(0.1 * animIntensity, { scale: new Vec3(1.0, 1.0, 1) })
            .start();
    }

    update(dt: number): void {
        if (!this.conflictData) return;

        const elapsed = (Date.now() - this.conflictData.appearedAt) / 1000;
        const remaining = this.conflictData.timeLimit - elapsed;

        const timerNode = this.node.getChildByName("timer");
        if (timerNode) {
            const label = timerNode.getComponent(Label);
            if (label) {
                label.string = `限时: ${Math.max(0, Math.ceil(remaining))}s`;
                if (remaining < 10) {
                    label.color = Color.RED;
                }
            }
        }
    }

    public setOnResolved(cb: (conflictId: string, optionId: string) => void): void {
        this.onResolved = cb;
    }
}
