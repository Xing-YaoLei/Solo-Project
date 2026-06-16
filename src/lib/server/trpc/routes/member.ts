import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../context';
import { members } from '../../db/schema';
import { eq, and, desc, like, count } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';

export const memberRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20)
    }))
    .query(async ({ ctx, input }) => {
      if (!['admin', 'manager'].includes(ctx.user.role)) {
        throw new Error('无权限访问会员档案');
      }

      const whereConditions = [];
      
      if (input.search) {
        whereConditions.push(
          like(members.name, `%${input.search}%`)
        );
      }

      const offset = (input.page - 1) * input.pageSize;

      const [records, total] = await Promise.all([
        ctx.db.query.members.findMany({
          where: and(...whereConditions),
          orderBy: [desc(members.createdAt)],
          limit: input.pageSize,
          offset
        }),
        ctx.db.select({ count: count() }).from(members).where(and(...whereConditions))
      ]);

      return {
        records,
        total: total[0]?.count || 0,
        page: input.page,
        pageSize: input.pageSize
      };
    }),

  get: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (!['admin', 'manager'].includes(ctx.user.role)) {
        throw new Error('无权限访问会员档案');
      }

      const member = await ctx.db.query.members.findFirst({
        where: eq(members.id, input)
      });

      if (!member) {
        throw new Error('会员不存在');
      }

      return member;
    }),

  create: protectedProcedure
    .input(z.object({
      memberNo: z.string(),
      name: z.string(),
      phone: z.string(),
      idCard: z.string().optional(),
      gender: z.string().optional(),
      birthday: z.date().optional(),
      address: z.string().optional(),
      allergyHistory: z.string().optional(),
      medicalHistory: z.string().optional(),
      insuranceCardNo: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!['admin', 'manager'].includes(ctx.user.role)) {
        throw new Error('无权限创建会员');
      }

      const id = generateIdFromEntropySize(21);
      
      const [member] = await ctx.db.insert(members).values({
        id,
        ...input,
        pharmacyId: ctx.user.pharmacyId
      }).returning();

      return member;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      memberNo: z.string().optional(),
      name: z.string().optional(),
      phone: z.string().optional(),
      idCard: z.string().optional(),
      gender: z.string().optional(),
      birthday: z.date().optional(),
      address: z.string().optional(),
      allergyHistory: z.string().optional(),
      medicalHistory: z.string().optional(),
      insuranceCardNo: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!['admin', 'manager'].includes(ctx.user.role)) {
        throw new Error('无权限修改会员');
      }

      const { id, ...updateData } = input;
      
      const [member] = await ctx.db.update(members)
        .set(updateData)
        .where(eq(members.id, id))
        .returning();

      return member;
    })
});
