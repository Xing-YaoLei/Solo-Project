import { z } from 'zod';
import { router, protectedProcedure, roleProcedure } from '../t';
import { eq, desc, and, gte, lte, sql, or } from 'drizzle-orm';
import { deposit } from '$server/db/schema';
import { createAuditLog, diffObject } from '$server/utils/audit';
import { startOfDay } from 'date-fns';

export const depositRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				status: z.enum(['collected', 'frozen', 'refunded', 'partial_refunded', 'deducted']).optional(),
				orderId: z.string().optional(),
				propertyId: z.string().optional(),
				startDate: z.date().optional(),
				endDate: z.date().optional(),
				search: z.string().optional()
			}).optional()
		)
		.query(async ({ ctx, input }) => {
			const where: any[] = [];
			if (input?.status) where.push(eq(deposit.status, input.status));
			if (input?.orderId) where.push(eq(deposit.orderId, input.orderId));
			if (input?.propertyId) where.push(eq(deposit.propertyId, input.propertyId));
			if (input?.startDate) where.push(gte(deposit.createdAt, startOfDay(input.startDate)));
			if (input?.endDate) where.push(lte(deposit.createdAt, startOfDay(input.endDate)));
			if (input?.search) {
				const search = `%${input.search}%`;
				where.push(
					or(
						sql`${deposit.guestName} LIKE ${search}`,
						sql`${deposit.depositNo} LIKE ${search}`,
						sql`${deposit.transactionNo} LIKE ${search}`
					)
				);
			}

			return ctx.db
				.select()
				.from(deposit)
				.where(where.length > 0 ? and(...where) : undefined)
				.orderBy(desc(deposit.createdAt));
		}),

	get: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.db.select().from(deposit).where(eq(deposit.id, input)).then(r => r[0]);
		}),

	create: roleProcedure(['admin', 'manager', 'staff'])
		.input(
			z.object({
				propertyId: z.string(),
				orderId: z.string().optional(),
				guestName: z.string(),
				amount: z.number().default(0),
				status: z.enum(['collected', 'frozen', 'refunded', 'partial_refunded', 'deducted']).default('collected'),
				paymentMethod: z.enum(['cash', 'wechat', 'alipay', 'bank_transfer', 'card', 'platform']).default('wechat'),
				transactionNo: z.string().optional(),
				collectedAt: z.date().optional(),
				photos: z.array(z.string()).optional(),
				remark: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = crypto.randomUUID();
			const depositNo = `DEP${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

			const newDeposit = (await ctx.db
				.insert(deposit)
				.values({
					id,
					depositNo,
					collectedAt: input.collectedAt ?? new Date(),
					...input
				})
				.returning())[0];

			await createAuditLog(
				{ action: 'create', entityType: 'deposit', entityId: id },
				ctx.user.id,
				ctx.db
			);

			return newDeposit;
		}),

	refund: roleProcedure(['admin', 'manager', 'staff'])
		.input(
			z.object({
				id: z.string(),
				refundedAmount: z.number(),
				deductedAmount: z.number().default(0),
				deductionItems: z.array(z.object({ name: z.string(), amount: z.number(), remark: z.string().optional() })).default([]),
				refundMethod: z.enum(['cash', 'wechat', 'alipay', 'bank_transfer', 'card', 'platform']),
				refundTransactionNo: z.string().optional(),
				photos: z.array(z.string()).optional(),
				remark: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const old = await ctx.db.select().from(deposit).where(eq(deposit.id, input.id)).then(r => r[0]);
			if (!old) throw new Error('押金记录不存在');

			const totalRefund = input.refundedAmount + input.deductedAmount;
			let status: string = old.status;
			if (input.deductedAmount > 0 && input.refundedAmount > 0) {
				status = 'partial_refunded';
			} else if (input.refundedAmount > 0 && Math.abs(input.refundedAmount - old.amount) < 0.01) {
				status = 'refunded';
			} else if (input.deductedAmount > 0 && input.refundedAmount === 0) {
				status = 'deducted';
			}

			const updated = (await ctx.db
				.update(deposit)
				.set({
					status: status as any,
					refundedAmount: input.refundedAmount,
					deductedAmount: input.deductedAmount,
					deductionItems: input.deductionItems,
					refundMethod: input.refundMethod,
					refundTransactionNo: input.refundTransactionNo,
					refundedAt: new Date(),
					photos: input.photos ?? old.photos,
					remark: input.remark ?? old.remark,
					updatedAt: new Date()
				})
				.where(eq(deposit.id, input.id))
				.returning())[0];

			await createAuditLog(
				{
					action: 'refund',
					entityType: 'deposit',
					entityId: input.id,
					field: 'status',
					oldValue: old.status,
					newValue: status,
					meta: { refundedAmount: input.refundedAmount, deductedAmount: input.deductedAmount }
				},
				ctx.user.id,
				ctx.db
			);

			return updated;
		}),

	update: roleProcedure(['admin', 'manager'])
		.input(
			z.object({
				id: z.string(),
				amount: z.number().optional(),
				paymentMethod: z.enum(['cash', 'wechat', 'alipay', 'bank_transfer', 'card', 'platform']).optional(),
				transactionNo: z.string().optional(),
				remark: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const old = await ctx.db.select().from(deposit).where(eq(deposit.id, input.id)).then(r => r[0]);
			const { id, ...data } = input;
			const updated = (await ctx.db
				.update(deposit)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(deposit.id, id))
				.returning())[0];

			if (old && updated) {
				const changes = diffObject(old as any, updated as any);
				for (const ch of changes) {
					await createAuditLog(
						{
							action: 'update',
							entityType: 'deposit',
							entityId: id,
							field: ch.field,
							oldValue: ch.old,
							newValue: ch.new
						},
						ctx.user.id,
						ctx.db
					);
				}
			}

			return updated;
		}),

	delete: roleProcedure(['admin'])
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(deposit).where(eq(deposit.id, input));
			await createAuditLog(
				{ action: 'delete', entityType: 'deposit', entityId: input },
				ctx.user.id,
				ctx.db
			);
			return { success: true };
		})
});
