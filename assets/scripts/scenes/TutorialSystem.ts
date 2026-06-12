import { _decorator, Component, Node, Label, Button, Sprite, Color, Vec3, UITransform, tween, UIOpacity, Mask, find } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { TimeManager } from '../core/TimeManager';
import { GameManager } from '../core/GameManager';
import { TutorialConfig, TutorialStep } from '../models/Tutorial';
const { ccclass, property } = _decorator;

@ccclass('TutorialSystem')
export class TutorialSystem extends Component {
    @property(Node)
    public overlay: Node | null = null;

    @property(Node)
    public highlightMask: Node | null = null;

    @property(Node)
    public dialogBox: Node | null = null;

    @property(Label)
    public titleLabel: Label | null = null;

    @property(Label)
    public contentLabel: Label | null = null;

    @property(Button)
    public prevBtn: Button | null = null;

    @property(Button)
    public nextBtn: Button | null = null;

    @property(Button)
    public skipBtn: Button | null = null;

    @property(Node)
    public arrowNode: Node | null = null;

    @property
    public maskPadding: number = 10;

    private _currentTutorial: TutorialConfig | null = null;
    private _currentStepIndex: number = 0;
    private _completedTutorials: Set<string> = new Set();
    private _isShowing: boolean = false;
    private _waitingAction: string | null = null;

    onLoad() {
        EventManager.getInstance().on(GameEvents.GAME_START, this.onGameStart.bind(this));
        EventManager.getInstance().on(GameEvents.DAY_PASSED, this.onDayPassed.bind(this));
        EventManager.getInstance().on(GameEvents.RANDOM_EVENT_TRIGGERED, this.onRandomEvent.bind(this));
        EventManager.getInstance().on(GameEvents.SUPPLIER_HOVER, this.onSupplierHover.bind(this));
        EventManager.getInstance().on(GameEvents.SUPPLIER_DRAG_START, this.onSupplierDrag.bind(this));

        if (this.nextBtn) {
            this.nextBtn.node.on(Button.EventType.CLICK, this.onNext, this);
        }
        if (this.prevBtn) {
            this.prevBtn.node.on(Button.EventType.CLICK, this.onPrev, this);
        }
        if (this.skipBtn) {
            this.skipBtn.node.on(Button.EventType.CLICK, this.onSkip, this);
        }

        this.hide();
    }

    onDestroy() {
        EventManager.getInstance().off(GameEvents.GAME_START, this.onGameStart.bind(this));
        EventManager.getInstance().off(GameEvents.DAY_PASSED, this.onDayPassed.bind(this));
        EventManager.getInstance().off(GameEvents.RANDOM_EVENT_TRIGGERED, this.onRandomEvent.bind(this));
        EventManager.getInstance().off(GameEvents.SUPPLIER_HOVER, this.onSupplierHover.bind(this));
        EventManager.getInstance().off(GameEvents.SUPPLIER_DRAG_START, this.onSupplierDrag.bind(this));

        if (this.nextBtn) {
            this.nextBtn.node.off(Button.EventType.CLICK, this.onNext, this);
        }
        if (this.prevBtn) {
            this.prevBtn.node.off(Button.EventType.CLICK, this.onPrev, this);
        }
        if (this.skipBtn) {
            this.skipBtn.node.off(Button.EventType.CLICK, this.onSkip, this);
        }
    }

    private onGameStart(): void {
        this.tryStartTutorial('first_game_start');
    }

    private onDayPassed(day: number): void {
        if (day === 5) {
            this.tryStartTutorial('day_5_reached');
        }
    }

    private onRandomEvent(): void {
        this.tryStartTutorial('first_random_event');
    }

    private onSupplierHover(): void {
        if (this._waitingAction === 'supplier_hover') {
            this._waitingAction = null;
            setTimeout(() => this.nextStep(), 500);
        }
    }

    private onSupplierDrag(): void {
        if (this._waitingAction === 'supplier_drag') {
            this._waitingAction = null;
        }
    }

    private tryStartTutorial(triggerCondition: string): void {
        const tutorials = ConfigManager.getInstance().getListConfig<TutorialConfig>(ConfigKeys.TUTORIALS);
        const tutorial = tutorials.find(t => t.triggerCondition === triggerCondition);

        if (!tutorial) return;
        if (this._completedTutorials.has(tutorial.id)) return;

        this.startTutorial(tutorial);
    }

    public startTutorial(tutorial: TutorialConfig): void {
        this._currentTutorial = tutorial;
        this._currentStepIndex = 0;
        this.show();
        this.showStep();
    }

