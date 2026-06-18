import { _decorator, Label, Node, Button } from 'cc';
import { UIBase } from './UIBase';
import { TutorialManager } from '../managers/TutorialManager';
import { AudioManager } from '../managers/AudioManager';
import { GameEvents } from '../utils/EventManager';

const { ccclass, property } = _decorator;

@ccclass('TutorialUI')
export class TutorialUI extends UIBase {
    @property(Label)
    tutorialTitleLabel: Label | null = null;

    @property(Label)
    stepContentLabel: Label | null = null;

    @property(Label)
    stepIndexLabel: Label | null = null;

    @property(Node)
    prevButton: Node | null = null;

    @property(Node)
    nextButton: Node | null = null;

    @property(Node)
    closeButton: Node | null = null;

    @property(Node)
    highlightNode: Node | null = null;

    onStart(): void {
        this.on(GameEvents.UI_SHOW_TUTORIAL, this.onShowTutorial.bind(this));
        this.on(GameEvents.TUTORIAL_STEP_CHANGED, this.onStepChanged.bind(this));
        this.on(GameEvents.TUTORIAL_COMPLETED, this.onTutorialCompleted.bind(this));

        this.registerInput('confirm', this.onNextClicked.bind(this));
        this.registerInput('next', this.onNextClicked.bind(this));
        this.registerInput('prev', this.onPrevClicked.bind(this));
        this.registerInput('cancel', this.onCloseClicked.bind(this));
    }

    private onShowTutorial(): void {
        this.show();
        const tutorial = TutorialManager.instance.getFirstUncompletedTutorial();
        if (tutorial) {
            TutorialManager.instance.startTutorial(tutorial.id);
            this.updateUI(tutorial.id, 0, tutorial.steps[0]);
        }
    }

    private onStepChanged(tutorialId: string, stepIndex: number, step: any): void {
        this.updateUI(tutorialId, stepIndex, step);
    }

    private onTutorialCompleted(tutorialId: string): void {
        this.hide();
    }

    private updateUI(tutorialId: string, stepIndex: number, step: any): void {
        const tutorial = TutorialManager.instance.getTutorial(tutorialId);
        const totalSteps = tutorial?.steps?.length || 0;

        if (this.tutorialTitleLabel) {
            this.tutorialTitleLabel.string = tutorial?.name || '';
        }
        if (this.stepContentLabel) {
            this.stepContentLabel.string = step?.content || '';
        }
        if (this.stepIndexLabel) {
            this.stepIndexLabel.string = `${stepIndex + 1} / ${totalSteps}`;
        }
        if (this.prevButton) {
            this.prevButton.active = stepIndex > 0;
        }
        if (this.nextButton) {
            this.nextButton.active = stepIndex < totalSteps - 1;
        }
        if (this.highlightNode && step?.target) {
            this.highlightNode.active = true;
        } else if (this.highlightNode) {
            this.highlightNode.active = false;
        }
    }

    public onPrevClicked(): void {
        AudioManager.instance.playClick();
        TutorialManager.instance.prevStep();
    }

    public onNextClicked(): void {
        AudioManager.instance.playClick();
        if (!TutorialManager.instance.nextStep()) {
            this.hide();
        }
    }

    public onCloseClicked(): void {
        AudioManager.instance.playClick();
        TutorialManager.instance.completeTutorial();
        this.hide();
    }

    onShow(): void {
        this.playShowAnimation();
    }
}
