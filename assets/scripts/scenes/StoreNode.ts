import { _decorator, Component, Node, Label, Sprite, Color, Vec3, UITransform, tween, UIOpacity } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { Store } from '../models/Store';
const { ccclass, property } = _decorator;

@ccclass('StoreNode')
export class StoreNode extends Component {
    @property(Label)
    public nameLabel: Label | null = null;

    @property(Label)
    public statusLabel: Label | null = null;

    @property(Sprite)
    public iconSprite: Sprite | null = null;

    @property(Node)
    public highlightNode: Node | null = null;

    @property(Sprite)
    public alertIndicator: Sprite | null = null;

    private _storeData: Store | null = null;
    private _isHighlighted: boolean = false;
    private _hasAlert: boolean = false;

    onLoad() {
        this.node.on('highlight_start', this.startHighlight, this);
        this.node.on('highlight_end', this.endHighlight, this);

        EventManager.getInstance().on(GameEvents.STOCK_CHANGED, this.onStockChanged.bind(this));
        EventManager.getInstance().on(GameEvents.BATCH_SHORTAGE, this.onShortage.bind(this));
    }

    onDestroy() {
        this.node.off('highlight_start', this.startHighlight, this);
        this.node.off('highlight_end', this.endHighlight, this);

        EventManager.getInstance().off(GameEvents.STOCK_CHANGED, this.onStockChanged.bind(this));
        EventManager.getInstance().off(GameEvents.BATCH_SHORTAGE, this.onShortage.bind(this));
    }

    setStoreData(data: Store) {
        this._storeData = data;
        if (this.nameLabel) this.nameLabel.string = data.name;
        if (this.statusLabel) this.statusLabel.string = data.isOpen ? '营业中' : '休息中';
        this.updateStatusColor();
    }

    getStoreId(): string {
        return this._storeData?.id || '';
    }

    getStoreData(): Store | null {
        return this._storeData;
    }

    private updateStatusColor(): void {
        if (!this.statusLabel || !this._storeData) return;
        this.statusLabel.color = this._storeData.isOpen ? new Color(80, 200, 80) : new Color(150, 150, 150);
    }

    private startHighlight(): void {
        if (this._isHighlighted) return;
        this._isHighlighted = true;

        if (this.highlightNode) {
            this.highlightNode.active = true;
            const opacity = this.highlightNode.getComponent(UIOpacity);
            if (opacity) {
                opacity.opacity = 0;
                tween(opacity)
                    .to(0.2, { opacity: 180 })
                    .start();
            }

            tween(this.highlightNode)
                .to(0.5, { scale: new Vec3(1.1, 1.1, 1) })
                .to(0.5, { scale: new Vec3(1, 1, 1) })
                .union()
                .repeatForever()
                .start();
        }
    }

    private endHighlight(): void {
        this._isHighlighted = false;

        if (this.highlightNode) {
            this.highlightNode.active = false;
            tween(this.highlightNode).stop();
            this.highlightNode.setScale(new Vec3(1, 1, 1));
        }
    }

    public showAlert(show: boolean): void {
        this._hasAlert = show;
        if (this.alertIndicator) {
            this.alertIndicator.node.active = show;
            if (show) {
                tween(this.alertIndicator.node)
                    .to(0.3, { scale: new Vec3(1.2, 1.2, 1) })
                    .to(0.3, { scale: new Vec3(1, 1, 1) })
                    .union()
                    .repeatForever()
                    .start();
            } else {
                tween(this.alertIndicator.node).stop();
                this.alertIndicator.node.setScale(new Vec3(1, 1, 1));
            }
        }
    }

    private onStockChanged(data: any): void {
        if (!this._storeData || data.storeId !== this._storeData.id) return;
    }

    private onShortage(data: any): void {
        if (!this._storeData) return;
        this.showAlert(true);
        setTimeout(() => this.showAlert(false), 5000);
    }

    public isHighlighted(): boolean {
        return this._isHighlighted;
    }
}
