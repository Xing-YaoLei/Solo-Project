import { _decorator, Component, Node, Label, Button, Sprite, EditBox, Prefab, instantiate, Vec3, UITransform, Color, ScrollView } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { InventoryManager } from '../game/InventoryManager';
import { GameManager } from '../core/GameManager';
import { LevelManager } from '../game/LevelManager';
import { Ingredient } from '../models/Ingredient';
import { InventoryCheckRecord } from '../models/UsageRecord';
const { ccclass, property } = _decorator;

@ccclass('InventoryCheckItem')
export class InventoryCheckItem extends Component {
    @property(Label)
    public nameLabel: Label | null = null;

    @property(Label)
    public systemQtyLabel: Label | null = null;

    @property(EditBox)
    public actualQtyEdit: EditBox | null = null;

    @property(Label)
    public differenceLabel: Label | null = null;

    @property(Label)
    public unitLabel: Label | null = null;

    @property(Sprite)
    public statusBg: Sprite | null = null;

    private _ingredient: Ingredient | null = null;
    private _systemQty: number = 0;

    setData(ingredient: Ingredient, systemQty: number) {
        this._ingredient = ingredient;
        this._systemQty = systemQty;

        if (this.nameLabel) this.nameLabel.string = ingredient.name;
        if (this.systemQtyLabel) this.systemQtyLabel.string = String(systemQty);
        if (this.unitLabel) this.unitLabel.string = ingredient.unit;
        if (this.actualQtyEdit) this.actualQtyEdit.string = String(systemQty);

        this.updateDifference();
    }

    getIngredientId(): string {
        return this._ingredient?.id || '';
    }

    getActualQty(): number {
        if (!this.actualQtyEdit) return 0;
        return parseInt(this.actualQtyEdit.string) || 0;
    }

    getSystemQty(): number {
        return this._systemQty;
    }

    onLoad() {
        if (this.actualQtyEdit) {
            this.actualQtyEdit.node.on(EditBox.EventType.EDITING_DID_ENDED, this.onQtyEdited, this);
            this.actualQtyEdit.node.on(EditBox.EventType.TEXT_CHANGED, this.onQtyEdited, this);
        }
    }

    onDestroy() {
        if (this.actualQtyEdit) {
            this.actualQtyEdit.node.off(EditBox.EventType.EDITING_DID_ENDED, this.onQtyEdited, this);
            this.actualQtyEdit.node.off(EditBox.EventType.TEXT_CHANGED, this.onQtyEdited, this);
        }
    }

    private onQtyEdited(): void {
        this.updateDifference();
    }

    private updateDifference(): void {
        const actual = this.getActualQty();
        const diff = actual - this._systemQty;

        if (this.differenceLabel) {
            if (diff === 0) {
                this.differenceLabel.string = '账实相符';
                this.differenceLabel.color = new Color(80, 200, 80);
            } else if (diff > 0) {
                this.differenceLabel.string = `+${diff} 盘盈`;
                this.differenceLabel.color = new Color(80, 150, 255);
            } else {
                this.differenceLabel.string = `${diff} 盘亏`;
                this.differenceLabel.color = new Color(255, 100, 100);
            }
        }

        if (this.statusBg) {
            if (diff === 0) {
                this.statusBg.color = new Color(80, 200, 80, 30);
            } else if (Math.abs(diff) <= this._systemQty * 0.05) {
                this.statusBg.color = new Color(255, 200, 80, 30);
            } else {
                this.statusBg.color = new Color(255, 100, 100, 40);
            }
        }
    }
}

@ccclass('InventoryCheckDialog')
export class InventoryCheckDialog extends Component {
    @property(Node)
    public modal: Node | null = null;

    @property(Node)
    public itemsContainer: Node | null = null;

    @property(ScrollView)
    public scrollView: ScrollView | null = null;

    @property(Prefab)
    public checkItemPrefab: Prefab | null = null;

    @property(Label)
    public summaryLabel: Label | null = null;

    @property(Label)
    public accuracyLabel: Label | null = null;

    @property(Button)
    public confirmBtn: Button | null = null;

    @property(Button)
    public cancelBtn: Button | null = null;

    @property
    public itemGap: number = 8;

    @property
    public itemHeight: number = 60;

    private _storeId: string = 'store_main';
    private _checkItems: InventoryCheckItem[] = [];

    onLoad() {
        if (this.confirmBtn) {
            this.confirmBtn.node.on(Button.EventType.CLICK, this.onConfirm, this);
        }
        if (this.cancelBtn) {
            this.cancelBtn.node.on(Button.EventType.CLICK, this.onCancel, this);
        }

        this.hide();
    }

