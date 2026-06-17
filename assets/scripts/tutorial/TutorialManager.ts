import { ITutorial, ITutorialStep, getTutorialById, getTutorialsForLevel } from '../../configs/TutorialConfig';
import { EventManager, GameEventType } from '../core/EventManager';
import { SaveManager } from '../core/SaveManager';
import { Logger } from '../core/Logger';

export interface ITutorialProgress {
    tutorialId: string;
    currentStep: number;
    completedSteps: string[];
    isCompleted: boolean;
    startTime: number;
    endTime?: number;
}

export type TutorialState = 'idle' | 'playing' | 'paused' | 'completed';

export class TutorialManager {
    private static instance: TutorialManager;
    private currentTutorial: ITutorial | null = null;
    private currentStepIndex: number = 0;
    private state: TutorialState = 'idle';
    private progress: Map<string, ITutorialProgress> = new Map();
    private eventManager: EventManager;
    private saveManager: SaveManager;
    private autoAdvanceTimer: number | null = null;

    private constructor() {
        this.eventManager = EventManager.getInstance();
        this.saveManager = SaveManager.getInstance();
    }

    public static getInstance(): TutorialManager {
        if (!TutorialManager.instance) {
            TutorialManager.instance = new TutorialManager();
        }
        return TutorialManager.instance;
    }

    public shouldShowTutorial(): boolean {
        return !this.saveManager.isTutorialCompleted();
    }

    public startTutorial(tutorialId: string): boolean {
        const tutorial = getTutorialById(tutorialId);
        if (!tutorial) {
            Logger.error(`Tutorial not found: ${tutorialId}`);
            return false;
        }

        this.clearAutoAdvanceTimer();
        this.currentTutorial = tutorial;
        this.currentStepIndex = 0;
        this.state = 'playing';

        if (!this.progress.has(tutorialId)) {
            this.progress.set(tutorialId, {
                tutorialId,
                currentStep: 0,
                completedSteps: [],
                isCompleted: false,
                startTime: Date.now()
            });
        }

        this.emitStepEvent();
        Logger.info(`Tutorial started: ${tutorial.name}`);
        return true;
    }

    public getCurrentStep(): ITutorialStep | null {
        if (!this.currentTutorial || this.state !== 'playing') return null;
        return this.currentTutorial.steps[this.currentStepIndex] || null;
    }

    public getCurrentTutorial(): ITutorial | null {
        return this.currentTutorial;
    }

    public nextStep(): boolean {
        if (!this.currentTutorial || this.state !== 'playing') return false;
        
        this.clearAutoAdvanceTimer();
        const currentStep = this.getCurrentStep();
        if (currentStep) {
            this.recordStepCompletion(currentStep.id);
        }

        if (this.currentStepIndex >= this.currentTutorial.steps.length - 1) {
            return this.completeTutorial();
        }

        this.currentStepIndex++;
        this.updateProgress();
        this.emitStepEvent();
        this.setupAutoAdvance();
        return true;
    }

    public previousStep(): boolean {
        if (!this.currentTutorial || this.state !== 'playing') return false;
        if (this.currentStepIndex <= 0) return false;

        this.clearAutoAdvanceTimer();
        this.currentStepIndex--;
        this.updateProgress();
        this.emitStepEvent();
        return true;
    }

    public goToStep(stepIndex: number): boolean {
        if (!this.currentTutorial || this.state !== 'playing') return false;
        if (stepIndex < 0 || stepIndex >= this.currentTutorial.steps.length) return false;

        this.clearAutoAdvanceTimer();
        this.currentStepIndex = stepIndex;
        this.updateProgress();
        this.emitStepEvent();
        this.setupAutoAdvance();
        return true;
    }

    public skipTutorial(): void {
        if (!this.currentTutorial) return;
        
        const step = this.getCurrentStep();
        if (step && !step.canSkip) {
            Logger.warn('Current step cannot be skipped');
            return;
        }

        this.clearAutoAdvanceTimer();
        this.completeTutorial();
    }

    public skipStep(): boolean {
        const step = this.getCurrentStep();
        if (!step || !step.canSkip) {
            return false;
        }
        return this.nextStep();
    }

