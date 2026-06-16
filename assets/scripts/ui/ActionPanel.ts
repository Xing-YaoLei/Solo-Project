import { _decorator, Component, Node, Label, UITransform, Color, Sprite, Button } from 'cc';
import { ConfigTypes } from '../types/ConfigTypes';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('ActionOption')
export class ActionOption extends Component {

    @property(Label)
    optionTextLabel: Label | null = null;

    @property(Label)
    riskIndicatorLabel: Label | null = null;

    @property(Sprite)
    backgroundSprite: Sprite | null = null;

    @property(Button)
    optionButton: Button | null = null;

    private config: ConfigTypes.ActionOption | null = null;
    private index: number = 0;
    private isSelected: boolean = false;
    private onSelectCallback: ((option: ConfigTypes.ActionOption, index: number) => void) | null = null;

    public setup(
        config: ConfigTypes.ActionOption,
        index: number,
        onSelect: (option: ConfigTypes.ActionOption, index: number) => void
    ): void {
        this.config = config;
        this.index = index;
        this.onSelectCallback = onSelect;

        if (this.optionTextLabel) {
            this.optionTextLabel.string = `${String.fromCharCode(65 + index)}. ${config.text}`;
        }

        if (this.riskIndicatorLabel) {
            this.riskIndicatorLabel.node.active = false;
        }

        this.setNormalStyle();

        this.node.on(Node.EventType.TOUCH_END, this.onClicked, this);
    }

    private onClicked(): void {
        if (this.isSelected || !this.config || !this.onSelectCallback) return;
        this.onSelectCallback(this.config, this.index);
    }

    public setSelected(): void {
        this.isSelected = true;
        if (this.backgroundSprite) {
            this.backgroundSprite.color = new Color(232, 245, 233);
        }
    }

    public setDisabled(): void {
        if (this.optionButton) {
            this.optionButton.interactable = false;
        }
    }

    public setNormalStyle(): void {
        if (this.backgroundSprite) {
            this.backgroundSprite.color = new Color(255, 255, 255);
        }
    }

    public showResult(showRisk: boolean = true): void {
        if (!this.config) return;

        if (this.config.isCorrect) {
            if (this.backgroundSprite) {
                this.backgroundSprite.color = new Color(232, 245, 233);
            }
            if (this.optionTextLabel) {
                this.optionTextLabel.string += ' ✅';
            }
        } else {
            if (this.backgroundSprite) {
                this.backgroundSprite.color = new Color(255, 235, 238);
            }
            if (this.optionTextLabel) {
                this.optionTextLabel.string += ' ❌';
            }
        }

        if (showRisk && this.config.insuranceRejectionRisk && this.config.insuranceRejectionRisk > 0) {
            if (this.riskIndicatorLabel) {
                const riskPercent = Math.round(this.config.insuranceRejectionRisk * 100);
                this.riskIndicatorLabel.string = `⚠️ 医保拒付风险: ${riskPercent}%`;
                this.riskIndicatorLabel.node.active = true;
                this.riskIndicatorLabel.color = riskPercent > 50
                    ? new Color(198, 40, 40)
                    : new Color(230, 81, 0);
            }
        }
    }

    public getConfig(): ConfigTypes.ActionOption | null {
        return this.config;
    }
}

@ccclass('ActionPanel')
export class ActionPanel extends Component {

    @property(Node)
    optionsContainer: Node | null = null;

    @property(Label)
    hintLabel: Label | null = null;

    @property(Node)
    feedbackSection: Node | null = null;

    @property(Label)
    feedbackExplanationLabel: Label | null = null;

    @property(Label)
    feedbackScoreLabel: Label | null = null;

    @property(Label)
    feedbackErrorLabel: Label | null = null;

    @property(Node)
    proceedButton: Node | null = null;

    private optionComponents: ActionOption[] = [];
    private lastSelectedOption: ConfigTypes.ActionOption | null = null;

    start(): void {
        GameManager.instance.eventTarget.on('action_selected', this.onActionSelected, this);
        this.proceedButton?.on(Node.EventType.TOUCH_END, this.onProceedClicked, this);
    }

    onDestroy(): void {
        GameManager.instance.eventTarget.off('action_selected', this.onActionSelected, this);
        this.proceedButton?.off(Node.EventType.TOUCH_END, this.onProceedClicked, this);
    }

    public refresh(): void {
        const options = GameManager.instance.getOptionsForCurrentTask();

        if (this.optionsContainer) {
            this.optionsContainer.removeAllChildren();
        }
        this.optionComponents = [];
        this.lastSelectedOption = null;

        if (this.feedbackSection) {
            this.feedbackSection.active = false;
        }
        if (this.proceedButton) {
            this.proceedButton.active = false;
        }

        if (!this.optionsContainer) return;

        options.forEach((opt, index) => {
            const node = this.createOptionNode();
            const component = node.getComponent(ActionOption) || node.addComponent(ActionOption);
            component.setup(opt, index, this.onOptionSelected.bind(this));
            this.optionsContainer!.addChild(node);
            this.optionComponents.push(component);
        });

        if (this.hintLabel) {
            const task = GameManager.instance.getCurrentTask();
            if (task?.type === 'EVALUATION') {
                this.hintLabel.string = '💡 请根据线索中的评估量表做出专业判断';
            } else if (task?.type === 'BILLING') {
                this.hintLabel.string = '💡 请严格按照医保目录和DRG规则选择方案，注意合规风险';
            } else {
                this.hintLabel.string = '💡 请结合线索资料，做出最专业的判断';
            }
        }
    }

