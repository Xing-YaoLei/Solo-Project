import { EventManager, GameEvents } from '../core/EventManager';
import { TimeManager } from '../core/TimeManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { InventoryManager } from './InventoryManager';
import { GameManager } from '../core/GameManager';
import { UsageType } from '../models/UsageRecord';
import { Ingredient } from '../models/Ingredient';
import { RandomEventManager } from './RandomEventManager';

export class ConsumptionSimulator {
    private static _instance: ConsumptionManager | null = null;

    private _baseConsumption: Record<string, number> = {};
    private _fluctuation: number = 0.2;
    private _lastProcessedDay: number = 0;
    private _currentStoreId: string = '';

    public static getInstance(): ConsumptionManager {
        if (!this._instance) {
            this._instance = new ConsumptionManager();
        }
        return this._instance;
    }

    public init(storeId: string, baseConsumption: Record<string, number>, fluctuation: number = 0.2): void {
        this._currentStoreId = storeId;
        this._baseConsumption = { ...baseConsumption };
        this._fluctuation = fluctuation;
        this._lastProcessedDay = TimeManager.getInstance().getCurrentDay();
    }

    public update(): void {
        const currentDay = TimeManager.getInstance().getCurrentDay();

        if (currentDay !== this._lastProcessedDay) {
            const daysPassed = currentDay - this._lastProcessedDay;
            for (let i = 0; i < daysPassed; i++) {
                this.processDailyConsumption();
            }
            this._lastProcessedDay = currentDay;
        }
    }

    private processDailyConsumption(): void {
        const ingredients = ConfigManager.getInstance().getListConfig<Ingredient>(ConfigKeys.INGREDIENTS);
        const eventManager = RandomEventManager.getInstance();

        for (const ingredient of ingredients) {
            const baseQty = this._baseConsumption[ingredient.id] || 0;
            if (baseQty <= 0) continue;

            let qty = baseQty * (1 + (Math.random() * 2 - 1) * this._fluctuation);

            if (eventManager.isIngredientAffected(ingredient.id)) {
                qty *= 1.5;
            }

            qty = Math.max(0, Math.floor(qty));

            if (qty > 0) {
                const available = InventoryManager.getInstance().getTotalQuantity(
                    this._currentStoreId,
                    ingredient.id
                );

                if (available < qty) {
                    GameManager.getInstance().incrementStat('shortageCount');
                    GameManager.getInstance().addCardPoint({
                        description: `${ingredient.name}库存不足，缺货${qty - available}${ingredient.unit}`,
                        type: 'mistake',
                        relatedData: { ingredientId: ingredient.id, shortage: qty - available }
                    });

                    if (available > 0) {
                        InventoryManager.getInstance().consume(
                            this._currentStoreId,
                            ingredient.id,
                            available,
                            UsageType.NORMAL_CONSUMPTION
                        );
                    }
                } else {
                    InventoryManager.getInstance().consume(
                        this._currentStoreId,
                        ingredient.id,
                        qty,
                        UsageType.NORMAL_CONSUMPTION
                    );
                }
            }
        }
    }

    public setConsumptionRate(ingredientId: string, rate: number): void {
        this._baseConsumption[ingredientId] = rate;
    }

    public getConsumptionRate(ingredientId: string): number {
        return this._baseConsumption[ingredientId] || 0;
    }

    public getEstimatedDailyUsage(ingredientId: string): number {
        const base = this.getConsumptionRate(ingredientId);
        const eventAffected = RandomEventManager.getInstance().isIngredientAffected(ingredientId);
        return eventAffected ? base * 1.5 : base;
    }

    public getDaysUntilStockout(storeId: string, ingredientId: string): number {
        const currentStock = InventoryManager.getInstance().getTotalQuantity(storeId, ingredientId);
        const dailyUsage = this.getEstimatedDailyUsage(ingredientId);

        if (dailyUsage <= 0) return Infinity;
        return Math.floor(currentStock / dailyUsage);
    }

    public reset(): void {
        this._baseConsumption = {};
        this._fluctuation = 0.2;
        this._lastProcessedDay = 0;
        this._currentStoreId = '';
    }
}

export type ConsumptionManager = ConsumptionSimulator;
