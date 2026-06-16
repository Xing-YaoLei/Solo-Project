import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { patients } from '../../db/schema';
import { eq, desc, and, ilike, count, or } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import type { PatientStatus, RecordStatus } from '$lib/types';

export const patientRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        search: z.string().optional(),
        status: z.enum(['active', 'inactive', 'archived']).optional()
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;
      const whereConditions = [];

      if (input.search) {
        whereConditions.push(
          or(
            ilike(patients.name, `%${input.search}%`),
            ilike(patients.patientNo, `%${input.search}%`),
            ilike(patients.phone, `%${input.search}%`)
          )
        );
      }

      if (input.status) {
        whereConditions.push(eq(patients.status, input.status));
      }

      const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const [totalResult] = await ctx.db.select({ count: count() }).from(patients).where(where);
      const items = await ctx.db
        .select()
        .from(patients)
        .where(where)
        .orderBy(desc(patients.createdAt))
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
      const [patient] = await ctx.db.select().from(patients).where(eq(patients.id, input.id));
      if (!patient) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '患者不存在' });
      }
      return patient;
    }),

  create: protectedProcedure
    .input(
      z.object({
        patientNo: z.string(),
        name: z.string(),
        gender: z.string().optional(),
        birthDate: z.string().optional(),
        phone: z.string().optional(),
        idCard: z.string().optional(),
        address: z.string().optional(),
        remarks: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newPatient] = await ctx.db
        .insert(patients)
        .values({
          ...input,
          createdBy: ctx.user.id
        })
        .returning();
      return newPatient;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        patientNo: z.string().optional(),
        name: z.string().optional(),
        gender: z.string().optional(),
        birthDate: z.string().optional(),
        phone: z.string().optional(),
        idCard: z.string().optional(),
        address: z.string().optional(),
        status: z.enum(['active', 'inactive', 'archived']).optional(),
        remarks: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(patients)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(patients.id, id))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(patients).set({ status: 'archived' }).where(eq(patients.id, input.id));
      return { success: true };
    })
});
