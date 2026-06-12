export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    PARTIAL = 'partial'
}

export interface OrderItem {
    ingredientId: string;
    quantity: number;
    unitPrice: number;
    receivedQuantity?: number;
    isShortage?: boolean;
}

export interface Order {
    id: string;
    storeId: string;
    supplierId: string;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatus;
    createTime: number;
    confirmTime?: number;
    shipTime?: number;
    deliveryTime?: number;
    expectedDeliveryTime: number;
    cancelledReason?: string;
    shortageNote?: string;
}

export interface PurchaseRecord {
    orderId: string;
    ingredientId: string;
    quantity: number;
    unitPrice: number;
    purchaseTime: number;
    batchId: string;
}
