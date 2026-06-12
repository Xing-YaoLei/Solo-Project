import { EventManager, GameEvents } from '../core/EventManager';
import { TimeManager } from '../core/TimeManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { Inventory, StockItem, Ingredient } from '../models/Ingredient';
import { UsageRecord, UsageType, InventoryCheckRecord } from '../models/UsageRecord';
import { Order, OrderItem } from '../models/Order';

export class InventoryManager {
    private static _instance: InventoryManager | null = null;

    private _inventories: Map<string, Inventory> = new Map();
    private _usageRecords: UsageRecord[] = [];
    private _checkRecords: InventoryCheckRecord[] = [];

    public static getInstance(): InventoryManager {
        if (!this._instance) {
            this._instance = new InventoryManager();
        }
        return this._instance;
    }

    public initStoreInventory(storeId: string, initialStock: Record<string, number>): void {
        const items = new Map<string, StockItem[]>();

        for (const [ingredientId, quantity] of Object.entries(initialStock)) {
            if (quantity > 0) {
                const ingredient = ConfigManager.getInstance().findById<Ingredient>(ConfigKeys.INGREDIENTS, ingredientId);
                if (ingredient) {
                    items.set(ingredientId, [{
                        ingredientId,
                        quantity,
                        batchId: `initial_${ingredientId}_${Date.now()}`,
                        productionDate: TimeManager.getInstance().getGameTime() - 86400000 * 3,
                        expireDate: TimeManager.getInstance().getGameTime() + ingredient.shelfLifeDays * 86400000
                    }]);
                }
            }
        }

        this._inventories.set(storeId, {
            storeId,
            items,
            lastUpdateTime: Date.now()
        });
    }

    public getTotalQuantity(storeId: string, ingredientId: string): number {
        const inventory = this._inventories.get(storeId);
        if (!inventory) return 0;

        const batches = inventory.items.get(ingredientId);
        if (!batches || batches.length === 0) return 0;

        return batches.reduce((sum, batch) => sum + batch.quantity, 0);
    }

    public getStockBatches(storeId: string, ingredientId: string): StockItem[] {
        const inventory = this._inventories.get(storeId);
        if (!inventory) return [];
        return inventory.items.get(ingredientId) || [];
    }

    public getInventorySnapshot(storeId: string): Map<string, number> {
        const snapshot = new Map<string, number>();
        const inventory = this._inventories.get(storeId);
        if (!inventory) return snapshot;

        for (const [ingredientId, batches] of inventory.items) {
            const total = batches.reduce((sum, batch) => sum + batch.quantity, 0);
            if (total > 0) {
                snapshot.set(ingredientId, total);
            }
        }
        return snapshot;
    }

    public consume(storeId: string, ingredientId: string, quantity: number, type: UsageType = UsageType.NORMAL_CONSUMPTION): boolean {
        const inventory = this._inventories.get(storeId);
        if (!inventory) return false;

        let remaining = quantity;
        const batches = inventory.items.get(ingredientId);
        if (!batches || batches.length === 0) return false;

        batches.sort((a, b) => a.expireDate - b.expireDate);

        for (const batch of batches) {
            if (remaining <= 0) break;
            const take = Math.min(remaining, batch.quantity);
            batch.quantity -= take;
            remaining -= take;

            this._usageRecords.push({
                id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                storeId,
                ingredientId,
                quantity: take,
                type,
                batchId: batch.batchId,
                operatorId: 'player',
                operateTime: Date.now()
            });
        }

        const cleanBatches = batches.filter(b => b.quantity > 0);
        if (cleanBatches.length > 0) {
            inventory.items.set(ingredientId, cleanBatches);
        } else {
            inventory.items.delete(ingredientId);
        }

        inventory.lastUpdateTime = Date.now();

        EventManager.getInstance().emit(GameEvents.STOCK_CHANGED, {
            storeId,
            ingredientId,
            quantity: -quantity,
            newTotal: this.getTotalQuantity(storeId, ingredientId)
        });

        EventManager.getInstance().emit(GameEvents.USAGE_RECORDED, {
            storeId,
            ingredientId,
            quantity,
            type
        });

        return remaining === 0;
    }

