import { _decorator, Component, Node, Label, Button, Sprite, EditBox, Prefab, instantiate, Vec3, UITransform, Color } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { OrderManager } from '../game/OrderManager';
import { InventoryManager } from '../game/InventoryManager';
import { Supplier, SupplierItem } from '../models/Supplier';
import { Ingredient } from '../models/Ingredient';
import { GameManager } from '../core/GameManager';
const { ccclass, property } = _decorator;

@ccclass('OrderItemEditor')
export class OrderItemEditor extends Component {
    @property(Label)
    public nameLabel: Label | null = null;

    @property(Label)
    public priceLabel: Label | null = null;

    @property(Label)
    public stockLabel: Label | null = null;

    @property(EditBox)
    public quantityEdit: EditBox | null = null;

    @property(Label)
    public subtotalLabel: Label | null = null;

    @property(Button)
    public minusBtn: Button | null = null;

    @property(Button)
    public plusBtn: Button | null = null;

    private _supplierItem: SupplierItem | null = null;
    private _ingredient: Ingredient | null = null;
    private _quantity: number = 0;
    private _onQuantityChange: ((qty: number) => void) | null = null;

    setData(supplierItem: SupplierItem, ingredient: Ingredient, currentStock: number, onQuantityChange: (qty: number) => void) {
        this._supplierItem = supplierItem;
        this._ingredient = ingredient;
        this._onQuantityChange = onQuantityChange;
        this._quantity = supplierItem.minOrderQuantity;

        if (this.nameLabel) this.nameLabel.string = ingredient.name;
        if (this.priceLabel) this.priceLabel.string = `¥${supplierItem.price}/${ingredient.unit}`;
        if (this.stockLabel) this.stockLabel.string = `库存: ${currentStock} ${ingredient.unit}`;
        if (this.quantityEdit) this.quantityEdit.string = String(this._quantity);

        this.updateSubtotal();
    }

    getQuantity(): number {
        return this._quantity;
    }

    getSupplierItem(): SupplierItem | null {
        return this._supplierItem;
    }

    getIngredientId(): string {
        return this._supplierItem?.ingredientId || '';
    }

    onLoad() {
        if (this.minusBtn) {
            this.minusBtn.node.on(Button.EventType.CLICK, this.onMinus, this);
        }
        if (this.plusBtn) {
            this.plusBtn.node.on(Button.EventType.CLICK, this.onPlus, this);
        }
        if (this.quantityEdit) {
            this.quantityEdit.node.on(EditBox.EventType.EDITING_DID_ENDED, this.onQuantityEdited, this);
        }
    }

    onDestroy() {
        if (this.minusBtn) {
            this.minusBtn.node.off(Button.EventType.CLICK, this.onMinus, this);
        }
        if (this.plusBtn) {
            this.plusBtn.node.off(Button.EventType.CLICK, this.onPlus, this);
        }
        if (this.quantityEdit) {
            this.quantityEdit.node.off(EditBox.EventType.EDITING_DID_ENDED, this.onQuantityEdited, this);
        }
    }

    private onMinus(): void {
        if (!this._supplierItem) return;
        const newQty = Math.max(0, this._quantity - this._supplierItem.minOrderQuantity);
        this.setQuantity(newQty);
    }

    private onPlus(): void {
        if (!this._supplierItem) return;
        const newQty = Math.min(this._supplierItem.maxOrderQuantity, this._quantity + this._supplierItem.minOrderQuantity);
        this.setQuantity(newQty);
    }

    private onQuantityEdited(): void {
        if (!this._supplierItem || !this.quantityEdit) return;
        let qty = parseInt(this.quantityEdit.string) || 0;
        qty = Math.max(0, Math.min(this._supplierItem.maxOrderQuantity, qty));
        this.setQuantity(qty);
    }

    private setQuantity(qty: number): void {
        this._quantity = qty;
        if (this.quantityEdit) this.quantityEdit.string = String(qty);
        this.updateSubtotal();
        if (this._onQuantityChange) {
            this._onQuantityChange(qty);
        }
    }

    private updateSubtotal(): void {
        if (!this._supplierItem || !this.subtotalLabel || !this._ingredient) return;

        let price = this._supplierItem.price;
        if (this._supplierItem.discountThreshold && this._quantity >= this._supplierItem.discountThreshold) {
            price *= (1 - (this._supplierItem.discountRate || 0));
        }

        const subtotal = price * this._quantity;
        this.subtotalLabel.string = `¥${subtotal.toFixed(0)}`;
    }
}

@ccclass('OrderDialog')
export class OrderDialog extends Component {
    @property(Node)
    public modal: Node | null = null;

