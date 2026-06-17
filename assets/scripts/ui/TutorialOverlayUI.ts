import { _decorator, Component, Node, Label, Sprite, Color, Button, Prefab, instantiate, Vec3, UIOpacity, UITransform, Layers, Graphics, Layout, find } from 'cc';
import { game } from '../Game';
import { TutorialManager } from '../tutorial/TutorialManager';
import { EventManager, GameEventType } from '../core/EventManager';
import { ITutorialStep } from '../../configs/TutorialConfig';
import { Logger } from '../core/Logger';
import { findGameScene } from '../scenes/GameScene';
const { ccclass, property } = _decorator;

@ccclass('TutorialOverlayUI')
export class TutorialOverlayUI extends Component {
    @property(Node)
    maskNode: Node | null = null;

    @property(Node)
    dialogNode: Node | null = null;

    @property(Node)
    highlightNode: Node | null = null;

    @property(Node)
    arrowNode: Node | null = null;

    @property(Label)
    titleLabel: Label | null = null;

    @property(Label)
    descriptionLabel: Label | null = null;

    @property(Label)
    exampleLabel: Label | null = null;

    @property(Label)
    ruleNameLabel: Label | null = null;

    @property(Label)
    stepCountLabel: Label | null = null;

    @property(Button)
    prevButton: Button | null = null;

    @property(Button)
    nextButton: Button | null = null;

    @property(Button)
    skipButton: Button | null = null;

    @property(Node)
    rulesBox: Node | null = null;

    private tutorialManager: TutorialManager;
    private eventManager: EventManager;

    onLoad() {
        this.tutorialManager = game.getTutorialManager();
        this.eventManager = EventManager.getInstance();

        this.node.setSiblingIndex(9999);
        this.makeFullscreenMask();
        this.setupButtons();
        this.setupEventListeners();
        this.renderCurrentStep();
    }

    private makeFullscreenMask() {
        if (!this.maskNode) {
            this.maskNode = new Node('Mask');
            this.maskNode.layer = Layers.Enum.UI_2D;
            const ui = this.maskNode.addComponent(UITransform);
            const canvas = find('Canvas');
            const cui = canvas?.getComponent(UITransform);
            if (cui) ui.setContentSize(cui.contentSize);
            else ui.setContentSize(1920, 1080);
            const gfx = this.maskNode.addComponent(Graphics);
            gfx.fillColor = new Color(0, 0, 0, 160);
            gfx.rect(-ui.contentSize.width / 2, -ui.contentSize.height / 2, ui.contentSize.width, ui.contentSize.height);
            gfx.fill();
            const opacity = this.maskNode.addComponent(UIOpacity);
            opacity.opacity = 200;
            this.node.addChild(this.maskNode);
        }

        if (!this.dialogNode) {
            this.dialogNode = this.buildDefaultDialog();
            this.node.addChild(this.dialogNode);
        }
    }

