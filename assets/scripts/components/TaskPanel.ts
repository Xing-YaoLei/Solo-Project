import { _decorator, Component, Node, Label, ProgressBar, Color } from 'cc';
import type { TaskConfig } from '../data/LevelConfig';
import { TimerService } from '../services/TimerService';
import { GameFlowController } from '../services/GameFlowController';
import { EventBus } from '../core/EventBus';
import { GameEventType } from '../data/enums/GameEventType';

const { ccclass, property } = _decorator;

@ccclass('TaskPanel')
export class TaskPanel extends Component {
    @property(Label)
    taskNumberLabel: Label | null = null;

    @property(Label)
    taskDescriptionLabel: Label | null = null;

    @property(Label)
    timerLabel: Label | null = null;

    @property(Label)
    scoreLabel: Label | null = null;

    @property(ProgressBar)
    progressBar: ProgressBar | null = null;

    @property(Label)
    progressLabel: Label | null = null;

    @property(Node)
    pauseButton: Node | null = null;

    private isPaused: boolean = false;

    onLoad() {
        EventBus.instance.on(GameEventType.DATA_UPDATED, this.onDataUpdated, this);
    }

    onDestroy() {
        EventBus.instance.off(GameEventType.DATA_UPDATED, this.onDataUpdated, this);
    }

    start() {
        if (this.pauseButton) {
            this.pauseButton.on(Node.EventType.TOUCH_END, this.onPauseClick, this);
        }
        this.schedule(this.updateTimer, 0.5);
    }

    onDisable() {
        this.unschedule(this.updateTimer);
        if (this.pauseButton) {
            this.pauseButton.off(Node.EventType.TOUCH_END, this.onPauseClick, this);
        }
    }

    public setTask(task: TaskConfig, taskIndex: number, totalTasks: number): void {
        if (this.taskNumberLabel) {
            this.taskNumberLabel.string = `任务 ${taskIndex + 1}/${totalTasks}`;
        }
        if (this.taskDescriptionLabel) {
            this.taskDescriptionLabel.string = task.description;
        }
        if (this.progressBar) {
            this.progressBar.progress = (taskIndex + 1) / totalTasks;
        }
        if (this.progressLabel) {
            this.progressLabel.string = `进度: ${taskIndex + 1}/${totalTasks}`;
        }
        this.updateScore();
    }

    private updateTimer(): void {
        if (!TimerService.instance.isTimerRunning()) return;
        const remaining = TimerService.instance.getRemainingTime();
        if (this.timerLabel) {
            this.timerLabel.string = TimerService.instance.formatTime(remaining);
            if (remaining <= 30) {
                this.timerLabel.color = new Color(255, 0, 0);
            } else {
                this.timerLabel.color = new Color(255, 255, 255);
            }
        }
    }

    private updateScore(): void {
        const state = GameFlowController.instance.getState();
        if (this.scoreLabel) {
            this.scoreLabel.string = `得分: ${state.score}/${state.totalScore}`;
        }
    }

    private onDataUpdated(eventType: string, data: any): void {
        if (eventType === 'task_change' || eventType === 'level_start') {
            const state = GameFlowController.instance.getState();
            const task = GameFlowController.instance.getCurrentTask();
            if (task && state.currentLevel) {
                this.setTask(task, state.currentTaskIndex, state.currentLevel.tasks.length);
            }
        }
    }

    private onPauseClick(): void {
        if (this.isPaused) {
            GameFlowController.instance.resumeGame();
            this.isPaused = false;
        } else {
            GameFlowController.instance.pauseGame();
            this.isPaused = true;
        }
        this.updatePauseButton();
    }

    private updatePauseButton(): void {
    }
}
