import { router, authenticatedProcedure, roleProcedure } from '../trpc';
import { db } from '$server/db';
import { workOrders, communicationRecords, reviewOpinions, rooms, tenants, buildings, users } from '$server/db/schema';
import { eq, and, desc, or, lt, isNotNull } from 'drizzle-orm';

export const workOrderRouter = router({
	list: authenticatedProcedure
		.input((input: { status?: string; priority?: string; overdue?: boolean }) => input)
		.query(async ({ input, ctx }) => {
			const conditions = [];
			if (input.status) conditions.push(eq(workOrders.status, input.status as any));
			if (input.priority) conditions.push(eq(workOrders.priority, input.priority as any));
			if (input.overdue) {
				conditions.push(lt(workOrders.dueAt, new Date()));
				conditions.push(or(
					eq(workOrders.status, 'submitted'),
					eq(workOrders.status, 'assigned'),
					eq(workOrders.status, 'in_progress')
				) as any);
			}

			if (ctx.user.role === 'tenant') {
				const [tenant] = await db.select().from(tenants).where(eq(tenants.userId, ctx.user.id)).limit(1);
				if (tenant) conditions.push(eq(workOrders.tenantId, tenant.id));
			} else if (ctx.user.role === 'maintenance') {
				conditions.push(eq(workOrders.assigneeId, ctx.user.id));
			}

			const now = new Date();
			const result = await db
				.select({
					id: workOrders.id,
					title: workOrders.title,
					priority: workOrders.priority,
					status: workOrders.status,
					dueAt: workOrders.dueAt,
					createdAt: workOrders.createdAt,
					roomNumber: rooms.roomNumber,
					buildingName: buildings.name,
					assigneeName: users.displayName
				})
				.from(workOrders)
				.leftJoin(rooms, eq(workOrders.roomId, rooms.id))
				.leftJoin(buildings, eq(rooms.buildingId, buildings.id))
				.leftJoin(users, eq(workOrders.assigneeId, users.id))
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(workOrders.createdAt));

			return result.map(r => ({
				...r,
				isOverdue: r.dueAt && new Date(r.dueAt) < now && !['completed', 'reviewing', 'closed'].includes(r.status)
			}));
		}),

	getById: authenticatedProcedure
		.input((input: { id: string }) => input)
		.query(async ({ input }) => {
			const [order] = await db.select().from(workOrders).where(eq(workOrders.id, input.id)).limit(1);
			if (!order) throw new Error('工单不存在');

			const [room] = await db.select().from(rooms).where(eq(rooms.id, order.roomId)).limit(1);
			const [tenant] = await db.select().from(tenants).where(eq(tenants.id, order.tenantId)).limit(1);
			const [assignee] = order.assigneeId
				? await db.select().from(users).where(eq(users.id, order.assigneeId)).limit(1)
				: [null];

			const communications = await db
				.select({
					id: communicationRecords.id,
					content: communicationRecords.content,
					createdAt: communicationRecords.createdAt,
					senderName: users.displayName,
					senderRole: users.role
				})
				.from(communicationRecords)
				.leftJoin(users, eq(communicationRecords.senderId, users.id))
				.where(eq(communicationRecords.workOrderId, input.id))
				.orderBy(communicationRecords.createdAt);

			const reviews = await db
				.select({
					id: reviewOpinions.id,
					opinion: reviewOpinions.opinion,
					action: reviewOpinions.action,
					createdAt: reviewOpinions.createdAt,
					reviewerName: users.displayName
				})
				.from(reviewOpinions)
				.leftJoin(users, eq(reviewOpinions.reviewerId, users.id))
				.where(eq(reviewOpinions.workOrderId, input.id))
				.orderBy(desc(reviewOpinions.createdAt));

			const now = new Date();
			const isOverdue = order.dueAt && new Date(order.dueAt) < now && !['completed', 'reviewing', 'closed'].includes(order.status);

			return {
				...order,
				isOverdue,
				room,
				tenant,
				assignee,
				communications,
				reviews
			};
		}),

	create: roleProcedure('tenant', 'admin')
		.input((input: { title: string; description: string; roomId: string; priority: string }) => input)
		.mutation(async ({ input, ctx }) => {
			const [tenant] = await db.select().from(tenants).where(eq(tenants.userId, ctx.user!.id)).limit(1);
			if (!tenant && ctx.user!.role === 'tenant') throw new Error('租户信息不存在');

			const dueAt = new Date(Date.now() + 480 * 60 * 1000);
			const [order] = await db
				.insert(workOrders)
				.values({
					title: input.title,
					description: input.description,
					roomId: input.roomId,
					tenantId: tenant?.id ?? '',
					priority: input.priority as any,
					dueAt
				})
				.returning();
			return order;
		}),

	assign: roleProcedure('admin')
		.input((input: { workOrderId: string; assigneeId: string }) => input)
		.mutation(async ({ input }) => {
			const [order] = await db
				.update(workOrders)
				.set({
					assigneeId: input.assigneeId,
					status: 'assigned',
					assignedAt: new Date()
				})
				.where(eq(workOrders.id, input.workOrderId))
				.returning();
			return order;
		}),

	addCommunication: authenticatedProcedure
		.input((input: { workOrderId: string; content: string }) => input)
		.mutation(async ({ input, ctx }) => {
			const [record] = await db
				.insert(communicationRecords)
				.values({
					workOrderId: input.workOrderId,
					senderId: ctx.user!.id,
					content: input.content
				})
				.returning();
			return record;
		}),

	submitReview: roleProcedure('admin', 'maintenance')
		.input((input: { workOrderId: string; opinion: string; action: 'confirm' | 'return' }) => input)
		.mutation(async ({ input, ctx }) => {
			const [review] = await db
				.insert(reviewOpinions)
				.values({
					workOrderId: input.workOrderId,
					reviewerId: ctx.user!.id,
					opinion: input.opinion,
					action: input.action
				})
				.returning();

			if (input.action === 'confirm') {
				await db
					.update(workOrders)
					.set({ status: 'closed', completedAt: new Date() })
					.where(eq(workOrders.id, input.workOrderId));
			} else {
				await db
					.update(workOrders)
					.set({ status: 'in_progress' })
					.where(eq(workOrders.id, input.workOrderId));
			}

			return review;
		}),

	updateStatus: authenticatedProcedure
		.input((input: { workOrderId: string; status: string }) => input)
		.mutation(async ({ input }) => {
			const updateData: any = { status: input.status };
			if (input.status === 'in_progress') updateData.assignedAt = new Date();
			if (input.status === 'completed') updateData.completedAt = new Date();

			const [order] = await db
				.update(workOrders)
				.set(updateData)
				.where(eq(workOrders.id, input.workOrderId))
				.returning();
			return order;
		})
});