    onDestroy() {
        if (this.confirmBtn) {
            this.confirmBtn.node.off(Button.EventType.CLICK, this.onConfirm, this);
        }
        if (this.cancelBtn) {
            this.cancelBtn.node.off(Button.EventType.CLICK, this.onCancel, this);
        }
    }

    public show(storeId?: string): void {
        this._storeId = storeId || this._storeId;
        this.node.active = true;
        if (this.modal) this.modal.active = true;
        this.buildCheckList();
        this.updateSummary();
    }

    public hide(): void {
        this.node.active = false;
        if (this.modal) this.modal.active = false;
        this._checkItems = [];
    }

    private buildCheckList(): void {
        if (!this.itemsContainer || !this.checkItemPrefab) return;

        this.itemsContainer.removeAllChildren();
        this._checkItems = [];

        const ingredients = ConfigManager.getInstance().getListConfig<Ingredient>(ConfigKeys.INGREDIENTS);
        let yOffset = -this.itemHeight / 2 - this.itemGap;

        const uiTransform = this.itemsContainer.getComponent(UITransform);
        if (uiTransform) {
            const totalHeight = ingredients.length * (this.itemHeight + this.itemGap) + this.itemGap;
            uiTransform.setContentSize(uiTransform.contentSize.width, totalHeight);
        }

        for (const ingredient of ingredients) {
            const systemQty = InventoryManager.getInstance().getTotalQuantity(this._storeId, ingredient.id);
            if (systemQty <= 0) continue;

            const itemNode = instantiate(this.checkItemPrefab);
            itemNode.setParent(this.itemsContainer);
            itemNode.setPosition(new Vec3(0, yOffset, 0));

            const checkItem = itemNode.getComponent(InventoryCheckItem);
            if (checkItem) {
                checkItem.setData(ingredient, systemQty);
                this._checkItems.push(checkItem);
            }

            yOffset -= this.itemHeight + this.itemGap;
        }
    }

    private updateSummary(): void {
        let totalItems = 0;
        let exactMatches = 0;
        let totalDiff = 0;
        let totalSystemQty = 0;

        for (const item of this._checkItems) {
            totalItems++;
            const systemQty = item.getSystemQty();
            const actualQty = item.getActualQty();
            totalSystemQty += systemQty;
            totalDiff += Math.abs(actualQty - systemQty);

            if (systemQty === actualQty) {
                exactMatches++;
            }
        }

        const accuracy = totalItems > 0 ? Math.floor((exactMatches / totalItems) * 100) : 100;
        const weightedAccuracy = totalSystemQty > 0 ? Math.floor((1 - totalDiff / totalSystemQty) * 100) : 100;

        if (this.summaryLabel) {
            this.summaryLabel.string = `共${totalItems}项，${exactMatches}项账实相符，差异数量${totalDiff}`;
        }

        if (this.accuracyLabel) {
            this.accuracyLabel.string = `准确率: ${weightedAccuracy}%`;
            this.accuracyLabel.color = weightedAccuracy >= 95 ? new Color(80, 200, 80) :
                                       weightedAccuracy >= 90 ? new Color(255, 180, 50) :
                                       new Color(255, 100, 100);
        }
    }

    private onConfirm(): void {
        const actualQuantities: Record<string, number> = {};

        for (const item of this._checkItems) {
            actualQuantities[item.getIngredientId()] = item.getActualQty();
        }

        const records = InventoryManager.getInstance().performInventoryCheck(this._storeId, actualQuantities);

        let perfectCount = 0;
        let diffCount = 0;

        for (const record of records) {
            if (record.difference === 0) {
                perfectCount++;
            } else {
                diffCount++;
                this.resolveDifference(record);
            }
        }

        GameManager.getInstance().incrementStat('perfectInventoryCount', perfectCount);
        if (diffCount > 0) {
            GameManager.getInstance().incrementStat('inventoryDifferenceCount', diffCount);
        }

        LevelManager.getInstance().updateObjectiveProgress('obj_stock_accuracy',
            Math.floor((perfectCount / Math.max(1, records.length)) * 100)
        );

        EventManager.getInstance().emit(GameEvents.SHOW_TOAST, {
            message: `盘点完成: ${perfectCount}项相符，${diffCount}项差异`,
            type: perfectCount === records.length ? 'success' : 'warning'
        });

        this.hide();
    }

    private resolveDifference(record: InventoryCheckRecord): void {
        if (record.difference === 0) return;

        InventoryManager.getInstance().resolveInventoryDifference(
            record.id,
            record.difference,
            '盘点自动调整'
        );

        GameManager.getInstance().addCardPoint({
            description: `盘点差异: ${record.ingredientId} 差异${record.difference}`,
            type: record.difference > 0 ? 'success' : 'mistake',
            relatedData: { recordId: record.id, difference: record.difference }
        });
    }

    private onCancel(): void {
        this.hide();
    }
}
