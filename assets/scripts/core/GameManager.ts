import { _decorator, Component, EventTarget, log, warn } from 'cc';
import { GameTypes } from '../types/GameTypes';
import { ConfigTypes } from '../types/ConfigTypes';
import { ConfigManager } from './ConfigManager';
import { SaveManager } from './SaveManager';
import { TrainingRecordManager } from './TrainingRecordManager';

const { ccclass, property } = _decorator;

export const GameEvent = {
    PHASE_CHANGED: 'game_phase_changed',
    SESSION_STARTED: 'session_started',
    SESSION_COMPLETED: 'session_completed',
    TASK_CHANGED: 'task_changed',
    TASK_COMPLETED: 'task_completed',
    SCORE_UPDATED: 'score_updated',
    INSURANCE_TRIGGERED: 'insurance_triggered',
    CLUE_VIEWED: 'clue_viewed',
    ACTION_SELECTED: 'action_selected'
};

@ccclass('GameManager')
export class GameManager extends Component {

    private static _instance: GameManager | null = null;
    public static get instance(): GameManager {
        return GameManager._instance!;
    }

    public eventTarget: EventTarget = new EventTarget();

    private currentPhase: GameTypes.GamePhase = 'MENU';
    private currentSession: GameTypes.LevelSession | null = null;

    private currentLevelConfig: ConfigTypes.LevelConfig | null = null;

    onLoad(): void {
        if (GameManager._instance && GameManager._instance !== this) {
            this.destroy();
            return;
        }
        GameManager._instance = this;
    }

    public getCurrentPhase(): GameTypes.GamePhase {
        return this.currentPhase;
    }

    public setPhase(phase: GameTypes.GamePhase): void {
        if (this.currentPhase !== phase) {
            log(`[GameManager] 阶段变化: ${this.currentPhase} -> ${phase}`);
            this.currentPhase = phase;
            this.eventTarget.emit(GameEvent.PHASE_CHANGED, phase);
        }
    }

    public getCurrentSession(): GameTypes.LevelSession | null {
        return this.currentSession;
    }

    public getCurrentLevelConfig(): ConfigTypes.LevelConfig | null {
        return this.currentLevelConfig;
    }

    public startLevel(levelId: string): boolean {
        const levelConfig = ConfigManager.instance.getLevelById(levelId);
        if (!levelConfig) {
            warn(`[GameManager] 关卡不存在: ${levelId}`);
            return false;
        }
        if (!SaveManager.instance.isLevelUnlocked(levelId)) {
            warn(`[GameManager] 关卡未解锁: ${levelId}`);
            return false;
        }

        this.currentLevelConfig = levelConfig;
        this.currentSession = this.createSession(levelConfig);

        log(`[GameManager] 开始关卡: ${levelConfig.name} (${levelId})`);
        this.eventTarget.emit(GameEvent.SESSION_STARTED, this.currentSession);

        this.setPhase('TASK_ACCEPT');
        this.startTask(levelConfig.tasks[0]);

        return true;
    }

    private createSession(levelConfig: ConfigTypes.LevelConfig): GameTypes.LevelSession {
        const prescription = ConfigManager.instance.getPrescriptionById(levelConfig.prescriptionId);
        const objectives: GameTypes.ObjectiveProgress[] = prescription?.objectives.map(obj => ({
            objectiveId: obj.id,
            name: obj.name,
            currentValue: 0,
            targetValue: obj.target,
            passed: false
        })) || [];

        const taskProgress: Record<string, GameTypes.TaskProgress> = {};
        levelConfig.tasks.forEach(taskId => {
            taskProgress[taskId] = {
                taskId,
                completed: false,
                selectedOptionId: null,
                scoreEarned: 0,
                triggeredInsuranceRejection: false,
                insuranceRisk: 0,
                timeSpent: 0,
                clueViewed: [],
                startTime: Date.now()
            };
        });

        return {
            sessionId: `S${Date.now()}${Math.random().toString(36).substring(2, 6)}`,
            levelId: levelConfig.id,
            prescriptionId: levelConfig.prescriptionId,
            startTime: Date.now(),
            totalTimeSpent: 0,
            currentTaskIndex: 0,
            taskOrder: [...levelConfig.tasks],
            taskProgress,
            totalScore: 0,
            passScore: levelConfig.passScore,
            completed: false,
            passed: false,
            insuranceRejectionCount: 0,
            insuranceTriggered: false,
            objectives,
            nursingLogs: [],
            difficulty: levelConfig.difficulty
        };
    }