    public addStock(storeId: string, ingredientId: string, quantity: number, batchId?: string, productionDate?: number): void {
        const inventory = this._inventories.get(storeId);
        if (!inventory) return;

        const ingredient = ConfigManager.getInstance().findById<Ingredient>(ConfigKeys.INGREDIENTS, ingredientId);
        if (!ingredient) return;

        const batches = inventory.items.get(ingredientId) || [];
        batches.push({
            ingredientId,
            quantity,
            batchId: batchId || `batch_${ingredientId}_${Date.now()}`,
            productionDate: productionDate || TimeManager.getInstance().getGameTime(),
            expireDate: TimeManager.getInstance().getGameTime() + ingredient.shelfLifeDays * 86400000
        });

        inventory.items.set(ingredientId, batches);
        inventory.lastUpdateTime = Date.now();

        EventManager.getInstance().emit(GameEvents.STOCK_CHANGED, {
            storeId,
            ingredientId,
            quantity,
            newTotal: this.getTotalQuantity(storeId, ingredientId)
        });
    }

    public addStockFromOrder(storeId: string, items: OrderItem[]): void {
        for (const item of items) {
            const receivedQty = item.receivedQuantity || item.quantity;
            if (receivedQty > 0) {
                this.addStock(
                    storeId,
                    item.ingredientId,
                    receivedQty,
                    `order_${Date.now()}_${item.ingredientId}`
                );
            }
        }
    }

    public performInventoryCheck(storeId: string, actualQuantities: Record<string, number>): InventoryCheckRecord[] {
        const records: InventoryCheckRecord[] = [];

        for (const [ingredientId, actualQty] of Object.entries(actualQuantities)) {
            const systemQty = this.getTotalQuantity(storeId, ingredientId);
            const difference = actualQty - systemQty;

            const record: InventoryCheckRecord = {
                id: `check_${Date.now()}_${ingredientId}`,
                storeId,
                ingredientId,
                systemQuantity: systemQty,
                actualQuantity: actualQty,
                difference,
                checkTime: Date.now(),
                operatorId: 'player',
                resolved: difference === 0,
                resolveNote: difference === 0 ? '账实相符' : undefined
            };

            records.push(record);
            this._checkRecords.push(record);

            EventManager.getInstance().emit(GameEvents.INVENTORY_CHECKED, record);

            if (difference !== 0) {
                EventManager.getInstance().emit(GameEvents.INVENTORY_DIFFERENCE_FOUND, record);
            }
        }

        return records;
    }

    public resolveInventoryDifference(recordId: string, adjustQuantity: number, note: string): boolean {
        const record = this._checkRecords.find(r => r.id === recordId);
        if (!record || record.resolved) return false;

        if (adjustQuantity !== 0) {
            if (adjustQuantity > 0) {
                this.addStock(record.storeId, record.ingredientId, adjustQuantity, `adjust_${recordId}`);
            } else {
                this.consume(record.storeId, record.ingredientId, Math.abs(adjustQuantity), UsageType.WASTE);
            }
        }

        record.resolved = true;
        record.resolveNote = note;

        return true;
    }

    public getExpiringItems(storeId: string, daysThreshold: number = 3): StockItem[] {
        const result: StockItem[] = [];
        const inventory = this._inventories.get(storeId);
        if (!inventory) return result;

        const thresholdTime = TimeManager.getInstance().getGameTime() + daysThreshold * 86400000;

        for (const batches of inventory.items.values()) {
            for (const batch of batches) {
                if (batch.expireDate <= thresholdTime) {
                    result.push(batch);
                }
            }
        }

        return result;
    }

    public getUsageRecords(storeId?: string, ingredientId?: string): UsageRecord[] {
        return this._usageRecords.filter(r =>
            (!storeId || r.storeId === storeId) &&
            (!ingredientId || r.ingredientId === ingredientId)
        );
    }

    public getCheckRecords(storeId?: string): InventoryCheckRecord[] {
        return this._checkRecords.filter(r => !storeId || r.storeId === storeId);
    }

    public isBelowSafetyLevel(storeId: string, ingredientId: string): boolean {
        const ingredient = ConfigManager.getInstance().findById<Ingredient>(ConfigKeys.INGREDIENTS, ingredientId);
        if (!ingredient) return false;

        const currentQty = this.getTotalQuantity(storeId, ingredientId);
        return currentQty < ingredient.safetyStockLevel;
    }

    public getLowStockItems(storeId: string): string[] {
        const result: string[] = [];
        const ingredients = ConfigManager.getInstance().getListConfig<Ingredient>(ConfigKeys.INGREDIENTS);

        for (const ingredient of ingredients) {
            if (this.isBelowSafetyLevel(storeId, ingredient.id)) {
                result.push(ingredient.id);
            }
        }

        return result;
    }

    public reset(): void {
        this._inventories.clear();
        this._usageRecords = [];
        this._checkRecords = [];
    }
}
