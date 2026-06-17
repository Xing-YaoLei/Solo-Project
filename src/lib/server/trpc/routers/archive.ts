import { router, roleProcedure } from '../trpc';
import { db } from '$server/db';
import { buildings, rooms, tenants, contracts, facilities } from '$server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const archiveRouter = router({
	listBuildings: roleProcedure('admin').query(async () => {
		const buildingList = await db.select().from(buildings);
		return buildingList;
	}),

	getBuildingDetail: roleProcedure('admin')
		.input((input: { id: string }) => input)
		.query(async ({ input }) => {
			const [building] = await db.select().from(buildings).where(eq(buildings.id, input.id)).limit(1);
			if (!building) throw new Error('楼宇不存在');

			const roomList = await db
				.select({
					id: rooms.id,
					floor: rooms.floor,
					unit: rooms.unit,
					roomNumber: rooms.roomNumber,
					status: rooms.status,
					area: rooms.area
				})
				.from(rooms)
				.where(eq(rooms.buildingId, input.id));

			return { ...building, rooms: roomList };
		}),

	getRoomDetail: roleProcedure('admin')
		.input((input: { buildingId: string; roomId: string }) => input)
		.query(async ({ input }) => {
			const [room] = await db.select().from(rooms).where(eq(rooms.id, input.roomId)).limit(1);
			if (!room) throw new Error('房间不存在');

			const [activeContract] = await db
				.select({
					id: contracts.id,
					startDate: contracts.startDate,
					endDate: contracts.endDate,
					monthlyRent: contracts.monthlyRent,
					status: contracts.status,
					tenantName: tenants.companyName
				})
				.from(contracts)
				.leftJoin(tenants, eq(contracts.tenantId, tenants.id))
				.where(eq(contracts.roomId, input.roomId))
				.orderBy(desc(contracts.createdAt))
				.limit(1);

			const facilityList = await db
				.select()
				.from(facilities)
				.where(eq(facilities.roomId, input.roomId));

			return { ...room, activeContract, facilities: facilityList };
		}),

	updateRoom: roleProcedure('admin')
		.input((input: { roomId: string; data: { status?: string; area?: number } }) => input)
		.mutation(async ({ input }) => {
			const [room] = await db
				.update(rooms)
				.set(input.data as any)
				.where(eq(rooms.id, input.roomId))
				.returning();
			return room;
		})
});
