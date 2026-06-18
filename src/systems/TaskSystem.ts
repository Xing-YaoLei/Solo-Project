import { Task, TaskStatus, Level, Difficulty } from '../models';
import { eventBus, GameEvent } from '../core/EventBus';

interface TaskSystemState {
  tasks: Map<string, Task>;
  taskStatuses: Map<string, TaskStatus>;
  currentTaskId: string | null;
  completedTaskIds: string[];
  levels: Map<string, Level>;
}

export class TaskSystem {
  private state: TaskSystemState;
  private static instance: TaskSystem;

  private constructor() {
    this.state = {
      tasks: new Map(),
      taskStatuses: new Map(),
      currentTaskId: null,
      completedTaskIds: [],
      levels: new Map(),
    };
  }

  public static getInstance(): TaskSystem {
    if (!TaskSystem.instance) {
      TaskSystem.instance = new TaskSystem();
    }
    return TaskSystem.instance;
  }

  public initialize(tasks: Task[], levels: Level[]): void {
    tasks.forEach((task) => {
      this.state.tasks.set(task.id, task);
      this.state.taskStatuses.set(
        task.id,
        task.unlocked ? 'available' : 'available'
      );
    });

    levels.forEach((level) => {
      this.state.levels.set(level.id, level);
    });
  }

  public getAvailableTasks(): Task[] {
    const available: Task[] = [];
    this.state.tasks.forEach((task, id) => {
      const status = this.state.taskStatuses.get(id);
      if (status === 'available' && task.unlocked) {
        available.push(task);
      }
    });
    return available;
  }

  public getTasksByDifficulty(difficulty: Difficulty): Task[] {
    return this.getAvailableTasks().filter((task) => task.difficulty === difficulty);
  }

  public getTask(taskId: string): Task | undefined {
    return this.state.tasks.get(taskId);
  }

  public getTaskById(taskId: string): Task | undefined {
    return this.getTask(taskId);
  }

  public getTaskStatus(taskId: string): TaskStatus | undefined {
    return this.state.taskStatuses.get(taskId);
  }

  public getCurrentTask(): Task | null {
    if (!this.state.currentTaskId) return null;
    return this.state.tasks.get(this.state.currentTaskId) || null;
  }

  public getLevelsByTaskId(taskId: string): Level[] {
    const levels: Level[] = [];
    this.state.levels.forEach((level) => {
      if (level.taskId === taskId) {
        levels.push(level);
      }
    });
    return levels.sort((a, b) => a.id.localeCompare(b.id));
  }

  public getLevel(levelId: string): Level | undefined {
    return this.state.levels.get(levelId);
  }

  public acceptTask(taskId: string): boolean {
    const task = this.state.tasks.get(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return false;
    }

    const status = this.state.taskStatuses.get(taskId);
    if (status !== 'available') {
      console.error(`Task ${taskId} is not available (status: ${status})`);
      return false;
    }

    if (!task.unlocked) {
      console.error(`Task ${taskId} is not unlocked`);
      return false;
    }

    this.state.currentTaskId = taskId;
    this.state.taskStatuses.set(taskId, 'in_progress');

    eventBus.emit(GameEvent.TASK_ACCEPTED, { task });

    return true;
  }

  public completeTask(taskId: string, score: number): boolean {
    const task = this.state.tasks.get(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return false;
    }

    const status = this.state.taskStatuses.get(taskId);
    if (status !== 'in_progress') {
      console.error(`Task ${taskId} is not in progress`);
      return false;
    }

    this.state.taskStatuses.set(taskId, 'completed');
    if (!this.state.completedTaskIds.includes(taskId)) {
      this.state.completedTaskIds.push(taskId);
    }

    if (this.state.currentTaskId === taskId) {
      this.state.currentTaskId = null;
    }

    this.unlockNextTasks(taskId);

    eventBus.emit(GameEvent.TASK_COMPLETED, { task, score });

    return true;
  }

  public failTask(taskId: string, reason: string): boolean {
    const task = this.state.tasks.get(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return false;
    }

    const status = this.state.taskStatuses.get(taskId);
    if (status !== 'in_progress') {
      console.error(`Task ${taskId} is not in progress`);
      return false;
    }

    this.state.taskStatuses.set(taskId, 'failed');

    if (this.state.currentTaskId === taskId) {
      this.state.currentTaskId = null;
    }

    eventBus.emit(GameEvent.TASK_FAILED, { task, reason });

    return true;
  }

  public resetTask(taskId: string): boolean {
    const task = this.state.tasks.get(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return false;
    }

    const status = this.state.taskStatuses.get(taskId);
    if (status === 'in_progress') {
      console.error(`Cannot reset task ${taskId} that is in progress`);
      return false;
    }

    this.state.taskStatuses.set(taskId, 'available');
    return true;
  }

  private unlockNextTasks(completedTaskId: string): void {
    const completedTask = this.state.tasks.get(completedTaskId);
    if (!completedTask) return;

    const difficultyOrder: Difficulty[] = ['easy', 'medium', 'hard'];
    const currentDifficultyIndex = difficultyOrder.indexOf(completedTask.difficulty);

    this.state.tasks.forEach((task) => {
      if (!task.unlocked && task.difficulty === completedTask.difficulty) {
        const completedCount = this.state.completedTaskIds.filter(
          (tid) => this.state.tasks.get(tid)?.difficulty === completedTask.difficulty
        ).length;
        if (completedCount >= 2) {
          task.unlocked = true;
        }
      }

      if (!task.unlocked && currentDifficultyIndex < difficultyOrder.length - 1) {
        const nextDifficulty = difficultyOrder[currentDifficultyIndex + 1];
        if (task.difficulty === nextDifficulty) {
          const sameDifficultyCompleted = this.state.completedTaskIds.filter(
            (tid) => this.state.tasks.get(tid)?.difficulty === completedTask.difficulty
          ).length;
          if (sameDifficultyCompleted >= 3) {
            task.unlocked = true;
          }
        }
      }
    });
  }

  public getCompletedCount(): number {
    return this.state.completedTaskIds.length;
  }

  public getProgress(): { completed: number; total: number } {
    return {
      completed: this.state.completedTaskIds.length,
      total: this.state.tasks.size,
    };
  }

  public getTotalReward(): number {
    return this.state.completedTaskIds.reduce((total, taskId) => {
      const task = this.state.tasks.get(taskId);
      return total + (task?.reward || 0);
    }, 0);
  }

  public reset(): void {
    this.state = {
      tasks: new Map(),
      taskStatuses: new Map(),
      currentTaskId: null,
      completedTaskIds: [],
      levels: new Map(),
    };
  }

  public getState(): Readonly<TaskSystemState> {
    return this.state;
  }
}

export const taskSystem = TaskSystem.getInstance();