    @property(Label)
    public supplierNameLabel: Label | null = null;

    @property(Label)
    public deliveryInfoLabel: Label | null = null;

    @property(Node)
    public itemsContainer: Node | null = null;

    @property(Prefab)
    public itemEditorPrefab: Prefab | null = null;

    @property(Label)
    public subtotalLabel: Label | null = null;

    @property(Label)
    public deliveryFeeLabel: Label | null = null;

    @property(Label)
    public totalLabel: Label | null = null;

    @property(Label)
    public capitalLabel: Label | null = null;

    @property(Button)
    public confirmBtn: Button | null = null;

    @property(Button)
    public cancelBtn: Button | null = null;

    @property
    public itemGap: number = 10;

    @property
    public itemHeight: number = 80;

    private _supplier: Supplier | null = null;
    private _storeId: string = '';
    private _editors: OrderItemEditor[] = [];
    private _dynamicTemplateNode: Node | null = null;
    private _dynamicTemplateCreated: boolean = false;

    public createDynamicTemplate(): Node {
        if (this._dynamicTemplateNode) return this._dynamicTemplateNode;

        const root = new Node('OrderItemTemplate');
        const uiTransform = root.addComponent(UITransform);
        uiTransform.setContentSize(440, this.itemHeight);
        uiTransform.setAnchorPoint(0.5, 0.5);
        const bg = root.addComponent(Sprite);
        bg.sizeMode = Sprite.SizeMode.CUSTOM;
        bg.color = new Color(55, 45, 35, 180);
        bg.type = Sprite.Type.SIMPLE;
        const editor = root.addComponent(OrderItemEditor);

        const nameNode = new Node('NameLabel');
        nameNode.setParent(root);
        nameNode.setPosition(new Vec3(-200, 20, 0));
        const nameUI = nameNode.addComponent(UITransform);
        nameUI.setContentSize(120, 22);
        nameUI.setAnchorPoint(0, 0.5);
        const nameLabel = nameNode.addComponent(Label);
        nameLabel.string = '';
        nameLabel.fontSize = 16;
        nameLabel.lineHeight = 16;
        nameLabel.color = new Color(255, 240, 220);
        nameLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        nameLabel.isSystemFontUsed = true;
        editor.nameLabel = nameLabel;

        const priceNode = new Node('PriceLabel');
        priceNode.setParent(root);
        priceNode.setPosition(new Vec3(-200, -5, 0));
        const priceUI = priceNode.addComponent(UITransform);
        priceUI.setContentSize(120, 18);
        priceUI.setAnchorPoint(0, 0.5);
        const priceLabel = priceNode.addComponent(Label);
        priceLabel.string = '';
        priceLabel.fontSize = 13;
        priceLabel.lineHeight = 13;
        priceLabel.color = new Color(255, 220, 100);
        priceLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        priceLabel.isSystemFontUsed = true;
        editor.priceLabel = priceLabel;

        const stockNode = new Node('StockLabel');
        stockNode.setParent(root);
        stockNode.setPosition(new Vec3(-200, -25, 0));
        const stockUI = stockNode.addComponent(UITransform);
        stockUI.setContentSize(120, 16);
        stockUI.setAnchorPoint(0, 0.5);
        const stockLabel = stockNode.addComponent(Label);
        stockLabel.string = '';
        stockLabel.fontSize = 11;
        stockLabel.lineHeight = 11;
        stockLabel.color = new Color(180, 180, 180);
        stockLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        stockLabel.isSystemFontUsed = true;
        editor.stockLabel = stockLabel;

        const editBg = new Node('EditBg');
        editBg.setParent(root);
        editBg.setPosition(new Vec3(40, 5, 0));
        const editBgUI = editBg.addComponent(UITransform);
        editBgUI.setContentSize(90, 32);
        const editBgSprite = editBg.addComponent(Sprite);
        editBgSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        editBgSprite.color = new Color(80, 70, 60, 200);
        editBgSprite.type = Sprite.Type.SIMPLE;

        const editNode = new Node('QuantityEdit');
        editNode.setParent(editBg);
        const editUI = editNode.addComponent(UITransform);
        editUI.setContentSize(90, 32);
        const quantityEdit = editNode.addComponent(EditBox);
        quantityEdit.string = '0';
        quantityEdit.fontSize = 16;
        quantityEdit.fontColor = Color.WHITE;
        quantityEdit.placeholder = '';
        quantityEdit.inputMode = EditBox.InputMode.NUMERIC;
        quantityEdit.maxLength = 6;
        quantityEdit.returnType = EditBox.KeyboardReturnType.DONE;
        editor.quantityEdit = quantityEdit;

        const minusNode = new Node('MinusBtn');
        minusNode.setParent(root);
        minusNode.setPosition(new Vec3(-10, 5, 0));
        const minusUI = minusNode.addComponent(UITransform);
        minusUI.setContentSize(32, 32);
        const minusBtn = minusNode.addComponent(Button);
        const minusSprite = minusNode.addComponent(Sprite);
        minusSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        minusSprite.color = new Color(160, 80, 80, 220);
        minusSprite.type = Sprite.Type.SIMPLE;
        minusBtn.node = minusNode;
        minusBtn.target = minusSprite;
        minusBtn.transition = Button.Transition.COLOR;
        minusBtn.normalColor = minusSprite.color;
        minusBtn.hoverColor = new Color(200, 100, 100, 220);
        minusBtn.pressedColor = new Color(120, 60, 60, 220);
        editor.minusBtn = minusBtn;

        const minusLabelNode = new Node('Label');
        minusLabelNode.setParent(minusNode);
        const minusLabelUI = minusLabelNode.addComponent(UITransform);
        minusLabelUI.setContentSize(32, 28);
        const minusLabel = minusLabelNode.addComponent(Label);
        minusLabel.string = '-';
        minusLabel.fontSize = 24;
        minusLabel.lineHeight = 24;
        minusLabel.color = Color.WHITE;
        minusLabel.isSystemFontUsed = true;

        const plusNode = new Node('PlusBtn');
        plusNode.setParent(root);
        plusNode.setPosition(new Vec3(110, 5, 0));
        const plusUI = plusNode.addComponent(UITransform);
        plusUI.setContentSize(32, 32);
        const plusBtn = plusNode.addComponent(Button);
        const plusSprite = plusNode.addComponent(Sprite);
        plusSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        plusSprite.color = new Color(80, 140, 80, 220);
        plusSprite.type = Sprite.Type.SIMPLE;
        plusBtn.node = plusNode;
        plusBtn.target = plusSprite;
        plusBtn.transition = Button.Transition.COLOR;
        plusBtn.normalColor = plusSprite.color;
        plusBtn.hoverColor = new Color(100, 180, 100, 220);
        plusBtn.pressedColor = new Color(60, 120, 60, 220);
        editor.plusBtn = plusBtn;

        const plusLabelNode = new Node('Label');
        plusLabelNode.setParent(plusNode);
        const plusLabelUI = plusLabelNode.addComponent(UITransform);
        plusLabelUI.setContentSize(32, 28);
        const plusLabel = plusLabelNode.addComponent(Label);
        plusLabel.string = '+';
        plusLabel.fontSize = 24;
        plusLabel.lineHeight = 24;
        plusLabel.color = Color.WHITE;
        plusLabel.isSystemFontUsed = true;

        const subtotalNode = new Node('SubtotalLabel');
        subtotalNode.setParent(root);
        subtotalNode.setPosition(new Vec3(180, 5, 0));
        const subtotalUI = subtotalNode.addComponent(UITransform);
        subtotalUI.setContentSize(70, 28);
        subtotalUI.setAnchorPoint(1, 0.5);
        const subtotalLabel = subtotalNode.addComponent(Label);
        subtotalLabel.string = '¥0';
        subtotalLabel.fontSize = 18;
        subtotalLabel.lineHeight = 18;
        subtotalLabel.color = new Color(255, 220, 100);
        subtotalLabel.horizontalAlign = Label.HorizontalAlign.RIGHT;
        subtotalLabel.isSystemFontUsed = true;
        editor.subtotalLabel = subtotalLabel;

        this._dynamicTemplateNode = root;
        this._dynamicTemplateCreated = true;
        return root;
    }

