import { _decorator, Node, Label, Button, Sprite, Color, UITransform, Vec3, ScrollView, Layout, SpriteFrame, UIOpacity, ProgressBar, Toggle, Slider } from 'cc';
import { ResourceGenerator, ResourceType } from './ResourceGenerator';
import { NodeUtil } from './utils/NodeUtil';
const { ccclass } = _decorator;

@ccclass('UIBuilder')
export class UIBuilder {
    private static ensureTransform(node: Node, width: number, height: number): UITransform {
        let t = node.getComponent(UITransform);
        if (!t) t = node.addComponent(UITransform);
        t.setContentSize(width, height);
        return t;
    }

    static createButton(text: string, width: number = 180, height: number = 56, onClick?: () => void, variant: 'primary' | 'secondary' | 'danger' = 'primary'): Node {
        const btnNode = new Node('Button');
        UIBuilder.ensureTransform(btnNode, width, height);

        const sprite = btnNode.addComponent(Sprite);
        let resourceType: ResourceType = 'button_primary';
        if (variant === 'secondary') resourceType = 'button_secondary';
        if (variant === 'danger') resourceType = 'button_danger';
        sprite.spriteFrame = ResourceGenerator.getSpriteFrame(resourceType);
        sprite.type = Sprite.Type.SLICED;

        const labelNode = new Node('Label');
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 22;
        label.lineHeight = 22;
        label.color = variant === 'secondary' ? new Color(60, 60, 60, 255) : Color.WHITE;
        labelNode.setPosition(0, 0, 0);
        btnNode.addChild(labelNode);

        const button = btnNode.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.92;

        if (onClick) {
            button.node.on(Button.EventType.CLICK, onClick);
        }

        return btnNode;
    }

    static createLabel(text: string, fontSize: number = 24, color: Color = new Color(50, 50, 50, 255), align: number = 1): Node {
        const node = new Node('Label');
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 4;
        label.color = color;
        label.horizontalAlign = align;
        label.verticalAlign = 1;
        label.overflow = Label.Overflow.NONE;

        const uiTransform = node.addComponent(UITransform);
        const width = Math.max(100, text.length * fontSize * 0.6);
        uiTransform.setContentSize(width, fontSize + 8);

        return node;
    }

    static createCard(width: number = 620, height: number = 96, type: 'normal' | 'correct' | 'wrong' | 'processed' = 'normal'): Node {
        const node = new Node('Card');
        UIBuilder.ensureTransform(node, width, height);

        const sprite = node.addComponent(Sprite);
        let resourceType: ResourceType = 'card_bg';
        if (type === 'correct') resourceType = 'card_correct';
        if (type === 'wrong') resourceType = 'card_wrong';
        if (type === 'processed') resourceType = 'card_processed';
        sprite.spriteFrame = ResourceGenerator.getSpriteFrame(resourceType);
        sprite.type = Sprite.Type.SLICED;

        node.addComponent(Button);

        return node;
    }

    static createPanel(width: number = 680, height: number = 900): Node {
        const node = new Node('Panel');
        UIBuilder.ensureTransform(node, width, height);

        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = ResourceGenerator.getSpriteFrame('panel_bg');
        sprite.type = Sprite.Type.SLICED;

        const opacity = node.addComponent(UIOpacity);
        opacity.opacity = 255;

        return node;
    }

    static createIcon(type: ResourceType, size: number = 40): Node {
        const node = new Node('Icon');
        UIBuilder.ensureTransform(node, size, size);

        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = ResourceGenerator.getSpriteFrame(type);

        return node;
    }

    static createTab(text: string, active: boolean = false, onClick?: () => void): Node {
        const node = new Node('Tab');
        UIBuilder.ensureTransform(node, 140, 48);

        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = ResourceGenerator.getSpriteFrame(active ? 'tab_active' : 'tab_inactive');
        sprite.type = Sprite.Type.SLICED;

        const labelNode = new Node('Label');
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 18;
        label.color = active ? Color.WHITE : new Color(100, 100, 100, 255);
        labelNode.setPosition(0, 0, 0);
        node.addChild(labelNode);

        const button = node.addComponent(Button);
        button.transition = Button.Transition.NONE;
        if (onClick) {
            button.node.on(Button.EventType.CLICK, onClick);
        }

        return node;
    }

    static createStar(filled: boolean, size: number = 48): Node {
        const node = new Node('Star');
        UIBuilder.ensureTransform(node, size, size);

        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = ResourceGenerator.getSpriteFrame(filled ? 'icon_star' : 'icon_star_empty');

        return node;
    }

