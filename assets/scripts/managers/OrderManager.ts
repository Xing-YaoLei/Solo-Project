import { _decorator, Component } from "cc";
import { Order, OrderStatus, OrderPriority, ChannelOrderPool } from "../models/Order";
import { ChannelType, Channel } from "../models/Channel";
import { LevelConfig } from "../models/Config";

const { ccclass } = _decorator;

@ccclass("OrderManager")
export class OrderManager extends Component {
    private orders: Map<string, Order> = new Map();
    private activePool: ChannelOrderPool[] = [];
    private channels: Map<string, Channel> = new Map();
    private levelConfig: LevelConfig | null = null;
    private spawnTimer: number = 0;
    private orderIdCounter: number = 0;
    private onOrderAdded: ((order: Order) => void) | null = null;
    private onOrderExpired: ((order: Order) => void) | null = null;
    private onOrderCancelled: ((order: Order) => void) | null = null;

    public init(config: LevelConfig, channels: Channel[]): void {
        this.levelConfig = config;
        this.orders.clear();
        this.activePool = [];
        this.orderIdCounter = 0;
        this.channels.clear();

        for (const ch of channels) {
            if (config.channelTypes.includes(ch.type as ChannelType)) {
                this.channels.set(ch.type, ch);
                this.activePool.push({
                    channelType: ch.type,
                    orders: [],
                    spawnInterval: this.calculateSpawnInterval(ch, config),
                    maxActive: Math.ceil(config.roomCount * ch.orderWeight),
                    cancelRate: ch.cancelProbability
                });
            }
        }
    }

    private calculateSpawnInterval(channel: Channel, config: LevelConfig): number {
        const baseInterval = 10 / config.orderFrequency;
        return baseInterval / channel.orderWeight;
    }

    public update(dt: number): void {
        if (!this.levelConfig) return;

        this.spawnTimer += dt;

        for (const pool of this.activePool) {
            if (this.spawnTimer >= pool.spawnInterval) {
                if (pool.orders.length < pool.maxActive) {
                    this.spawnOrder(pool);
                }
            }
        }

        if (this.spawnTimer >= 10) {
            this.spawnTimer = 0;
        }

        this.checkExpirations(dt);
        this.checkCancellations();
    }

    private spawnOrder(pool: ChannelOrderPool): void {
        const channel = this.channels.get(pool.channelType);
        if (!channel || !this.levelConfig) return;

        const id = `order_${++this.orderIdCounter}`;
        const guestNames = ["张先生", "李女士", "王先生", "赵女士", "刘先生", "陈女士", "杨先生", "黄女士"];
        const roomTypes = this.levelConfig.roomTypes;
        const selectedType = roomTypes[Math.floor(Math.random() * roomTypes.length)];

        const leadDays = Math.floor(Math.random() * channel.avgLeadTime) + 1;
        const stayDays = Math.floor(Math.random() * 3) + 1;

        const checkInDate = new Date();
        checkInDate.setDate(checkInDate.getDate() + leadDays);
        const checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkOutDate.getDate() + stayDays);

        const priorities = [OrderPriority.LOW, OrderPriority.NORMAL, OrderPriority.NORMAL, OrderPriority.HIGH];
        const priority = channel.orderWeight > 0.2
            ? priorities[Math.floor(Math.random() * priorities.length)]
            : OrderPriority.NORMAL;

        const now = Date.now();
        const expireSeconds = 30 + Math.floor(Math.random() * 30);

        const order: Order = {
            id,
            channelType: pool.channelType,
            guestName: guestNames[Math.floor(Math.random() * guestNames.length)],
            guestCount: Math.floor(Math.random() * 3) + 1,
            roomId: null,
            roomType: selectedType,
            checkIn: this.formatDate(checkInDate),
            checkOut: this.formatDate(checkOutDate),
            status: OrderStatus.PENDING,
            priority,
            price: this.calculatePrice(selectedType, stayDays),
            deposit: 0,
            specialRequests: [],
            createdAt: now,
            expireAt: now + expireSeconds * 1000,
            isVip: Math.random() < 0.15
        };

