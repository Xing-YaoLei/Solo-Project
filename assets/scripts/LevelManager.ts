import { LevelConfig, LEVEL_CONFIGS, generateElderlyProfiles, generateMedicineTasks, generateVisitTasks, generateActivityTasks } from './data/LevelConfig';
import { ElderlyProfile, MedicineItem, VisitRecord, ActivityItem } from './data/ElderlyData';

export class LevelManager {
    private _currentLevel: LevelConfig | null = null;
    private _elderlyProfiles: ElderlyProfile[] = [];
    private _medicineTasks: MedicineItem[] = [];
    private _visitTasks: VisitRecord[] = [];
    private _activityTasks: ActivityItem[] = [];
    private _currentTaskIndex: number = 0;
    private _currentTaskType: 'medicine' | 'visit' | 'activity' | null = null;

    get totalLevels(): number {
        return LEVEL_CONFIGS.length;
    }

    getLevelConfig(levelId: number): LevelConfig | null {
        return LEVEL_CONFIGS.find(l => l.id === levelId) || null;
    }

    getAllLevels(): LevelConfig[] {
        return [...LEVEL_CONFIGS];
    }

    loadLevel(levelId: number): boolean {
        const config = this.getLevelConfig(levelId);
        if (!config) return false;

        this._currentLevel = config;
        this._currentTaskIndex = 0;
        this._elderlyProfiles = generateElderlyProfiles(config.elderlyCount);

        if (config.taskTypes.includes('medicine')) {
            this._medicineTasks = generateMedicineTasks(config.medicineCount, config.difficulty);
        } else {
            this._medicineTasks = [];
        }

        if (config.taskTypes.includes('visit')) {
            this._visitTasks = generateVisitTasks(config.visitCount);
        } else {
            this._visitTasks = [];
        }

        if (config.taskTypes.includes('activity')) {
            this._activityTasks = generateActivityTasks(config.activityCount);
        } else {
            this._activityTasks = [];
        }

        if (config.taskTypes.length > 0) {
            this._currentTaskType = config.taskTypes[0];
        }

        return true;
    }

    get currentLevel(): LevelConfig | null {
        return this._currentLevel;
    }

    get elderlyProfiles(): ElderlyProfile[] {
        return [...this._elderlyProfiles];
    }

    get medicineTasks(): MedicineItem[] {
        return [...this._medicineTasks];
    }

    get visitTasks(): VisitRecord[] {
        return [...this._visitTasks];
    }

    get activityTasks(): ActivityItem[] {
        return [...this._activityTasks];
    }

    get currentTaskType(): 'medicine' | 'visit' | 'activity' | null {
        return this._currentTaskType;
    }

    getTotalTaskCount(): number {
        return this._medicineTasks.length + this._visitTasks.length + this._activityTasks.length;
    }

    getCompletedTaskCount(): number {
        let count = 0;
        this._medicineTasks.forEach(t => { if ((t as any).processed) count++; });
        this._visitTasks.forEach(t => { if ((t as any).processed) count++; });
        this._activityTasks.forEach(t => { if ((t as any).processed) count++; });
        return count;
    }

    getRemainingTaskCount(): number {
        return this.getTotalTaskCount() - this.getCompletedTaskCount();
    }

    setTaskType(type: 'medicine' | 'visit' | 'activity'): void {
        if (this._currentLevel?.taskTypes.includes(type)) {
            this._currentTaskType = type;
        }
    }

    getTasksByType(type: 'medicine' | 'visit' | 'activity'): (MedicineItem | VisitRecord | ActivityItem)[] {
        switch (type) {
            case 'medicine': return [...this._medicineTasks];
            case 'visit': return [...this._visitTasks];
            case 'activity': return [...this._activityTasks];
        }
    }

    markTaskProcessed(taskId: string, taskType: 'medicine' | 'visit' | 'activity'): void {
        let tasks: any[] = [];
        switch (taskType) {
            case 'medicine': tasks = this._medicineTasks; break;
            case 'visit': tasks = this._visitTasks; break;
            case 'activity': tasks = this._activityTasks; break;
        }
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            (task as any).processed = true;
        }
    }

    isAllTasksCompleted(): boolean {
        return this.getRemainingTaskCount() === 0;
    }

    resetLevel(): void {
        if (this._currentLevel) {
            this.loadLevel(this._currentLevel.id);
        }
    }

    getNextLevelId(): number | null {
        if (!this._currentLevel) return 1;
        const nextId = this._currentLevel.id + 1;
        return nextId <= this.totalLevels ? nextId : null;
    }
}

export const levelManager = new LevelManager();
