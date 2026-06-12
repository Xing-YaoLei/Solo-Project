import { _decorator, Component, Node, Label, Color, UITransform, Vec3, tween, UIOpacity } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
const { ccclass, property } = _decorator;

export interface ToastData {
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
}

@ccclass('ToastManager')
export class ToastManager extends Component {
    @property(Node)
    public container: Node | null = null;

    @property(Node)
    public toastTemplate: Node | null = null;

    @property
    public toastGap: number = 10;

    @property
    defaulDuration: number = 2;

    private _activeToasts: Node[] = [];

    onLoad() {
        EventManager.getInstance().on(GameEvents.SHOW_TOAST, this.showToast.bind(this));
    }

    onDestroy() {
        EventManager.getInstance().off(GameEvents.SHOW_TOAST, this.showToast.bind(this));
    }

    public showToast(data: ToastData): void {
        if (!this.container || !this.toastTemplate) return;

        const toastNode = this.toastTemplate.clone();
        toastNode.active = true;
        toastNode.setParent(this.container);

        const label = toastNode.getComponentInChildren(Label);
        if (label) {
            label.string = data.message;
        }

        const bg = toastNode.getComponent('cc.Sprite') || toastNode.getChildByName('Background')?.getComponent('cc.Sprite');
        if (bg) {
            const colorMap: Record<string, Color> = {
                'info': new Color(80, 120, 200, 220),
                'success': new Color(80, 180, 80, 220),
                'warning': new Color(240, 180, 60, 220),
                'error': new Color(220, 80, 80, 220)
            };
            (bg as any).color = colorMap[data.type || 'info'] || colorMap.info;
        }

        this.layoutToasts();

        const opacity = toastNode.getComponent(UIOpacity);
        if (opacity) {
            opacity.opacity = 0;
            tween(opacity)
                .to(0.2, { opacity: 255 })
                .delay((data.duration || this.defaulDuration) - 0.4)
                .to(0.2, { opacity: 0 })
                .call(() => {
                    const index = this._activeToasts.indexOf(toastNode);
                    if (index !== -1) {
                        this._activeToasts.splice(index, 1);
                    }
                    toastNode.destroy();
                    this.layoutToasts();
                })
                .start();
        }

        this._activeToasts.push(toastNode);
    }

    private layoutToasts(): void {
        let yOffset = 0;
        const toastHeight = 50;

        for (let i = this._activeToasts.length - 1; i >= 0; i--) {
            const toast = this._activeToasts[i];
            tween(toast)
                .to(0.2, { position: new Vec3(0, yOffset, 0) })
                .start();
            yOffset += toastHeight + this.toastGap;
        }
    }
}