        this.orders.set(id, order);
        pool.orders.push(order);

        if (this.onOrderAdded) {
            this.onOrderAdded(order);
        }
    }

    private formatDate(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }

    private calculatePrice(roomType: string, days: number): number {
        const base: Record<string, number> = { standard: 200, deluxe: 380, suite: 600, family: 480 };
        return (base[roomType] || 200) * days;
    }

    private checkExpirations(dt: number): void {
        const now = Date.now();
        for (const [id, order] of this.orders) {
            if (order.status === OrderStatus.PENDING && order.expireAt && now >= order.expireAt) {
                order.status = OrderStatus.EXPIRED;
                this.removeFromPool(order);
                if (this.onOrderExpired) {
                    this.onOrderExpired(order);
                }
            }
        }
    }

    private checkCancellations(): void {
        for (const pool of this.activePool) {
            const toCancel: Order[] = [];
            for (const order of pool.orders) {
                if (order.status === OrderStatus.CONFIRMED && Math.random() < pool.cancelRate * 0.001) {
                    toCancel.push(order);
                }
            }
            for (const order of toCancel) {
                order.status = OrderStatus.CANCELLED;
                this.removeFromPool(order);
                if (this.onOrderCancelled) {
                    this.onOrderCancelled(order);
                }
            }
        }
    }

    private removeFromPool(order: Order): void {
        for (const pool of this.activePool) {
            const idx = pool.orders.indexOf(order);
            if (idx >= 0) {
                pool.orders.splice(idx, 1);
                break;
            }
        }
    }

    public confirmOrder(orderId: string, roomId: string): boolean {
        const order = this.orders.get(orderId);
        if (!order || order.status !== OrderStatus.PENDING) return false;
        order.status = OrderStatus.CONFIRMED;
        order.roomId = roomId;
        this.removeFromPool(order);
        return true;
    }

    public checkInOrder(orderId: string): boolean {
        const order = this.orders.get(orderId);
        if (!order || order.status !== OrderStatus.CONFIRMED) return false;
        order.status = OrderStatus.CHECKED_IN;
        return true;
    }

    public checkOutOrder(orderId: string): boolean {
        const order = this.orders.get(orderId);
        if (!order || order.status !== OrderStatus.CHECKED_IN) return false;
        order.status = OrderStatus.CHECKED_OUT;
        return true;
    }

    public cancelOrder(orderId: string): boolean {
        const order = this.orders.get(orderId);
        if (!order) return false;
        if (order.status === OrderStatus.CHECKED_IN || order.status === OrderStatus.CHECKED_OUT) return false;
        order.status = OrderStatus.CANCELLED;
        this.removeFromPool(order);
        if (this.onOrderCancelled) {
            this.onOrderCancelled(order);
        }
        return true;
    }

    public getPendingOrders(): Order[] {
        return Array.from(this.orders.values()).filter(o => o.status === OrderStatus.PENDING);
    }

    public getConfirmedOrders(): Order[] {
        return Array.from(this.orders.values()).filter(o => o.status === OrderStatus.CONFIRMED);
    }

    public getOrder(orderId: string): Order | undefined {
        return this.orders.get(orderId);
    }

    public getAllOrders(): Order[] {
        return Array.from(this.orders.values());
    }

    public setOnOrderAdded(cb: (order: Order) => void): void {
        this.onOrderAdded = cb;
    }

    public setOnOrderExpired(cb: (order: Order) => void): void {
        this.onOrderExpired = cb;
    }

    public setOnOrderCancelled(cb: (order: Order) => void): void {
        this.onOrderCancelled = cb;
    }

    public getActivePoolInfo(): ChannelOrderPool[] {
        return this.activePool;
    }

    public reset(): void {
        this.orders.clear();
        this.activePool = [];
        this.levelConfig = null;
        this.orderIdCounter = 0;
    }
}