    private buildDefaultDialog(): Node {
        const dialog = new Node('TutorialDialog');
        dialog.layer = Layers.Enum.UI_2D;
        const dUi = dialog.addComponent(UITransform);
        dUi.setContentSize(600, 360);
        const bg = dialog.addComponent(Sprite);
        bg.color = new Color(255, 255, 255);
        bg.type = Sprite.Type.SLICED;
        dialog.setPosition(new Vec3(0, 50, 0));

        const titleNode = new Node('Title');
        titleNode.layer = Layers.Enum.UI_2D;
        const tUi = titleNode.addComponent(UITransform);
        tUi.setContentSize(560, 40);
        tUi.anchorY = 1;
        const tLbl = titleNode.addComponent(Label);
        tLbl.fontSize = 22;
        tLbl.color = new Color(40, 80, 180);
        tLbl.string = '';
        titleNode.setPosition(new Vec3(0, 160, 0));
        dialog.addChild(titleNode);
        this.titleLabel = tLbl;

        const stepNode = new Node('StepCount');
        stepNode.layer = Layers.Enum.UI_2D;
        const sUi = stepNode.addComponent(UITransform);
        sUi.setContentSize(100, 24);
        const sLbl = stepNode.addComponent(Label);
        sLbl.fontSize = 12;
        sLbl.color = new Color(150, 150, 150);
        sLbl.string = '';
        stepNode.setPosition(new Vec3(220, 160, 0));
        dialog.addChild(stepNode);
        this.stepCountLabel = sLbl;

        const descNode = new Node('Description');
        descNode.layer = Layers.Enum.UI_2D;
        const d2Ui = descNode.addComponent(UITransform);
        d2Ui.setContentSize(560, 120);
        d2Ui.anchorY = 1;
        const dLbl = descNode.addComponent(Label);
        dLbl.fontSize = 16;
        dLbl.color = new Color(60, 60, 60);
        dLbl.lineHeight = 24;
        dLbl.string = '';
        dLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        descNode.setPosition(new Vec3(0, 110, 0));
        dialog.addChild(descNode);
        this.descriptionLabel = dLbl;

        const exampleNode = new Node('Example');
        exampleNode.layer = Layers.Enum.UI_2D;
        exampleNode.active = false;
        const eUi = exampleNode.addComponent(UITransform);
        eUi.setContentSize(540, 60);
        eUi.anchorY = 1;
        const eBg = exampleNode.addComponent(Sprite);
        eBg.color = new Color(248, 248, 210);
        eBg.type = Sprite.Type.SLICED;
        const eLbl = exampleNode.addComponent(Label);
        eLbl.fontSize = 13;
        eLbl.color = new Color(120, 100, 40);
        eLbl.lineHeight = 20;
        eLbl.string = '';
        eLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        exampleNode.setPosition(new Vec3(0, -20, 0));
        dialog.addChild(exampleNode);
        this.exampleLabel = eLbl;
        this.rulesBox = exampleNode;

        const ruleNode = new Node('RuleName');
        ruleNode.layer = Layers.Enum.UI_2D;
        ruleNode.active = false;
        const rUi = ruleNode.addComponent(UITransform);
        rUi.setContentSize(540, 26);
        rUi.anchorY = 1;
        const rBg = ruleNode.addComponent(Sprite);
        rBg.color = new Color(220, 240, 255);
        rBg.type = Sprite.Type.SLICED;
        const rLbl = ruleNode.addComponent(Label);
        rLbl.fontSize = 12;
        rLbl.color = new Color(60, 100, 180);
        rLbl.string = '';
        rLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        ruleNode.setPosition(new Vec3(0, -40, 0));
        dialog.addChild(ruleNode);
        this.ruleNameLabel = rLbl;

        const nextBtn = new Node('NextButton');
        nextBtn.layer = Layers.Enum.UI_2D;
        const nUi = nextBtn.addComponent(UITransform);
        nUi.setContentSize(140, 44);
        const nBg = nextBtn.addComponent(Sprite);
        nBg.color = new Color(60, 140, 230);
        nBg.type = Sprite.Type.SLICED;
        const nBtn = nextBtn.addComponent(Button);
        nBtn.transition = Button.Transition.COLOR;
        nBtn.normalColor = nBg.color;
        nBtn.hoverColor = new Color(90, 170, 255);
        nBtn.pressedColor = new Color(40, 120, 210);
        const nLbl = nextBtn.addComponent(Label);
        nLbl.string = '下一步 ▶';
        nLbl.fontSize = 16;
        nLbl.color = new Color(255, 255, 255);
        nextBtn.setPosition(new Vec3(200, -140, 0));
        dialog.addChild(nextBtn);
        this.nextButton = nBtn;

        const prevBtn = new Node('PrevButton');
        prevBtn.layer = Layers.Enum.UI_2D;
        const pUi = prevBtn.addComponent(UITransform);
        pUi.setContentSize(140, 44);
        const pBg = prevBtn.addComponent(Sprite);
        pBg.color = new Color(230, 230, 230);
        pBg.type = Sprite.Type.SLICED;
        const pBtn = prevBtn.addComponent(Button);
        pBtn.transition = Button.Transition.COLOR;
        pBtn.normalColor = pBg.color;
        pBtn.hoverColor = new Color(245, 245, 245);
        pBtn.pressedColor = new Color(210, 210, 210);
        const pLbl = prevBtn.addComponent(Label);
        pLbl.string = '◀ 上一步';
        pLbl.fontSize = 16;
        pLbl.color = new Color(80, 80, 80);
        prevBtn.setPosition(new Vec3(-200, -140, 0));
        dialog.addChild(prevBtn);
        this.prevButton = pBtn;

        const skipBtn = new Node('SkipButton');
        skipBtn.layer = Layers.Enum.UI_2D;
        const skUi = skipBtn.addComponent(UITransform);
        skUi.setContentSize(80, 28);
        const skBtn = skipBtn.addComponent(Button);
        skBtn.transition = Button.Transition.COLOR;
        skBtn.normalColor = new Color(0, 0, 0, 0);
        const skLbl = skipBtn.addComponent(Label);
        skLbl.string = '跳过教程';
        skLbl.fontSize = 12;
        skLbl.color = new Color(180, 180, 180);
        skipBtn.setPosition(new Vec3(220, 160, 0));
        dialog.addChild(skipBtn);
        this.skipButton = skBtn;

        return dialog;
    }

    private setupButtons() {
        if (this.nextButton) {
            this.nextButton.node.on(Button.EventType.CLICK, () => {
                Logger.info('[教程] 下一步');
                this.tutorialManager.nextStep();
                if (this.tutorialManager.getState() === 'completed') {
                    this.finishTutorial();
                } else {
                    this.renderCurrentStep();
                }
            }, this);
        }
        if (this.prevButton) {
            this.prevButton.node.on(Button.EventType.CLICK, () => {
                this.tutorialManager.previousStep();
                this.renderCurrentStep();
            }, this);
        }
        if (this.skipButton) {
            this.skipButton.node.on(Button.EventType.CLICK, () => {
                Logger.info('[教程] 跳过');
                const step = this.tutorialManager.getCurrentStep();
                if (step && step.canSkip) {
                    this.tutorialManager.skipTutorial();
                    this.finishTutorial();
                } else {
                    const scene = findGameScene();
                    if (scene) scene.showNotification('⚠️ 不可跳过', '当前步骤必须阅读完成', 'warning');
                }
            }, this);
        }
    }