    public startTask(taskId: string): boolean {
        if (!this.currentSession) {
            warn('[GameManager] 无进行中的关卡');
            return false;
        }

        const taskConfig = ConfigManager.instance.getTaskById(taskId);
        if (!taskConfig) {
            warn(`[GameManager] 任务不存在: ${taskId}`);
            return false;
        }

        const progress = this.currentSession.taskProgress[taskId];
        if (progress) {
            progress.startTime = Date.now();
        }

        const index = this.currentSession.taskOrder.indexOf(taskId);
        if (index >= 0) {
            this.currentSession.currentTaskIndex = index;
        }

        log(`[GameManager] 开始任务: ${taskConfig.name} (${taskId})`);
        this.eventTarget.emit(GameEvent.TASK_CHANGED, taskId, taskConfig);

        if (taskConfig.clueIds && taskConfig.clueIds.length > 0) {
            this.setPhase('CLUE_OBSERVATION');
        } else {
            this.setPhase('ACTION_SELECTION');
        }

        return true;
    }

    public getCurrentTask(): ConfigTypes.TaskConfig | null {
        if (!this.currentSession) return null;
        const taskId = this.currentSession.taskOrder[this.currentSession.currentTaskIndex];
        return ConfigManager.instance.getTaskById(taskId);
    }

    public getCurrentTaskProgress(): GameTypes.TaskProgress | null {
        if (!this.currentSession) return null;
        const taskId = this.currentSession.taskOrder[this.currentSession.currentTaskIndex];
        return this.currentSession.taskProgress[taskId] || null;
    }

    public viewClue(clueId: string): ConfigTypes.ClueConfig | null {
        const clue = ConfigManager.instance.getClueById(clueId);
        if (!clue) return null;

        const currentProgress = this.getCurrentTaskProgress();
        if (currentProgress && !currentProgress.clueViewed.includes(clueId)) {
            currentProgress.clueViewed.push(clueId);
        }

        this.eventTarget.emit(GameEvent.CLUE_VIEWED, clueId, clue);
        return clue;
    }

    public markClueObservationComplete(): void {
        const currentTask = this.getCurrentTask();
        if (currentTask?.questionSetId) {
            this.setPhase('QUESTION_SET');
        } else {
            this.setPhase('ACTION_SELECTION');
        }
    }

    public selectAction(optionId: string): ConfigTypes.ActionOption | null {
        if (!this.currentSession) {
            warn('[GameManager] 无进行中的关卡');
            return null;
        }

        const currentTask = this.getCurrentTask();
        if (!currentTask) return null;

        const option = currentTask.actionOptions.find(o => o.id === optionId);
        if (!option) {
            warn(`[GameManager] 选项不存在: ${optionId}`);
            return null;
        }

        const progress = this.getCurrentTaskProgress();
        if (!progress || progress.completed) return null;

        const prescription = ConfigManager.instance.getPrescriptionById(this.currentSession.prescriptionId);
        const multiplier = prescription?.parameters.scoreMultiplier || 1.0;
        const actualScore = option.score * multiplier;

        progress.selectedOptionId = optionId;
        progress.scoreEarned = actualScore;
        progress.completed = true;
        progress.errorType = option.errorType;
        progress.insuranceRisk = option.insuranceRejectionRisk || 0;
        progress.endTime = Date.now();
        progress.timeSpent = (progress.endTime - progress.startTime) / 1000;

        if (progress.timeSpent > 0 && prescription?.parameters.timeDeductionPerSecond) {
            const deduction = progress.timeSpent * prescription.parameters.timeDeductionPerSecond;
            progress.scoreEarned = Math.max(0, progress.scoreEarned - deduction);
        }

        this.currentSession.totalScore = Math.max(0, Math.min(100, this.currentSession.totalScore + progress.scoreEarned));

        if (option.insuranceRejectionRisk && option.insuranceRejectionRisk > 0) {
            const triggered = Math.random() < option.insuranceRejectionRisk;
            if (triggered) {
                progress.triggeredInsuranceRejection = true;
                this.currentSession.insuranceRejectionCount++;
                this.currentSession.insuranceTriggered = true;
                this.eventTarget.emit(GameEvent.INSURANCE_TRIGGERED, {
                    taskId: currentTask.id,
                    option: option,
                    risk: option.insuranceRejectionRisk
                });
                warn(`[GameManager] 触发医保拒付: ${currentTask.name} - ${option.errorType}`);
            }
        }

        const logEntry = TrainingRecordManager.instance.createNursingLogEntry(
            currentTask.id,
            option,
            progress.scoreEarned
        );
        this.currentSession.nursingLogs.push(logEntry);

        this.updateObjectives(currentTask.id, option);

        this.eventTarget.emit(GameEvent.ACTION_SELECTED, {
            taskId: currentTask.id,
            option,
            score: progress.scoreEarned,
            totalScore: this.currentSession.totalScore,
            triggeredInsurance: progress.triggeredInsuranceRejection
        });
        this.eventTarget.emit(GameEvent.SCORE_UPDATED, this.currentSession.totalScore);
        this.eventTarget.emit(GameEvent.TASK_COMPLETED, currentTask.id, progress);

        this.setPhase('FEEDBACK');

        return option;
    }

