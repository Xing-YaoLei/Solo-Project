import { _decorator, Component, Node, Label, Color, Sprite, UITransform, Vec3, tween, UIOpacity } from "cc";
import { TutorialStep } from "../models/Config";
import { GameManager } from "../managers/GameManager";

const { ccclass } = _decorator;

const CALENDAR_TUTORIAL: TutorialStep[] = [
    {
        id: "welcome",
        targetElement: "",
        message: "欢迎来到民宿经营模拟！这里你将学习如何管理房态。目标是：让客人满意入住，最大化入住率，妥善处理突发冲突。",
        highlightArea: { x: 0, y: 0, width: 0, height: 0 },
        actionRequired: "tap_anywhere",
        nextStepId: "calendar_intro"
    },
    {
        id: "calendar_intro",
        targetElement: "RoomCalendar",
        message: "这是房源日历，它是你管理的核心。每行代表一间房，每列代表一天。颜色不同代表房态不同。",
        highlightArea: { x: 100, y: 200, width: 800, height: 400 },
        actionRequired: "tap_anywhere",
        nextStepId: "status_colors"
    },
    {
        id: "status_colors",
        targetElement: "RoomCalendar",
        message: "绿色=空房，红色=已住，蓝色=保洁中，紫色=冲突。空房可以接受新订单，保洁完成后自动变为空房。",
        highlightArea: { x: 100, y: 200, width: 800, height: 400 },
        actionRequired: "tap_anywhere",
        nextStepId: "order_intro"
    },
    {
        id: "order_intro",
        targetElement: "OrderPanel",
        message: "这里是渠道订单区。新订单会自动出现，你可以将订单拖拽到日历上的空房格子来确认入住。",
        highlightArea: { x: 700, y: 100, width: 300, height: 500 },
        actionRequired: "tap_anywhere",
        nextStepId: "drag_guide"
    },
    {
        id: "drag_guide",
        targetElement: "OrderPanel",
        message: "试试将订单拖到日历空房上！注意：订单有倒计时，超时会自动过期。VIP客人的订单更需优先处理。",
        highlightArea: { x: 700, y: 100, width: 300, height: 500 },
        actionRequired: "drag_order_to_calendar",
        nextStepId: "task_intro"
    },
    {
        id: "task_intro",
        targetElement: "TaskPanel",
        message: "客人退房后，房间需要保洁才能再次入住。点击任务开始保洁，完成后房间恢复为空房。",
        highlightArea: { x: 0, y: 100, width: 200, height: 500 },
        actionRequired: "tap_anywhere",
        nextStepId: "conflict_intro"
    },
    {
        id: "conflict_intro",
        targetElement: "",
        message: "有时会出现房态冲突（如重复预订），你需要快速做出决策！不同选择有不同的代价和影响。",
        highlightArea: { x: 0, y: 0, width: 0, height: 0 },
        actionRequired: "tap_anywhere",
        nextStepId: "goal_summary"
    },
    {
        id: "goal_summary",
        targetElement: "",
        message: "本次训练目标：将入住率提升到60%以上，尽量避免订单过期和冲突超时。准备好了吗？点击开始！",
        highlightArea: { x: 0, y: 0, width: 0, height: 0 },
        actionRequired: "start_game",
        nextStepId: null
    }
];

@ccclass("TutorialManager")
export class TutorialManager extends Component {
    private steps: TutorialStep[] = [];
    private currentStepIndex: number = 0;
    private isTutorialActive: boolean = false;
    private overlayNode: Node | null = null;
    private messageLabel: Label | null = null;
    private highlightNode: Node | null = null;
    private onTutorialComplete: (() => void) | null = null;
    private onStepChanged: ((step: TutorialStep, index: number) => void) | null = null;

    public init(): void {
        this.steps = [...CALENDAR_TUTORIAL];
        this.currentStepIndex = 0;

        this.createOverlay();
    }

