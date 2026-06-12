import { _decorator, Component, Node, Prefab, instantiate, ScrollView, Vec3, UITransform, Label, EventTouch } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { Supplier } from '../models/Supplier';
import { SupplierCard } from './SupplierCard';
const { ccclass, property } = _decorator;

@ccclass('SupplierPanel')
export class SupplierPanel extends Component {
    @property(ScrollView)
    public scrollView: ScrollView | null = null;

    @property(Node)
    public contentNode: Node | null = null;

    @property(Prefab)
    public supplierCardPrefab: Prefab | null = null;

    @property(Node)
    public orderDialog: Node | null = null;

    @property
    public cardGap: number = 15;

    @property
    public cardWidth: number = 200;

    @property
    public cardHeight: number = 280;

    private _cards: SupplierCard[] = [];
    private _dropTargets: Map<string, Node> = new Map();

    onLoad() {
        EventManager.getInstance().on(GameEvents.SUPPLIER_DROPPED, this.onSupplierDropped.bind(this));
        EventManager.getInstance().on(GameEvents.SUPPLIER_DRAG_START, this.onSupplierDragStart.bind(this));
    }

    start() {
        this.loadSuppliers();
    }

    onDestroy() {
        EventManager.getInstance().off(GameEvents.SUPPLIER_DROPPED, this.onSupplierDropped.bind(this));
        EventManager.getInstance().off(GameEvents.SUPPLIER_DRAG_START, this.onSupplierDragStart.bind(this));
    }

    public registerDropTarget(storeId: string, node: Node): void {
        this._dropTargets.set(storeId, node);
    }

    private loadSuppliers(): void {
        const suppliers = ConfigManager.getInstance().getListConfig<Supplier>(ConfigKeys.SUPPLIERS);
        this.createCards(suppliers.filter(s => s.isActive));
    }

    private createCards(suppliers: Supplier[]): void {
        if (!this.contentNode || !this.supplierCardPrefab) return;

        this.contentNode.removeAllChildren();
        this._cards = [];

        const startX = this.cardWidth / 2 + this.cardGap;
        const totalWidth = suppliers.length * (this.cardWidth + this.cardGap) + this.cardGap;

        const uiTransform = this.contentNode.getComponent(UITransform);
        if (uiTransform) {
            uiTransform.setContentSize(totalWidth, this.cardHeight + this.cardGap * 2);
        }

        suppliers.forEach((supplier, index) => {
            const cardNode = instantiate(this.supplierCardPrefab!);
            cardNode.name = `supplier_${supplier.id}`;
            cardNode.setParent(this.contentNode);

            const posX = startX + index * (this.cardWidth + this.cardGap);
            cardNode.setPosition(new Vec3(posX, 0, 0));

            const card = cardNode.getComponent(SupplierCard);
            if (card) {
                card.setSupplierData(supplier);
                this._cards.push(card);
            }
        });
    }

    private onSupplierDragStart(data: any): void {
        for (const [storeId, node] of this._dropTargets) {
            node.emit('highlight_start');
        }
    }

    private onSupplierDropped(data: { supplierId: string; supplierData: Supplier; worldPosition: Vec3; cardNode: Node }): void {
        for (const [storeId, node] of this._dropTargets) {
            node.emit('highlight_end');

            if (this.isPositionInNode(data.worldPosition, node)) {
                this.showOrderDialog(data.supplierData, storeId);
                return;
            }
        }
    }

    private isPositionInNode(worldPos: Vec3, node: Node): boolean {
        const uiTransform = node.getComponent(UITransform);
        if (!uiTransform) return false;

        const localPos = node.getComponent(UITransform)?.convertToNodeSpaceAR(worldPos) || new Vec3();
        const size = uiTransform.contentSize;

        return Math.abs(localPos.x) <= size.width / 2 &&
               Math.abs(localPos.y) <= size.height / 2;
    }

    private showOrderDialog(supplier: Supplier, storeId: string): void {
        if (!this.orderDialog) return;

        this.orderDialog.active = true;
        this.orderDialog.emit('setup_order', { supplier, storeId });

        EventManager.getInstance().emit(GameEvents.SUPPLIER_SELECTED, {
            supplierId: supplier.id,
            storeId
        });
    }

    public refresh(): void {
        this.loadSuppliers();
    }
}
