import { z } from 'zod';
import { router, protectedProcedure, roleProcedure } from '../t';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import { exceptionOrder, exceptionResponsible } from '$server/db/schema';
import { createAuditLog, diffObject } from '$server/utils/audit';
import { detectAllConflicts } from '$server/utils/conflict';

export const exceptionRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
				type: z.enum(['status_conflict', 'double_booking', 'overbooking', 'cleaning_delay', 'amenity_issue', 'guest_complaint', 'other']).optional(),
				severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
				propertyId: z.string().optional(),
				ownerId: z.string().optional()
			}).optional()
		)
		.query(async ({ ctx, input }) => {
			const where: any[] = [];
			if (input?.status) where.push(eq(exceptionOrder.status, input.status));
			if (input?.type) where.push(eq(exceptionOrder.type, input.type));
			if (input?.severity) where.push(eq(exceptionOrder.severity, input.severity));
			if (input?.propertyId) where.push(eq(exceptionOrder.propertyId, input.propertyId));
			if (input?.ownerId) where.push(eq(exceptionOrder.ownerId, input.ownerId));

			return ctx.db
				.select()
				.from(exceptionOrder)
				.where(where.length > 0 ? and(...where) : undefined)
				.orderBy(desc(exceptionOrder.createdAt));
		}),

	get: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			const ex = await ctx.db
				.select()
				.from(exceptionOrder)
				.where(eq(exceptionOrder.id, input))
				.then(r => r[0]);

			if (!ex) return null;

			const responsibles = await ctx.db
				.select()
				.from(exceptionResponsible)
				.where(eq(exceptionResponsible.exceptionId, input));

			return { ...ex, responsibles };
		}),

	create: roleProcedure(['admin', 'manager', 'staff'])
		.input(
			z.object({
				type: z.enum(['status_conflict', 'double_booking', 'overbooking', 'cleaning_delay', 'amenity_issue', 'guest_complaint', 'other']),
				severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
				title: z.string(),
				description: z.string(),
				propertyId: z.string().optional(),
				orderId: z.string().optional(),
				affectedStartDate: z.date().optional(),
				affectedEndDate: z.date().optional(),
				affectedNights: z.number().int().optional(),
				ownerId: z.string().optional(),
				responsibleUserIds: z.array(z.string()).default([])
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = crypto.randomUUID();
			const exceptionNo = `EXC${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

			const newEx = (await ctx.db
				.insert(exceptionOrder)
				.values({
					id,
					exceptionNo,
					createdBy: ctx.user.id,
					title: input.title,
					description: input.description,
					type: input.type,
					severity: input.severity,
					propertyId: input.propertyId,
					orderId: input.orderId,
					affectedStartDate: input.affectedStartDate,
					affectedEndDate: input.affectedEndDate,
					affectedNights: input.affectedNights,
					ownerId: input.ownerId
				})
				.returning())[0];

			for (const uid of input.responsibleUserIds) {
				await ctx.db.insert(exceptionResponsible).values({
					id: crypto.randomUUID(),
					exceptionId: id,
					userId: uid,
					role: 'responsible'
				});
			}

			await createAuditLog(
				{ action: 'create', entityType: 'exception', entityId: id },
				ctx.user.id,
				ctx.db
			);

			return newEx;
		}),

	updateStatus: roleProcedure(['admin', 'manager', 'staff'])
		.input(
			z.object({
				id: z.string(),
				status: z.enum(['open', 'investigating', 'resolved', 'closed']),
				responderId: z.string().optional(),
				rootCause: z.string().optional(),
				resolution: z.string().optional(),
				conclusion: z.string().optional(),
				impactScope: z.string().optional(),
				ownerId: z.string().optional(),
				financialImpact: z.number().optional(),
				compensationAmount: z.number().optional(),
				evidence: z.array(z.string()).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const old = await ctx.db.select().from(exceptionOrder).where(eq(exceptionOrder.id, input.id)).then(r => r[0]);
			if (!old) throw new Error('异常单不存在');

			if (input.status === 'closed') {
				if (!input.conclusion) throw new Error('关闭前必须填写处理结论');
				if (!input.impactScope && !old.impactScope) throw new Error('关闭前必须填写影响范围');
				const responsibles = await ctx.db
					.select()
					.from(exceptionResponsible)
					.where(eq(exceptionResponsible.exceptionId, input.id));
				if (responsibles.length === 0) throw new Error('关闭前必须指定责任人');
			}

			const updateData: any = { status: input.status, updatedAt: new Date() };
			if (input.responderId) updateData.responderId = input.responderId;
			if (input.rootCause) updateData.rootCause = input.rootCause;
			if (input.resolution) updateData.resolution = input.resolution;
			if (input.conclusion) updateData.conclusion = input.conclusion;
			if (input.impactScope) updateData.impactScope = input.impactScope;
			if (input.ownerId) updateData.ownerId = input.ownerId;
			if (input.financialImpact !== undefined) updateData.financialImpact = input.financialImpact;
			if (input.compensationAmount !== undefined) updateData.compensationAmount = input.compensationAmount;
			if (input.evidence) updateData.evidence = input.evidence;
			if (input.status === 'resolved') updateData.resolvedAt = new Date();
			if (input.status === 'closed') updateData.closedAt = new Date();

			const updated = (await ctx.db
				.update(exceptionOrder)
				.set(updateData)
				.where(eq(exceptionOrder.id, input.id))
				.returning())[0];

			await createAuditLog(
				{
					action: 'status_change',
					entityType: 'exception',
					entityId: input.id,
					field: 'status',
					oldValue: old.status,
					newValue: input.status,
					meta: { conclusion: input.conclusion, impactScope: input.impactScope }
				},
				ctx.user.id,
				ctx.db
			);

			return updated;
		}),

	addResponsibles: roleProcedure(['admin', 'manager'])
		.input(
			z.object({
				exceptionId: z.string(),
				responsibles: z.array(
					z.object({
						userId: z.string(),
						role: z.string(),
						responsibilityDescription: z.string().optional()
					})
				)
			})
		)
		.mutation(async ({ ctx, input }) => {
			for (const r of input.responsibles) {
				await ctx.db.insert(exceptionResponsible).values({
					id: crypto.randomUUID(),
					exceptionId: input.exceptionId,
					userId: r.userId,
					role: r.role,
					responsibilityDescription: r.responsibilityDescription
				}).onConflictDoNothing();
			}

			await createAuditLog(
				{
					action: 'add_responsibles',
					entityType: 'exception',
					entityId: input.exceptionId,
					meta: { count: input.responsibles.length }
				},
				ctx.user.id,
				ctx.db
			);

			return { success: true, added: input.responsibles.length };
		}),

	removeResponsible: roleProcedure(['admin', 'manager'])
		.input(
			z.object({
				exceptionId: z.string(),
				userId: z.string()
			})
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(exceptionResponsible)
				.where(
					and(
						eq(exceptionResponsible.exceptionId, input.exceptionId),
						eq(exceptionResponsible.userId, input.userId)
					)
				);
			return { success: true };
		}),

	runAutoDetect: roleProcedure(['admin', 'manager'])
		.mutation(async ({ ctx }) => {
			const conflicts = await detectAllConflicts(ctx.db);
			const created: typeof exceptionOrder.$inferSelect[] = [];

			for (const conflict of conflicts) {
				if (conflict.conflicts.length === 0) continue;
				const existing = await ctx.db
					.select()
					.from(exceptionOrder)
					.where(
						and(
							eq(exceptionOrder.status, 'open'),
							eq(exceptionOrder.type, 'double_booking')
						)
					)
					.then(r => r[0]);

				if (!existing) {
					const id = crypto.randomUUID();
					const ex = (await ctx.db
						.insert(exceptionOrder)
						.values({
							id,
							exceptionNo: `EXC${Date.now()}${created.length}`,
							type: 'double_booking',
							status: 'open',
							severity: 'high',
							title: '自动检测到房态冲突',
							description: `系统自动检测到存在${conflict.conflicts.length}处房态日期冲突`,
							createdBy: ctx.user.id
						})
						.returning())[0];
					created.push(ex);
				}
			}

			return {
				totalConflicts: conflicts.length,
				newExceptions: created.length,
				exceptions: created
			};
		})
});
