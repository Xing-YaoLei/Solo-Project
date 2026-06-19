import { _decorator, Component, Node, Label, UITransform, Color, Sprite, Button } from 'cc';
import { EventConfig, ResolutionOption } from '../config/ILevelConfig';

const { ccclass, property } = _decorator;

const TITLE_COLOR = new Color(220, 60, 60, 255);
const DESC_COLOR = new Color(240, 240, 240, 255);
const PARTS_COLOR = new Color(255, 200, 80, 255);
const BUTTON_COLOR = new Color(80, 160, 255, 255);
const BUTTON_HOVER_COLOR = new Color(100, 180, 255, 255);

@ccclass('EventPopupUI')
export class EventPopupUI extends Component {

    @property({ type: Label })
    titleLabel: Label | null = null;

    @property({ type: Label })
    descLabel: Label | null = null;

    @property({ type: Label })
    partsLabel: Label | null = null;

    @property({ type: Node })
    resolutionContainer: Node | null = null;

    private _config: EventConfig | null = null;

    setup(config: EventConfig): void {
        this._config = config;

        this._ensureLabels();

        if (this.titleLabel) {
            this.titleLabel.string = this._formatTitle(config.type);
            this.titleLabel.color = TITLE_COLOR;
        }

        if (this.descLabel) {
            this.descLabel.string = this._formatDescription(config);
            this.descLabel.color = DESC_COLOR;
        }

        if (this.partsLabel) {
            this.partsLabel.string = config.partsAffected.length > 0
                ? '受影响配件: ' + config.partsAffected.join(', ')
                : '';
            this.partsLabel.color = PARTS_COLOR;
        }
    }

    addResolutionButton(option: ResolutionOption, callback: (id: string) => void): void {
        const container = this.resolutionContainer;
        if (!container) return;

        const btnNode = new Node(`Resolution_${option.id}`);
        container.addChild(btnNode);

        const uiTransform = btnNode.addComponent(UITransform);
        uiTransform.setContentSize(260, 50);

        const sprite = btnNode.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.color = BUTTON_COLOR;

        const labelNode = new Node('Label');
        btnNode.addChild(labelNode);

        const labelUiTransform = labelNode.addComponent(UITransform);
        labelUiTransform.setContentSize(240, 40);

        const label = labelNode.addComponent(Label);
        label.string = `${option.description} (费用: ${option.cost}, 时间: ${option.timePenalty}s)`;
        label.fontSize = 18;
        label.color = Color.WHITE;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.CLAMP;

        const button = btnNode.addComponent(Button);
        button.transition = Button.Transition.COLOR;
        button.normalColor = BUTTON_COLOR;
        button.hoverColor = BUTTON_HOVER_COLOR;
        button.pressedColor = new Color(60, 120, 200, 255);
        button.disabledColor = new Color(120, 120, 120, 255);

        btnNode.on(Node.EventType.TOUCH_END, () => {
            callback(option.id);
        }, this);
    }

    private _ensureLabels(): void {
        if (!this.titleLabel) {
            const titleNode = new Node('TitleLabel');
            this.node.addChild(titleNode);
            const titleUiTransform = titleNode.addComponent(UITransform);
            titleUiTransform.setContentSize(400, 40);
            this.titleLabel = titleNode.addComponent(Label);
            this.titleLabel.fontSize = 28;
            this.titleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
            this.titleLabel.verticalAlign = Label.VerticalAlign.CENTER;
        }

        if (!this.descLabel) {
            const descNode = new Node('DescLabel');
            this.node.addChild(descNode);
            const descUiTransform = descNode.addComponent(UITransform);
            descUiTransform.setContentSize(400, 60);
            descNode.setPosition(0, -60, 0);
            this.descLabel = descNode.addComponent(Label);
            this.descLabel.fontSize = 20;
            this.descLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
            this.descLabel.verticalAlign = Label.VerticalAlign.CENTER;
            this.descLabel.overflow = Label.Overflow.RESIZE_HEIGHT;
        }

        if (!this.partsLabel) {
            const partsNode = new Node('PartsLabel');
            this.node.addChild(partsNode);
            const partsUiTransform = partsNode.addComponent(UITransform);
            partsUiTransform.setContentSize(400, 30);
            partsNode.setPosition(0, -110, 0);
            this.partsLabel = partsNode.addComponent(Label);
            this.partsLabel.fontSize = 16;
            this.partsLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
            this.partsLabel.verticalAlign = Label.VerticalAlign.CENTER;
        }

        if (!this.resolutionContainer) {
            const containerNode = new Node('ResolutionContainer');
            this.node.addChild(containerNode);
            containerNode.setPosition(0, -170, 0);
            const containerUiTransform = containerNode.addComponent(UITransform);
            containerUiTransform.setContentSize(400, 200);
            this.resolutionContainer = containerNode;
        }
    }

    private _formatTitle(type: string): string {
        const titleMap: Record<string, string> = {
            parts_shortage: '配件短缺',
            equipment_failure: '设备故障',
            customer_complaint: '客户投诉',
            safety_hazard: '安全隐患',
            quality_issue: '质量问题',
        };
        return '突发事件: ' + (titleMap[type] || type);
    }

    private _formatDescription(config: EventConfig): string {
        return `事件ID: ${config.id} | 影响分值: ${config.impactScore}`;
    }
}
