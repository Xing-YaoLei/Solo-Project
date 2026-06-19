export enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    CHECKED_IN = "checked_in",
    CHECKED_OUT = "checked_out",
    CANCELLED = "cancelled",
    NO_SHOW = "no_show",
    EXPIRED = "expired"
}

export enum OrderPriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent"
}

export interface Order {
    id: string;
    channelType: string;
    guestName: string;
    guestCount: number;
    roomId: string | null;
    roomType: string;
    checkIn: string;
    checkOut: string;
    status: OrderStatus;
    priority: OrderPriority;
    price: number;
    deposit: number;
    specialRequests: string[];
    createdAt: number;
    expireAt: number | null;
    isVip: boolean;
}

export interface ChannelOrderPool {
    channelType: string;
    orders: Order[];
    spawnInterval: number;
    maxActive: number;
    cancelRate: number;
}
