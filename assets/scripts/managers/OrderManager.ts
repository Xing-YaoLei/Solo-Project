import { _decorator, Component } from 'cc';
import { Order, Position, WrongStep } from '../types/GameTypes';
import { MAP_LOCATIONS } from '../config/GameConfig';
import { v4 as uuidv4 } from '../utils/uuid';

const { ccclass } = _decorator;

@ccclass('OrderManager')
export class OrderManager extends Component {
    private orders: Order[] = [];
    private orderPool: Order[] = [];
    private maxPoolSize = 20;

    onLoad() {
        this.initOrderPool();
    }

    private initOrderPool() {
        for (let i = 0; i < this.maxPoolSize; i++) {
            this.orderPool.push(this.createEmptyOrder());
        }
    }

    private createEmptyOrder(): Order {
        return {
            id: '',
            createdAt: 0,
            pickup: { x: 0, y: 0, name: '', address: '' },
            delivery: { x: 0, y: 0, name: '', address: '' },
            expectedTime: 0,
            basePrice: 0,
            distance: 0,
            priority: 'normal',
            status: 'pending',
            wrongSteps: [],
        };
    }

    generateOrder(currentTime: number, weather: string): Order {
        let order = this.orderPool.pop();
        if (!order) {
            order = this.createEmptyOrder();
        }

        const pickupIdx = Math.floor(Math.random() * MAP_LOCATIONS.length);
        let deliveryIdx = Math.floor(Math.random() * MAP_LOCATIONS.length);
        while (deliveryIdx === pickupIdx) {
            deliveryIdx = Math.floor(Math.random() * MAP_LOCATIONS.length);
        }

        const pickup = MAP_LOCATIONS[pickupIdx];
        const delivery = MAP_LOCATIONS[deliveryIdx];
        const distance = this.calculateDistance(pickup, delivery);

        const priorityRoll = Math.random();
        let priority: Order['priority'] = 'normal';
        if (priorityRoll < 0.7) priority = 'normal';
        else if (priorityRoll < 0.9) priority = 'urgent';
        else priority = 'vip';

        const baseTime = Math.max(15, Math.floor(distance / 100));
        const expectedTime = priority === 'normal' ? baseTime :
                            priority === 'urgent' ? baseTime * 0.7 : baseTime * 0.5;

        const basePrice = Math.floor(8 + distance / 200 + (priority === 'vip' ? 5 : priority === 'urgent' ? 3 : 0));

        order.id = uuidv4();
        order.createdAt = currentTime;
        order.pickup = { ...pickup };
        order.delivery = { ...delivery };
        order.distance = distance;
        order.expectedTime = expectedTime;
        order.basePrice = basePrice;
        order.priority = priority;
        order.status = 'pending';
        order.wrongSteps = [];
        order.riderId = undefined;
        order.acceptedAt = undefined;
        order.pickedAt = undefined;
        order.deliveredAt = undefined;
        order.failedReason = undefined;

        this.orders.push(order);
        return order;
    }

    private calculateDistance(a: Position, b: Position): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy) * 10;
    }

    getPendingOrders(): Order[] {
        return this.orders.filter(o => o.status === 'pending');
    }

    getActiveOrders(): Order[] {
        return this.orders.filter(o => o.status === 'assigned' || o.status === 'picked');
    }

    getOrderById(id: string): Order | undefined {
        return this.orders.find(o => o.id === id);
    }

    updateOrderStatus(orderId: string, status: Order['status'], riderId?: string): boolean {
        const order = this.getOrderById(orderId);
        if (!order) return false;

        order.status = status;
        if (riderId) order.riderId = riderId;
        if (status === 'assigned') order.acceptedAt = Date.now();
        if (status === 'picked') order.pickedAt = Date.now();
        if (status === 'delivered') order.deliveredAt = Date.now();

        return true;
    }

    addWrongStep(orderId: string, wrongStep: Omit<WrongStep, 'time'>): boolean {
        const order = this.getOrderById(orderId);
        if (!order) return false;

        order.wrongSteps.push({
            ...wrongStep,
            time: Date.now(),
        });
        return true;
    }

    getWrongSteps(orderId: string): WrongStep[] {
        const order = this.getOrderById(orderId);
        return order ? order.wrongSteps : [];
    }

    removeCompletedOrders(): Order[] {
        const completed = this.orders.filter(o =>
            o.status === 'delivered' || o.status === 'failed' || o.status === 'rejected'
        );
        this.orders = this.orders.filter(o =>
            o.status === 'pending' || o.status === 'assigned' || o.status === 'picked'
        );
        completed.forEach(o => {
            o.wrongSteps = [];
            o.status = 'pending';
            o.riderId = undefined;
            o.acceptedAt = undefined;
            o.pickedAt = undefined;
            o.deliveredAt = undefined;
            o.failedReason = undefined;
            if (this.orderPool.length < this.maxPoolSize) {
                this.orderPool.push(o);
            }
        });
        return completed;
    }

    clearAll() {
        this.orders.forEach(o => {
            o.wrongSteps = [];
            o.status = 'pending';
            if (this.orderPool.length < this.maxPoolSize) {
                this.orderPool.push(o);
            }
        });
        this.orders = [];
    }

    getAllOrders(): Order[] {
        return [...this.orders];
    }
}
