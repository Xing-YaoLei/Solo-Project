export enum SeatStatus {
    AVAILABLE = 'available',
    SOLD = 'sold',
    SELECTED = 'selected',
    LOCKED = 'locked',
    OCCUPIED = 'occupied'
}

export enum TicketType {
    VIP = 'vip',
    PREMIUM = 'premium',
    STANDARD = 'standard',
    STUDENT = 'student',
    GROUP = 'group'
}

export interface Seat {
    id: string;
    row: number;
    col: number;
    section: string;
    status: SeatStatus;
    ticketType: TicketType;
    price: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface TicketRule {
    id: string;
    ticketType: TicketType;
    name: string;
    description: string;
    basePrice: number;
    maxPerOrder: number;
    sections: string[];
    requirements: {
        idRequired: boolean;
        studentIdRequired?: boolean;
        groupSizeMinimum?: number;
        ageLimit?: { min: number; max: number };
    };
    refundPolicy: {
        refundable: boolean;
        deadlineHours: number;
        feePercentage: number;
    };
    validTime?: {
        startDate: string;
        endDate: string;
    };
    exchangeAllowed: boolean;
}

export interface OrderItem {
    seatId: string;
    ticketType: TicketType;
    price: number;
    valid: boolean;
}

export interface Order {
    id: string;
    customerName: string;
    items: OrderItem[];
    totalPrice: number;
    createdAt: number;
    paymentMethod: string;
    status: OrderStatus;
    requirements: {
        hasId: boolean;
        hasStudentId?: boolean;
        groupSize?: number;
        customerAge?: number;
    };
    isDiscounted: boolean;
    discountCode?: string;
}

export enum OrderStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    CONFIRMED = 'confirmed',
    REJECTED = 'rejected',
    REFUNDED = 'refunded'
}

export interface LevelConfig {
    id: number;
    name: string;
    description: string;
    difficulty: 'easy' | 'normal' | 'hard' | 'expert';
    duration: number;
    venueName: string;
    eventName: string;
    targetOrders: number;
    maxErrors: number;
    ticketRules: TicketRule[];
    seatMapTiled: string;
    orderSpawnRate: number;
    complexOrdersChance: number;
    rewardMultiplier: number;
}

export interface GameStats {
    levelId: number;
    ordersProcessed: number;
    ordersCorrect: number;
    ordersRejected: number;
    correctRejections: number;
    errors: number;
    maxConsecutiveCorrect: number;
    currentConsecutiveCorrect: number;
    totalTime: number;
    processingStartTime: number;
    averageProcessingTime: number;
    processingTimes: number[];
    ticketsSold: number;
    revenue: number;
    seatsUtilization: number;
}

export interface LevelResult {
    levelId: number;
    passed: boolean;
    stats: GameStats;
    score: number;
    efficiencyScore: number;
    speedScore: number;
    accuracyScore: number;
    timestamp: number;
}

export interface Settings {
    soundEnabled: boolean;
    musicVolume: number;
    sfxVolume: number;
    vibrationEnabled: boolean;
    animationIntensity: 'off' | 'low' | 'medium' | 'high';
    showTooltips: boolean;
    keyboardShortcuts: boolean;
    autoCheckAnswers: boolean;
}

export interface ReviewRecord {
    levelId: number;
    levelName: string;
    difficulty: string;
    ordersPerMinute: number;
    accuracy: number;
    avgProcessingTime: number;
    consecutiveMax: number;
    efficiency: number;
    score: number;
    timestamp: number;
}

export const TICKET_TYPE_COLORS: Record<TicketType, string> = {
    [TicketType.VIP]: '#FFD700',
    [TicketType.PREMIUM]: '#9B59B6',
    [TicketType.STANDARD]: '#3498DB',
    [TicketType.STUDENT]: '#2ECC71',
    [TicketType.GROUP]: '#E67E22'
};

export const TICKET_TYPE_NAMES: Record<TicketType, string> = {
    [TicketType.VIP]: 'VIP票',
    [TicketType.PREMIUM]: '高级票',
    [TicketType.STANDARD]: '标准票',
    [TicketType.STUDENT]: '学生票',
    [TicketType.GROUP]: '团体票'
};