    private updateObjectives(taskId: string, option: ConfigTypes.ActionOption): void {
        if (!this.currentSession) return;

        const prescription = ConfigManager.instance.getPrescriptionById(this.currentSession.prescriptionId);
        if (!prescription) return;

        this.currentSession.objectives.forEach(obj => {
            let updated = false;
            if (option.isCorrect) {
                obj.currentValue = Math.min(1, obj.currentValue + 0.1);
                updated = true;
            }
            if (option.errorType) {
                if (obj.name.includes('合规') && (option.errorType === 'BILLING_FRAUD' || option.errorType === 'OVERTREATMENT')) {
                    obj.currentValue = Math.max(0, obj.currentValue - 0.2);
                    updated = true;
                }
            }
            if (updated) {
                obj.passed = obj.currentValue >= obj.targetValue;
            }
        });
    }

    public proceedFromFeedback(): void {
        if (!this.currentSession) return;

        const currentTask = this.getCurrentTask();
        if (!currentTask) {
            this.completeSession();
            return;
        }

        const selectedOptionId = this.currentSession.taskProgress[currentTask.id]?.selectedOptionId;
        if (!selectedOptionId) return;

        const selectedOption = currentTask.actionOptions.find(o => o.id === selectedOptionId);

        if (selectedOption?.nextTask) {
            const nextTaskId = selectedOption.nextTask;
            const nextIndex = this.currentSession.taskOrder.indexOf(nextTaskId);
            if (nextIndex >= 0) {
                this.currentSession.currentTaskIndex = nextIndex;
                this.startTask(nextTaskId);
                return;
            }
        }

        const nextIndex = this.currentSession.currentTaskIndex + 1;
        if (nextIndex < this.currentSession.taskOrder.length) {
            const nextTaskId = this.currentSession.taskOrder[nextIndex];
            this.currentSession.currentTaskIndex = nextIndex;
            this.startTask(nextTaskId);
        } else {
            this.completeSession();
        }
    }

