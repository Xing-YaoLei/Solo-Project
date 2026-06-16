import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { imagingAttachments } from '../../db/schema';
import { eq, desc, and, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const imagingAttachmentRouter = createTRPCRouter({
  listByPatient: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
        type: z.enum(['xray', 'cbct', 'intraoral', 'panoramic', 'other']).optional(),
        recordId: z.string().optional(),
        treatmentPlanId: z.string().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;
      const whereConditions = [eq(imagingAttachments.patientId, input.patientId)];

      if (input.type) {
        whereConditions.push(eq(imagingAttachments.type, input.type));
      }
      if (input.recordId) {
        whereConditions.push(eq(imagingAttachments.recordId, input.recordId));
      }
      if (input.treatmentPlanId) {
        whereConditions.push(eq(imagingAttachments.treatmentPlanId, input.treatmentPlanId));
      }

      const where = and(...whereConditions);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(imagingAttachments)
        .where(where);

      const items = await ctx.db
        .select()
        .from(imagingAttachments)
        .where(where)
        .orderBy(desc(imagingAttachments.uploadedAt))
        .limit(input.pageSize)
        .offset(offset);

      return {
        items,
        total: totalResult.count,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(totalResult.count / input.pageSize)
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [attachment] = await ctx.db
        .select()
        .from(imagingAttachments)
        .where(eq(imagingAttachments.id, input.id));
      if (!attachment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '影像附件不存在' });
      }
      return attachment;
    }),

  create: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        recordId: z.string().optional(),
        treatmentPlanId: z.string().optional(),
        type: z.enum(['xray', 'cbct', 'intraoral', 'panoramic', 'other']),
        fileName: z.string(),
        fileUrl: z.string(),
        fileSize: z.number().optional(),
        description: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newAttachment] = await ctx.db
        .insert(imagingAttachments)
        .values({
          ...input,
          uploadedBy: ctx.user.id
        })
        .returning();
      return newAttachment;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        type: z.enum(['xray', 'cbct', 'intraoral', 'panoramic', 'other']).optional(),
        description: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(imagingAttachments)
        .set(data)
        .where(eq(imagingAttachments.id, id))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(imagingAttachments).where(eq(imagingAttachments.id, input.id));
      return { success: true };
    })
});