    static createProgressBar(width: number = 400, height: number = 18): Node {
        const bgNode = new Node('ProgressBar');
        UIBuilder.ensureTransform(bgNode, width, height);

        const bgSprite = bgNode.addComponent(Sprite);
        bgSprite.spriteFrame = ResourceGenerator.getSpriteFrame('progress_bar_bg');
        bgSprite.type = Sprite.Type.SLICED;

        const progressBar = bgNode.addComponent(ProgressBar);
        progressBar.barSprite = bgSprite;
        progressBar.mode = ProgressBar.Mode.HORIZONTAL;
        progressBar.totalWidth = width;
        progressBar.progress = 1;

        const barNode = new Node('Bar');
        UIBuilder.ensureTransform(barNode, width, height);
        barNode.setAnchorPoint(0, 0.5);
        barNode.setPosition(-width / 2, 0, 0);
        const barSprite = barNode.addComponent(Sprite);
        barSprite.spriteFrame = ResourceGenerator.getSpriteFrame('progress_bar_green');
        barSprite.type = Sprite.Type.SLICED;
        bgNode.addChild(barNode);

        progressBar.barSprite = barSprite;

        return bgNode;
    }

    static createScrollView(width: number = 650, height: number = 600): Node {
        const scrollNode = new Node('ScrollView');
        UIBuilder.ensureTransform(scrollNode, width, height);

        const scrollView = scrollNode.addComponent(ScrollView);
        scrollView.direction = ScrollView.Direction.VERTICAL;
        scrollView.brake = 0.5;
        scrollView.elastic = true;

        const sprite = scrollNode.addComponent(Sprite);
        sprite.color = new Color(250, 250, 250, 0);

        const viewNode = new Node('View');
        const viewTransform = UIBuilder.ensureTransform(viewNode, width, height);
        scrollNode.addChild(viewNode);
        scrollView.view = viewTransform;

        const contentNode = new Node('Content');
        UIBuilder.ensureTransform(contentNode, width, 0);
        contentNode.setAnchorPoint(0.5, 1);
        contentNode.setPosition(0, height / 2, 0);
        const contentLayout = contentNode.addComponent(Layout);
        contentLayout.type = Layout.Type.VERTICAL;
        contentLayout.resizeMode = Layout.ResizeMode.CONTAINER;
        contentLayout.spacingY = 10;
        contentLayout.paddingTop = 10;
        contentLayout.paddingBottom = 10;
        viewNode.addChild(contentNode);
        scrollView.content = contentNode;

        return scrollNode;
    }

    static createOverlay(): Node {
        const node = new Node('Overlay');
        UIBuilder.ensureTransform(node, 800, 1400);

        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = ResourceGenerator.getSpriteFrame('overlay_bg');

        const opacity = node.addComponent(UIOpacity);
        opacity.opacity = 0;

        return node;
    }

    static createToggle(label: string, checked: boolean = false, onChange?: (checked: boolean) => void): Node {
        const container = new Node('ToggleContainer');
        UIBuilder.ensureTransform(container, 280, 44);

        const layout = container.addComponent(Layout);
        layout.type = Layout.Type.HORIZONTAL;
        layout.spacingX = 12;
        layout.verticalDirection = Layout.VerticalDirection.CENTER;

        const toggleNode = new Node('Toggle');
        UIBuilder.ensureTransform(toggleNode, 40, 40);
        const toggleSprite = toggleNode.addComponent(Sprite);
        toggleSprite.spriteFrame = ResourceGenerator.getSpriteFrame(checked ? 'tab_active' : 'tab_inactive');
        toggleSprite.type = Sprite.Type.SLICED;

        const toggle = toggleNode.addComponent(Toggle);
        toggle.isChecked = checked;
        toggle.checkMark = toggleSprite;

        const markNode = new Node('CheckMark');
        UIBuilder.ensureTransform(markNode, 20, 20);
        const markSprite = markNode.addComponent(Sprite);
        markSprite.spriteFrame = ResourceGenerator.getSpriteFrame('icon_star');
        markNode.active = checked;
        toggleNode.addChild(markNode);
        toggle.checkMark = markSprite;

        if (onChange) {
            toggle.node.on(Toggle.EventType.TOGGLE, (t: Toggle) => {
                markNode.active = t.isChecked;
                onChange(t.isChecked);
            });
        }

        const labelNode = this.createLabel(label, 20, new Color(60, 60, 60, 255));

        container.addChild(toggleNode);
        container.addChild(labelNode);

        return container;
    }

