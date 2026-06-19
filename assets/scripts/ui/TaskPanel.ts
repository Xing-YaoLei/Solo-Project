import { _decorator, Component, Node, Label, Sprite, Color, Vec3, tween, UIOpacity, ProgressBar, UITransform } from "cc";
import { Task, TaskType, TaskStatus, TimerTask } from "../models/Task";
import { GameManager } from "../managers/GameManager";
import { AudioManager } from "../utils/AudioManager";

const { ccclass, property } = _decorator;

const TASK_COLORS: Record<TaskType, Color> = {
    [TaskType.CLEANING]: new Color(33, 150, 243, 255),
    [TaskType.MAINTENANCE]: new Color(255, 152, 0, 255),
    [TaskType.INSPECTION]: new Color(76, 175, 80, 255),
    [TaskType.LAUNDRY]: new Color(156, 39, 176, 255),
    [TaskType.RESTOCK]: new Color(0, 188, 212, 255)
};

@ccclass("TaskItem")
export class TaskItem extends Component {
    private taskData: Task | null = null;
    private progressBar: ProgressBar | null = null;
    private onTaskClicked: ((taskId: string) => void) | null = null;

    public init(task: Task): void {
        this.taskData = task;

        const typeLabel = this.node.getChildByName("type");
        if (typeLabel) {
            const label = typeLabel.getComponent(Label);
            if (label) {
                const typeNames: Record<TaskType, string> = {
                    [TaskType.CLEANING]: "保洁",
                    [TaskType.MAINTENANCE]: "维修",
                    [TaskType.INSPECTION]: "查房",
                    [TaskType.LAUNDRY]: "布草",
                    [TaskType.RESTOCK]: "补货"
                };
                label.string = typeNames[task.type] || "任务";
            }
        }

        const roomLabel = this.node.getChildByName("room");
        if (roomLabel) {
            const label = roomLabel.getComponent(Label);
            if (label) {
                label.string = task.roomId;
            }
        }

        const descLabel = this.node.getChildByName("description");
        if (descLabel) {
            const label = descLabel.getComponent(Label);
            if (label) {
                label.string = task.description;
            }
        }

        const rewardLabel = this.node.getChildByName("reward");
        if (rewardLabel) {
            const label = rewardLabel.getComponent(Label);
            if (label) {
                label.string = `+${task.reward}`;
            }
        }

        const progressNode = this.node.getChildByName("progress");
        if (progressNode) {
            this.progressBar = progressNode.getComponent(ProgressBar);
            if (this.progressBar) {
                this.progressBar.progress = 0;
            }
        }

        const bgSprite = this.node.getComponent(Sprite);
        if (bgSprite) {
            bgSprite.color = TASK_COLORS[task.type] || Color.WHITE;
        }

        this.updateStatusVisual();
    }

    update(dt: number): void {
        if (!this.taskData || this.taskData.status !== TaskStatus.IN_PROGRESS) return;

        const gm = GameManager.instance;
        if (!gm) return;
        const taskMgr = gm.getTaskManager();
        if (!taskMgr) return;

        const progress = taskMgr.getProgress(this.taskData.id);
        if (this.progressBar) {
            this.progressBar.progress = progress;
        }

        const timeLabel = this.node.getChildByName("time");
        if (timeLabel) {
            const label = timeLabel.getComponent(Label);
            if (label) {
                const remaining = this.taskData.duration - this.taskData.elapsed;
                label.string = `${Math.max(0, Math.ceil(remaining))}s`;
                if (remaining < 5) {
                    label.color = Color.RED;
                }
            }
        }
    }

    private updateStatusVisual(): void {
        if (!this.taskData) return;

        const statusNode = this.node.getChildByName("status");
        if (statusNode) {
            const label = statusNode.getComponent(Label);
            if (label) {
                const statusTexts: Record<TaskStatus, string> = {
                    [TaskStatus.PENDING]: "等待中",
                    [TaskStatus.IN_PROGRESS]: "进行中",
                    [TaskStatus.COMPLETED]: "已完成",
                    [TaskStatus.FAILED]: "失败",
                    [TaskStatus.EXPIRED]: "已过期"
                };
                label.string = statusTexts[this.taskData.status] || "未知";
            }
        }

        const startBtn = this.node.getChildByName("startBtn");
        if (startBtn) {
            startBtn.active = this.taskData.status === TaskStatus.PENDING;
        }
    }

    public updateTask(task: Task): void {
        this.taskData = task;
        this.updateStatusVisual();
    }

