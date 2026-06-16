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
import { getDb, type Database } from '../../db';
import * as schema from '../../db/schema';
import { eq, desc, asc, and } from 'drizzle-orm';

function toDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  return date instanceof Date ? date : new Date(date);
}

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
    .query(async ({ input }): Promise<FlowAttachment[]> => {
      const dbInstance = await getDb();
      if (!dbInstance.isMock) {
        const db = dbInstance.db as Database;
        const rows = await db.query.flowAttachments.findMany({
          where: and(
            eq(schema.flowAttachments.entityType, input.entityType as any),
            eq(schema.flowAttachments.entityId, input.entityId)
          ),
          orderBy: [desc(schema.flowAttachments.uploadedAt)]
        });
        return rows.map(a => ({
          id: a.id,
          entityType: a.entityType as any,
          entityId: a.entityId,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          fileSize: a.fileSize ?? 0,
          mimeType: a.mimeType ?? '',
          uploadedBy: a.uploadedBy ?? null,
          uploadedAt: toDate(a.uploadedAt) ?? new Date()
        }));
      }
      return attachmentsData
        .filter(
          (a) => a.entityType === input.entityType && a.entityId === input.entityId
        )
        .sort((a, b) => (toDate(b.uploadedAt)?.getTime() ?? 0) - (toDate(a.uploadedAt)?.getTime() ?? 0));
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
    .mutation(async ({ input, ctx }): Promise<FlowAttachment> => {
      const dbInstance = await getDb();
      const now = new Date();
      const id = generateId();

      if (!dbInstance.isMock) {
        const db = dbInstance.db as Database;
        await db.insert(schema.flowAttachments).values({
          id,
          entityType: input.entityType as any,
          entityId: input.entityId,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          uploadedBy: ctx.user?.name,
          uploadedAt: now
        });
        return {
          id,
          entityType: input.entityType as EntityType,
          entityId: input.entityId,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          fileSize: input.fileSize ?? 0,
          mimeType: input.mimeType ?? '',
          uploadedBy: ctx.user?.name ?? null,
          uploadedAt: now
        };
      }

      const newAttachment: FlowAttachment = {
        id,
        entityType: input.entityType as EntityType,
        entityId: input.entityId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize ?? 0,
        mimeType: input.mimeType ?? '',
        uploadedBy: ctx.user?.name ?? null,
        uploadedAt: now
      };
      attachmentsData.unshift(newAttachment);
      return newAttachment;
    }),

  deleteAttachment: protectedProcedure
    .use(staffRole)
    .input(z.string().min(1))
    .mutation(async ({ input }): Promise<{ success: boolean }> => {
      const dbInstance = await getDb();
      if (!dbInstance.isMock) {
        const db = dbInstance.db as Database;
        await db.delete(schema.flowAttachments)
          .where(eq(schema.flowAttachments.id, input));
        return { success: true };
      }
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
    .query(async ({ input }): Promise<FlowRemark[]> => {
      const dbInstance = await getDb();
      if (!dbInstance.isMock) {
        const db = dbInstance.db as Database;
        const rows = await db.query.flowRemarks.findMany({
          where: and(
            eq(schema.flowRemarks.entityType, input.entityType as any),
            eq(schema.flowRemarks.entityId, input.entityId)
          ),
          orderBy: [asc(schema.flowRemarks.createdAt)]
        });
        return rows.map(r => ({
          id: r.id,
          entityType: r.entityType as any,
          entityId: r.entityId,
          content: r.content,
          createdBy: r.createdBy ?? null,
          createdAt: toDate(r.createdAt) ?? new Date()
        }));
      }
      return remarksData
        .filter(
          (r) => r.entityType === input.entityType && r.entityId === input.entityId
        )
        .sort((a, b) => (toDate(a.createdAt)?.getTime() ?? 0) - (toDate(b.createdAt)?.getTime() ?? 0));
    }),

  addRemark: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(['assessment', 'incident', 'elder', 'medication', 'visit']),
        entityId: z.string().min(1),
        content: z.string().min(1, '备注内容不能为空')
      })
    )
    .mutation(async ({ input, ctx }): Promise<FlowRemark> => {
      const dbInstance = await getDb();
      const now = new Date();
      const id = generateId();

      if (!dbInstance.isMock) {
        const db = dbInstance.db as Database;
        await db.insert(schema.flowRemarks).values({
          id,
          entityType: input.entityType as any,
          entityId: input.entityId,
          content: input.content,
          createdBy: ctx.user?.name,
          createdAt: now
        });
        return {
          id,
          entityType: input.entityType as EntityType,
          entityId: input.entityId,
          content: input.content,
          createdBy: ctx.user?.name ?? null,
          createdAt: now
        };
      }

      const newRemark: FlowRemark = {
        id,
        entityType: input.entityType as EntityType,
        entityId: input.entityId,
        content: input.content,
        createdBy: ctx.user?.name ?? null,
        createdAt: now
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
    .query(async ({ input }): Promise<FlowHandler[]> => {
      const dbInstance = await getDb();
      if (!dbInstance.isMock) {
        const db = dbInstance.db as Database;
        const rows = await db.query.flowHandlers.findMany({
          where: and(
            eq(schema.flowHandlers.entityType, input.entityType as any),
            eq(schema.flowHandlers.entityId, input.entityId)
          ),
          orderBy: [asc(schema.flowHandlers.handledAt)]
        });
        return rows.map(h => ({
          id: h.id,
          entityType: h.entityType as any,
          entityId: h.entityId,
          stepName: h.stepName,
          userId: h.userId ?? null,
          userName: h.userName,
          handledAt: toDate(h.handledAt),
          action: h.action ?? ''
        }));
      }
      return handlersData
        .filter(
          (h) => h.entityType === input.entityType && h.entityId === input.entityId
        )
        .sort((a, b) => {
          const timeA = toDate(a.handledAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
          const timeB = toDate(b.handledAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
          return timeA - timeB;
        });
    })
});
