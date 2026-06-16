import { _decorator, Component, Node, Label, Color, Sprite, UITransform, tween } from 'cc';
import type { TaskResult } from '../data/GameState';
import { TaskAction } from '../data/enums/TaskAction';

const { ccclass, property } = _decorator;

@ccclass('WrongItemCard')
export class WrongItemCard extends Component {
    @property(Label)
    taskNumberLabel: Label | null = null;

    @property(Label)
    descriptionLabel: Label | null = null;

    @property(Label)
    playerActionLabel: Label | null = null;

    @property(Label)
    correctActionLabel: Label | null = null;

    @property(Label)
    reasonLabel: Label | null = null;

    @property(Label)
    knowledgeLabel: Label | null = null;

    @property(Label)
    knowledgePointLabel: Label | null = null;

    @property(Node)
    expandButton: Node | null = null;

    @property(Node)
    detailContainer: Node | null = null;

    @property(Sprite)
    statusIcon: Sprite | null = null;

    private isExpanded: boolean = false;
    private result: TaskResult | null = null;
    private taskDescription: string = '';
    private taskNumber: number = 0;

    start() {
        if (this.expandButton) {
            this.expandButton.on(Node.EventType.TOUCH_END, this.onExpandClick, this);
        }
    }

    onDestroy() {
        if (this.expandButton) {
            this.expandButton.off(Node.EventType.TOUCH_END, this.onExpandClick, this);
        }
    }

    public setData(result: TaskResult, taskDescription: string, taskNumber: number): void {
        this.result = result;
        this.taskDescription = taskDescription;
        this.taskNumber = taskNumber;
        this.isExpanded = false;
        this.refreshUI();
        this.updateDetailVisibility();
    }

    private refreshUI(): void {
        if (!this.result) return;

        if (this.taskNumberLabel) {
            this.taskNumberLabel.string = `第${this.taskNumber}题`;
        }
        if (this.descriptionLabel) {
            this.descriptionLabel.string = this.taskDescription;
        }
        if (this.playerActionLabel) {
            this.playerActionLabel.string = `你的选择：${TaskAction.getDisplayName(this.result.playerAction)}`;
            this.playerActionLabel.color = new Color().fromHEX(TaskAction.getColor(this.result.playerAction));
        }
        if (this.correctActionLabel) {
            this.correctActionLabel.string = `正确答案：${TaskAction.getDisplayName(this.result.correctAction)}`;
            this.correctActionLabel.color = new Color().fromHEX('#4CAF50');
        }
        if (this.reasonLabel) {
            this.reasonLabel.string = this.result.wrongReason || '操作错误';
        }
        if (this.knowledgeLabel) {
            this.knowledgeLabel.string = this.result.knowledgeExplanation || '请参考相关知识学习';
        }
        if (this.knowledgePointLabel) {
            this.knowledgePointLabel.string = `知识点：${this.result.knowledgePoint || '未分类'}`;
        }
        if (this.statusIcon) {
            this.statusIcon.color = new Color().fromHEX(this.result.isCorrect ? '#4CAF50' : '#F44336');
        }
    }

    private onExpandClick(): void {
        this.isExpanded = !this.isExpanded;
        this.updateDetailVisibility();
    }

    private updateDetailVisibility(): void {
        if (!this.detailContainer) return;

        if (this.isExpanded) {
            this.detailContainer.active = true;
            const uiTransform = this.detailContainer.getComponent(UITransform);
            if (uiTransform) {
                uiTransform.height = 0;
                tween(uiTransform)
                    .to(0.3, { height: 200 })
                    .start();
            }
        } else {
            const uiTransform = this.detailContainer.getComponent(UITransform);
            if (uiTransform) {
                tween(uiTransform)
                    .to(0.3, { height: 0 })
                    .call(() => {
                        if (this.detailContainer) {
                            this.detailContainer.active = false;
                        }
                    })
                    .start();
            }
        }

        if (this.expandButton) {
            this.expandButton.angle = this.isExpanded ? 180 : 0;
        }
    }

    public expand(): void {
        if (!this.isExpanded) {
            this.onExpandClick();
        }
    }

    public collapse(): void {
        if (this.isExpanded) {
            this.onExpandClick();
        }
    }
}
