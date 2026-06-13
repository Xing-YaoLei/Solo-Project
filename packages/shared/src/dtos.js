"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendReminderDto = exports.createResponsibilityRuleDto = exports.createProblemTagDto = exports.createVisitResultDto = exports.closeOrderDto = exports.supplementOrderDto = exports.retryOrderDto = exports.addNoteDto = exports.addEvidenceDto = exports.updateStatusDto = exports.assignOrderDto = exports.updateRefundOrderDto = exports.createRefundOrderDto = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
exports.createRefundOrderDto = zod_1.z.object({
    orderNo: zod_1.z.string().min(1),
    customerName: zod_1.z.string().min(1),
    customerPhone: zod_1.z.string().min(1),
    region: zod_1.z.string().min(1),
    community: zod_1.z.string().min(1),
    groupLeader: zod_1.z.string().optional(),
    productName: zod_1.z.string().min(1),
    productSku: zod_1.z.string().optional(),
    quantity: zod_1.z.number().min(1),
    unitPrice: zod_1.z.number().min(0),
    refundAmount: zod_1.z.number().min(0),
    reason: zod_1.z.string().min(1),
    problemTags: zod_1.z.array(zod_1.z.string()).default([]),
    deadline: zod_1.z.coerce.date(),
    isUrgent: zod_1.z.boolean().default(false),
    note: zod_1.z.string().optional(),
});
exports.updateRefundOrderDto = zod_1.z.object({
    orderNo: zod_1.z.string().optional(),
    customerName: zod_1.z.string().optional(),
    customerPhone: zod_1.z.string().optional(),
    region: zod_1.z.string().optional(),
    community: zod_1.z.string().optional(),
    groupLeader: zod_1.z.string().optional(),
    productName: zod_1.z.string().optional(),
    productSku: zod_1.z.string().optional(),
    quantity: zod_1.z.number().min(1).optional(),
    unitPrice: zod_1.z.number().min(0).optional(),
    refundAmount: zod_1.z.number().min(0).optional(),
    reason: zod_1.z.string().optional(),
    problemTags: zod_1.z.array(zod_1.z.string()).optional(),
    status: zod_1.z.nativeEnum(enums_1.RefundStatus).optional(),
    visitResult: zod_1.z.string().optional(),
    responsibility: zod_1.z.nativeEnum(enums_1.ResponsibilityParty).optional(),
    assigneeId: zod_1.z.string().optional(),
    deadline: zod_1.z.coerce.date().optional(),
    isUrgent: zod_1.z.boolean().optional(),
    note: zod_1.z.string().optional(),
});
exports.assignOrderDto = zod_1.z.object({
    assigneeId: zod_1.z.string(),
    note: zod_1.z.string().optional(),
});
exports.updateStatusDto = zod_1.z.object({
    status: zod_1.z.nativeEnum(enums_1.RefundStatus),
    note: zod_1.z.string().optional(),
});
exports.addEvidenceDto = zod_1.z.object({
    fileName: zod_1.z.string(),
    fileUrl: zod_1.z.string(),
    fileType: zod_1.z.string(),
    fileSize: zod_1.z.number(),
    note: zod_1.z.string().optional(),
});
exports.addNoteDto = zod_1.z.object({
    note: zod_1.z.string(),
    action: zod_1.z.nativeEnum(enums_1.TimelineAction).optional(),
});
exports.retryOrderDto = zod_1.z.object({
    reason: zod_1.z.string(),
    newDeadline: zod_1.z.coerce.date().optional(),
});
exports.supplementOrderDto = zod_1.z.object({
    reason: zod_1.z.string(),
    requiredInfo: zod_1.z.string(),
    newDeadline: zod_1.z.coerce.date().optional(),
});
exports.closeOrderDto = zod_1.z.object({
    result: zod_1.z.string(),
    finalAmount: zod_1.z.number().optional(),
});
exports.createVisitResultDto = zod_1.z.object({
    code: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    sortOrder: zod_1.z.number().default(0),
});
exports.createProblemTagDto = zod_1.z.object({
    name: zod_1.z.string().min(1),
    color: zod_1.z.string().default('#3b82f6'),
    thresholdDays: zod_1.z.number().default(7),
    sortOrder: zod_1.z.number().default(0),
});
exports.createResponsibilityRuleDto = zod_1.z.object({
    name: zod_1.z.string().min(1),
    problemTags: zod_1.z.array(zod_1.z.string()).default([]),
    visitResults: zod_1.z.array(zod_1.z.string()).default([]),
    regions: zod_1.z.array(zod_1.z.string()).default([]),
    responsibility: zod_1.z.nativeEnum(enums_1.ResponsibilityParty),
    assigneeId: zod_1.z.string().optional(),
    priority: zod_1.z.number().default(0),
});
exports.sendReminderDto = zod_1.z.object({
    recipientIds: zod_1.z.array(zod_1.z.string()),
    message: zod_1.z.string(),
    channel: zod_1.z.nativeEnum(enums_1.ReminderChannel).default(enums_1.ReminderChannel.IN_APP),
});
//# sourceMappingURL=dtos.js.map