    onLoad() {
        this.node.on('setup_order', this.onSetupOrder, this);

        if (this.confirmBtn) {
            this.confirmBtn.node.on(Button.EventType.CLICK, this.onConfirm, this);
        }
        if (this.cancelBtn) {
            this.cancelBtn.node.on(Button.EventType.CLICK, this.onCancel, this);
        }

        this.createDynamicTemplate();
        this.hide();
    }

    onDestroy() {
        this.node.off('setup_order', this.onSetupOrder, this);

        if (this.confirmBtn) {
            this.confirmBtn.node.off(Button.EventType.CLICK, this.onConfirm, this);
        }
        if (this.cancelBtn) {
            this.cancelBtn.node.off(Button.EventType.CLICK, this.onCancel, this);
        }
    }

    private onSetupOrder(data: { supplier: Supplier; storeId: string }): void {
        this._supplier = data.supplier;
        this._storeId = data.storeId;
        this.show();
        this.buildItemList();
        this.updateSummary();
    }

    private buildItemList(): void {
        if (!this.itemsContainer || !this._supplier) return;
        if (!this.itemEditorPrefab && !this._dynamicTemplateCreated) {
            this.createDynamicTemplate();
        }
        if (!this.itemEditorPrefab && !this._dynamicTemplateNode) return;

        this.itemsContainer.removeAllChildren();
        this._editors = [];

        let yOffset = -this.itemHeight / 2 - this.itemGap;

        const uiTransform = this.itemsContainer.getComponent(UITransform);
        if (uiTransform) {
            const totalHeight = this._supplier.items.length * (this.itemHeight + this.itemGap) + this.itemGap;
            uiTransform.setContentSize(uiTransform.contentSize.width, totalHeight);
        }

        for (const supplierItem of this._supplier.items) {
            const ingredient = ConfigManager.getInstance().findById<Ingredient>(
                ConfigKeys.INGREDIENTS,
                supplierItem.ingredientId
            );
            if (!ingredient) continue;

            let itemNode: Node;
            if (this.itemEditorPrefab) {
                itemNode = instantiate(this.itemEditorPrefab);
            } else if (this._dynamicTemplateNode) {
                itemNode = instantiate(this._dynamicTemplateNode);
            } else {
                continue;
            }
            itemNode.setParent(this.itemsContainer);
            itemNode.setPosition(new Vec3(0, yOffset, 0));

            const editor = itemNode.getComponent(OrderItemEditor);
            if (editor) {
                const currentStock = InventoryManager.getInstance().getTotalQuantity(this._storeId, supplierItem.ingredientId);
                editor.setData(supplierItem, ingredient, currentStock, () => this.updateSummary());
                this._editors.push(editor);
            }

            yOffset -= this.itemHeight + this.itemGap;
        }

        if (this.supplierNameLabel) {
            this.supplierNameLabel.string = this._supplier.name;
        }

        if (this.deliveryInfoLabel) {
            this.deliveryInfoLabel.string = `配送费: ¥${this._supplier.deliveryFee} (满¥${this._supplier.freeDeliveryThreshold}免运费)`;
        }
    }

