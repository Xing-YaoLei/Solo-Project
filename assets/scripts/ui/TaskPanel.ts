import { _decorator, Component, Node, Label, Sprite, Color, ProgressBar } from 'cc';
import { ConfigTypes } from '../types/ConfigTypes';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('TaskPanel')
export class TaskPanel extends Component {

    @property(Label)
    taskNameLabel: Label | null = null;

    @property(Label)
    taskDescLabel: Label | null = null;

    @property(Label)
    taskTypeLabel: Label | null = null;

    @property(Label)
    taskProgressLabel: Label | null = null;

    @property(Node)
    clueIndicator: Node | null = null;

    @property(Label)
    clueCountLabel: Label | null = null;

    @property(Node)
    acceptButton: Node | null = null;

    private currentTask: ConfigTypes.TaskConfig | null = null;

    start(): void {
        GameManager.instance.eventTarget.on('task_changed', this.onTaskChanged, this);
        GameManager.instance.eventTarget.on('task_completed', this.onTaskCompleted, this);
        this.acceptButton?.on(Node.EventType.TOUCH_END, this.onAcceptClicked, this);
    }

    onDestroy(): void {
        GameManager.instance.eventTarget.off('task_changed', this.onTaskChanged, this);
        GameManager.instance.eventTarget.off('task_completed', this.onTaskCompleted, this);
        this.acceptButton?.off(Node.EventType.TOUCH_END, this.onAcceptClicked, this);
    }

    private onTaskChanged(taskId: string, taskConfig: ConfigTypes.TaskConfig): void {
        this.currentTask = taskConfig;
        this.refresh(taskId);
    }

    private onTaskCompleted(taskId: string): void {
        this.setCompletedStyle();
    }

    public refresh(currentTaskId?: string): void {
        const session = GameManager.instance.getCurrentSession();
        if (!session) return;

        const totalTasks = session.taskOrder.length;
        const currentIndex = session.currentTaskIndex + 1;
        if (this.taskProgressLabel) {
            this.taskProgressLabel.string = `任务进度: ${currentIndex}/${totalTasks}`;
        }

        const task = this.currentTask || GameManager.instance.getCurrentTask();
        if (!task) return;

        if (this.taskNameLabel) {
            this.taskNameLabel.string = task.name;
        }
        if (this.taskDescLabel) {
            this.taskDescLabel.string = task.description;
        }
        if (this.taskTypeLabel) {
            this.taskTypeLabel.string = this.getTypeDisplay(task.type);
            this.taskTypeLabel.color = this.getTypeColor(task.type);
        }

        const clueCount = task.clueIds?.length || 0;
        if (this.clueCountLabel) {
            this.clueCountLabel.string = `关联线索: ${clueCount}份`;
        }
        if (this.clueIndicator) {
            this.clueIndicator.active = clueCount > 0;
        }

        const progress = session.taskProgress[task.id];
        if (progress?.completed) {
            this.setCompletedStyle();
        } else {
            this.setNormalStyle();
        }
    }

    private getTypeDisplay(type: ConfigTypes.TaskType): string {
        const typeMap: Record<ConfigTypes.TaskType, string> = {
            'ACTION': '操作执行',
            'OBSERVATION': '观察判断',
            'EVALUATION': '量化评估',
            'PLANNING': '方案制定',
            'PRESCRIPTION': '处方开具',
            'COMMUNICATION': '医患沟通',
            'SAFETY': '安全核查',
            'COLLABORATION': '团队协作',
            'BILLING': '费用结算'
        };
        return `【${typeMap[type] || type}】`;
    }

    private getTypeColor(type: ConfigTypes.TaskType): Color {
        const colorMap: Partial<Record<ConfigTypes.TaskType, Color>> = {
            'ACTION': new Color(46, 125, 50),
            'EVALUATION': new Color(21, 101, 192),
            'BILLING': new Color(230, 81, 0),
            'SAFETY': new Color(198, 40, 40)
        };
        return colorMap[type] || new Color(33, 33, 33);
    }

    private setCompletedStyle(): void {
        if (this.taskNameLabel) {
            this.taskNameLabel.color = new Color(120, 120, 120);
        }
        this.acceptButton?.setActive(false);
    }

    private setNormalStyle(): void {
        if (this.taskNameLabel) {
            this.taskNameLabel.color = new Color(33, 33, 33);
        }
        this.acceptButton?.setActive(true);
    }

    private onAcceptClicked(): void {
        const clues = GameManager.instance.getCluesForCurrentTask();
        if (clues.length > 0) {
            GameManager.instance.setPhase('CLUE_OBSERVATION');
        } else {
            GameManager.instance.markClueObservationComplete();
        }
    }
}
