import { _decorator, Component, Node, Prefab, instantiate, ScrollView, Vec3, UITransform, Label, EventTouch, Sprite, Color } from 'cc';
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
    private _dynamicCardTemplate: Node | null = null;

    public createDynamicCardTemplate(): Node {
        if (this._dynamicCardTemplate) return this._dynamicCardTemplate;

        const root = new Node('SupplierCardTemplate');
        root.name = 'SupplierCardTemplate';
        const ui = root.addComponent(UITransform);
        ui.setContentSize(this.cardWidth, this.cardHeight);
        ui.setAnchorPoint(0.5, 0.5);
        const bg = root.addComponent(Sprite);
        bg.sizeMode = Sprite.SizeMode.CUSTOM;
        bg.color = new Color(70, 55, 40, 230);
        bg.type = Sprite.Type.SIMPLE;
        const card = root.addComponent(SupplierCard);
        card.dragNode = root;

        const header = new Node('Header');
        header.setParent(root);
        header.setPosition(new Vec3(0, this.cardHeight / 2 - 30, 0));
        const hui = header.addComponent(UITransform);
        hui.setContentSize(this.cardWidth - 20, 28);
        const hbg = header.addComponent(Sprite);
        hbg.sizeMode = Sprite.SizeMode.CUSTOM;
        hbg.color = new Color(120, 80, 40, 200);
        hbg.type = Sprite.Type.SIMPLE;

        const nameNode = new Node('NameLabel');
        nameNode.setParent(header);
        nameNode.setPosition(new Vec3(0, 0, 0));
        const nui = nameNode.addComponent(UITransform);
        nui.setContentSize(this.cardWidth - 30, 24);
        const nameLabel = nameNode.addComponent(Label);
        nameLabel.string = '';
        nameLabel.fontSize = 15;
        nameLabel.lineHeight = 15;
        nameLabel.color = new Color(255, 240, 210);
        nameLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        nameLabel.overflow = Label.Overflow.SHRINK;
        nameLabel.isSystemFontUsed = true;
        card.nameLabel = nameLabel;

        const iconNode = new Node('IconSprite');
        iconNode.setParent(root);
        iconNode.setPosition(new Vec3(0, 60, 0));
        const iui = iconNode.addComponent(UITransform);
        iui.setContentSize(80, 80);
        const icon = iconNode.addComponent(Sprite);
        icon.sizeMode = Sprite.SizeMode.CUSTOM;
        icon.color = new Color(180, 140, 80);
        icon.type = Sprite.Type.SIMPLE;
        card.iconSprite = icon;

        const ratingNode = new Node('RatingLabel');
        ratingNode.setParent(root);
        ratingNode.setPosition(new Vec3(0, 0, 0));
        const rui = ratingNode.addComponent(UITransform);
        rui.setContentSize(this.cardWidth - 20, 22);
        const ratingLabel = ratingNode.addComponent(Label);
        ratingLabel.string = '';
        ratingLabel.fontSize = 14;
        ratingLabel.lineHeight = 14;
        ratingLabel.color = Color.WHITE;
        ratingLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        ratingLabel.isSystemFontUsed = true;
        card.ratingLabel = ratingLabel;

        const relNode = new Node('ReliabilityLabel');
        relNode.setParent(root);
        relNode.setPosition(new Vec3(0, -30, 0));
        const relUI = relNode.addComponent(UITransform);
        relUI.setContentSize(this.cardWidth - 20, 20);
        const relLabel = relNode.addComponent(Label);
        relLabel.string = '';
        relLabel.fontSize = 12;
        relLabel.lineHeight = 12;
        relLabel.color = new Color(200, 220, 255);
        relLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        relLabel.isSystemFontUsed = true;
        card.reliabilityLabel = relLabel;

        const categoriesNode = new Node('CategoriesContainer');
        categoriesNode.setParent(root);
        categoriesNode.setPosition(new Vec3(0, -90, 0));
        const catUI = categoriesNode.addComponent(UITransform);
        catUI.setContentSize(this.cardWidth - 20, 60);
        card.categoriesContainer = categoriesNode;

        const hintNode = new Node('HintLabel');
        hintNode.setParent(root);
        hintNode.setPosition(new Vec3(0, -this.cardHeight / 2 + 20, 0));
        const hintUI = hintNode.addComponent(UITransform);
        hintUI.setContentSize(this.cardWidth - 10, 24);
        const hintLabel = hintNode.addComponent(Label);
        hintLabel.string = '拖拽到门店下单';
        hintLabel.fontSize = 11;
        hintLabel.lineHeight = 11;
        hintLabel.color = new Color(200, 200, 150);
        hintLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        hintLabel.isSystemFontUsed = true;

        this._dynamicCardTemplate = root;
        return root;
    }

    onLoad() {
        this.createDynamicCardTemplate();
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
        if (!this.contentNode) return;
        if (!this.supplierCardPrefab && !this._dynamicCardTemplate) this.createDynamicCardTemplate();
        if (!this.supplierCardPrefab && !this._dynamicCardTemplate) return;

        this.contentNode.removeAllChildren();
        this._cards = [];

        const startX = this.cardWidth / 2 + this.cardGap;
        const totalWidth = Math.max(1, suppliers.length) * (this.cardWidth + this.cardGap) + this.cardGap;

        const uiTransform = this.contentNode.getComponent(UITransform);
        if (uiTransform) {
            uiTransform.setContentSize(totalWidth, this.cardHeight + this.cardGap * 2);
        }

        suppliers.forEach((supplier, index) => {
            const cardNode = this.supplierCardPrefab
                ? instantiate(this.supplierCardPrefab)
                : (this._dynamicCardTemplate ? instantiate(this._dynamicCardTemplate) : new Node());
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
