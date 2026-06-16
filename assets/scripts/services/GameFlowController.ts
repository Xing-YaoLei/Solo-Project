import { EventBus } from '../core/EventBus';
import { GameEventType } from '../data/enums/GameEventType';
import { createInitialGameState, type GameState, type TaskResult } from '../data/GameState';
import { GameMode } from '../data/enums/GameMode';
import type { LevelConfig, TaskConfig } from '../data/LevelConfig';
import { TaskAction } from '../data/enums/TaskAction';
import { TimerService } from './TimerService';
import { ScoringService } from './ScoringService';
import { PlayerDataService } from './PlayerDataService';

export interface LevelCompletionData {
    levelId: string;
    levelName: string;
    results: TaskResult[];
    score: number;
    totalScore: number;
    timeSpent: number;
    mode: GameMode;
    tasks: TaskConfig[];
    passingScore: number;
}

export class GameFlowController {
    private static _instance: GameFlowController | null = null;
    private state: GameState = createInitialGameState();

    public static get instance(): GameFlowController {
        if (!GameFlowController._instance) {
            GameFlowController._instance = new GameFlowController();
        }
        return GameFlowController._instance;
    }

    public startLevel(level: LevelConfig, mode: GameMode): void {
        this.state = {
            currentMode: mode,
            currentLevel: level,
            currentTaskIndex: 0,
            score: 0,
            totalScore: level.tasks.reduce((sum, task) => sum + task.score, 0),
            timeRemaining: level.timeLimit,
            taskResults: [],
            isPaused: false,
            taskStartTime: Date.now(),
            levelStartTime: Date.now()
        };

        TimerService.instance.start(level.timeLimit);
        this.ensureTimeUpListener();
        EventBus.instance.emit(GameEventType.DATA_UPDATED, 'level_start', this.state);
    }

    private timeUpHandler: (() => void) | null = null;

    private ensureTimeUpListener(): void {
        if (this.timeUpHandler) {
            EventBus.instance.off(GameEventType.TIME_UP, this.timeUpHandler);
        }
        this.timeUpHandler = () => { this.completeLevel(); };
        EventBus.instance.on(GameEventType.TIME_UP, this.timeUpHandler);
    }

    public getCurrentTask(): TaskConfig | null {
        if (!this.state.currentLevel) return null;
        if (this.state.currentTaskIndex >= this.state.currentLevel.tasks.length) return null;
        return this.state.currentLevel.tasks[this.state.currentTaskIndex];
    }

    public submitAction(action: TaskAction): TaskResult | null {
        const task = this.getCurrentTask();
        if (!task) return null;

        const timeSpent = (Date.now() - this.state.taskStartTime) / 1000;
        const result = ScoringService.instance.evaluateAction(
            task,
            action,
            timeSpent,
            this.state.currentMode
        );

        this.state.score += result.scoreEarned;
        this.state.taskResults.push(result);

        EventBus.instance.emit(GameEventType.ACTION_SELECTED, action, result);

        return result;
    }

    public advanceToNextTask(): boolean {
        if (!this.state.currentLevel) return false;

        this.state.currentTaskIndex++;
        this.state.taskStartTime = Date.now();

        if (this.state.currentTaskIndex >= this.state.currentLevel.tasks.length) {
            this.completeLevel();
            return false;
        }

        EventBus.instance.emit(GameEventType.DATA_UPDATED, 'task_change', this.state.currentTaskIndex);
        return true;
    }

    public completeLevel(): void {
        TimerService.instance.stop();

        const timeSpent = (Date.now() - this.state.levelStartTime) / 1000;

        if (this.state.currentLevel) {
            PlayerDataService.instance.recordLevelCompletion(
                this.state.currentLevel.id,
                this.state.taskResults,
                timeSpent
            );
        }

        if (this.timeUpHandler) {
            EventBus.instance.off(GameEventType.TIME_UP, this.timeUpHandler);
            this.timeUpHandler = null;
        }

        const completionData: LevelCompletionData = {
            levelId: this.state.currentLevel ? this.state.currentLevel.id : '',
            levelName: this.state.currentLevel ? this.state.currentLevel.name : '',
            results: [...this.state.taskResults],
            score: this.state.score,
            totalScore: this.state.totalScore,
            timeSpent,
            mode: this.state.currentMode,
            tasks: this.state.currentLevel ? [...this.state.currentLevel.tasks] : [],
            passingScore: this.state.currentLevel ? this.state.currentLevel.passingScore : 60
        };

        EventBus.instance.emit(GameEventType.LEVEL_COMPLETED, completionData);
    }

    public pauseGame(): void {
        if (this.state.isPaused) return;
        this.state.isPaused = true;
        TimerService.instance.pause();
    }

    public resumeGame(): void {
        if (!this.state.isPaused) return;
        this.state.isPaused = false;
        TimerService.instance.resume();
    }

    public getState(): GameState {
        return { ...this.state };
    }

    public getProgress(): number {
        if (!this.state.currentLevel) return 0;
        return (this.state.currentTaskIndex / this.state.currentLevel.tasks.length) * 100;
    }

    public hasMoreTasks(): boolean {
        if (!this.state.currentLevel) return false;
        return this.state.currentTaskIndex < this.state.currentLevel.tasks.length;
    }

    public reset(): void {
        TimerService.instance.stop();
        if (this.timeUpHandler) {
            EventBus.instance.off(GameEventType.TIME_UP, this.timeUpHandler);
            this.timeUpHandler = null;
        }
        this.state = createInitialGameState();
    }
}