    private createOptionNode(): Node {
        const node = new Node('ActionOption');
        const ut = node.addComponent(UITransform);
        ut.setContentSize(530, 48);

        const backgroundSprite = node.addComponent(Sprite);
        const optionButton = node.addComponent(Button);
        const actionOption = node.addComponent(ActionOption);

        const optionTextNode = new Node('OptionTextLabel');
        node.addChild(optionTextNode);
        const optionTextUt = optionTextNode.addComponent(UITransform);
        optionTextUt.setContentSize(460, 36);
        optionTextNode.setPosition(-30, 0, 0);
        const optionTextLabel = optionTextNode.addComponent(Label);
        optionTextLabel.string = '';
        optionTextLabel.fontSize = 24;
        optionTextLabel.lineHeight = 28.8;
        optionTextLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        optionTextLabel.verticalAlign = Label.VerticalAlign.CENTER;

        const riskIndicatorNode = new Node('RiskIndicatorLabel');
        node.addChild(riskIndicatorNode);
        const riskIndicatorUt = riskIndicatorNode.addComponent(UITransform);
        riskIndicatorUt.setContentSize(300, 24);
        riskIndicatorNode.setPosition(0, -28, 0);
        const riskIndicatorLabel = riskIndicatorNode.addComponent(Label);
        riskIndicatorLabel.string = '';
        riskIndicatorLabel.fontSize = 12;
        riskIndicatorLabel.lineHeight = 14.4;
        riskIndicatorLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        riskIndicatorLabel.verticalAlign = Label.VerticalAlign.CENTER;
        riskIndicatorLabel.color = new Color(255, 0, 0);

        actionOption.optionTextLabel = optionTextLabel;
        actionOption.riskIndicatorLabel = riskIndicatorLabel;
        actionOption.backgroundSprite = backgroundSprite;
        actionOption.optionButton = optionButton;

        return node;
    }

    private onOptionSelected(option: ConfigTypes.ActionOption, index: number): void {
        if (this.lastSelectedOption) return;
        this.lastSelectedOption = option;

        this.optionComponents.forEach((comp, i) => {
            if (i === index) {
                comp.setSelected();
            }
            comp.setDisabled();
        });

        GameManager.instance.selectAction(option.id);
    }

    private onActionSelected(data: any): void {
        const option: ConfigTypes.ActionOption = data.option;
        const scoreEarned: number = data.score;
        const triggeredInsurance: boolean = data.triggeredInsurance;

        if (this.feedbackSection) {
            this.feedbackSection.active = true;
        }
        if (this.proceedButton) {
            this.proceedButton.active = true;
        }

        this.optionComponents.forEach((comp, i) => {
            if (comp.getConfig()?.id === option.id) {
                comp.showResult(true);
            } else if (comp.getConfig()?.isCorrect) {
                comp.showResult(false);
            }
        });

        if (this.feedbackExplanationLabel) {
            this.feedbackExplanationLabel.string = `📝 ${option.explanation}`;
        }

        if (this.feedbackScoreLabel) {
            if (scoreEarned >= 0) {
                this.feedbackScoreLabel.string = `评分: +${scoreEarned.toFixed(1)}分`;
                this.feedbackScoreLabel.color = new Color(46, 125, 50);
            } else {
                this.feedbackScoreLabel.string = `评分: ${scoreEarned.toFixed(1)}分`;
                this.feedbackScoreLabel.color = new Color(198, 40, 40);
            }
        }

        if (this.feedbackErrorLabel) {
            if (option.errorType) {
                this.feedbackErrorLabel.string = `⚠️ 错因分类: ${this.getErrorTypeDisplay(option.errorType)}`;
                this.feedbackErrorLabel.node.active = true;
            } else if (triggeredInsurance) {
                this.feedbackErrorLabel.string = `🚨 已触发医保稽核风险！本次操作可能被拒付`;
                this.feedbackErrorLabel.node.active = true;
            } else {
                this.feedbackErrorLabel.node.active = false;
            }
        }
    }

    private getErrorTypeDisplay(type: ConfigTypes.ErrorType): string {
        const map: Record<ConfigTypes.ErrorType, string> = {
            'PROCEDURAL': '流程错误',
            'ADMINISTRATIVE': '行政/登记错误',
            'DIAGNOSTIC': '诊断/判断错误',
            'EVALUATION': '评估不规范',
            'DOCUMENTATION': '文档/病历错误',
            'OVERTREATMENT': '过度治疗',
            'TREATMENT': '治疗方案不当',
            'BILLING_FRAUD': '医保违规/欺诈骗保',
            'COMMUNICATION': '沟通不充分',
            'SAFETY': '医疗安全风险',
            'COLLABORATION': '团队协作不足',
            'PLANNING': '计划制定不周'
        };
        return map[type] || type;
    }

    private onProceedClicked(): void {
        GameManager.instance.proceedFromFeedback();
    }
}
