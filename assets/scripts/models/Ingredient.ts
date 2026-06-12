export enum IngredientCategory {
    COFFEE_BEAN = 'coffee_bean',
    MILK = 'milk',
    SYRUP = 'syrup',
    CUP = 'cup',
    LID = 'lid',
    SUGAR = 'sugar',
    OTHER = 'other'
}

export interface Ingredient {
    id: string;
    name: string;
    category: IngredientCategory;
    unit: string;
    unitPrice: number;
    shelfLifeDays: number;
    safetyStockLevel: number;
    description: string;
    icon: string;
}

export interface StockItem {
    ingredientId: string;
    quantity: number;
    batchId: string;
    productionDate: number;
    expireDate: number;
}

export interface Inventory {
    storeId: string;
    items: Map<string, StockItem[]>;
    lastUpdateTime: number;
}
