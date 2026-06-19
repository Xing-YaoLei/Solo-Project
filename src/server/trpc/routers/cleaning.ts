import { z } from 'zod';
import { router, protectedProcedure, roleProcedure } from '../t';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { cleaningTask, order } from '$server/db/schema';
import { createAuditLog, diffObject } from '$server/utils/audit';
import { startOfDay } from 'date-fns';

export const cleaningRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'rejected']).optional(),
				assignedTo: z.string().optional(),
				propertyId: z.string().optional(),
				startDate: z.date().optional(),
				endDate: z.date().optional()
			}).optional()
		)
		.query(async ({ ctx, input }) => {
			const where: any[] = [];
			if (input?.status) where.push(eq(cleaningTask.status, input.status));
			if (input?.assignedTo) where.push(eq(cleaningTask.assignedTo, input.assignedTo));
			if (input?.propertyId) where.push(eq(cleaningTask.propertyId, input.propertyId));
			if (input?.startDate) where.push(gte(cleaningTask.scheduledDate, startOfDay(input.startDate)));
			if (input?.endDate) where.push(lte(cleaningTask.scheduledDate, startOfDay(input.endDate)));

			return ctx.db
				.select()
				.from(cleaningTask)
				.where(where.length > 0 ? and(...where) : undefined)
				.orderBy(desc(cleaningTask.scheduledDate));
		}),

	get: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.db.select().from(cleaningTask).where(eq(cleaningTask.id, input)).then(r => r[0]);
		}),

	create: roleProcedure(['admin', 'manager', 'staff'])
		.input(
			z.object({
				propertyId: z.string(),
				orderId: z.string().optional(),
				type: z.enum(['checkout', 'periodic', 'deep', 'maintenance', 'other']).default('checkout'),
				priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
				scheduledDate: z.date(),
				scheduledTime: z.string().optional(),
				assignedTo: z.string().optional(),
				fee: z.number().default(0),
				items: z.array(z.object({ name: z.string(), done: z.boolean() })).default([]),
				checklist: z.array(z.object({ name: z.string(), done: z.boolean(), remark: z.string().optional() })).default([]),
				cleanerNote: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = crypto.randomUUID();
			const taskNo = `CLN${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

			const newTask = (await ctx.db
				.insert(cleaningTask)
				.values({ id, taskNo, ...input })
				.returning())[0];

			await createAuditLog(
				{ action: 'create', entityType: 'cleaning_task', entityId: id },
				ctx.user.id,
				ctx.db
			);

			return newTask;
		}),

	updateStatus: roleProcedure(['admin', 'manager', 'staff'])
		.input(
			z.object({
				id: z.string(),
				status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'rejected']),
				inspectorNote: z.string().optional(),
				beforePhotos: z.array(z.string()).optional(),
				afterPhotos: z.array(z.string()).optional(),
				checklist: z.array(z.object({ name: z.string(), done: z.boolean(), remark: z.string().optional() })).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const old = await ctx.db.select().from(cleaningTask).where(eq(cleaningTask.id, input.id)).then(r => r[0]);
			if (!old) throw new Error('任务不存在');

			const updateData: any = { status: input.status, updatedAt: new Date() };
			if (input.status === 'in_progress') updateData.actualStart = new Date();
			if (input.status === 'completed' || input.status === 'cancelled' || input.status === 'rejected') {
				updateData.actualEnd = new Date();
			}
			if (input.inspectorNote) updateData.inspectorNote = input.inspectorNote;
			if (input.beforePhotos) updateData.beforePhotos = input.beforePhotos;
			if (input.afterPhotos) updateData.afterPhotos = input.afterPhotos;
			if (input.checklist) updateData.checklist = input.checklist;

			const updated = (await ctx.db
				.update(cleaningTask)
				.set(updateData)
				.where(eq(cleaningTask.id, input.id))
				.returning())[0];

			await createAuditLog(
				{
					action: 'status_change',
					entityType: 'cleaning_task',
					entityId: input.id,
					field: 'status',
					oldValue: old.status,
					newValue: input.status
				},
				ctx.user.id,
				ctx.db
			);

			return updated;
		}),

	update: roleProcedure(['admin', 'manager', 'staff'])
		.input(
			z.object({
				id: z.string(),
				propertyId: z.string().optional(),
				type: z.enum(['checkout', 'periodic', 'deep', 'maintenance', 'other']).optional(),
				priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
				scheduledDate: z.date().optional(),
				scheduledTime: z.string().optional(),
				assignedTo: z.string().optional(),
				fee: z.number().optional(),
				items: z.array(z.object({ name: z.string(), done: z.boolean() })).optional(),
				checklist: z.array(z.object({ name: z.string(), done: z.boolean(), remark: z.string().optional() })).optional(),
				cleanerNote: z.string().optional(),
				inspectorNote: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const old = await ctx.db.select().from(cleaningTask).where(eq(cleaningTask.id, input.id)).then(r => r[0]);
			const { id, ...data } = input;
			const updated = (await ctx.db
				.update(cleaningTask)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(cleaningTask.id, id))
				.returning())[0];

			if (old && updated) {
				const changes = diffObject(old as any, updated as any);
				for (const ch of changes) {
					await createAuditLog(
						{
							action: 'update',
							entityType: 'cleaning_task',
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

	delete: roleProcedure(['admin', 'manager'])
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(cleaningTask).where(eq(cleaningTask.id, input));
			await createAuditLog(
				{ action: 'delete', entityType: 'cleaning_task', entityId: input },
				ctx.user.id,
				ctx.db
			);
			return { success: true };
		}),

	autoCreateFromCheckout: roleProcedure(['admin', 'manager'])
		.input(z.object({ date: z.date().optional() }))
		.mutation(async ({ ctx, input }) => {
			const targetDate = startOfDay(input.date ?? new Date());
			const nextDay = new Date(targetDate.getTime() + 86400000);

			const checkoutOrders = await ctx.db
				.select()
				.from(order)
				.where(
					and(
						gte(order.checkOutDate, targetDate),
						lte(order.checkOutDate, nextDay),
						sql`${order.status} = 'checked_in' OR ${order.status} = 'checked_out'`
					)
				);

			const created: typeof cleaningTask.$inferSelect[] = [];
			for (const ord of checkoutOrders) {
				const existing = await ctx.db
					.select()
					.from(cleaningTask)
					.where(
						and(
							eq(cleaningTask.orderId, ord.id),
							eq(cleaningTask.type, 'checkout')
						)
					)
					.then(r => r[0]);
				if (!existing) {
					const id = crypto.randomUUID();
					const taskNo = `CLN${Date.now()}${created.length}`;
					const t = (await ctx.db
						.insert(cleaningTask)
						.values({
							id,
							taskNo,
							propertyId: ord.propertyId,
							orderId: ord.id,
							type: 'checkout',
							priority: 'high',
							scheduledDate: ord.checkOutDate,
							status: 'pending'
						})
						.returning())[0];
					created.push(t);

					await createAuditLog(
						{ action: 'auto_create', entityType: 'cleaning_task', entityId: id, meta: { fromOrder: ord.id } },
						ctx.user.id,
						ctx.db
					);
				}
			}

			return { created: created.length, tasks: created };
		}),

	getMyTasks: protectedProcedure
		.input(z.object({ status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'rejected']).optional() }).optional())
		.query(async ({ ctx, input }) => {
			const where = [eq(cleaningTask.assignedTo, ctx.user.id)];
			if (input?.status) where.push(eq(cleaningTask.status, input.status));
			return ctx.db
				.select()
				.from(cleaningTask)
				.where(and(...(where as any)))
				.orderBy(desc(cleaningTask.scheduledDate));
		})
});
