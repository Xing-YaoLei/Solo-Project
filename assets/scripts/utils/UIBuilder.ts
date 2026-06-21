import { _decorator, Component, Node, Label, Sprite, Button, Color, Vec3, UIOpacity, Layout, Widget, ScrollView, Mask, view, Size } from 'cc';
const { ccclass } = _decorator;

@ccclass('UIBuilder')
export class UIBuilder {
    public static createNode(name: string, parent: Node | null = null): Node {
        const node = new Node(name);
        if (parent) {
            parent.addChild(node);
        }
        return node;
    }

    public static addSprite(node: Node, color: Color = Color.WHITE, sizeMode: Sprite.SizeMode = Sprite.SizeMode.CUSTOM): Sprite {
        const sprite = node.addComponent(Sprite);
        sprite.type = Sprite.Type.SIMPLE;
        sprite.sizeMode = sizeMode;
        sprite.color = color;
        return sprite;
    }

    public static addLabel(node: Node, text: string = '', fontSize: number = 20, color: Color = Color.BLACK): Label {
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.color = color;
        label.lineHeight = fontSize + 4;
        return label;
    }

    public static addButton(node: Node, normalColor: Color = new Color(33, 150, 243), hoverColor?: Color, pressedColor?: Color): Button {
        const button = node.addComponent(Button);
        const sprite = node.getComponent(Sprite);
        if (!sprite) {
            this.addSprite(node, normalColor);
        } else {
            sprite.color = normalColor;
        }

        button.transition = Button.Transition.COLOR;
        button.normalColor = normalColor;
        button.hoverColor = hoverColor || normalColor.clone().multiplyScalar(0.9);
        button.pressedColor = pressedColor || normalColor.clone().multiplyScalar(0.75);
        button.disabledColor = new Color(150, 150, 150, 255);

        return button;
    }

    public static addLayout(node: Node, type: Layout.Type = Layout.Type.VERTICAL, spacingX: number = 0, spacingY: number = 0): Layout {
        const layout = node.addComponent(Layout);
        layout.type = type;
        layout.spacingX = spacingX;
        layout.spacingY = spacingY;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        return layout;
    }

    public static addWidget(node: Node, left?: number, right?: number, top?: number, bottom?: number): Widget {
        const widget = node.addComponent(Widget);
        if (left !== undefined) { widget.isAlignLeft = true; widget.left = left; }
        if (right !== undefined) { widget.isAlignRight = true; widget.right = right; }
        if (top !== undefined) { widget.isAlignTop = true; widget.top = top; }
        if (bottom !== undefined) { widget.isAlignBottom = true; widget.bottom = bottom; }
        return widget;
    }

    public static addMask(node: Node): Mask {
        const mask = node.addComponent(Mask);
        return mask;
    }

    public static addScrollView(node: Node, contentNode: Node): ScrollView {
        const scrollView = node.addComponent(ScrollView);
        scrollView.content = contentNode;
        scrollView.horizontal = false;
        scrollView.vertical = true;
        scrollView.inertia = true;
        scrollView.brake = 0.5;
        scrollView.elastic = true;
        return scrollView;
    }

    public static addUIOpacity(node: Node, opacity: number = 255): UIOpacity {
        const uiOpacity = node.addComponent(UIOpacity);
        uiOpacity.opacity = opacity;
        return uiOpacity;
    }

    public static setSize(node: Node, width: number, height: number): void {
        node.setContentSize(width, height);
    }

    public static setPosition(node: Node, x: number, y: number, z: number = 0): void {
        node.setPosition(x, y, z);
    }

    public static createTextButton(
        parent: Node,
        name: string,
        text: string,
        width: number = 200,
        height: number = 50,
        fontSize: number = 22,
        bgColor: Color = new Color(33, 150, 243),
        textColor: Color = Color.WHITE
    ): { node: Node; button: Button; label: Label } {
        const btnNode = this.createNode(name, parent);
        this.setSize(btnNode, width, height);

        const bg = this.addSprite(btnNode, bgColor);
        bg.type = Sprite.Type.SLICED;

        const button = this.addButton(btnNode, bgColor);

        const labelNode = this.createNode('Label', btnNode);
        const label = this.addLabel(labelNode, text, fontSize, textColor);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;

        return { node: btnNode, button, label };
    }

    public static createPanel(
        parent: Node,
        name: string,
        width: number,
        height: number,
        bgColor: Color = new Color(250, 250, 250, 255),
        borderRadius: boolean = true
    ): Node {
        const panel = this.createNode(name, parent);
        this.setSize(panel, width, height);
        const sprite = this.addSprite(panel, bgColor);
        sprite.type = Sprite.Type.SLICED;
        return panel;
    }

    public static createScrollList(
        parent: Node,
        name: string,
        width: number,
        height: number,
        itemHeight: number = 80,
        itemSpacing: number = 10
    ): { scrollView: ScrollView; content: Node; mask: Mask } {
        const scrollNode = this.createNode(name, parent);
        this.setSize(scrollNode, width, height);

        const mask = this.addMask(scrollNode);

        const contentNode = this.createNode('Content', scrollNode);
        this.setSize(contentNode, width, 0);

        const layout = this.addLayout(contentNode, Layout.Type.VERTICAL, 0, itemSpacing);
        layout.paddingTop = 10;
        layout.paddingBottom = 10;
        layout.paddingLeft = 10;
        layout.paddingRight = 10;

        const scrollView = this.addScrollView(scrollNode, contentNode);

        return { scrollView, content: contentNode, mask };
    }

    public static createListHeader(
        parent: Node,
        title: string,
        width: number,
        height: number = 40,
        bgColor: Color = new Color(33, 150, 243)
    ): Label {
        const header = this.createNode('Header', parent);
        this.setSize(header, width, height);
        this.addSprite(header, bgColor);

        const labelNode = this.createNode('Title', header);
        const label = this.addLabel(labelNode, title, 18, Color.WHITE);
        label.horizontalAlign = Label.HorizontalAlign.LEFT;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        labelNode.setPosition(15, 0, 0);

        return label;
    }

    public static getDesignResolution(): { width: number; height: number } {
        const size = view.getVisibleSize();
        return { width: size.width, height: size.height };
    }
}
