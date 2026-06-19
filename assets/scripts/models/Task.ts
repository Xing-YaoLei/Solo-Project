export enum TaskType {
    CLEANING = "cleaning",
    MAINTENANCE = "maintenance",
    INSPECTION = "inspection",
    LAUNDRY = "laundry",
    RESTOCK = "restock"
}

export enum TaskStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    EXPIRED = "expired"
}

export interface Task {
    id: string;
    type: TaskType;
    roomId: string;
    orderId?: string;
    description: string;
    status: TaskStatus;
    duration: number;
    elapsed: number;
    startedAt: number | null;
    completedAt: number | null;
    deadline: number | null;
    reward: number;
    penalty: number;
}

export interface TimerTask extends Task {
    timeLimit: number;
    urgency: number;
}
