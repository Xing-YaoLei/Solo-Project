import { _decorator, Component, Node, Label, Color, tween, Vec3 } from 'cc';
import { TaskAction } from '../data/enums/TaskAction';
import { GameFlowController } from '../services/GameFlowController';
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
    feedbackLabel: Label | null = null;

    private isProcessing: boolean = false;
    private onActionDone: ((result: TaskResult) => void) | null = null;

    onLoad() {
        this.setupButtons();
        this.hideFeedback();
    }

    private setupButtons(): void {
        const buttonConfigs: [Node | null, TaskAction][] = [
            [this.approveButton, TaskAction.APPROVE],
            [this.rejectButton, TaskAction.REJECT],
            [this.supplementButton, TaskAction.SUPPLEMENT],
            [this.reportButton, TaskAction.REPORT]
        ];

        buttonConfigs.forEach(([node, action]) => {
            if (node) {
                node.on(Node.EventType.TOUCH_END, () => {
                    this.onButtonClick(action);
                }, this);
            }
        });
    }

    public setOnActionDone(callback: (result: TaskResult) => void): void {
        this.onActionDone = callback;
    }

    private onButtonClick(action: TaskAction): void {
        if (this.isProcessing) return;
        this.isProcessing = true;

        this.animateButtonClick(action);

        const result = GameFlowController.instance.submitAction(action);
        if (!result) {
            this.isProcessing = false;
            return;
        }

        this.showFeedback(result);
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

    private showFeedback(result: TaskResult): void {
        if (this.feedbackLabel) {
            if (result.isCorrect) {
                this.feedbackLabel.string = `✓ 正确！+${result.scoreEarned}分`;
                this.feedbackLabel.color = new Color().fromHEX('#4CAF50');
            } else {
                this.feedbackLabel.string = `✗ 错误：${result.wrongReason || '操作有误'}`;
                this.feedbackLabel.color = new Color().fromHEX('#F44336');
            }
        }

        if (this.feedbackPanel) {
            this.feedbackPanel.active = true;
            this.feedbackPanel.opacity = 0;
            tween(this.feedbackPanel)
                .to(0.3, { opacity: 255 })
                .delay(1.2)
                .to(0.3, { opacity: 0 })
                .call(() => {
                    this.hideFeedback();
                    this.isProcessing = false;
                    if (this.onActionDone) {
                        this.onActionDone(result);
                    }
                })
                .start();
        } else {
            this.isProcessing = false;
            if (this.onActionDone) {
                this.onActionDone(result);
            }
        }
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
