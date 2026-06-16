import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../context';
import { drugs, drugBatches } from '../../db/schema';
import { eq, and, desc, like, count, gte } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';

export const drugRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20)
    }))
    .query(async ({ ctx, input }) => {
      const whereConditions = [];
      
      if (input.search) {
        whereConditions.push(
          like(drugs.name, `%${input.search}%`)
        );
      }

      const offset = (input.page - 1) * input.pageSize;

      const [records, total] = await Promise.all([
        ctx.db.query.drugs.findMany({
          where: and(...whereConditions),
          orderBy: [desc(drugs.createdAt)],
          limit: input.pageSize,
          offset
        }),
        ctx.db.select({ count: count() }).from(drugs).where(and(...whereConditions))
      ]);

      return {
        records,
        total: total[0]?.count || 0,
        page: input.page,
        pageSize: input.pageSize
      };
    }),

  getBatches: protectedProcedure
    .input(z.object({
      drugId: z.string().optional(),
      expiringSoon: z.boolean().default(false)
    }))
    .query(async ({ ctx, input }) => {
      const whereConditions = [];
      
      if (input.drugId) {
        whereConditions.push(eq(drugBatches.drugId, input.drugId));
      }
      
      if (input.expiringSoon) {
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
        whereConditions.push(gte(drugBatches.expiryDate, threeMonthsLater));
      }

      const batches = await ctx.db.query.drugBatches.findMany({
        where: and(...whereConditions),
        with: {
          drug: true
        },
        orderBy: [desc(drugBatches.expiryDate)]
      });

      return batches;
    }),

  createBatch: protectedProcedure
    .input(z.object({
      drugId: z.string(),
      batchNo: z.string(),
      productionDate: z.date().optional(),
      expiryDate: z.date(),
      quantity: z.number().default(0)
    }))
    .mutation(async ({ ctx, input }) => {
      const id = generateIdFromEntropySize(21);
      
      const [batch] = await ctx.db.insert(drugBatches).values({
        id,
        ...input,
        pharmacyId: ctx.user.pharmacyId
      }).returning();

      return batch;
    }),

  get: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const drug = await ctx.db.query.drugs.findFirst({
        where: eq(drugs.id, input)
      });

      if (!drug) {
        throw new Error('药品不存在');
      }

      return drug;
    }),

  create: protectedProcedure
    .input(z.object({
      drugCode: z.string(),
      name: z.string(),
      genericName: z.string().optional(),
      specification: z.string().optional(),
      manufacturer: z.string().optional(),
      unit: z.string().optional(),
      category: z.string().optional(),
      usage: z.string().optional(),
      caution: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const id = generateIdFromEntropySize(21);
      
      const [drug] = await ctx.db.insert(drugs).values({
        id,
        ...input
      }).returning();

      return drug;
    })
});