    public playCompleteAnimation(intensity: number): void {
        const gm = GameManager.instance;
        const settings = gm?.getSettings();

        if (settings?.soundEnabled) {
            AudioManager.instance?.playSfx("task_complete");
        }

        const animIntensity = Math.min(1.0, Math.max(0.0, intensity));

        tween(this.node)
            .to(0.2 * animIntensity, { scale: new Vec3(1.1, 1.1, 1) })
            .to(0.2 * animIntensity, { scale: new Vec3(1.0, 1.0, 1) })
            .delay(0.5)
            .call(() => {
                const opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
                tween(this.node)
                    .to(0.3, {}, {
                        onUpdate: (target: Node | null) => {
                            if (target) {
                                const op = target.getComponent(UIOpacity);
                                if (op) op.opacity = Math.max(0, op.opacity - 8);
                            }
                        }
                    })
                    .call(() => this.node.destroy())
                    .start();
            })
            .start();
    }

    onEnable(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    onDisable(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onClick, this);
    }

    private onClick(): void {
        if (this.taskData && this.onTaskClicked) {
            this.onTaskClicked(this.taskData.id);
        }
    }

    public setOnTaskClicked(cb: (taskId: string) => void): void {
        this.onTaskClicked = cb;
    }

    public getTaskData(): Task | null {
        return this.taskData;
    }
}

@ccclass("TaskPanel")
export class TaskPanel extends Component {
    private taskItems: Map<string, TaskItem> = new Map();
    private tasksParent: Node | null = null;
    private onTaskClicked: ((taskId: string) => void) | null = null;

    public init(): void {
        this.taskItems.clear();
        this.tasksParent = this.node.getChildByName("taskList");
    }

    public addTask(task: Task): void {
        if (!this.tasksParent) return;

        const itemNode = new Node(`task_${task.id}`);
        itemNode.addComponent(UITransform).setContentSize(180, 60);
        const bg = itemNode.addComponent(Sprite);

        const typeNode = new Node("type");
        typeNode.addComponent(UITransform).setContentSize(40, 16);
        const typeLabel = typeNode.addComponent(Label);
        typeLabel.fontSize = 12;
        typeNode.setPosition(-70, 20, 0);
        typeNode.parent = itemNode;

        const roomNode = new Node("room");
        roomNode.addComponent(UITransform).setContentSize(60, 16);
        roomNode.addComponent(Label).fontSize = 12;
        roomNode.setPosition(-30, 20, 0);
        roomNode.parent = itemNode;

        const descNode = new Node("description");
        descNode.addComponent(UITransform).setContentSize(160, 14);
        descNode.addComponent(Label).fontSize = 10;
        descNode.setPosition(0, 5, 0);
        descNode.parent = itemNode;

        const progressNode = new Node("progress");
        progressNode.addComponent(UITransform).setContentSize(140, 12);
        const pb = progressNode.addComponent(ProgressBar);
        pb.progress = 0;
        progressNode.setPosition(0, -10, 0);
        progressNode.parent = itemNode;

        const rewardNode = new Node("reward");
        rewardNode.addComponent(UITransform).setContentSize(50, 14);
        rewardNode.addComponent(Label).fontSize = 11;
        rewardNode.setPosition(60, 20, 0);
        rewardNode.parent = itemNode;

        const timeNode = new Node("time");
        timeNode.addComponent(UITransform).setContentSize(40, 14);
        timeNode.addComponent(Label).fontSize = 11;
        timeNode.setPosition(-60, -10, 0);
        timeNode.parent = itemNode;

        const statusNode = new Node("status");
        statusNode.addComponent(UITransform).setContentSize(50, 14);
        statusNode.addComponent(Label).fontSize = 10;
        statusNode.setPosition(60, -10, 0);
        statusNode.parent = itemNode;

        const startBtnNode = new Node("startBtn");
        startBtnNode.addComponent(UITransform).setContentSize(40, 20);
        const startLabel = startBtnNode.addComponent(Label);
        startLabel.fontSize = 10;
        startLabel.string = "开始";
        startBtnNode.setPosition(70, 0, 0);
        startBtnNode.parent = itemNode;

        const item = itemNode.addComponent(TaskItem);
        item.init(task);
        item.setOnTaskClicked((taskId) => {
            if (this.onTaskClicked) this.onTaskClicked(taskId);
        });

        const index = this.taskItems.size;
        itemNode.setPosition(0, -index * 70, 0);
        itemNode.parent = this.tasksParent;

        this.taskItems.set(task.id, item);
    }

    public removeTaskItem(taskId: string): void {
        const item = this.taskItems.get(taskId);
        if (item) {
            const gm = GameManager.instance;
            const settings = gm?.getSettings();
            item.playCompleteAnimation(settings?.animationIntensity ?? 1.0);
            this.taskItems.delete(taskId);
        }
    }

    public setOnTaskClicked(cb: (taskId: string) => void): void {
        this.onTaskClicked = cb;
    }

    public clear(): void {
        for (const [id, item] of this.taskItems) {
            item.node.destroy();
        }
        this.taskItems.clear();
    }
}
