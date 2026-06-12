import { EventManager, GameEvents } from '../core/EventManager';
import { TimeManager } from '../core/TimeManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { GameManager } from '../core/GameManager';
import { Supplier, SupplierItem } from '../models/Supplier';
import { Order, OrderStatus, OrderItem } from '../models/Order';

export class OrderManager {
    private static _instance: OrderManager | null = null;

    private _orders: Order[] = [];
    private _pendingDeliveries: Map<string, Order> = new Map();

    public static getInstance(): OrderManager {
        if (!this._instance) {
            this._instance = new OrderManager();
        }
        return this._instance;
    }

    public createOrder(
        storeId: string,
        supplierId: string,
        items: Array<{ ingredientId: string; quantity: number }>
    ): Order | null {
        const supplier = ConfigManager.getInstance().findById<Supplier>(ConfigKeys.SUPPLIERS, supplierId);
        if (!supplier || !supplier.isActive) {
            console.error('[OrderManager] Supplier not found or inactive');
            return null;
        }

        const orderItems: OrderItem[] = [];
        let totalAmount = 0;

        for (const item of items) {
            const supplierItem = supplier.items.find(si => si.ingredientId === item.ingredientId);
            if (!supplierItem) {
                console.error(`[OrderManager] Supplier doesn't carry ingredient ${item.ingredientId}`);
                continue;
            }

            if (item.quantity < supplierItem.minOrderQuantity) {
                console.error(`[OrderManager] Quantity below minimum for ${item.ingredientId}`);
                continue;
            }

            if (item.quantity > supplierItem.maxOrderQuantity) {
                console.error(`[OrderManager] Quantity exceeds maximum for ${item.ingredientId}`);
                continue;
            }

            let unitPrice = supplierItem.price;
            if (supplierItem.discountThreshold && item.quantity >= supplierItem.discountThreshold) {
                unitPrice *= (1 - (supplierItem.discountRate || 0));
            }

            orderItems.push({
                ingredientId: item.ingredientId,
                quantity: item.quantity,
                unitPrice
            });

            totalAmount += unitPrice * item.quantity;
        }

        if (orderItems.length === 0) {
            console.error('[OrderManager] No valid items in order');
            return null;
        }

        if (totalAmount < supplier.freeDeliveryThreshold) {
            totalAmount += supplier.deliveryFee;
        }

        if (!GameManager.getInstance().spendCapital(totalAmount)) {
            console.error('[OrderManager] Insufficient capital');
            return null;
        }

        const maxLeadTime = Math.max(...orderItems.map(oi => {
            const si = supplier.items.find(s => s.ingredientId === oi.ingredientId);
            return si ? si.leadTimeDays : 1;
        }));

        const order: Order = {
            id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            storeId,
            supplierId,
            items: orderItems,
            totalAmount,
            status: OrderStatus.PENDING,
            createTime: Date.now(),
            expectedDeliveryTime: Date.now() + maxLeadTime * 60 * 1000
        };

        this._orders.push(order);

        setTimeout(() => this.confirmOrder(order.id), supplier.responseTimeMinutes * 1000);

        EventManager.getInstance().emit(GameEvents.ORDER_CREATED, order);
        GameManager.getInstance().incrementStat('totalOrders');
        GameManager.getInstance().incrementStat('totalSpent', totalAmount);

        return order;
    }

    public confirmOrder(orderId: string): void {
        const order = this._orders.find(o => o.id === orderId);
        if (!order || order.status !== OrderStatus.PENDING) return;

        order.status = OrderStatus.CONFIRMED;
        order.confirmTime = Date.now();

        EventManager.getInstance().emit(GameEvents.ORDER_STATUS_CHANGED, order);

        const timeToShip = Math.max(500, (order.expectedDeliveryTime - order.confirmTime) * 0.3);
        setTimeout(() => this.shipOrder(order.id), timeToShip);
    }

