import { _decorator, Component, Node, Label, Button, tween, Vec3 } from 'cc';
import { UIBase } from './UIBase';
import { SaveManager } from '../core/SaveManager';
import { ConfigManager } from '../core/ConfigManager';
import { ITutorial, ITutorialStep } from '../core/GameInterfaces';
const { ccclass, property } = _decorator;

@ccclass('TutorialManager')
export class TutorialManager extends Component {

    private static _instance: TutorialManager | null = null;

    public static get instance(): TutorialManager {
        if (!TutorialManager._instance) {
            TutorialManager._instance = new TutorialManager();
        }
        return TutorialManager._instance;
    }

    @property(Node)
    tutorialPanel: Node | null = null;

    @property(Label)
    titleLabel: Label | null = null;

    @property(Label)
    contentLabel: Label | null = null;

    @property(Button)
    prevButton: Button | null = null;

    @property(Button)
    nextButton: Button | null = null;

    @property(Button)
    closeButton: Button | null = null;

    @property(Node)
    highlightNode: Node | null = null;

    private _currentTutorial: ITutorial | null = null;
    private _currentStepIndex: number = 0;
    private _isShowing: boolean = false;

    constructor() {
        super();
    }

    onLoad() {
        if (this.prevButton) {
            this.prevButton.node.on(Button.EventType.CLICK, this.onPrevStep, this);
        }
        if (this.nextButton) {
            this.nextButton.node.on(Button.EventType.CLICK, this.onNextStep, this);
        }
        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, this.onClose, this);
        }
    }

    public startTutorial(tutorialId: string): boolean {
        const tutorial = ConfigManager.instance.getTutorial(tutorialId);
        if (!tutorial) {
            console.warn(`[TutorialManager] Tutorial ${tutorialId} not found`);
            return false;
        }

        if (SaveManager.instance.isTutorialComplete(tutorialId)) {
            console.log(`[TutorialManager] Tutorial ${tutorialId} already completed`);
            return false;
        }

        this._currentTutorial = tutorial;
        this._currentStepIndex = 0;
        this.show();
        this.updateStepDisplay();

        console.log(`[TutorialManager] Started tutorial: ${tutorial.name}`);
        return true;
    }

    public show(): void {
        if (this._isShowing) return;
        this._isShowing = true;
        if (this.tutorialPanel) {
            this.tutorialPanel.active = true;
            this.tutorialPanel.setScale(0.9, 0.9, 0.9);
            tween(this.tutorialPanel)
                .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                .start();
        }
    }

    public hide(): void {
        if (!this._isShowing) return;
        this._isShowing = false;
        if (this.tutorialPanel) {
            tween(this.tutorialPanel)
                .to(0.2, { scale: new Vec3(0.9, 0.9, 0.9) }, { easing: 'backIn' })
                .call(() => {
                    if (this.tutorialPanel) {
                        this.tutorialPanel.active = false;
                    }
                })
                .start();
        }
    }

    private updateStepDisplay(): void {
        if (!this._currentTutorial) return;

        const step = this._currentTutorial.steps[this._currentStepIndex];
        if (!step) return;

        if (this.titleLabel) {
            this.titleLabel.string = step.title;
        }
        if (this.contentLabel) {
            this.contentLabel.string = step.content;
        }

        if (this.prevButton) {
            this.prevButton.interactable = this._currentStepIndex > 0;
        }

        if (this.nextButton) {
            const isLastStep = this._currentStepIndex >= this._currentTutorial.steps.length - 1;
            this.nextButton.node.getChildByName('Label')?.getComponent(Label)?.setString(
                isLastStep ? '完成' : '下一步'
            );
        }

        if (this.highlightNode) {
            if (step.highlightNode) {
                this.highlightNode.active = true;
            } else {
                this.highlightNode.active = false;
            }
        }
    }

    private onPrevStep(): void {
        if (this._currentStepIndex > 0) {
            this._currentStepIndex--;
            this.updateStepDisplay();
        }
    }

    private onNextStep(): void {
        if (!this._currentTutorial) return;

        if (this._currentStepIndex < this._currentTutorial.steps.length - 1) {
            this._currentStepIndex++;
            this.updateStepDisplay();
        } else {
            this.completeTutorial();
        }
    }

    private completeTutorial(): void {
        if (!this._currentTutorial) return;

        SaveManager.instance.setTutorialComplete(this._currentTutorial.id);
        this.hide();

        console.log(`[TutorialManager] Tutorial completed: ${this._currentTutorial.name}`);

        this._currentTutorial = null;
        this._currentStepIndex = 0;
    }

    private onClose(): void {
        this.hide();
    }

    public isShowing(): boolean {
        return this._isShowing;
    }

    public checkTrigger(trigger: string): void {
        const allTutorials = ConfigManager.instance.getAllTutorials 
            ? ConfigManager.instance.getAllTutorials()
            : [];
        
        for (const tutorial of allTutorials) {
            if (tutorial.triggerCondition === trigger && 
                !SaveManager.instance.isTutorialComplete(tutorial.id)) {
                this.startTutorial(tutorial.id);
                break;
            }
        }
    }

    public resetTutorial(tutorialId: string): void {
        const save = SaveManager.instance.getSave();
        delete save.tutorialProgress[tutorialId];
        SaveManager.instance.saveGame();
    }

    public resetAllTutorials(): void {
        const save = SaveManager.instance.getSave();
        save.tutorialProgress = {};
        SaveManager.instance.saveGame();
        console.log('[TutorialManager] All tutorials reset');
    }
}
