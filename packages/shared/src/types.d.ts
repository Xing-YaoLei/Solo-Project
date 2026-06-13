import type { RefundStatus, ResponsibilityParty, TimelineAction, UserRole } from './enums';
export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    region?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface RefundOrder {
    id: string;
    orderNo: string;
    customerName: string;
    customerPhone: string;
    region: string;
    community: string;
    groupLeader?: string;
    productName: string;
    productSku?: string;
    quantity: number;
    unitPrice: number;
    refundAmount: number;
    reason: string;
    problemTags: string[];
    status: RefundStatus;
    visitResult?: string;
    responsibility?: ResponsibilityParty;
    assigneeId?: string;
    assignee?: User;
    deadline: Date;
    actualClosedAt?: Date;
    handlingDurationMinutes?: number;
    isUrgent: boolean;
    isTimeout: boolean;
    timeoutCount: number;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: User;
    evidences: RefundEvidence[];
    timelines: RefundTimeline[];
    reminders: RefundReminder[];
}
export interface RefundEvidence {
    id: string;
    refundOrderId: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedById: string;
    uploadedBy?: User;
    note?: string;
    createdAt: Date;
}
export interface RefundTimeline {
    id: string;
    refundOrderId: string;
    action: TimelineAction;
    oldStatus?: RefundStatus;
    newStatus?: RefundStatus;
    oldValue?: string;
    newValue?: string;
    note?: string;
    operatorId?: string;
    operator?: User;
    createdAt: Date;
}
export interface RefundReminder {
    id: string;
    refundOrderId: string;
    recipientId: string;
    recipient?: User;
    message: string;
    channel: string;
    sentAt: Date;
    readAt?: Date;
}
export interface VisitResult {
    id: string;
    code: string;
    name: string;
    description?: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProblemTag {
    id: string;
    name: string;
    color: string;
    thresholdDays: number;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ResponsibilityRule {
    id: string;
    name: string;
    problemTags: string[];
    visitResults: string[];
    regions: string[];
    responsibility: ResponsibilityParty;
    assigneeId?: string;
    assignee?: User;
    priority: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface PaginationParams {
    page: number;
    pageSize: number;
}
export interface RefundFilterParams extends PaginationParams {
    status?: RefundStatus[];
    startDate?: Date;
    endDate?: Date;
    region?: string;
    assigneeId?: string;
    problemTag?: string;
    responsibility?: ResponsibilityParty;
    keyword?: string;
    isTimeout?: boolean;
}
export interface RefundStats {
    total: number;
    pending: number;
    processing: number;
    closed: number;
    timeout: number;
    avgHandlingHours: number;
    totalRefundAmount: number;
}
export interface CloseDurationAnalysis {
    avgDuration: number;
    medianDuration: number;
    p95Duration: number;
    totalClosed?: number;
    onTimeRate?: number;
    distribution: {
        range: string;
        count: number;
    }[];
    byRegion: {
        region: string;
        avgDuration: number;
        medianDuration?: number;
        count: number;
    }[];
    byResponsibility: {
        responsibility: string;
        avgDuration: number;
        count: number;
    }[];
}
export interface TrendAnalysis {
    date: string;
    count: number;
    totalAmount: number;
    avgDuration?: number;
}
export interface PerformanceByAssignee {
    assigneeId: string;
    assigneeName: string;
    totalCount: number;
    avgDuration: number;
    onTimeRate?: number;
}
//# sourceMappingURL=types.d.ts.map