    private updateSummary(): void {
        if (!this._supplier) return;

        let subtotal = 0;
        for (const editor of this._editors) {
            const qty = editor.getQuantity();
            const si = editor.getSupplierItem();
            if (!si || qty <= 0) continue;

            let price = si.price;
            if (si.discountThreshold && qty >= si.discountThreshold) {
                price *= (1 - (si.discountRate || 0));
            }
            subtotal += price * qty;
        }

        const deliveryFee = subtotal < this._supplier.freeDeliveryThreshold && subtotal > 0 ? this._supplier.deliveryFee : 0;
        const total = subtotal + deliveryFee;
        const capital = GameManager.getInstance().getCapital();

        if (this.subtotalLabel) this.subtotalLabel.string = `¥${subtotal.toFixed(0)}`;
        if (this.deliveryFeeLabel) this.deliveryFeeLabel.string = deliveryFee > 0 ? `¥${deliveryFee}` : '免费';
        if (this.totalLabel) this.totalLabel.string = `¥${total.toFixed(0)}`;
        if (this.capitalLabel) this.capitalLabel.string = `可用资金: ¥${capital.toLocaleString()}`;

        if (this.confirmBtn) {
            const canAfford = total <= capital && total > 0;
            this.confirmBtn.interactable = canAfford;

            const btnSprite = this.confirmBtn.getComponent(Sprite);
            if (btnSprite) {
                btnSprite.color = canAfford ? new Color(80, 180, 80) : new Color(150, 150, 150);
            }
        }
    }

    private onConfirm(): void {
        if (!this._supplier) return;

        const items = this._editors
            .filter(e => e.getQuantity() > 0)
            .map(e => ({
                ingredientId: e.getIngredientId(),
                quantity: e.getQuantity()
            }));

        if (items.length === 0) {
            this.hide();
            return;
        }

        const order = OrderManager.getInstance().createOrder(this._storeId, this._supplier.id, items);
        if (order) {
            EventManager.getInstance().emit(GameEvents.SHOW_TOAST, {
                message: '订单创建成功！',
                type: 'success'
            });
        } else {
            EventManager.getInstance().emit(GameEvents.SHOW_TOAST, {
                message: '订单创建失败，请检查资金或库存！',
                type: 'error'
            });
        }

        this.hide();
    }

    private onCancel(): void {
        this.hide();
    }

    public show(): void {
        this.node.active = true;
        if (this.modal) this.modal.active = true;
    }

    public hide(): void {
        this.node.active = false;
        if (this.modal) this.modal.active = false;
        this._editors = [];
    }
}
