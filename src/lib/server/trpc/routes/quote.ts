import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../t';
import { db } from '$db';
import { quoteItems, quoteParts } from '$db/schema';
import { eq, and, ilike, asc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

const quotePartSchema = z.object({
  partNumber: z.string(),
  partName: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0)
});

export const quoteRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        keyword: z.string().optional(),
        isActive: z.boolean().optional()
      })
    )
    .query(async ({ input }) => {
      const where = [];
      if (input.category) {
        where.push(eq(quoteItems.category, input.category));
      }
      if (input.keyword) {
        where.push(ilike(quoteItems.name, `%${input.keyword}%`));
      }
      if (input.isActive !== undefined) {
        where.push(eq(quoteItems.isActive, input.isActive));
      }

      const items = await db
        .select()
        .from(quoteItems)
        .where(and(...where))
        .orderBy(asc(quoteItems.category), asc(quoteItems.name));

      const itemsWithParts = await Promise.all(
        items.map(async (item) => {
          const parts = await db.select().from(quoteParts).where(eq(quoteParts.quoteItemId, item.id));
          return { ...item, parts };
        })
      );

      return itemsWithParts;
    }),

  getCategories: protectedProcedure.query(async () => {
    const result = await db
      .selectDistinct({ category: quoteItems.category })
      .from(quoteItems)
      .where(eq(quoteItems.isActive, true))
      .orderBy(asc(quoteItems.category));
    return result.map((r) => r.category);
  }),

  get: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const [item] = await db.select().from(quoteItems).where(eq(quoteItems.id, input)).limit(1);
      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '报价项目不存在' });
      }
      const parts = await db.select().from(quoteParts).where(eq(quoteParts.quoteItemId, input));
      return { ...item, parts };
    }),

  create: adminProcedure
    .input(
      z.object({
        category: z.string().min(1),
        name: z.string().min(1),
        code: z.string().min(1),
        laborHours: z.number().min(0),
        laborPrice: z.number().min(0),
        description: z.string().optional(),
        parts: z.array(quotePartSchema).default([]),
        isActive: z.boolean().default(true)
      })
    )
    .mutation(async ({ input }) => {
      return await db.transaction(async (tx) => {
        const [newItem] = await tx
          .insert(quoteItems)
          .values({
            category: input.category,
            name: input.name,
            code: input.code,
            laborHours: input.laborHours.toString(),
            laborPrice: input.laborPrice.toString(),
            description: input.description,
            isActive: input.isActive
          })
          .returning();

        if (input.parts.length > 0) {
          await tx.insert(quoteParts).values(
            input.parts.map((p) => ({
              quoteItemId: newItem.id,
              partNumber: p.partNumber,
              partName: p.partName,
              quantity: p.quantity,
              unitPrice: p.unitPrice.toString()
            }))
          );
        }

        return { ...newItem, parts: input.parts };
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        category: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        code: z.string().min(1).optional(),
        laborHours: z.number().min(0).optional(),
        laborPrice: z.number().min(0).optional(),
        description: z.string().optional(),
        parts: z.array(quotePartSchema).optional(),
        isActive: z.boolean().optional()
      })
    )
    .mutation(async ({ input }) => {
      return await db.transaction(async (tx) => {
        const updateData: Partial<typeof quoteItems.$inferInsert> = {};
        if (input.category) updateData.category = input.category;
        if (input.name) updateData.name = input.name;
        if (input.code) updateData.code = input.code;
        if (input.laborHours !== undefined) updateData.laborHours = input.laborHours.toString();
        if (input.laborPrice !== undefined) updateData.laborPrice = input.laborPrice.toString();
        if (input.description !== undefined) updateData.description = input.description;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        const [updatedItem] = await tx
          .update(quoteItems)
          .set(updateData)
          .where(eq(quoteItems.id, input.id))
          .returning();

        if (!updatedItem) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '报价项目不存在' });
        }

        if (input.parts !== undefined) {
          await tx.delete(quoteParts).where(eq(quoteParts.quoteItemId, input.id));
          if (input.parts.length > 0) {
            await tx.insert(quoteParts).values(
              input.parts.map((p) => ({
                quoteItemId: input.id,
                partNumber: p.partNumber,
                partName: p.partName,
                quantity: p.quantity,
                unitPrice: p.unitPrice.toString()
              }))
            );
          }
        }

        const parts = await tx.select().from(quoteParts).where(eq(quoteParts.quoteItemId, input.id));
        return { ...updatedItem, parts };
      });
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ input }) => {
    const result = await db.delete(quoteItems).where(eq(quoteItems.id, input)).returning();
    if (result.length === 0) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '报价项目不存在' });
    }
    return { success: true };
  })
});