    public shipOrder(orderId: string): void {
        const order = this._orders.find(o => o.id === orderId);
        if (!order || order.status !== OrderStatus.CONFIRMED) return;

        order.status = OrderStatus.SHIPPED;
        order.shipTime = Date.now();
        this._pendingDeliveries.set(order.id, order);

        EventManager.getInstance().emit(GameEvents.ORDER_STATUS_CHANGED, order);
    }

    public deliverOrder(orderId: string, shortageItems?: string[]): void {
        const order = this._orders.find(o => o.id === orderId);
        if (!order || order.status !== OrderStatus.SHIPPED) return;

        order.status = OrderStatus.DELIVERED;
        order.deliveryTime = Date.now();

        if (shortageItems && shortageItems.length > 0) {
            order.status = OrderStatus.PARTIAL;
            order.shortageNote = `缺货原料: ${shortageItems.join(', ')}`;

            for (const item of order.items) {
                if (shortageItems.includes(item.ingredientId)) {
                    item.isShortage = true;
                    item.receivedQuantity = Math.floor(item.quantity * 0.5);
                    EventManager.getInstance().emit(GameEvents.BATCH_SHORTAGE, {
                        orderId,
                        ingredientId: item.ingredientId,
                        orderedQuantity: item.quantity,
                        receivedQuantity: item.receivedQuantity
                    });
                } else {
                    item.receivedQuantity = item.quantity;
                }
            }

            GameManager.getInstance().incrementStat('shortageCount');
        } else {
            for (const item of order.items) {
                item.receivedQuantity = item.quantity;
            }
        }

        this._pendingDeliveries.delete(orderId);

        EventManager.getInstance().emit(GameEvents.ORDER_STATUS_CHANGED, order);
        EventManager.getInstance().emit(GameEvents.ORDER_DELIVERED, order);
    }

    public cancelOrder(orderId: string, reason: string): boolean {
        const order = this._orders.find(o => o.id === orderId);
        if (!order) return false;
        if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
            return false;
        }

        const refundRatio = order.status === OrderStatus.PENDING ? 1 : 0.5;
        GameManager.getInstance().addCapital(Math.floor(order.totalAmount * refundRatio));

        order.status = OrderStatus.CANCELLED;
        order.cancelledReason = reason;

        this._pendingDeliveries.delete(orderId);
        EventManager.getInstance().emit(GameEvents.ORDER_STATUS_CHANGED, order);

        return true;
    }

    public update(): void {
        const now = Date.now();
        for (const order of this._pendingDeliveries.values()) {
            if (order.status === OrderStatus.SHIPPED && now >= order.expectedDeliveryTime) {
                this.deliverOrder(order.id);
            }
        }
    }

    public getOrder(orderId: string): Order | null {
        return this._orders.find(o => o.id === orderId) || null;
    }

    public getOrdersByStore(storeId: string): Order[] {
        return this._orders.filter(o => o.storeId === storeId);
    }

    public getOrdersByStatus(status: OrderStatus): Order[] {
        return this._orders.filter(o => o.status === status);
    }

    public getPendingDeliveries(): Order[] {
        return Array.from(this._pendingDeliveries.values());
    }

    public getSupplierItem(supplierId: string, ingredientId: string): SupplierItem | null {
        const supplier = ConfigManager.getInstance().findById<Supplier>(ConfigKeys.SUPPLIERS, supplierId);
        if (!supplier) return null;
        return supplier.items.find(si => si.ingredientId === ingredientId) || null;
    }

    public getActiveSuppliers(): Supplier[] {
        const suppliers = ConfigManager.getInstance().getListConfig<Supplier>(ConfigKeys.SUPPLIERS);
        return suppliers.filter(s => s.isActive);
    }

    public getSuppliersByIngredient(ingredientId: string): Supplier[] {
        const suppliers = ConfigManager.getInstance().getListConfig<Supplier>(ConfigKeys.SUPPLIERS);
        return suppliers.filter(s =>
            s.isActive && s.items.some(si => si.ingredientId === ingredientId)
        );
    }

    public reset(): void {
        this._orders = [];
        this._pendingDeliveries.clear();
    }
}