    static createSlider(label: string, value: number = 1, onChange?: (value: number) => void): Node {
        const container = new Node('SliderContainer');
        UIBuilder.ensureTransform(container, 400, 60);

        const labelNode = this.createLabel(label, 20, new Color(60, 60, 60, 255));
        labelNode.setPosition(-160, 10, 0);
        container.addChild(labelNode);

        const valueLabel = this.createLabel(value < 0.33 ? '低' : value < 0.66 ? '中' : '高', 18, new Color(74, 144, 217, 255));
        valueLabel.setPosition(170, 10, 0);
        container.addChild(valueLabel);

        const sliderNode = new Node('Slider');
        UIBuilder.ensureTransform(sliderNode, 360, 20);
        sliderNode.setPosition(0, -15, 0);

        const bgSprite = sliderNode.addComponent(Sprite);
        bgSprite.spriteFrame = ResourceGenerator.getSpriteFrame('progress_bar_bg');
        bgSprite.type = Sprite.Type.SLICED;

        const slider = sliderNode.addComponent(Slider);
        slider.direction = Slider.Direction.HORIZONTAL;
        slider.progress = value;

        const barNode = new Node('Bar');
        UIBuilder.ensureTransform(barNode, 360, 20);
        barNode.setAnchorPoint(0, 0.5);
        barNode.setPosition(-180, 0, 0);
        const barSprite = barNode.addComponent(Sprite);
        barSprite.spriteFrame = ResourceGenerator.getSpriteFrame('progress_bar_green');
        barSprite.type = Sprite.Type.SLICED;
        sliderNode.addChild(barNode);

        const handleNode = new Node('Handle');
        UIBuilder.ensureTransform(handleNode, 28, 28);
        const handleSprite = handleNode.addComponent(Sprite);
        handleSprite.spriteFrame = ResourceGenerator.getSpriteFrame('button_primary');
        handleSprite.type = Sprite.Type.SLICED;
        sliderNode.addChild(handleNode);
        slider.handle = handleSprite;

        slider.node.on('slide', (s: Slider) => {
            const vLabel = valueLabel.getComponent(Label)!;
            vLabel.string = s.progress < 0.33 ? '低' : s.progress < 0.66 ? '中' : '高';
            onChange?.(s.progress);
        });

        container.addChild(sliderNode);

        return container;
    }

    static createTaskCard(
        title: string,
        subtitle: string,
        isCorrect: boolean,
        onClick: () => void
    ): Node {
        const card = this.createCard(600, 88, 'normal');

        const iconType = subtitle.includes('片') || subtitle.includes('粒') || subtitle.includes('ml') || subtitle.includes('后') || subtitle.includes('空腹')
            ? 'icon_medicine'
            : subtitle.includes(':') && subtitle.length <= 6
                ? 'icon_visit'
                : 'icon_activity';

        const icon = this.createIcon(iconType as ResourceType, 40);
        icon.setPosition(-260, 0, 0);
        card.addChild(icon);

        const titleLabel = this.createLabel(title, 20, new Color(40, 40, 40, 255), 0);
        titleLabel.getComponent(UITransform)!.setContentSize(400, 28);
        titleLabel.setAnchorPoint(0, 0.5);
        titleLabel.setPosition(-200, 14, 0);
        card.addChild(titleLabel);

        const subLabel = this.createLabel(subtitle, 16, new Color(120, 120, 120, 255), 0);
        subLabel.getComponent(UITransform)!.setContentSize(400, 22);
        subLabel.setAnchorPoint(0, 0.5);
        subLabel.setPosition(-200, -14, 0);
        card.addChild(subLabel);

        const hintIcon = this.createIcon(isCorrect ? 'icon_star' : 'icon_star_empty', 24);
        hintIcon.setPosition(260, 0, 0);
        const hintOp = hintIcon.getComponent(UIOpacity) || hintIcon.addComponent(UIOpacity);
        NodeUtil.setOpacity(hintOp, 0);
        card.addChild(hintIcon);

        const btn = card.getComponent(Button)!;
        btn.node.off(Button.EventType.CLICK);
        btn.node.on(Button.EventType.CLICK, () => {
            onClick();
        });

        (card as any)._taskData = { isCorrect, title, subtitle };

        return card;
    }
}
