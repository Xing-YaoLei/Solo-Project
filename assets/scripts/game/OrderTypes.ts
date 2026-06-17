export type OrderType = 'repair' | 'maintenance' | 'complaint' | 'emergency' | 'consultation';
export type OrderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type OrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'timeout';
export type RepairCategory = 'electrical' | 'plumbing' | 'structure' | 'equipment' | 'other';
export type LocationType = 'residential' | 'commercial' | 'public' | 'parking' | 'outdoor';

export interface IOrderLocation {
    building: string;
    floor: string;
    room: string;
    description: string;
    coordinates?: { x: number; y: number };
}

export interface IOrderReward {
    score: number;
    experience?: number;
    unlockRule?: string;
}

export interface IOrderPenalty {
    scoreDeduction: number;
    errorType: string;
    description: string;
    requiresReview: boolean;
}

export interface IChoiceResult {
    isCorrect: boolean;
    nextState: string;
    reward?: IOrderReward;
    penalty?: IOrderPenalty;
    feedback: string;
    unlockedClues?: string[];
    endOrder?: boolean;
    changeAssignedWorker?: string;
}

export interface IChoice {
    id: string;
    text: string;
    requiredClues?: string[];
    condition?: (context: IOrderContext) => boolean;
    result: IChoiceResult;
}

export interface IClue {
    id: string;
    title: string;
    description: string;
    category: string;
    isHidden: boolean;
    discoveredAt?: number;
    importance: number;
}

export interface IOrderStage {
    id: string;
    name: string;
    description: string;
    choices: IChoice[];
    autoDiscoverClues?: string[];
}

export interface IOrderContext {
    order: IRepairOrder;
    discoveredClues: string[];
    currentStage: string;
    assignedWorkerId?: string;
    decisionHistory: Array<{ stageId: string; choiceId: string; timestamp: number }>;
    elapsedTime: number;
}

export interface IRepairOrder {
    id: string;
    type: OrderType;
    priority: OrderPriority;
    category: RepairCategory;
    title: string;
    description: string;
    location: IOrderLocation;
    reporter: string;
    reporterPhone?: string;
    timeLimit: number;
    baseReward: number;
    stages: IOrderStage[];
    initialClues: IClue[];
    correctPath: string[];
    commonErrors: IOrderPenalty[];
    createdAt: number;
    deadline: number;
    icon?: string;
    tags?: string[];
}

export interface IActiveOrder extends IRepairOrder {
    status: OrderStatus;
    assignedWorkerId?: string;
    discoveredClueIds: string[];
    currentStageId: string;
    decisionHistory: Array<{ stageId: string; choiceId: string; timestamp: number }>;
    acceptedAt: number;
    completedAt?: number;
    failedAt?: number;
    isFirstAttempt: boolean;
}

export function createActiveOrder(order: IRepairOrder): IActiveOrder {
    return {
        ...order,
        status: 'pending',
        discoveredClueIds: order.initialClues.filter(c => !c.isHidden).map(c => c.id),
        currentStageId: order.stages[0]?.id || '',
        decisionHistory: [],
        acceptedAt: Date.now(),
        isFirstAttempt: true
    };
}

export function getOrderByPriority(priority: OrderPriority): number {
    const priorityMap: Record<OrderPriority, number> = {
        urgent: 4,
        high: 3,
        medium: 2,
        low: 1
    };
    return priorityMap[priority];
}

export function getPriorityColor(priority: OrderPriority): string {
    const colorMap: Record<OrderPriority, string> = {
        urgent: '#FF3B30',
        high: '#FF9500',
        medium: '#FFCC00',
        low: '#34C759'
    };
    return colorMap[priority];
}

export function getStatusText(status: OrderStatus): string {
    const statusMap: Record<OrderStatus, string> = {
        pending: '待受理',
        assigned: '已派单',
        in_progress: '处理中',
        completed: '已完成',
        failed: '处理失败',
        timeout: '已超时'
    };
    return statusMap[status];
}

export function getCategoryText(category: RepairCategory): string {
    const categoryMap: Record<RepairCategory, string> = {
        electrical: '电力维修',
        plumbing: '水暖维修',
        structure: '土建维修',
        equipment: '设备维修',
        other: '其他维修'
    };
    return categoryMap[category];
}
