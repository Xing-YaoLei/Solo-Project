import { z } from 'zod';
import { router, protectedProcedure, roleProcedure } from '../t';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { auditLog } from '$server/db/schema';
import { startOfDay } from 'date-fns';

export const auditRouter = router({
	list: roleProcedure(['admin', 'manager'])
		.input(
			z.object({
				entityType: z.string().optional(),
				entityId: z.string().optional(),
				userId: z.string().optional(),
				action: z.string().optional(),
				startDate: z.date().optional(),
				endDate: z.date().optional(),
				limit: z.number().int().default(200),
				offset: z.number().int().default(0)
			}).optional()
		)
		.query(async ({ ctx, input }) => {
			const where: any[] = [];
			if (input?.entityType) where.push(eq(auditLog.entityType, input.entityType));
			if (input?.entityId) where.push(eq(auditLog.entityId, input.entityId));
			if (input?.userId) where.push(eq(auditLog.userId, input.userId));
			if (input?.action) where.push(eq(auditLog.action, input.action));
			if (input?.startDate) where.push(gte(auditLog.createdAt, startOfDay(input.startDate)));
			if (input?.endDate) where.push(lte(auditLog.createdAt, startOfDay(input.endDate)));

			return ctx.db
				.select()
				.from(auditLog)
				.where(where.length > 0 ? and(...where) : undefined)
				.orderBy(desc(auditLog.createdAt))
				.limit(input?.limit ?? 200)
				.offset(input?.offset ?? 0);
		}),

	getByEntity: protectedProcedure
		.input(
			z.object({
				entityType: z.string(),
				entityId: z.string()
			})
		)
		.query(async ({ ctx, input }) => {
			return ctx.db
				.select()
				.from(auditLog)
				.where(
					and(
						eq(auditLog.entityType, input.entityType),
						eq(auditLog.entityId, input.entityId)
					)
				)
				.orderBy(desc(auditLog.createdAt));
		}),

	getByUser: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.db
				.select()
				.from(auditLog)
				.where(eq(auditLog.userId, input))
				.orderBy(desc(auditLog.createdAt))
				.limit(100);
		})
});
