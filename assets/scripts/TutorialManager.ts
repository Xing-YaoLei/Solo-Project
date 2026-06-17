import { _decorator, Component, Node, Label, Button, Sprite, Color, tween, Vec3, UIOpacity } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

export interface TutorialStep {
    id: string;
    title: string;
    content: string;
    targetNode?: string;
    position?: { x: number; y: number };
    highlightType?: 'circle' | 'rect' | 'none';
    showNextButton?: boolean;
    autoAdvance?: boolean;
    delay?: number;
}

const MEDICINE_TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'welcome',
        title: '欢迎来到养老护理评估中心',
        content: '你将扮演一名护理评估员，负责处理老人的入住评估工作。\n\n让我们从用药清单开始，熟悉基本操作。',
        highlightType: 'none',
        showNextButton: true,
    },
    {
        id: 'medicine_intro',
        title: '用药清单',
        content: '这是用药清单，显示每位老人需要服用的药物。\n\n你的任务是：点击【正确】的用药条目，忽略有问题的。',
        highlightType: 'rect',
        showNextButton: true,
    },
    {
        id: 'correct_example',
        title: '正确的用药',
        content: '绿色标记的药物是正确的，包含正确的药名、剂量和服用时间。\n\n点击这类条目来获得分数！',
        highlightType: 'rect',
        showNextButton: true,
    },
    {
        id: 'wrong_example',
        title: '错误的用药',
        content: '红色标记的药物有问题，可能是剂量错误或时间不对。\n\n千万不要点！点错会扣分并中断连击。',
        highlightType: 'rect',
        showNextButton: true,
    },
    {
        id: 'combo_intro',
        title: '连击加分',
        content: '连续答对可以触发连击加分！\n\n连击越高，每次得分越多。保持专注，不要出错！',
        highlightType: 'none',
        showNextButton: true,
    },
    {
        id: 'time_intro',
        title: '时间管理',
        content: '每个关卡都有时间限制，在时间结束前完成尽可能多的正确操作。\n\n剩余时间越多，速度奖励分越高！',
        highlightType: 'rect',
        showNextButton: true,
    },
    {
        id: 'ready',
        title: '准备好了吗？',
        content: '好的，评估工作即将开始！\n\n记住：快、准、稳，你就是最棒的护理员！',
        highlightType: 'none',
        showNextButton: true,
    },
];

@ccclass('TutorialManager')
export class TutorialManager extends Component {
    @property(Node)
    tutorialOverlay: Node | null = null;

    @property(Label)
    titleLabel: Label | null = null;

    @property(Label)
    contentLabel: Label | null = null;

    @property(Button)
    nextButton: Button | null = null;

    @property(Button)
    skipButton: Button | null = null;

    @property(Node)
    highlightNode: Node | null = null;

    @property(Label)
    stepIndicator: Label | null = null;

    private _currentStepIndex: number = 0;
    private _steps: TutorialStep[] = [];
    private _tutorialType: 'medicine' | 'full' = 'medicine';
    private _isRunning: boolean = false;
    private _onCompleteCallback: (() => void) | null = null;

    onLoad() {
        this.setupEventListeners();
        this.hide();
    }

    setupEventListeners(): void {
        if (this.nextButton) {
            this.nextButton.node.on(Button.EventType.CLICK, this.onNext, this);
        }
        if (this.skipButton) {
            this.skipButton.node.on(Button.EventType.CLICK, this.onSkip, this);
        }
    }

    startTutorial(type: 'medicine' | 'full' = 'medicine', onComplete?: () => void): void {
        this._tutorialType = type;
        this._onCompleteCallback = onComplete || null;
        this._currentStepIndex = 0;
        this._isRunning = true;

        if (type === 'medicine') {
            this._steps = [...MEDICINE_TUTORIAL_STEPS];
        } else {
            this._steps = [...MEDICINE_TUTORIAL_STEPS];
        }

        this.show();
        this.showStep(0);
    }

    showStep(index: number): void {
        if (index < 0 || index >= this._steps.length) return;

        this._currentStepIndex = index;
        const step = this._steps[index];

        if (this.titleLabel) {
            this.titleLabel.string = step.title;
        }
        if (this.contentLabel) {
            this.contentLabel.string = step.content;
        }
        if (this.stepIndicator) {
            this.stepIndicator.string = `${index + 1}/${this._steps.length}`;
        }

        if (this.nextButton) {
            this.nextButton.node.active = step.showNextButton !== false;
        }

        this.updateHighlight(step);
        this.playStepAnimation();
    }

    updateHighlight(step: TutorialStep): void {
        if (!this.highlightNode) return;

        if (step.highlightType === 'none' || !step.highlightType) {
            this.highlightNode.active = false;
            return;
        }

        this.highlightNode.active = true;

        const sprite = this.highlightNode.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(255, 255, 255, 50);
        }

        if (step.position) {
            this.highlightNode.setPosition(step.position.x, step.position.y, 0);
        }

        const intensity = GameManager.instance.getAnimationMultiplier();
        this.highlightNode.setScale(0, 0, 1);
        tween(this.highlightNode)
            .to(0.3 * intensity, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
    }

    playStepAnimation(): void {
        if (!this.tutorialOverlay) return;

        const contentNode = this.tutorialOverlay.getChildByName('Content');
        if (contentNode) {
            const intensity = GameManager.instance.getAnimationMultiplier();
            contentNode.setPosition(0, -20, 0);
            contentNode.opacity = 0;
            tween(contentNode)
                .to(0.3 * intensity, { position: new Vec3(0, 0, 0), opacity: 255 })
                .start();
        }
    }

    onNext(): void {
        GameManager.instance.playSound('click');

        if (this._currentStepIndex < this._steps.length - 1) {
            this.showStep(this._currentStepIndex + 1);
        } else {
            this.completeTutorial();
        }
    }

    onSkip(): void {
        GameManager.instance.playSound('click');
        this.completeTutorial();
    }

    completeTutorial(): void {
        this._isRunning = false;
        GameManager.instance.tutorialCompleted = true;
        this.hide();

        if (this._onCompleteCallback) {
            this._onCompleteCallback();
        }
    }

    show(): void {
        if (this.tutorialOverlay) {
            this.tutorialOverlay.active = true;
        }
    }

    hide(): void {
        if (this.tutorialOverlay) {
            this.tutorialOverlay.active = false;
        }
    }

    get isRunning(): boolean {
        return this._isRunning;
    }

    get currentStepId(): string {
        if (this._currentStepIndex >= 0 && this._currentStepIndex < this._steps.length) {
            return this._steps[this._currentStepIndex].id;
        }
        return '';
    }

    static shouldShowTutorial(): boolean {
        return !GameManager.instance.tutorialCompleted;
    }
}
