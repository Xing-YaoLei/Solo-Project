import { z } from 'zod';
import { RefundStatus, ResponsibilityParty, TimelineAction, ReminderChannel } from './enums';
export declare const createRefundOrderDto: z.ZodObject<{
    orderNo: z.ZodString;
    customerName: z.ZodString;
    customerPhone: z.ZodString;
    region: z.ZodString;
    community: z.ZodString;
    groupLeader: z.ZodOptional<z.ZodString>;
    productName: z.ZodString;
    productSku: z.ZodOptional<z.ZodString>;
    quantity: z.ZodNumber;
    unitPrice: z.ZodNumber;
    refundAmount: z.ZodNumber;
    reason: z.ZodString;
    problemTags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    deadline: z.ZodDate;
    isUrgent: z.ZodDefault<z.ZodBoolean>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    region?: string;
    problemTags?: string[];
    orderNo?: string;
    customerName?: string;
    customerPhone?: string;
    community?: string;
    groupLeader?: string;
    productName?: string;
    productSku?: string;
    quantity?: number;
    unitPrice?: number;
    refundAmount?: number;
    reason?: string;
    deadline?: Date;
    isUrgent?: boolean;
    note?: string;
}, {
    region?: string;
    problemTags?: string[];
    orderNo?: string;
    customerName?: string;
    customerPhone?: string;
    community?: string;
    groupLeader?: string;
    productName?: string;
    productSku?: string;
    quantity?: number;
    unitPrice?: number;
    refundAmount?: number;
    reason?: string;
    deadline?: Date;
    isUrgent?: boolean;
    note?: string;
}>;
export declare const updateRefundOrderDto: z.ZodObject<{
    orderNo: z.ZodOptional<z.ZodString>;
    customerName: z.ZodOptional<z.ZodString>;
    customerPhone: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
    community: z.ZodOptional<z.ZodString>;
    groupLeader: z.ZodOptional<z.ZodString>;
    productName: z.ZodOptional<z.ZodString>;
    productSku: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodNumber>;
    unitPrice: z.ZodOptional<z.ZodNumber>;
    refundAmount: z.ZodOptional<z.ZodNumber>;
    reason: z.ZodOptional<z.ZodString>;
    problemTags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof RefundStatus>>;
    visitResult: z.ZodOptional<z.ZodString>;
    responsibility: z.ZodOptional<z.ZodNativeEnum<typeof ResponsibilityParty>>;
    assigneeId: z.ZodOptional<z.ZodString>;
    deadline: z.ZodOptional<z.ZodDate>;
    isUrgent: z.ZodOptional<z.ZodBoolean>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    region?: string;
    problemTags?: string[];
    assigneeId?: string;
    orderNo?: string;
    customerName?: string;
    customerPhone?: string;
    community?: string;
    groupLeader?: string;
    productName?: string;
    productSku?: string;
    quantity?: number;
    unitPrice?: number;
    refundAmount?: number;
    reason?: string;
    status?: RefundStatus;
    visitResult?: string;
    responsibility?: ResponsibilityParty;
    deadline?: Date;
    isUrgent?: boolean;
    note?: string;
}, {
    region?: string;
    problemTags?: string[];
    assigneeId?: string;
    orderNo?: string;
    customerName?: string;
    customerPhone?: string;
    community?: string;
    groupLeader?: string;
    productName?: string;
    productSku?: string;
    quantity?: number;
    unitPrice?: number;
    refundAmount?: number;
    reason?: string;
    status?: RefundStatus;
    visitResult?: string;
    responsibility?: ResponsibilityParty;
    deadline?: Date;
    isUrgent?: boolean;
    note?: string;
}>;
export declare const assignOrderDto: z.ZodObject<{
    assigneeId: z.ZodString;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    assigneeId?: string;
    note?: string;
}, {
    assigneeId?: string;
    note?: string;
}>;
export declare const updateStatusDto: z.ZodObject<{
    status: z.ZodNativeEnum<typeof RefundStatus>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: RefundStatus;
    note?: string;
}, {
    status?: RefundStatus;
    note?: string;
}>;
export declare const addEvidenceDto: z.ZodObject<{
    fileName: z.ZodString;
    fileUrl: z.ZodString;
    fileType: z.ZodString;
    fileSize: z.ZodNumber;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    note?: string;
    fileName?: string;
    fileUrl?: string;
    fileType?: string;
    fileSize?: number;
}, {
    note?: string;
    fileName?: string;
    fileUrl?: string;
    fileType?: string;
    fileSize?: number;
}>;
export declare const addNoteDto: z.ZodObject<{
    note: z.ZodString;
    action: z.ZodOptional<z.ZodNativeEnum<typeof TimelineAction>>;
}, "strip", z.ZodTypeAny, {
    note?: string;
    action?: TimelineAction;
}, {
    note?: string;
    action?: TimelineAction;
}>;
export declare const retryOrderDto: z.ZodObject<{
    reason: z.ZodString;
    newDeadline: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    reason?: string;
    newDeadline?: Date;
}, {
    reason?: string;
    newDeadline?: Date;
}>;
export declare const supplementOrderDto: z.ZodObject<{
    reason: z.ZodString;
    requiredInfo: z.ZodString;
    newDeadline: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    reason?: string;
    newDeadline?: Date;
    requiredInfo?: string;
}, {
    reason?: string;
    newDeadline?: Date;
    requiredInfo?: string;
}>;
export declare const closeOrderDto: z.ZodObject<{
    result: z.ZodString;
    finalAmount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    result?: string;
    finalAmount?: number;
}, {
    result?: string;
    finalAmount?: number;
}>;
export declare const createVisitResultDto: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    code?: string;
    description?: string;
    sortOrder?: number;
}, {
    name?: string;
    code?: string;
    description?: string;
    sortOrder?: number;
}>;
export declare const createProblemTagDto: z.ZodObject<{
    name: z.ZodString;
    color: z.ZodDefault<z.ZodString>;
    thresholdDays: z.ZodDefault<z.ZodNumber>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    sortOrder?: number;
    color?: string;
    thresholdDays?: number;
}, {
    name?: string;
    sortOrder?: number;
    color?: string;
    thresholdDays?: number;
}>;
export declare const createResponsibilityRuleDto: z.ZodObject<{
    name: z.ZodString;
    problemTags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    visitResults: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    regions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    responsibility: z.ZodNativeEnum<typeof ResponsibilityParty>;
    assigneeId: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    regions?: string[];
    problemTags?: string[];
    assigneeId?: string;
    responsibility?: ResponsibilityParty;
    visitResults?: string[];
    priority?: number;
}, {
    name?: string;
    regions?: string[];
    problemTags?: string[];
    assigneeId?: string;
    responsibility?: ResponsibilityParty;
    visitResults?: string[];
    priority?: number;
}>;
export declare const sendReminderDto: z.ZodObject<{
    recipientIds: z.ZodArray<z.ZodString, "many">;
    message: z.ZodString;
    channel: z.ZodDefault<z.ZodNativeEnum<typeof ReminderChannel>>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    recipientIds?: string[];
    channel?: ReminderChannel;
}, {
    message?: string;
    recipientIds?: string[];
    channel?: ReminderChannel;
}>;
export type CreateRefundOrderDto = z.infer<typeof createRefundOrderDto>;
export type UpdateRefundOrderDto = z.infer<typeof updateRefundOrderDto>;
export type AssignOrderDto = z.infer<typeof assignOrderDto>;
export type UpdateStatusDto = z.infer<typeof updateStatusDto>;
export type AddEvidenceDto = z.infer<typeof addEvidenceDto>;
export type AddNoteDto = z.infer<typeof addNoteDto>;
export type RetryOrderDto = z.infer<typeof retryOrderDto>;
export type SupplementOrderDto = z.infer<typeof supplementOrderDto>;
export type CloseOrderDto = z.infer<typeof closeOrderDto>;
export type CreateVisitResultDto = z.infer<typeof createVisitResultDto>;
export type CreateProblemTagDto = z.infer<typeof createProblemTagDto>;
export type CreateResponsibilityRuleDto = z.infer<typeof createResponsibilityRuleDto>;
export type SendReminderDto = z.infer<typeof sendReminderDto>;
//# sourceMappingURL=dtos.d.ts.map