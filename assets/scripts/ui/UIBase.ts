import { _decorator, Component, Node, Label, Button, Sprite, UITransform, Vec3, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UIBase')
export class UIBase extends Component {

    @property(Node)
    contentNode: Node | null = null;

    @property(Button)
    closeButton: Button | null = null;

    protected _isShowing: boolean = false;

    onLoad() {
        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, this.onCloseClick, this);
        }
    }

    public show(animate: boolean = true): void {
        if (this._isShowing) return;
        
        this._isShowing = true;
        this.node.active = true;
        
        if (animate && this.contentNode) {
            this.contentNode.setScale(0.8, 0.8, 0.8);
            tween(this.contentNode)
                .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                .start();
        }

        this.onShow();
    }

    public hide(animate: boolean = true): void {
        if (!this._isShowing) return;

        this.onHide();

        if (animate && this.contentNode) {
            tween(this.contentNode)
                .to(0.2, { scale: new Vec3(0.8, 0.8, 0.8) }, { easing: 'backIn' })
                .call(() => {
                    this._isShowing = false;
                    this.node.active = false;
                })
                .start();
        } else {
            this._isShowing = false;
            this.node.active = false;
        }
    }

    public isShowing(): boolean {
        return this._isShowing;
    }

    protected onShow(): void {
    }

    protected onHide(): void {
    }

    protected onCloseClick(): void {
        this.hide();
    }

    protected setLabelText(label: Label | null, text: string): void {
        if (label) {
            label.string = text;
        }
    }

    protected setButtonEnabled(button: Button | null, enabled: boolean): void {
        if (button) {
            button.interactable = enabled;
        }
    }
}
