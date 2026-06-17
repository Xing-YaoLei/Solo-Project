import { router, roleProcedure, authenticatedProcedure } from '../trpc';
import { db } from '$server/db';
import { inspections, checkpoints, anomalies, rooms, buildings, users } from '$server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const inspectionRouter = router({
	list: roleProcedure('admin', 'inspector')
		.input((input: { status?: string; assigneeId?: string }) => input)
		.query(async ({ input, ctx }) => {
			const conditions = [];
			if (input.status) conditions.push(eq(inspections.status, input.status as any));
			if (input.assigneeId) conditions.push(eq(inspections.assigneeId, input.assigneeId));
			if (ctx.user.role === 'inspector') {
				conditions.push(eq(inspections.assigneeId, ctx.user.id));
			}

			const result = await db
				.select({
					id: inspections.id,
					name: inspections.name,
					buildingId: inspections.buildingId,
					assigneeId: inspections.assigneeId,
					status: inspections.status,
					scheduledAt: inspections.scheduledAt,
					completedAt: inspections.completedAt,
					buildingName: buildings.name,
					assigneeName: users.displayName
				})
				.from(inspections)
				.leftJoin(buildings, eq(inspections.buildingId, buildings.id))
				.leftJoin(users, eq(inspections.assigneeId, users.id))
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(inspections.scheduledAt));

			return result;
		}),

	getById: roleProcedure('admin', 'inspector')
		.input((input: { id: string }) => input)
		.query(async ({ input }) => {
			const [inspection] = await db.select().from(inspections).where(eq(inspections.id, input.id)).limit(1);
			if (!inspection) throw new Error('巡检路线不存在');

			const checkpointList = await db
				.select({
					id: checkpoints.id,
					roomId: checkpoints.roomId,
					sortOrder: checkpoints.sortOrder,
					status: checkpoints.status,
					note: checkpoints.note,
					checkedAt: checkpoints.checkedAt,
					roomNumber: rooms.roomNumber,
					floor: rooms.floor,
					unit: rooms.unit
				})
				.from(checkpoints)
				.leftJoin(rooms, eq(checkpoints.roomId, rooms.id))
				.where(eq(checkpoints.inspectionId, input.id))
				.orderBy(checkpoints.sortOrder);

			return { ...inspection, checkpoints: checkpointList };
		}),

	updateCheckpoint: roleProcedure('admin', 'inspector')
		.input((input: { routeId: string; checkpointId: string; status: string; note?: string }) => input)
		.mutation(async ({ input }) => {
			const [updated] = await db
				.update(checkpoints)
				.set({
					status: input.status as any,
					note: input.note,
					checkedAt: new Date()
				})
				.where(eq(checkpoints.id, input.checkpointId))
				.returning();
			return updated;
		}),

	reportAnomaly: roleProcedure('admin', 'inspector')
		.input((input: { routeId: string; checkpointId: string; description: string; images?: string }) => input)
		.mutation(async ({ input, ctx }) => {
			const [anomaly] = await db
				.insert(anomalies)
				.values({
					checkpointId: input.checkpointId,
					reporterId: ctx.user!.id,
					description: input.description,
					images: input.images
				})
				.returning();

			await db
				.update(checkpoints)
				.set({ status: 'anomaly' })
				.where(eq(checkpoints.id, input.checkpointId));

			return anomaly;
		})
});