    private setupEventListeners() {
        this.eventManager.on(GameEventType.TUTORIAL_STEP, () => this.renderCurrentStep());
        this.eventManager.on(GameEventType.TUTORIAL_COMPLETE, () => this.finishTutorial());
    }

    private renderCurrentStep() {
        const step = this.tutorialManager.getCurrentStep();
        if (!step) {
            this.finishTutorial();
            return;
        }

        Logger.info(`[教程] 步骤 ${this.tutorialManager.getCurrentStepIndex() + 1}/${this.tutorialManager.getStepCount()}: ${step.title}`);

        if (this.titleLabel) this.titleLabel.string = step.title;
        if (this.descriptionLabel) this.descriptionLabel.string = step.description;

        if (this.stepCountLabel) {
            this.stepCountLabel.string = `${this.tutorialManager.getCurrentStepIndex() + 1} / ${this.tutorialManager.getStepCount()}`;
        }

        if (this.exampleLabel && this.rulesBox) {
            if (step.showExample && step.exampleContent) {
                this.rulesBox.active = true;
                this.exampleLabel.string = `💡 示例：${step.exampleContent}`;
            } else {
                this.rulesBox.active = false;
            }
        }

        if (this.ruleNameLabel) {
            if (step.ruleToExplain) {
                this.ruleNameLabel.node.active = true;
                const rule = game.getDispatchRuleManager().getRule(step.ruleToExplain);
                this.ruleNameLabel.string = rule 
                    ? `📌 相关规则：${rule.name} - ${rule.description}`
                    : `📌 规则：${step.ruleToExplain}`;
            } else {
                this.ruleNameLabel.node.active = false;
            }
        }

        if (this.nextButton) {
            const nLbl = this.nextButton.node.getComponent(Label) || this.nextButton.node.getComponentInChildren(Label);
            if (nLbl) {
                const isLast = this.tutorialManager.getCurrentStepIndex() >= this.tutorialManager.getStepCount() - 1;
                nLbl.string = isLast ? '✅ 完成' : (step.nextButtonText || '下一步 ▶');
            }
        }

        if (this.prevButton) {
            this.prevButton.interactable = this.tutorialManager.getCurrentStepIndex() > 0;
        }

        this.updateArrow(step);
        this.updateHighlight(step);
    }

    private updateArrow(step: ITutorialStep) {
        if (!this.arrowNode || !this.dialogNode) return;
        this.arrowNode.active = !!step.arrow;
        if (!step.arrow) return;

        const arrowLbl = this.arrowNode.getComponent(Label) || this.arrowNode.getComponentInChildren(Label) || this.arrowNode.addComponent(Label);
        arrowLbl.fontSize = 40;
        const arrows: Record<string, string> = { up: '⬆️', down: '⬇️', left: '⬅️', right: '➡️' };
        arrowLbl.string = arrows[step.arrow] || '';

        const positions: Record<string, Vec3> = {
            up: new Vec3(0, 260, 0),
            down: new Vec3(0, -260, 0),
            left: new Vec3(-380, 0, 0),
            right: new Vec3(380, 0, 0)
        };
        this.arrowNode.setPosition(positions[step.arrow] || Vec3.ZERO);
    }

    private updateHighlight(step: ITutorialStep) {
        if (!this.highlightNode) return;
        this.highlightNode.active = !!step.highlightElement;
        if (!step.highlightElement) return;

        const scene = findGameScene();
        if (!scene) return;
        const refs = scene.getRefs();

        const positions: Record<string, Vec3> = {
            'order-list': new Vec3(-560, 0, 0),
            'order-detail': new Vec3(0, 100, 0),
            'worker-panel': new Vec3(560, 0, 0),
            'workload-indicator': new Vec3(600, -50, 0),
            'clue-panel': new Vec3(0, -150, 0),
            'choice-panel': new Vec3(0, 0, 0),
            'timer-display': new Vec3(700, 450, 0),
            'priority-badge': new Vec3(-500, 300, 0),
            'availability-status': new Vec3(600, 50, 0),
            'skill-level': new Vec3(580, -20, 0)
        };

        if (positions[step.highlightElement] && this.dialogNode) {
            this.dialogNode.setPosition(positions[step.highlightElement]);
        }
    }

    private finishTutorial() {
        Logger.info('[教程] 完成');
        const scene = findGameScene();
        if (scene) scene.showNotification('🎉 教程完成', '你可以开始处理工单了！', 'success');
        this.scheduleOnce(() => {
            if (this.node.isValid) this.node.destroy();
        }, 0.5);
    }

    onDestroy() {
        this.eventManager.removeAllListeners();
    }
}
