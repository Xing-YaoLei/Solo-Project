import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, createRoleMiddleware } from '../trpc';
import type {
  FlowAttachment,
  FlowRemark,
  FlowHandler,
  EntityType
} from '../../../shared/types';
import {
  mockFlowAttachments,
  mockFlowRemarks,
  mockFlowHandlers,
  generateId
} from '../mockData';

let attachmentsData: FlowAttachment[] = [...mockFlowAttachments];
let remarksData: FlowRemark[] = [...mockFlowRemarks];
const handlersData: FlowHandler[] = [...mockFlowHandlers];

const staffRole = createRoleMiddleware('admin', 'supervisor', 'nurse', 'doctor');

export const flowRouter = createTRPCRouter({
  listAttachments: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(['assessment', 'incident', 'elder', 'medication', 'visit']),
        entityId: z.string().min(1)
      })
    )
    .query(({ input }): FlowAttachment[] => {
      return attachmentsData
        .filter(
          (a) => a.entityType === input.entityType && a.entityId === input.entityId
        )
        .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    }),

  uploadAttachment: protectedProcedure
    .use(staffRole)
    .input(
      z.object({
        entityType: z.enum(['assessment', 'incident', 'elder', 'medication', 'visit']),
        entityId: z.string().min(1),
        fileName: z.string().min(1, '文件名不能为空').max(255),
        fileUrl: z.string().min(1, '文件地址不能为空').max(500),
        fileSize: z.number().optional(),
        mimeType: z.string().max(100).optional()
      })
    )
    .mutation(({ input, ctx }): FlowAttachment => {
      const newAttachment: FlowAttachment = {
        id: generateId(),
        entityType: input.entityType as EntityType,
        entityId: input.entityId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize ?? 0,
        mimeType: input.mimeType ?? '',
        uploadedBy: ctx.user?.name,
        uploadedAt: new Date()
      };
      attachmentsData.unshift(newAttachment);
      return newAttachment;
    }),

  deleteAttachment: protectedProcedure
    .use(staffRole)
    .input(z.string().min(1))
    .mutation(({ input }): { success: boolean } => {
      const index = attachmentsData.findIndex((a) => a.id === input);
      if (index !== -1) {
        attachmentsData.splice(index, 1);
      }
      return { success: true };
    }),

  listRemarks: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(['assessment', 'incident', 'elder', 'medication', 'visit']),
        entityId: z.string().min(1)
      })
    )
    .query(({ input }): FlowRemark[] => {
      return remarksData
        .filter(
          (r) => r.entityType === input.entityType && r.entityId === input.entityId
        )
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }),

  addRemark: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(['assessment', 'incident', 'elder', 'medication', 'visit']),
        entityId: z.string().min(1),
        content: z.string().min(1, '备注内容不能为空')
      })
    )
    .mutation(({ input, ctx }): FlowRemark => {
      const newRemark: FlowRemark = {
        id: generateId(),
        entityType: input.entityType as EntityType,
        entityId: input.entityId,
        content: input.content,
        createdBy: ctx.user?.name,
        createdAt: new Date()
      };
      remarksData.unshift(newRemark);
      return newRemark;
    }),

  listHandlers: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(['assessment', 'incident']),
        entityId: z.string().min(1)
      })
    )
    .query(({ input }): FlowHandler[] => {
      return handlersData
        .filter(
          (h) => h.entityType === input.entityType && h.entityId === input.entityId
        )
        .sort((a, b) => {
          const timeA = a.handledAt?.getTime() ?? 0;
          const timeB = b.handledAt?.getTime() ?? 0;
          return timeA - timeB;
        });
    })
});
