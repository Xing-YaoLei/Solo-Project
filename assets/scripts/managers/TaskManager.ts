import { _decorator, Component } from "cc";
import { Task, TaskType, TaskStatus, TimerTask } from "../models/Task";
import { LevelConfig } from "../models/Config";

const { ccclass } = _decorator;

@ccclass("TaskManager")
export class TaskManager extends Component {
    private tasks: Map<string, Task> = new Map();
    private levelConfig: LevelConfig | null = null;
    private taskIdCounter: number = 0;
    private onTaskCompleted: ((task: Task) => void) | null = null;
    private onTaskFailed: ((task: Task) => void) | null = null;
    private onTaskCreated: ((task: Task) => void) | null = null;

    public init(config: LevelConfig): void {
        this.levelConfig = config;
        this.tasks.clear();
        this.taskIdCounter = 0;
    }

    public update(dt: number): void {
        for (const [id, task] of this.tasks) {
            if (task.status === TaskStatus.IN_PROGRESS) {
                task.elapsed += dt;
                if (task.startedAt) {
                    const elapsed = (Date.now() - task.startedAt) / 1000;
                    if (elapsed >= task.duration) {
                        this.completeTask(id);
                    }
                }
                if (task.deadline && Date.now() > task.deadline) {
                    this.failTask(id);
                }
            }
        }
    }

    public createCleaningTask(roomId: string, orderId?: string, urgency: number = 1): Task {
        const baseDuration = 15;
        const duration = baseDuration / urgency;
        const task = this.createTask(
            TaskType.CLEANING,
            roomId,
            `保洁: ${roomId}`,
            duration,
            50,
            20
        );
        task.orderId = orderId;
        return task;
    }

    public createTimerTask(type: TaskType, roomId: string, timeLimit: number, urgency: number): TimerTask {
        const task = this.createTask(
            type,
            roomId,
            this.getTaskDescription(type, roomId),
            timeLimit * 0.8,
            80 * urgency,
            40 * urgency
        ) as TimerTask;
        task.timeLimit = timeLimit;
        task.urgency = urgency;
        task.deadline = Date.now() + timeLimit * 1000;
        return task;
    }

    private createTask(type: TaskType, roomId: string, description: string, duration: number, reward: number, penalty: number): Task {
        const id = `task_${++this.taskIdCounter}`;
        const task: Task = {
            id,
            type,
            roomId,
            description,
            status: TaskStatus.PENDING,
            duration,
            elapsed: 0,
            startedAt: null,
            completedAt: null,
            deadline: null,
            reward,
            penalty
        };
        this.tasks.set(id, task);
        if (this.onTaskCreated) {
            this.onTaskCreated(task);
        }
        return task;
    }

    private getTaskDescription(type: TaskType, roomId: string): string {
        const descriptions: Record<TaskType, string> = {
            [TaskType.CLEANING]: `保洁: ${roomId}`,
            [TaskType.MAINTENANCE]: `维修: ${roomId}`,
            [TaskType.INSPECTION]: `查房: ${roomId}`,
            [TaskType.LAUNDRY]: `布草更换: ${roomId}`,
            [TaskType.RESTOCK]: `补货: ${roomId}`
        };
        return descriptions[type] || `任务: ${roomId}`;
    }

    public startTask(taskId: string): boolean {
        const task = this.tasks.get(taskId);
        if (!task || task.status !== TaskStatus.PENDING) return false;
        task.status = TaskStatus.IN_PROGRESS;
        task.startedAt = Date.now();
        return true;
    }

    public completeTask(taskId: string): boolean {
        const task = this.tasks.get(taskId);
        if (!task || task.status !== TaskStatus.IN_PROGRESS) return false;
        task.status = TaskStatus.COMPLETED;
        task.completedAt = Date.now();
        if (this.onTaskCompleted) {
            this.onTaskCompleted(task);
        }
        return true;
    }

    public failTask(taskId: string): boolean {
        const task = this.tasks.get(taskId);
        if (!task) return false;
        task.status = TaskStatus.FAILED;
        if (this.onTaskFailed) {
            this.onTaskFailed(task);
        }
        return true;
    }

    public getPendingTasks(): Task[] {
        return Array.from(this.tasks.values()).filter(t => t.status === TaskStatus.PENDING);
    }

    public getActiveTasks(): Task[] {
        return Array.from(this.tasks.values()).filter(t => t.status === TaskStatus.IN_PROGRESS);
    }

    public getTask(taskId: string): Task | undefined {
        return this.tasks.get(taskId);
    }

    public getTasksByRoom(roomId: string): Task[] {
        return Array.from(this.tasks.values()).filter(t => t.roomId === roomId);
    }

    public getTasksByType(type: TaskType): Task[] {
        return Array.from(this.tasks.values()).filter(t => t.type === type);
    }

    public getProgress(taskId: string): number {
        const task = this.tasks.get(taskId);
        if (!task || task.status !== TaskStatus.IN_PROGRESS) return 0;
        return Math.min(1, task.elapsed / task.duration);
    }

    public setOnTaskCompleted(cb: (task: Task) => void): void {
        this.onTaskCompleted = cb;
    }

    public setOnTaskFailed(cb: (task: Task) => void): void {
        this.onTaskFailed = cb;
    }

    public setOnTaskCreated(cb: (task: Task) => void): void {
        this.onTaskCreated = cb;
    }

    public getAllTasks(): Task[] {
        return Array.from(this.tasks.values());
    }

    public reset(): void {
        this.tasks.clear();
        this.taskIdCounter = 0;
    }
}
