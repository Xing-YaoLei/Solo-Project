import { _decorator, Component, Node, EventTouch, Vec3, UITransform, Sprite, Label, Color, UIOpacity, tween } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { Supplier } from '../models/Supplier';
const { ccclass, property } = _decorator;

@ccclass('SupplierCard')
export class SupplierCard extends Component {
    @property(Node)
    public dragNode: Node | null = null;

    @property(Label)
    public nameLabel: Label | null = null;

    @property(Label)
    public ratingLabel: Label | null = null;

    @property(Label)
    public reliabilityLabel: Label | null = null;

    @property(Sprite)
    public iconSprite: Sprite | null = null;

    @property(Node)
    public categoriesContainer: Node | null = null;

    private _supplierData: Supplier | null = null;
    private _isDragging: boolean = false;
    private _startPos: Vec3 = new Vec3();
    private _originalPos: Vec3 = new Vec3();
    private _originalOpacity: number = 255;

    setSupplierData(data: Supplier) {
        this._supplierData = data;
        this._originalPos = new Vec3(this.node.position);

        if (this.nameLabel) this.nameLabel.string = data.name;
        if (this.ratingLabel) this.ratingLabel.string = this.getRatingText(data.rating);
        if (this.reliabilityLabel) this.reliabilityLabel.string = `可靠性: ${data.reliabilityScore}%`;

        this.updateRatingColor();
    }

    getSupplierData(): Supplier | null {
        return this._supplierData;
    }

    getSupplierId(): string {
        return this._supplierData?.id || '';
    }

    private getRatingText(rating: string): string {
        const map: Record<string, string> = {
            'bronze': '铜牌',
            'silver': '银牌',
            'gold': '金牌',
            'platinum': '铂金'
        };
        return map[rating] || rating;
    }

    private updateRatingColor(): void {
        if (!this.ratingLabel || !this._supplierData) return;

        const colorMap: Record<string, Color> = {
            'bronze': new Color(205, 127, 50),
            'silver': new Color(192, 192, 192),
            'gold': new Color(255, 215, 0),
            'platinum': new Color(229, 228, 226)
        };

        this.ratingLabel.color = colorMap[this._supplierData.rating] || Color.WHITE;
    }

    onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    private onTouchStart(event: EventTouch): void {
        if (!this._supplierData) return;

        this._isDragging = true;
        this._originalPos.set(this.node.position);
        event.getUILocation(this._startPos as any);

        const opacity = this.node.getComponent(UIOpacity);
        if (opacity) {
            this._originalOpacity = opacity.opacity;
            opacity.opacity = 180;
        }

        this.node.setSiblingIndex(999);

        EventManager.getInstance().emit(GameEvents.SUPPLIER_DRAG_START, {
            supplierId: this._supplierData.id,
            node: this.node
        });
    }

    private onTouchMove(event: EventTouch): void {
        if (!this._isDragging) return;

        const currentPos = new Vec3();
        event.getUILocation(currentPos as any);

        const deltaX = currentPos.x - this._startPos.x;
        const deltaY = currentPos.y - this._startPos.y;

        this.node.setPosition(
            this._originalPos.x + deltaX,
            this._originalPos.y + deltaY,
            this._originalPos.z
        );
    }

    private onTouchEnd(event: EventTouch): void {
        if (!this._isDragging || !this._supplierData) return;

        this._isDragging = false;

        const worldPos = new Vec3();
        event.getUILocation(worldPos as any);

        EventManager.getInstance().emit(GameEvents.SUPPLIER_DROPPED, {
            supplierId: this._supplierData.id,
            supplierData: this._supplierData,
            worldPosition: worldPos,
            cardNode: this.node
        });

        EventManager.getInstance().emit(GameEvents.SUPPLIER_DRAG_END, {
            supplierId: this._supplierData.id,
            node: this.node
        });

        this.returnToOriginalPosition();
    }

    private onTouchCancel(event: EventTouch): void {
        if (!this._isDragging) return;

        this._isDragging = false;
        this.returnToOriginalPosition();

        if (this._supplierData) {
            EventManager.getInstance().emit(GameEvents.SUPPLIER_DRAG_END, {
                supplierId: this._supplierData.id,
                node: this.node
            });
        }
    }

    public returnToOriginalPosition(): void {
        const opacity = this.node.getComponent(UIOpacity);
        if (opacity) {
            opacity.opacity = this._originalOpacity;
        }

        tween(this.node)
            .to(0.15, { position: this._originalPos }, { easing: 'quadOut' })
            .start();
    }

    public isDragging(): boolean {
        return this._isDragging;
    }
}
