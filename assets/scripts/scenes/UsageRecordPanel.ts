import { _decorator, Component, Node, Prefab, instantiate, ScrollView, Label, Color, Vec3, UITransform } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { InventoryManager } from '../game/InventoryManager';
import { UsageRecord, UsageType } from '../models/UsageRecord';
import { Ingredient } from '../models/Ingredient';
const { ccclass, property } = _decorator;

@ccclass('UsageRecordItem')
export class UsageRecordItem extends Component {
    @property(Label)
    public timeLabel: Label | null = null;

    @property(Label)
    public nameLabel: Label | null = null;

    @property(Label)
    public quantityLabel: Label | null = null;

    @property(Label)
    public typeLabel: Label | null = null;

    setData(record: UsageRecord, ingredient: Ingredient) {
        const date = new Date(record.operateTime);
        if (this.timeLabel) {
            this.timeLabel.string = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
        }

        if (this.nameLabel) {
            this.nameLabel.string = ingredient.name;
        }

        const prefix = this.isNegativeType(record.type) ? '-' : '+';
        if (this.quantityLabel) {
            this.quantityLabel.string = `${prefix}${record.quantity} ${ingredient.unit}`;
            this.quantityLabel.color = this.isNegativeType(record.type) ? new Color(255, 120, 120) : new Color(100, 200, 100);
        }

        if (this.typeLabel) {
            this.typeLabel.string = this.getTypeText(record.type);
            this.typeLabel.color = this.getTypeColor(record.type);
        }
    }

    private isNegativeType(type: UsageType): boolean {
        return type === UsageType.NORMAL_CONSUMPTION ||
               type === UsageType.WASTE ||
               type === UsageType.DAMAGE ||
               type === UsageType.TRANSFER_OUT;
    }

    private getTypeText(type: UsageType): string {
        const map: Record<UsageType, string> = {
            [UsageType.NORMAL_CONSUMPTION]: '正常消耗',
            [UsageType.WASTE]: '损耗',
            [UsageType.DAMAGE]: '损坏',
            [UsageType.RETURN]: '退货',
            [UsageType.TRANSFER_OUT]: '调出',
            [UsageType.TRANSFER_IN]: '调入'
        };
        return map[type] || type;
    }

    private getTypeColor(type: UsageType): Color {
        const map: Record<UsageType, Color> = {
            [UsageType.NORMAL_CONSUMPTION]: new Color(100, 150, 255),
            [UsageType.WASTE]: new Color(255, 100, 100),
            [UsageType.DAMAGE]: new Color(255, 150, 50),
            [UsageType.RETURN]: new Color(150, 150, 150),
            [UsageType.TRANSFER_OUT]: new Color(255, 180, 50),
            [UsageType.TRANSFER_IN]: new Color(100, 200, 100)
        };
        return map[type] || Color.WHITE;
    }
}

@ccclass('UsageRecordPanel')
export class UsageRecordPanel extends Component {
    @property(ScrollView)
    public scrollView: ScrollView | null = null;

    @property(Node)
    public contentNode: Node | null = null;

    @property(Prefab)
    public recordItemPrefab: Prefab | null = null;

    @property(Label)
    public titleLabel: Label | null = null;

    @property
    public itemGap: number = 4;

    @property
    public itemHeight: number = 40;

    @property
    public maxRecords: number = 50;

    private _currentStoreId: string = 'store_main';

    onLoad() {
        EventManager.getInstance().on(GameEvents.USAGE_RECORDED, this.onUsageRecorded.bind(this));
        EventManager.getInstance().on(GameEvents.STOCK_CHANGED, this.onStockChanged.bind(this));
        EventManager.getInstance().on(GameEvents.ORDER_DELIVERED, this.onOrderDelivered.bind(this));
    }

    start() {
        this.refresh();
    }

    onDestroy() {
        EventManager.getInstance().off(GameEvents.USAGE_RECORDED, this.onUsageRecorded.bind(this));
        EventManager.getInstance().off(GameEvents.STOCK_CHANGED, this.onStockChanged.bind(this));
        EventManager.getInstance().off(GameEvents.ORDER_DELIVERED, this.onOrderDelivered.bind(this));
    }

    public setStore(storeId: string): void {
        this._currentStoreId = storeId;
        this.refresh();
    }

    public refresh(): void {
        if (!this.contentNode || !this.recordItemPrefab) return;

        this.contentNode.removeAllChildren();

        const records = InventoryManager.getInstance()
            .getUsageRecords(this._currentStoreId)
            .sort((a, b) => b.operateTime - a.operateTime)
            .slice(0, this.maxRecords);

        const uiTransform = this.contentNode.getComponent(UITransform);
        if (uiTransform) {
            const totalHeight = records.length * (this.itemHeight + this.itemGap) + this.itemGap;
            uiTransform.setContentSize(uiTransform.contentSize.width, Math.max(200, totalHeight));
        }

        let yOffset = -this.itemHeight / 2 - this.itemGap;

        for (const record of records) {
            const ingredient = ConfigManager.getInstance().findById<Ingredient>(
                ConfigKeys.INGREDIENTS,
                record.ingredientId
            );
            if (!ingredient) continue;

            const itemNode = instantiate(this.recordItemPrefab);
            itemNode.setParent(this.contentNode);
            itemNode.setPosition(new Vec3(0, yOffset, 0));

            const item = itemNode.getComponent(UsageRecordItem);
            if (item) {
                item.setData(record, ingredient);
            }

            yOffset -= this.itemHeight + this.itemGap;
        }

        if (this.scrollView) {
            this.scrollView.scrollToTop(0.1);
        }
    }

    private onUsageRecorded(data: any): void {
        this.refresh();
    }

    private onStockChanged(data: any): void {
        if (data.quantity > 0) {
            this.refresh();
        }
    }

    private onOrderDelivered(data: any): void {
        this.refresh();
    }
}
