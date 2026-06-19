import { _decorator, Component, Node, Vec3, EventTouch, UITransform } from 'cc';
import { QuoteOption } from '../config/ILevelConfig';

const { ccclass, property } = _decorator;

@ccclass('DraggableQuote')
export class DraggableQuote extends Component {

    @property({ type: String })
    quoteId: string = '';

    @property({ type: Boolean })
    snapBack: boolean = true;

    @property({ type: Number })
    snapThreshold: number = 50;

    private _isDragging: boolean = false;
    private _originalPos: Vec3 = new Vec3();
    private _dropTarget: Node | null = null;
    private _offset: Vec3 = new Vec3();
    private _quoteData: QuoteOption | null = null;

    get isDragging(): boolean {
        return this._isDragging;
    }

    get quoteData(): QuoteOption | null {
        return this._quoteData;
    }

    onLoad(): void {
        this._originalPos.set(this.node.worldPosition);
        this.node.on(Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
    }

    onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
    }

    setQuoteData(quoteOption: QuoteOption): void {
        this._quoteData = quoteOption;
        this.quoteId = quoteOption.id;
    }

    resetPosition(): void {
        this._isDragging = false;
        this._dropTarget = null;
        this.node.setWorldPosition(this._originalPos);
    }

    private _onTouchStart(event: EventTouch): void {
        event.propagationStopped = true;
        this._isDragging = true;
        this._dropTarget = null;

        const touchWorld = this._getTouchWorldPos(event);
        const nodeWorld = this.node.worldPosition;
        Vec3.subtract(this._offset, nodeWorld, touchWorld);
    }

    private _onTouchMove(event: EventTouch): void {
        if (!this._isDragging) return;

        const touchWorld = this._getTouchWorldPos(event);
        const newPos = new Vec3();
        Vec3.add(newPos, touchWorld, this._offset);
        this.node.setWorldPosition(newPos);

        this._detectDropZone(newPos);
    }

    private _onTouchEnd(event: EventTouch): void {
        if (!this._isDragging) return;
        this._isDragging = false;

        if (this._dropTarget) {
            const zone = this._dropTarget.getComponent('QuoteDropZone') as import('./QuoteDropZone').QuoteDropZone;
            if (zone && zone.canAccept(this.quoteId)) {
                this.node.setWorldPosition(this._dropTarget.worldPosition);
                this.node.emit('quote-dropped', { quoteId: this.quoteId, targetZoneId: zone.zoneId });
                return;
            }
        }

        if (this.snapBack) {
            this.node.setWorldPosition(this._originalPos);
        }
    }

    private _getTouchWorldPos(event: EventTouch): Vec3 {
        const uiTransform = this.node.parent?.getComponent(UITransform);
        if (!uiTransform) return new Vec3(event.getUILocation().x, event.getUILocation().y, 0);
        const loc = event.getUILocation();
        return new Vec3(loc.x, loc.y, 0);
    }

    private _detectDropZone(currentPos: Vec3): void {
        const dropZones = this._findAllDropZones();
        let closestZone: Node | null = null;
        let closestDist = this.snapThreshold;

        for (const zone of dropZones) {
            const zonePos = zone.worldPosition;
            const dist = Vec3.distance(currentPos, zonePos);
            if (dist < closestDist) {
                closestDist = dist;
                closestZone = zone;
            }
        }

        if (this._dropTarget && this._dropTarget !== closestZone) {
            const prevZone = this._dropTarget.getComponent('QuoteDropZone') as import('./QuoteDropZone').QuoteDropZone;
            if (prevZone) prevZone.highlight(false);
        }

        this._dropTarget = closestZone;

        if (closestZone) {
            const zone = closestZone.getComponent('QuoteDropZone') as import('./QuoteDropZone').QuoteDropZone;
            if (zone) zone.highlight(true);
        }
    }

    private _findAllDropZones(): Node[] {
        const result: Node[] = [];

        const walk = (node: Node) => {
            const zone = node.getComponent('QuoteDropZone');
            if (zone && node.isValid) {
                result.push(node);
            }
            for (const child of node.children) {
                walk(child);
            }
        };

        const scene = this.node.scene;
        if (scene) {
            walk(scene);
        }

        return result;
    }
}
