import { _decorator, Component, Node, Prefab, instantiate, ScrollView, Label, Sprite, Color, ProgressBar, Vec3, UITransform, Graphics } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { InventoryManager } from '../game/InventoryManager';
import { Ingredient } from '../models/Ingredient';
import { ConsumptionManager } from '../game/ConsumptionManager';
const { ccclass, property } = _decorator;

export interface InventoryItemData {
    ingredient: Ingredient;
    quantity: number;
    safetyLevel: number;
    daysUntilStockout: number;
    dailyUsage: number;
}

@ccclass('InventoryItem')
export class InventoryItem extends Component {
    @property(Label)
    public nameLabel: Label | null = null;

    @property(Label)
    public quantityLabel: Label | null = null;

    @property(Label)
    public daysLabel: Label | null = null;

    @property(ProgressBar)
    public stockBar: ProgressBar | null = null;

    @property(Sprite)
    public statusIcon: Sprite | null = null;

    @property(Sprite)
    public background: Sprite | null = null;

    private _data: InventoryItemData | null = null;

    setData(data: InventoryItemData) {
        this._data = data;
        this.updateDisplay();
    }

    private updateDisplay(): void {
        if (!this._data) return;

        const { ingredient, quantity, safetyLevel, daysUntilStockout, dailyUsage } = this._data;

        if (this.nameLabel) this.nameLabel.string = ingredient.name;
        if (this.quantityLabel) this.quantityLabel.string = `${quantity} ${ingredient.unit}`;

        if (this.daysLabel) {
            if (daysUntilStockout === Infinity) {
                this.daysLabel.string = '充足';
            } else if (daysUntilStockout <= 0) {
                this.daysLabel.string = '缺货!';
            } else {
                this.daysLabel.string = `${daysUntilStockout}天`;
            }
        }

        const barRatio = safetyLevel > 0 ? Math.min(1.5, quantity / (safetyLevel * 2)) : 0;
        if (this.stockBar) {
            this.stockBar.progress = Math.max(0, Math.min(1, barRatio));
        }

        this.updateStatusColor(quantity, safetyLevel, daysUntilStockout);
    }

    private updateStatusColor(quantity: number, safetyLevel: number, daysUntilStockout: number): void {
        let color: Color;

        if (quantity <= 0 || daysUntilStockout <= 1) {
            color = new Color(255, 100, 100, 50);
        } else if (quantity < safetyLevel || daysUntilStockout <= 3) {
            color = new Color(255, 200, 100, 50);
        } else {
            color = new Color(100, 255, 100, 30);
        }

        if (this.background) {
            this.background.color = color;
        }

        if (this.stockBar) {
            const barColor = quantity < safetyLevel ? new Color(255, 150, 50) : new Color(80, 200, 80);
            const barSprite = this.stockBar.getComponent(Sprite) || this.stockBar.barSprite;
            if (barSprite) {
                barSprite.color = barColor;
            }
        }
    }
}

@ccclass('InventoryPanel')
export class InventoryPanel extends Component {
    @property(ScrollView)
    public scrollView: ScrollView | null = null;

    @property(Node)
    public contentNode: Node | null = null;

    @property(Prefab)
    public inventoryItemPrefab: Prefab | null = null;

    @property(Label)
    public storeNameLabel: Label | null = null;

    @property
    public itemGap: number = 8;

    @property
    public itemHeight: number = 70;

    private _currentStoreId: string = 'store_main';
    private _items: Map<string, InventoryItem> = new Map();
    private _dynamicTemplateCreated: boolean = false;
    private _dynamicItemNode: Node | null = null;

