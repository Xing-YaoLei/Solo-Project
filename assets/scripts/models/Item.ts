export enum ItemType {
    INSTANT_DELIVERY = 'instant_delivery',
    BATCH_RESERVE = 'batch_reserve',
    PRICE_LOCK = 'price_lock',
    EMERGENCY_SUPPLY = 'emergency_supply',
    INVENTORY_CHECK_BOOST = 'inventory_check_boost',
    TIME_EXTEND = 'time_extend'
}

export interface ItemConfig {
    id: string;
    name: string;
    type: ItemType;
    description: string;
    icon: string;
    cooldownSeconds: number;
    maxStack: number;
    effectParams: Record<string, number>;
}

export interface PlayerItem {
    itemId: string;
    count: number;
    lastUsedTime?: number;
}
