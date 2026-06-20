import { _decorator, Component, Node, Button, Label, Sprite, Color, tween, Vec3 } from 'cc';
import { GameManager } from '../core/GameManager';
import { TutorialStep } from '../models';
import { ActionType } from '../models/GameEnums';
const { ccclass, property } = _decorator;

@ccclass('TutorialSystem')
export class TutorialSystem extends Component {
    @property(Node)
    tutorialMask: Node | null = null;

    @property(Node)
    tutorialDialog: Node | null = null;

    @property(Label)
    tutorialTitle: Label | null = null;

    @property(Label)
    tutorialContent: Label | null = null;

    @property(Button)
    nextBtn: Button | null = null;

    @property(Button)
    skipBtn: Button | null = null;

    @property(Label)
    stepLabel: Label | null = null;

    private steps: TutorialStep[] = [];
    private currentStepIndex: number = 0;
    private isActive: boolean = false;
    private onCompleteCallback: (() => void) | null = null;

    onLoad() {
        this.registerEvents();
        this.hide();
    }

    private registerEvents(): void {
        if (this.nextBtn) {
            this.nextBtn.node.on(Button.EventType.CLICK, this.onNextStep, this);
        }
        if (this.skipBtn) {
            this.skipBtn.node.on(Button.EventType.CLICK, this.onSkip, this);
        }
    }

    public startTutorial(steps: TutorialStep[], onComplete?: () => void): void {
        this.steps = steps;
        this.currentStepIndex = 0;
        this.isActive = true;
        this.onCompleteCallback = onComplete || null;

        this.show();
        this.showStep(0);
    }

    private showStep(index: number): void {
        if (index < 0 || index >= this.steps.length) return;

        const step = this.steps[index];

        if (this.tutorialTitle) {
            this.tutorialTitle.string = step.title;
        }
        if (this.tutorialContent) {
            this.tutorialContent.string = step.content;
        }
        if (this.stepLabel) {
            this.stepLabel.string = `${index + 1}/${this.steps.length}`;
        }

        if (this.nextBtn) {
            this.nextBtn.node.active = !step.autoNext;
        }

        this.playDialogAnimation();
    }

    private playDialogAnimation(): void {
        if (!this.tutorialDialog) return;

        this.tutorialDialog.setScale(0.8, 0.8, 1);
        tween(this.tutorialDialog)
            .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
    }

    private onNextStep(): void {
        this.currentStepIndex++;

        if (this.currentStepIndex >= this.steps.length) {
            this.completeTutorial();
        } else {
            this.showStep(this.currentStepIndex);
        }
    }

    private onSkip(): void {
        this.completeTutorial();
    }

    private completeTutorial(): void {
        this.hide();
        this.isActive = false;

        if (this.onCompleteCallback) {
            this.onCompleteCallback();
        }
    }

    public notifyAction(action: ActionType): void {
        if (!this.isActive) return;

        const currentStep = this.steps[this.currentStepIndex];
        if (!currentStep || !currentStep.waitForAction) return;

        if (currentStep.waitForAction === action) {
            this.onNextStep();
        }
    }

    public show(): void {
        if (this.tutorialMask) {
            this.tutorialMask.active = true;
        }
        if (this.tutorialDialog) {
            this.tutorialDialog.active = true;
        }
    }

    public hide(): void {
        if (this.tutorialMask) {
            this.tutorialMask.active = false;
        }
        if (this.tutorialDialog) {
            this.tutorialDialog.active = false;
        }
    }

    public isTutorialActive(): boolean {
        return this.isActive;
    }

    public getCurrentStep(): TutorialStep | null {
        if (this.currentStepIndex < 0 || this.currentStepIndex >= this.steps.length) {
            return null;
        }
        return this.steps[this.currentStepIndex];
    }
}