    public createDynamicTemplate(): Node {
        if (this._dynamicItemNode) return this._dynamicItemNode;

        const root = new Node('InventoryItemTemplate');
        const uiTransform = root.addComponent(UITransform);
        uiTransform.setContentSize(220, this.itemHeight);
        uiTransform.setAnchorPoint(0.5, 0.5);
        const bg = root.addComponent(Sprite);
        bg.sizeMode = Sprite.SizeMode.CUSTOM;
        bg.color = new Color(50, 40, 30, 150);
        bg.type = Sprite.Type.SIMPLE;
        const itemComp = root.addComponent(InventoryItem);
        itemComp.background = bg;

        const nameNode = new Node('NameLabel');
        nameNode.setParent(root);
        nameNode.setPosition(new Vec3(-85, 15, 0));
        const nameUI = nameNode.addComponent(UITransform);
        nameUI.setContentSize(100, 22);
        nameUI.setAnchorPoint(0, 0.5);
        const nameLabel = nameNode.addComponent(Label);
        nameLabel.string = '';
        nameLabel.fontSize = 14;
        nameLabel.lineHeight = 14;
        nameLabel.color = new Color(255, 240, 220);
        nameLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        nameLabel.isSystemFontUsed = true;
        itemComp.nameLabel = nameLabel;

        const qtyNode = new Node('QuantityLabel');
        qtyNode.setParent(root);
        qtyNode.setPosition(new Vec3(85, 15, 0));
        const qtyUI = qtyNode.addComponent(UITransform);
        qtyUI.setContentSize(80, 22);
        qtyUI.setAnchorPoint(1, 0.5);
        const qtyLabel = qtyNode.addComponent(Label);
        qtyLabel.string = '';
        qtyLabel.fontSize = 14;
        qtyLabel.lineHeight = 14;
        qtyLabel.color = new Color(255, 220, 100);
        qtyLabel.horizontalAlign = Label.HorizontalAlign.RIGHT;
        qtyLabel.isSystemFontUsed = true;
        itemComp.quantityLabel = qtyLabel;

        const barBgNode = new Node('BarBg');
        barBgNode.setParent(root);
        barBgNode.setPosition(new Vec3(-80, -10, 0));
        const barBgUI = barBgNode.addComponent(UITransform);
        barBgUI.setContentSize(120, 8);
        barBgUI.setAnchorPoint(0, 0.5);
        const barBgSprite = barBgNode.addComponent(Sprite);
        barBgSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        barBgSprite.color = new Color(60, 60, 60, 200);
        barBgSprite.type = Sprite.Type.SIMPLE;

        const barNode = new Node('Bar');
        barNode.setParent(barBgNode);
        barNode.setPosition(new Vec3(0, 0, 1));
        const barUI = barNode.addComponent(UITransform);
        barUI.setContentSize(60, 8);
        barUI.setAnchorPoint(0, 0.5);
        const barSprite = barNode.addComponent(Sprite);
        barSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        barSprite.color = new Color(80, 200, 100);
        barSprite.type = Sprite.Type.SIMPLE;
        const barComp = barBgNode.addComponent(ProgressBar);
        barComp.barSprite = barSprite;
        barComp.progress = 0.5;
        barComp.mode = ProgressBar.Mode.FILLED;
        itemComp.stockBar = barComp;

        const daysNode = new Node('DaysLabel');
        daysNode.setParent(root);
        daysNode.setPosition(new Vec3(75, -10, 0));
        const daysUI = daysNode.addComponent(UITransform);
        daysUI.setContentSize(70, 22);
        daysUI.setAnchorPoint(1, 0.5);
        const daysLabel = daysNode.addComponent(Label);
        daysLabel.string = '';
        daysLabel.fontSize = 12;
        daysLabel.lineHeight = 12;
        daysLabel.color = new Color(180, 200, 180);
        daysLabel.horizontalAlign = Label.HorizontalAlign.RIGHT;
        daysLabel.isSystemFontUsed = true;
        itemComp.daysLabel = daysLabel;

        const iconNode = new Node('StatusIcon');
        iconNode.setParent(root);
        iconNode.setPosition(new Vec3(-100, -10, 0));
        const iconUI = iconNode.addComponent(UITransform);
        iconUI.setContentSize(10, 10);
        const iconSprite = iconNode.addComponent(Sprite);
        iconSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        iconSprite.color = new Color(100, 200, 100);
        iconSprite.type = Sprite.Type.SIMPLE;
        itemComp.statusIcon = iconSprite;

        this._dynamicItemNode = root;
        this._dynamicTemplateCreated = true;
        return root;
    }

    onLoad() {
        EventManager.getInstance().on(GameEvents.STOCK_CHANGED, this.onStockChanged.bind(this));
        EventManager.getInstance().on(GameEvents.USAGE_RECORDED, this.onUsageRecorded.bind(this));
        EventManager.getInstance().on(GameEvents.DAY_PASSED, this.onDayPassed.bind(this));
        this.createDynamicTemplate();
    }

    start() {
        this.refresh();
    }

    onDestroy() {
        EventManager.getInstance().off(GameEvents.STOCK_CHANGED, this.onStockChanged.bind(this));
        EventManager.getInstance().off(GameEvents.USAGE_RECORDED, this.onUsageRecorded.bind(this));
        EventManager.getInstance().off(GameEvents.DAY_PASSED, this.onDayPassed.bind(this));
    }

    public setStore(storeId: string): void {
        this._currentStoreId = storeId;
        this.refresh();
    }

    public refresh(): void {
        if (!this.contentNode) return;
        if (!this.inventoryItemPrefab && !this._dynamicTemplateCreated) {
            this.createDynamicTemplate();
        }
        if (!this.inventoryItemPrefab && !this._dynamicItemNode) return;

        this.contentNode.removeAllChildren();
        this._items.clear();

        const ingredients = ConfigManager.getInstance().getListConfig<Ingredient>(ConfigKeys.INGREDIENTS);
        let yOffset = -this.itemHeight / 2 - this.itemGap;

        const uiTransform = this.contentNode.getComponent(UITransform);
        if (uiTransform) {
            const totalHeight = ingredients.length * (this.itemHeight + this.itemGap) + this.itemGap;
            uiTransform.setContentSize(uiTransform.contentSize.width, totalHeight);
        }

        for (const ingredient of ingredients) {
            const quantity = InventoryManager.getInstance().getTotalQuantity(this._currentStoreId, ingredient.id);
            const dailyUsage = ConsumptionManager.getInstance().getEstimatedDailyUsage(ingredient.id);
            const daysUntilStockout = ConsumptionManager.getInstance().getDaysUntilStockout(
                this._currentStoreId,
                ingredient.id
            );

            let itemNode: Node;
            if (this.inventoryItemPrefab) {
                itemNode = instantiate(this.inventoryItemPrefab);
            } else if (this._dynamicItemNode) {
                itemNode = instantiate(this._dynamicItemNode);
            } else {
                continue;
            }
            itemNode.setParent(this.contentNode);
            itemNode.setPosition(new Vec3(0, yOffset, 0));

            const item = itemNode.getComponent(InventoryItem);
            if (item) {
                item.setData({
                    ingredient,
                    quantity,
                    safetyLevel: ingredient.safetyStockLevel,
                    daysUntilStockout,
                    dailyUsage
                });
                this._items.set(ingredient.id, item);
            }

            yOffset -= this.itemHeight + this.itemGap;
        }
    }

    private onStockChanged(data: any): void {
        if (data.storeId !== this._currentStoreId) return;
        this.refresh();
    }

    private onUsageRecorded(data: any): void {
        this.refresh();
    }

    private onDayPassed(day: number): void {
        this.refresh();
    }
}