    private createOverlay(): void {
        this.overlayNode = new Node("tutorial_overlay");
        this.overlayNode.addComponent(UITransform).setContentSize(1280, 720);
        const opacity = this.overlayNode.addComponent(UIOpacity);
        opacity.opacity = 180;

        const bgSprite = this.overlayNode.addComponent(Sprite);
        bgSprite.color = new Color(0, 0, 0, 180);

        const messageNode = new Node("message");
        messageNode.addComponent(UITransform).setContentSize(600, 120);
        this.messageLabel = messageNode.addComponent(Label);
        this.messageLabel.fontSize = 18;
        this.messageLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.messageLabel.verticalAlign = Label.VerticalAlign.CENTER;
        this.messageLabel.color = Color.WHITE;
        messageNode.setPosition(0, -250, 0);
        messageNode.parent = this.overlayNode;

        this.highlightNode = new Node("highlight");
        this.highlightNode.addComponent(UITransform).setContentSize(100, 100);
        const highlightSprite = this.highlightNode.addComponent(Sprite);
        highlightSprite.color = new Color(255, 255, 255, 60);
        this.highlightNode.setPosition(0, 0, 0);
        this.highlightNode.parent = this.overlayNode;

        this.overlayNode.active = false;
    }

    public startTutorial(): void {
        this.isTutorialActive = true;
        this.currentStepIndex = 0;

        if (this.overlayNode) {
            this.overlayNode.active = true;
            this.overlayNode.parent = this.node;
        }

        this.showCurrentStep();
    }

    private showCurrentStep(): void {
        if (this.currentStepIndex >= this.steps.length) {
            this.completeTutorial();
            return;
        }

        const step = this.steps[this.currentStepIndex];

        if (this.messageLabel) {
            this.messageLabel.string = step.message;
        }

        if (this.highlightNode) {
            const area = step.highlightArea;
            if (area.width > 0 && area.height > 0) {
                this.highlightNode.active = true;
                const transform = this.highlightNode.getComponent(UITransform);
                if (transform) {
                    transform.setContentSize(area.width, area.height);
                }
                this.highlightNode.setPosition(area.x + area.width / 2 - 640, area.y + area.height / 2 - 360, 0);

                tween(this.highlightNode)
                    .repeat(3,
                        tween(this.highlightNode).to(0.5, { scale: new Vec3(1.02, 1.02, 1) }).to(0.5, { scale: new Vec3(1.0, 1.0, 1) })
                    )
                    .start();
            } else {
                this.highlightNode.active = false;
            }
        }

        if (this.onStepChanged) {
            this.onStepChanged(step, this.currentStepIndex);
        }
    }

    public advanceStep(action: string): boolean {
        if (!this.isTutorialActive) return false;

        const step = this.steps[this.currentStepIndex];
        if (!step) return false;

        if (step.actionRequired === "tap_anywhere" || step.actionRequired === action) {
            this.currentStepIndex++;
            this.showCurrentStep();
            return true;
        }

        return false;
    }

    public skipTutorial(): void {
        this.isTutorialActive = false;
        this.completeTutorial();
    }

    private completeTutorial(): void {
        this.isTutorialActive = false;

        if (this.overlayNode) {
            this.overlayNode.active = false;
        }

        const gm = GameManager.instance;
        if (gm) {
            gm.updateSettings({ tutorialCompleted: true });
        }

        if (this.onTutorialComplete) {
            this.onTutorialComplete();
        }
    }

    public isActive(): boolean {
        return this.isTutorialActive;
    }

    public getCurrentStep(): TutorialStep | null {
        if (this.currentStepIndex < this.steps.length) {
            return this.steps[this.currentStepIndex];
        }
        return null;
    }

    public getCurrentStepIndex(): number {
        return this.currentStepIndex;
    }

    public getTotalSteps(): number {
        return this.steps.length;
    }

    public setOnTutorialComplete(cb: () => void): void {
        this.onTutorialComplete = cb;
    }

    public setOnStepChanged(cb: (step: TutorialStep, index: number) => void): void {
        this.onStepChanged = cb;
    }

    public shouldShowTutorial(): boolean {
        const gm = GameManager.instance;
        if (!gm) return true;
        return !gm.getSettings().tutorialCompleted;
    }
}
