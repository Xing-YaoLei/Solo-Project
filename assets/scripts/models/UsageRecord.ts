export enum UsageType {
    NORMAL_CONSUMPTION = 'normal_consumption',
    WASTE = 'waste',
    DAMAGE = 'damage',
    RETURN = 'return',
    TRANSFER_OUT = 'transfer_out',
    TRANSFER_IN = 'transfer_in'
}

export interface UsageRecord {
    id: string;
    storeId: string;
    ingredientId: string;
    quantity: number;
    type: UsageType;
    batchId?: string;
    relatedOrderId?: string;
    operatorId: string;
    operateTime: number;
    note?: string;
}

export interface InventoryCheckRecord {
    id: string;
    storeId: string;
    ingredientId: string;
    systemQuantity: number;
    actualQuantity: number;
    difference: number;
    checkTime: number;
    operatorId: string;
    resolved: boolean;
    resolveNote?: string;
}
