import { _decorator, Component, Node, Label, Sprite, Color } from 'cc';
import { ConfigTypes } from '../types/ConfigTypes';
import { GameManager } from '../core/GameManager';
import { ConfigManager } from '../core/ConfigManager';
import { SaveManager } from '../core/SaveManager';

const { ccclass, property } = _decorator;

@ccclass('TutorialController')
export class TutorialController extends Component {

    @property(Node)
    tutorialOverlay: Node | null = null;

    @property(Label)
    tutorialContentLabel: Label | null = null;

    @property(Node)
    pointerArrow: Node | null = null;

    @property(Sprite)
    highlightMask: Sprite | null = null;

    @property(Node)
    nextButton: Node | null = null;

    @property(Node)
    skipButton: Node | null = null;

    @property(Node)
    highlightArea: Node | null = null;

    private currentTutorial: ConfigTypes.TutorialConfig | null = null;
    private currentStepIndex: number = 0;
    private isShowing: boolean = false;

    start(): void {
        GameManager.instance.eventTarget.on('session_started', this.checkTutorialTrigger, this);
        this.nextButton?.on(Node.EventType.TOUCH_END, this.onNextStep, this);
        this.skipButton?.on(Node.EventType.TOUCH_END, this.onSkipTutorial, this);

        this.hideTutorial();

        this.checkFirstLaunchTutorial();
    }

    onDestroy(): void {
        GameManager.instance.eventTarget.off('session_started', this.checkTutorialTrigger, this);
    }

    private checkFirstLaunchTutorial(): void {
        this.triggerTutorialsByCondition('FIRST_LAUNCH');
    }

    private checkTutorialTrigger(): void {
        const session = GameManager.instance.getCurrentSession();
        if (!session) return;

        if (session.levelId === 'LV001') {
            this.triggerTutorialsByCondition('ENTER_LEVEL_LV001');
        }
    }

    public triggerTutorialsByCondition(condition: ConfigTypes.TutorialTriggerCondition): void {
        const tutorials = ConfigManager.instance.getTutorialsByTrigger(condition);
        for (const tutorial of tutorials) {
            if (!SaveManager.instance.isTutorialCompleted(tutorial.id)) {
                this.startTutorial(tutorial);
                return;
            }
        }
    }

    public triggerFirstActionTutorial(): void {
        this.triggerTutorialsByCondition('FIRST_ACTION_COMPLETE');
    }

    public triggerComplexLogTutorial(): void {
        this.triggerTutorialsByCondition('UNLOCK_COMPLEX_LOGS');
    }

    public triggerFirstLevelCompleteTutorial(): void {
        this.triggerTutorialsByCondition('FIRST_LEVEL_COMPLETE');
    }

    public startTutorial(tutorial: ConfigTypes.TutorialConfig): void {
        this.currentTutorial = tutorial;
        this.currentStepIndex = 0;
        this.isShowing = true;

        log(`[TutorialController] 开始教程: ${tutorial.name}`);
        this.showTutorial();
        this.showCurrentStep();
    }

    private showCurrentStep(): void {
        if (!this.currentTutorial) return;

        const step = this.currentTutorial.steps[this.currentStepIndex];
        if (!step) {
            this.completeTutorial();
            return;
        }

        if (this.tutorialContentLabel) {
            this.tutorialContentLabel.string = step.content;
        }

        if (step.type === 'POINTER' && this.pointerArrow && this.highlightArea) {
            this.pointerArrow.active = true;
            this.highlightArea.active = true;
        } else if (this.pointerArrow && this.highlightArea) {
            this.pointerArrow.active = false;
            this.highlightArea.active = false;
        }

        if (this.skipButton) {
            this.skipButton.active = this.currentStepIndex > 0;
        }
    }

    private showTutorial(): void {
        if (this.tutorialOverlay) {
            this.tutorialOverlay.active = true;
        }
    }

    private hideTutorial(): void {
        this.isShowing = false;
        if (this.tutorialOverlay) {
            this.tutorialOverlay.active = false;
        }
        if (this.pointerArrow) {
            this.pointerArrow.active = false;
        }
        if (this.highlightArea) {
            this.highlightArea.active = false;
        }
    }

    private onNextStep(): void {
        if (!this.currentTutorial) return;

        this.currentStepIndex++;

        if (this.currentStepIndex >= this.currentTutorial.steps.length) {
            this.completeTutorial();
        } else {
            this.showCurrentStep();
        }
    }

    private onSkipTutorial(): void {
        this.completeTutorial();
    }

    private completeTutorial(): void {
        if (this.currentTutorial) {
            SaveManager.instance.markTutorialCompleted(this.currentTutorial.id);
            log(`[TutorialController] 教程完成: ${this.currentTutorial.name}`);
        }
        this.currentTutorial = null;
        this.currentStepIndex = 0;
        this.hideTutorial();
    }

    public getIsShowing(): boolean {
        return this.isShowing;
    }

    public getCurrentTutorialId(): string | null {
        return this.currentTutorial?.id || null;
    }
}
