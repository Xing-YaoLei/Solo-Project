import { z } from 'zod';
import { RefundStatus, ResponsibilityParty, TimelineAction, ReminderChannel } from './enums';

export const createRefundOrderDto = z.object({
  orderNo: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  region: z.string().min(1),
  community: z.string().min(1),
  groupLeader: z.string().optional(),
  productName: z.string().min(1),
  productSku: z.string().optional(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  refundAmount: z.number().min(0),
  reason: z.string().min(1),
  problemTags: z.array(z.string()).default([]),
  deadline: z.coerce.date(),
  isUrgent: z.boolean().default(false),
  note: z.string().optional(),
});

export const updateRefundOrderDto = z.object({
  orderNo: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  region: z.string().optional(),
  community: z.string().optional(),
  groupLeader: z.string().optional(),
  productName: z.string().optional(),
  productSku: z.string().optional(),
  quantity: z.number().min(1).optional(),
  unitPrice: z.number().min(0).optional(),
  refundAmount: z.number().min(0).optional(),
  reason: z.string().optional(),
  problemTags: z.array(z.string()).optional(),
  status: z.nativeEnum(RefundStatus).optional(),
  visitResult: z.string().optional(),
  responsibility: z.nativeEnum(ResponsibilityParty).optional(),
  assigneeId: z.string().optional(),
  deadline: z.coerce.date().optional(),
  isUrgent: z.boolean().optional(),
  note: z.string().optional(),
});

export const assignOrderDto = z.object({
  assigneeId: z.string(),
  note: z.string().optional(),
});

export const updateStatusDto = z.object({
  status: z.nativeEnum(RefundStatus),
  note: z.string().optional(),
});

export const addEvidenceDto = z.object({
  fileName: z.string(),
  fileUrl: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  note: z.string().optional(),
});

export const addNoteDto = z.object({
  note: z.string(),
  action: z.nativeEnum(TimelineAction).optional(),
});

export const retryOrderDto = z.object({
  reason: z.string(),
  newDeadline: z.coerce.date().optional(),
});

export const supplementOrderDto = z.object({
  reason: z.string(),
  requiredInfo: z.string(),
  newDeadline: z.coerce.date().optional(),
});

export const closeOrderDto = z.object({
  result: z.string(),
  finalAmount: z.number().optional(),
});

export const createVisitResultDto = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().default(0),
});

export const createProblemTagDto = z.object({
  name: z.string().min(1),
  color: z.string().default('#3b82f6'),
  thresholdDays: z.number().default(7),
  sortOrder: z.number().default(0),
});

export const createResponsibilityRuleDto = z.object({
  name: z.string().min(1),
  problemTags: z.array(z.string()).default([]),
  visitResults: z.array(z.string()).default([]),
  regions: z.array(z.string()).default([]),
  responsibility: z.nativeEnum(ResponsibilityParty),
  assigneeId: z.string().optional(),
  priority: z.number().default(0),
});

export const sendReminderDto = z.object({
  recipientIds: z.array(z.string()),
  message: z.string(),
  channel: z.nativeEnum(ReminderChannel).default(ReminderChannel.IN_APP),
});

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
