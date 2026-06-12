import { _decorator, Component, Node, Prefab, instantiate, ScrollView, Label, Sprite, Color, ProgressBar, Vec3, UITransform } from 'cc';
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

    onLoad() {
        EventManager.getInstance().on(GameEvents.STOCK_CHANGED, this.onStockChanged.bind(this));
        EventManager.getInstance().on(GameEvents.USAGE_RECORDED, this.onUsageRecorded.bind(this));
        EventManager.getInstance().on(GameEvents.DAY_PASSED, this.onDayPassed.bind(this));
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
        if (!this.contentNode || !this.inventoryItemPrefab) return;

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

            const itemNode = instantiate(this.inventoryItemPrefab);
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
