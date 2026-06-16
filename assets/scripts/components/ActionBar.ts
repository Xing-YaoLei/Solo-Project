import { _decorator, Component, Node, Button, Label, Color, tween, Vec3 } from 'cc';
import { TaskAction } from '../data/enums/TaskAction';
import { EventBus } from '../core/EventBus';
import { GameEventType } from '../data/enums/GameEventType';
import type { TaskResult } from '../data/GameState';

const { ccclass, property } = _decorator;

@ccclass('ActionBar')
export class ActionBar extends Component {
    @property(Node)
    approveButton: Node | null = null;

    @property(Node)
    rejectButton: Node | null = null;

    @property(Node)
    supplementButton: Node | null = null;

    @property(Node)
    reportButton: Node | null = null;

    @property(Node)
    feedbackPanel: Node | null = null;

    @property(Label)
    feedbackLabel: Node | null = null;

    private isProcessing: boolean = false;
    private onActionCallback: ((action: TaskAction, result: TaskResult) => void) | null = null;

    onLoad() {
        this.setupButtons();
        this.hideFeedback();
    }

    private setupButtons(): void {
        const buttonConfigs = [
            { node: this.approveButton, action: TaskAction.APPROVE },
            { node: this.rejectButton, action: TaskAction.REJECT },
            { node: this.supplementButton, action: TaskAction.SUPPLEMENT },
            { node: this.reportButton, action: TaskAction.REPORT }
        ];

        buttonConfigs.forEach(config => {
            if (config.node) {
                config.node.on(Node.EventType.TOUCH_END, () => {
                    this.onButtonClick(config.action);
                }, this);
            }
        });
    }

    public setCallback(callback: (action: TaskAction, result: TaskResult) => void): void {
        this.onActionCallback = callback;
    }

    private onButtonClick(action: TaskAction): void {
        if (this.isProcessing) return;
        this.isProcessing = true;

        this.animateButtonClick(action);

        EventBus.instance.emit(GameEventType.ACTION_SELECTED, action);
    }

    private animateButtonClick(action: TaskAction): void {
        const button = this.getButtonNode(action);
        if (!button) return;

        tween(button)
            .to(0.1, { scale: new Vec3(0.95, 0.95, 1) })
            .to(0.1, { scale: new Vec3(1, 1, 1) })
            .start();
    }

    private getButtonNode(action: TaskAction): Node | null {
        switch (action) {
            case TaskAction.APPROVE: return this.approveButton;
            case TaskAction.REJECT: return this.rejectButton;
            case TaskAction.SUPPLEMENT: return this.supplementButton;
            case TaskAction.REPORT: return this.reportButton;
            default: return null;
        }
    }

    public showFeedback(result: TaskResult): void {
        if (!this.feedbackPanel) return;

        this.feedbackPanel.active = true;
        const feedbackLabel = this.feedbackPanel.getComponentInChildren(Label);

        if (feedbackLabel) {
            if (result.isCorrect) {
                feedbackLabel.string = `✓ 正确！+${result.scoreEarned}分`;
                feedbackLabel.color = new Color().fromHEX('#4CAF50');
            } else {
                feedbackLabel.string = `✗ 错误：${result.wrongReason || '操作有误'}`;
                feedbackLabel.color = new Color().fromHEX('#F44336');
            }
        }

        this.feedbackPanel.opacity = 0;
        tween(this.feedbackPanel)
            .to(0.3, { opacity: 255 })
            .delay(1.5)
            .to(0.3, { opacity: 0 })
            .call(() => {
                this.hideFeedback();
                if (this.onActionCallback) {
                    this.onActionCallback(result.playerAction, result);
                }
                this.isProcessing = false;
            })
            .start();
    }

    private hideFeedback(): void {
        if (this.feedbackPanel) {
            this.feedbackPanel.active = false;
        }
    }

    public setEnabled(enabled: boolean): void {
        this.isProcessing = !enabled;
        [this.approveButton, this.rejectButton, this.supplementButton, this.reportButton].forEach(btn => {
            if (btn) {
                btn.opacity = enabled ? 255 : 128;
            }
        });
    }

    public reset(): void {
        this.isProcessing = false;
        this.hideFeedback();
        this.setEnabled(true);
    }
}