    private completeTutorial(): boolean {
        if (!this.currentTutorial) return false;

        const tutorialProgress = this.progress.get(this.currentTutorial.id);
        if (tutorialProgress) {
            tutorialProgress.isCompleted = true;
            tutorialProgress.endTime = Date.now();
            tutorialProgress.currentStep = this.currentTutorial.steps.length - 1;
            tutorialProgress.completedSteps = this.currentTutorial.steps.map(s => s.id);
        }

        if (this.currentTutorial.isMandatory) {
            this.saveManager.completeTutorial();
        }

        this.state = 'completed';
        this.eventManager.emit(GameEventType.TUTORIAL_COMPLETE, {
            tutorialId: this.currentTutorial.id,
            tutorialName: this.currentTutorial.name
        });

        Logger.info(`Tutorial completed: ${this.currentTutorial.name}`);
        this.clearAutoAdvanceTimer();
        return true;
    }

    public pauseTutorial(): void {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.clearAutoAdvanceTimer();
        }
    }

    public resumeTutorial(): void {
        if (this.state === 'paused') {
            this.state = 'playing';
            this.setupAutoAdvance();
        }
    }

    public closeTutorial(): void {
        this.clearAutoAdvanceTimer();
        this.currentTutorial = null;
        this.currentStepIndex = 0;
        this.state = 'idle';
    }

    public getProgress(tutorialId: string): ITutorialProgress | undefined {
        return this.progress.get(tutorialId);
    }

    public isTutorialCompleted(tutorialId: string): boolean {
        const progress = this.progress.get(tutorialId);
        return progress?.isCompleted || false;
    }

    public getState(): TutorialState {
        return this.state;
    }

    public getStepCount(): number {
        return this.currentTutorial?.steps.length || 0;
    }

    public getCurrentStepIndex(): number {
        return this.currentStepIndex;
    }

    public getTutorialsForLevel(levelId: number): ITutorial[] {
        return getTutorialsForLevel(levelId);
    }

    public getUncompletedTutorials(levelId: number): ITutorial[] {
        return this.getTutorialsForLevel(levelId).filter(t => 
            !this.isTutorialCompleted(t.id)
        );
    }

    public startMandatoryTutorialIfNeeded(): boolean {
        if (this.shouldShowTutorial()) {
            return this.startTutorial('tutorial_dispatch_basics');
        }
        return false;
    }

    public handleAction(action: string, data?: any): void {
        if (this.state !== 'playing') return;
        
        const step = this.getCurrentStep();
        if (!step) return;

        if (step.actionType === 'click' && action === step.targetElement) {
            this.nextStep();
        } else if (step.actionType === 'select' && data?.selected) {
            this.nextStep();
        }
    }

    private recordStepCompletion(stepId: string): void {
        if (!this.currentTutorial) return;
        const progress = this.progress.get(this.currentTutorial.id);
        if (progress && !progress.completedSteps.includes(stepId)) {
            progress.completedSteps.push(stepId);
        }
    }

    private updateProgress(): void {
        if (!this.currentTutorial) return;
        const progress = this.progress.get(this.currentTutorial.id);
        if (progress) {
            progress.currentStep = this.currentStepIndex;
        }
    }

    private emitStepEvent(): void {
        const step = this.getCurrentStep();
        if (step) {
            this.eventManager.emit(GameEventType.TUTORIAL_STEP, {
                tutorialId: this.currentTutorial?.id,
                stepIndex: this.currentStepIndex,
                step
            });
        }
    }

    private setupAutoAdvance(): void {
        const step = this.getCurrentStep();
        if (step && step.autoAdvance && step.autoAdvanceDelay) {
            this.autoAdvanceTimer = window.setTimeout(() => {
                if (this.state === 'playing') {
                    this.nextStep();
                }
            }, step.autoAdvanceDelay);
        }
    }

    private clearAutoAdvanceTimer(): void {
        if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
    }

    public getAllProgress(): Map<string, ITutorialProgress> {
        return new Map(this.progress);
    }

    public resetProgress(): void {
        this.progress.clear();
        this.closeTutorial();
    }
}
