import { EventManager, GameEvents } from '../core/EventManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { ItemConfig, PlayerItem, ItemType } from '../models/Item';

export class ItemManager {
    private static _instance: ItemManager | null = null;

    private _playerItems: Map<string, PlayerItem> = new Map();
    private _cooldowns: Map<string, number> = new Map();

    public static getInstance(): ItemManager {
        if (!this._instance) {
            this._instance = new ItemManager();
        }
        return this._instance;
    }

    public init(initialItems?: string[]): void {
        const itemConfigs = ConfigManager.getInstance().getListConfig<ItemConfig>(ConfigKeys.ITEMS);

        for (const config of itemConfigs) {
            const count = initialItems?.includes(config.id) ? 3 : 1;
            this._playerItems.set(config.id, {
                itemId: config.id,
                count,
                lastUsedTime: 0
            });
        }
    }

    public canUseItem(itemId: string): boolean {
        const playerItem = this._playerItems.get(itemId);
        if (!playerItem || playerItem.count <= 0) return false;

        const config = ConfigManager.getInstance().findById<ItemConfig>(ConfigKeys.ITEMS, itemId);
        if (!config) return false;

        const cooldown = this.getRemainingCooldown(itemId);
        return cooldown <= 0;
    }

    public useItem(itemId: string): boolean {
        if (!this.canUseItem(itemId)) return false;

        const playerItem = this._playerItems.get(itemId)!;
        const config = ConfigManager.getInstance().findById<ItemConfig>(ConfigKeys.ITEMS, itemId)!;

        playerItem.count--;
        playerItem.lastUsedTime = Date.now();
        this._cooldowns.set(itemId, Date.now() + config.cooldownSeconds * 1000);

        this.applyItemEffect(config);

        EventManager.getInstance().emit(GameEvents.ITEM_USED, {
            itemId,
            remainingCount: playerItem.count
        });

        EventManager.getInstance().emit(GameEvents.ITEM_COOLDOWN_CHANGED, {
            itemId,
            cooldownEnd: this._cooldowns.get(itemId)
        });

        return true;
    }

    private applyItemEffect(config: ItemConfig): void {
        const params = config.effectParams;

        switch (config.type) {
            case ItemType.INSTANT_DELIVERY:
                EventManager.getInstance().emit('item_instant_delivery', params);
                break;
            case ItemType.BATCH_RESERVE:
                EventManager.getInstance().emit('item_batch_reserve', params);
                break;
            case ItemType.PRICE_LOCK:
                EventManager.getInstance().emit('item_price_lock', params);
                break;
            case ItemType.EMERGENCY_SUPPLY:
                EventManager.getInstance().emit('item_emergency_supply', params);
                break;
            case ItemType.INVENTORY_CHECK_BOOST:
                EventManager.getInstance().emit('item_inventory_check_boost', params);
                break;
            case ItemType.TIME_EXTEND:
                EventManager.getInstance().emit('item_time_extend', params);
                break;
        }
    }

    public getItemCount(itemId: string): number {
        return this._playerItems.get(itemId)?.count || 0;
    }

    public getRemainingCooldown(itemId: string): number {
        const cooldownEnd = this._cooldowns.get(itemId);
        if (!cooldownEnd) return 0;
        return Math.max(0, cooldownEnd - Date.now());
    }

    public getCooldownPercent(itemId: string): number {
        const config = ConfigManager.getInstance().findById<ItemConfig>(ConfigKeys.ITEMS, itemId);
        if (!config) return 0;

        const remaining = this.getRemainingCooldown(itemId);
        const total = config.cooldownSeconds * 1000;
        return total > 0 ? remaining / total : 0;
    }

    public addItem(itemId: string, count: number = 1): void {
        const playerItem = this._playerItems.get(itemId);
        const config = ConfigManager.getInstance().findById<ItemConfig>(ConfigKeys.ITEMS, itemId);
        if (!config) return;

        if (!playerItem) {
            this._playerItems.set(itemId, {
                itemId,
                count,
                lastUsedTime: 0
            });
        } else {
            playerItem.count = Math.min(playerItem.count + count, config.maxStack);
        }
    }

    public getAllPlayerItems(): PlayerItem[] {
        return Array.from(this._playerItems.values());
    }

    public getAvailableItems(): ItemConfig[] {
        return ConfigManager.getInstance().getListConfig<ItemConfig>(ConfigKeys.ITEMS);
    }

    public update(): void {
        const now = Date.now();
        for (const [itemId, cooldownEnd] of this._cooldowns) {
            if (now >= cooldownEnd) {
                this._cooldowns.delete(itemId);
                EventManager.getInstance().emit(GameEvents.ITEM_COOLDOWN_CHANGED, {
                    itemId,
                    cooldownEnd: 0
                });
            }
        }
    }

    public reset(): void {
        this._playerItems.clear();
        this._cooldowns.clear();
    }
}