    private showStep(): void {
        if (!this._currentTutorial) return;

        const step = this._currentTutorial.steps[this._currentStepIndex];
        if (!step) {
            this.completeTutorial();
            return;
        }

        if (this.titleLabel) this.titleLabel.string = step.title;
        if (this.contentLabel) this.contentLabel.string = step.content;

        if (this.prevBtn) {
            this.prevBtn.node.active = this._currentStepIndex > 0;
        }

        if (this.nextBtn) {
            const nextLabel = this.nextBtn.node.getComponentInChildren(Label);
            if (nextLabel) {
                nextLabel.string = this._currentStepIndex === this._currentTutorial.steps.length - 1 ? '完成' : '下一步';
            }
        }

        this.applyHighlight(step);
        this.positionDialog(step);

        if (step.requireAction) {
            this._waitingAction = step.requireAction;
            if (this.nextBtn) this.nextBtn.node.active = false;
        } else {
            if (this.nextBtn) this.nextBtn.node.active = true;
        }

        if (step.autoNext && step.nextDelay) {
            setTimeout(() => {
                if (this._isShowing && this._currentTutorial?.steps[this._currentStepIndex] === step) {
                    this.nextStep();
                }
            }, step.nextDelay * 1000);
        }

        EventManager.getInstance().emit(GameEvents.TUTORIAL_STEP, {
            tutorialId: this._currentTutorial.id,
            stepIndex: this._currentStepIndex,
            step
        });
    }

    private applyHighlight(step: TutorialStep): void {
        if (!this.highlightMask) return;

        if (step.highlightType === 'none' || !step.targetNodePath) {
            this.highlightMask.active = false;
            return;
        }

        const targetNode = find(step.targetNodePath);
        if (!targetNode) {
            this.highlightMask.active = false;
            return;
        }

        this.highlightMask.active = true;

        const targetUiTransform = targetNode.getComponent(UITransform);
        const maskUiTransform = this.highlightMask.getComponent(UITransform);

        if (targetUiTransform && maskUiTransform) {
            const worldPos = new Vec3();
            targetUiTransform.convertToWorldSpaceAR(new Vec3(0, 0, 0), worldPos);

            const localPos = new Vec3();
            this.highlightMask.parent?.getComponent(UITransform)?.convertToNodeSpaceAR(worldPos, localPos);

            this.highlightMask.setPosition(localPos);

            const size = targetUiTransform.contentSize;
            maskUiTransform.setContentSize(
                size.width + this.maskPadding * 2,
                size.height + this.maskPadding * 2
            );

            tween(this.highlightMask)
                .to(0.3, { scale: new Vec3(1, 1, 1) })
                .start();
        }
    }

    private positionDialog(step: TutorialStep): void {
        if (!this.dialogBox) return;

        let pos = new Vec3(0, -200, 0);

        if (step.position) {
            pos = new Vec3(step.position.x, step.position.y, 0);
        } else if (step.targetNodePath) {
            const targetNode = find(step.targetNodePath);
            if (targetNode) {
                const targetUiTransform = targetNode.getComponent(UITransform);
                if (targetUiTransform) {
                    const worldPos = new Vec3();
                    targetUiTransform.convertToWorldSpaceAR(new Vec3(0, 0, 0), worldPos);

                    const localPos = new Vec3();
                    this.dialogBox.parent?.getComponent(UITransform)?.convertToNodeSpaceAR(worldPos, localPos);

                    const size = targetUiTransform.contentSize;
                    pos = new Vec3(localPos.x, localPos.y - size.height / 2 - 100, 0);
                }
            }
        }

        this.dialogBox.setPosition(pos);
    }

    public nextStep(): void {
        if (!this._currentTutorial) return;

        this._currentStepIndex++;
        if (this._currentStepIndex >= this._currentTutorial.steps.length) {
            this.completeTutorial();
        } else {
            this.showStep();
        }
    }

    public prevStep(): void {
        if (this._currentStepIndex > 0) {
            this._currentStepIndex--;
            this.showStep();
        }
    }

    private completeTutorial(): void {
        if (this._currentTutorial) {
            this._completedTutorials.add(this._currentTutorial.id);
            EventManager.getInstance().emit(GameEvents.TUTORIAL_COMPLETED, this._currentTutorial.id);
        }
        this.hide();
    }

    private onNext(): void {
        this.nextStep();
    }

    private onPrev(): void {
        this.prevStep();
    }

    private onSkip(): void {
        this.completeTutorial();
    }

    public show(): void {
        this._isShowing = true;
        this.node.active = true;

        if (this.overlay) {
            this.overlay.active = true;
            const opacity = this.overlay.getComponent(UIOpacity);
            if (opacity) {
                opacity.opacity = 0;
                tween(opacity).to(0.3, { opacity: 150 }).start();
            }
        }

        if (this.dialogBox) {
            this.dialogBox.active = true;
            this.dialogBox.setScale(new Vec3(0.8, 0.8, 1));
            tween(this.dialogBox)
                .to(0.25, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                .start();
        }
    }

    public hide(): void {
        this._isShowing = false;
        this._waitingAction = null;
        this._currentTutorial = null;
        this.node.active = false;

        if (this.overlay) this.overlay.active = false;
        if (this.highlightMask) this.highlightMask.active = false;
        if (this.dialogBox) this.dialogBox.active = false;
    }

    public isTutorialShowing(): boolean {
        return this._isShowing;
    }

    public isTutorialCompleted(tutorialId: string): boolean {
        return this._completedTutorials.has(tutorialId);
    }
}
