export enum RandomEventType {
    BATCH_SHORTAGE = 'batch_shortage',
    SUPPLIER_DELAY = 'supplier_delay',
    PRICE_FLUCTUATION = 'price_fluctuation',
    SURGE_DEMAND = 'surge_demand',
    QUALITY_ISSUE = 'quality_issue',
    EQUIPMENT_FAILURE = 'equipment_failure'
}

export interface RandomEventConfig {
    id: string;
    type: RandomEventType;
    name: string;
    description: string;
    icon: string;
    minDurationMinutes: number;
    maxDurationMinutes: number;
    severity: 'low' | 'medium' | 'high';
    affectedIngredients?: string[];
    affectedSuppliers?: string[];
    effectParams: Record<string, number>;
}

export interface ActiveRandomEvent {
    eventId: string;
    configId: string;
    startTime: number;
    endTime: number;
    resolved: boolean;
    resolvedTime?: number;
    note?: string;
}
