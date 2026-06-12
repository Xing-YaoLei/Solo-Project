import { IngredientCategory } from './Ingredient';

export interface SupplierItem {
    ingredientId: string;
    price: number;
    minOrderQuantity: number;
    maxOrderQuantity: number;
    leadTimeDays: number;
    discountThreshold?: number;
    discountRate?: number;
}

export enum SupplierRating {
    BRONZE = 'bronze',
    SILVER = 'silver',
    GOLD = 'gold',
    PLATINUM = 'platinum'
}

export interface Supplier {
    id: string;
    name: string;
    rating: SupplierRating;
    items: SupplierItem[];
    categories: IngredientCategory[];
    deliveryFee: number;
    freeDeliveryThreshold: number;
    responseTimeMinutes: number;
    reliabilityScore: number;
    icon: string;
    description: string;
    isActive: boolean;
}
