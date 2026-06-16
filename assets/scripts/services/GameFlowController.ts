import { _decorator } from 'cc';
import { EventBus } from '../core/EventBus';
import { GameEventType } from '../data/enums/GameEventType';
import { createInitialGameState, type GameState, type TaskResult } from '../data/GameState';
import { GameMode } from '../data/enums/GameMode';
import type { LevelConfig, TaskConfig } from '../data/LevelConfig';
import { TaskAction } from '../data/enums/TaskAction';
import { TimerService } from './TimerService';
import { ScoringService } from './ScoringService';
import { PlayerDataService } from './PlayerDataService';

@ccclass('GameFlowController')
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
        this.setupEventListeners();
        EventBus.instance.emit(GameEventType.DATA_UPDATED, 'level_start', this.state);
    }

    private setupEventListeners(): void {
        EventBus.instance.on(GameEventType.TIME_UP, () => {
            this.completeLevel();
        });
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

    public nextTask(): boolean {
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

        EventBus.instance.emit(GameEventType.LEVEL_COMPLETED, {
            results: this.state.taskResults,
            score: this.state.score,
            totalScore: this.state.totalScore,
            timeSpent,
            mode: this.state.currentMode
        });
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
        this.state = createInitialGameState();
    }
}