    private completeSession(): void {
        if (!this.currentSession || !this.currentLevelConfig) return;

        this.currentSession.endTime = Date.now();
        this.currentSession.totalTimeSpent = (this.currentSession.endTime - this.currentSession.startTime) / 1000;
        this.currentSession.completed = true;
        this.currentSession.passed = this.currentSession.totalScore >= this.currentSession.passScore;

        this.currentSession.settlement = TrainingRecordManager.instance.buildSettlementDetail(
            this.currentSession,
            this.currentLevelConfig
        );

        const errors: ConfigTypes.ErrorType[] = [];
        for (const taskId of this.currentSession.taskOrder) {
            const p = this.currentSession.taskProgress[taskId];
            if (p?.errorType) {
                errors.push(p.errorType);
            }
        }

        SaveManager.instance.recordLevelCompletion(
            this.currentLevelConfig.id,
            this.currentSession.sessionId,
            this.currentSession.totalScore,
            this.currentSession.passed,
            this.currentSession.insuranceRejectionCount,
            errors
        );

        if (this.currentSession.passed) {
            const rewards = this.currentLevelConfig.rewards;
            if (rewards?.exp) SaveManager.instance.addExp(rewards.exp);
            if (rewards?.coins) SaveManager.instance.addCoins(rewards.coins);
            if (rewards?.unlockItems) {
                rewards.unlockItems.forEach(id => SaveManager.instance.addItem(id));
            }
            this.unlockNextLevels();
        }

        const replay = TrainingRecordManager.instance.buildReplaySession(
            this.currentSession,
            this.currentLevelConfig
        );
        SaveManager.instance.saveReplaySession(replay);

        const profile = SaveManager.instance.getPlayerProfile();
        const taskCount = this.currentSession.taskOrder.length;
        const correctCount = Object.values(this.currentSession.taskProgress).filter(p => p.scoreEarned >= 0).length;
        const accuracy = taskCount > 0 ? correctCount / taskCount : 0;
        const totalTasks = this.currentSession.taskOrder.length;
        const compliance = Math.max(0, 1 - this.currentSession.insuranceRejectionCount / Math.max(3, totalTasks * 0.3));
        const compositeScore = TrainingRecordManager.instance.calculateCompositeScore(
            this.currentSession.totalScore,
            this.currentSession.totalTimeSpent,
            this.currentLevelConfig,
            this.currentSession.insuranceRejectionCount
        );

        SaveManager.instance.submitLeaderboardEntry({
            playerId: profile.playerId,
            playerName: profile.playerName,
            levelId: this.currentLevelConfig.id,
            score: this.currentSession.totalScore,
            timeSpent: this.currentSession.totalTimeSpent,
            accuracy,
            insuranceCompliance: compliance,
            compositeScore,
            updatedAt: Date.now()
        });

        log(`[GameManager] 关卡完成: ${this.currentLevelConfig.name} - 得分: ${this.currentSession.totalScore}, ${this.currentSession.passed ? '通过' : '未通过'}`);
        this.eventTarget.emit(GameEvent.SESSION_COMPLETED, {
            session: this.currentSession,
            level: this.currentLevelConfig,
            replay
        });

        this.setPhase('SETTLEMENT');
    }

    private unlockNextLevels(): void {
        const allLevels = ConfigManager.instance.getAllLevels();
        const totalScore = SaveManager.instance.getTotalScore();
        const completedLevelIds = SaveManager.instance.getCompletedLevelIds();

        allLevels.forEach(level => {
            if (SaveManager.instance.isLevelUnlocked(level.id)) return;

            const cond = level.unlockCondition;
            let shouldUnlock = false;

            switch (cond.type) {
                case 'NONE':
                    shouldUnlock = true;
                    break;
                case 'LEVEL_PASS':
                    shouldUnlock = completedLevelIds.includes(cond.value as string);
                    break;
                case 'TOTAL_SCORE':
                    shouldUnlock = totalScore >= (cond.value as number);
                    break;
                case 'EXP_REACHED':
                    shouldUnlock = SaveManager.instance.getPlayerProfile().totalExp >= (cond.value as number);
                    break;
                case 'ITEM_OWNED':
                    shouldUnlock = SaveManager.instance.hasItem(cond.value as string);
                    break;
            }

            if (shouldUnlock) {
                SaveManager.instance.unlockLevel(level.id);
                log(`[GameManager] 解锁新关卡: ${level.name} (${level.id})`);
            }
        });
    }

    public abandonSession(): void {
        if (this.currentSession) {
            warn(`[GameManager] 放弃关卡: ${this.currentSession.levelId}`);
            this.currentSession = null;
            this.currentLevelConfig = null;
        }
        this.setPhase('LEVEL_SELECT');
    }

    public getTaskProgress(taskId: string): GameTypes.TaskProgress | null {
        return this.currentSession?.taskProgress[taskId] || null;
    }

    public getCluesForCurrentTask(): ConfigTypes.ClueConfig[] {
        const task = this.getCurrentTask();
        if (!task) return [];
        return ConfigManager.instance.getCluesByIds(task.clueIds);
    }

    public getOptionsForCurrentTask(): ConfigTypes.ActionOption[] {
        const task = this.getCurrentTask();
        if (!task) return [];
        return task.actionOptions;
    }

    public checkUnlockComplexLogs(): boolean {
        if (!this.currentSession) return false;
        return TrainingRecordManager.instance.shouldUnlockComplexLogs(this.currentSession.prescriptionId);
    }
}
