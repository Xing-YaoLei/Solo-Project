import { router, roleProcedure } from '../trpc';
import { db } from '$server/db';
import { utilityReadings, rooms, buildings } from '$server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const utilityRouter = router({
	list: roleProcedure('admin', 'finance')
		.input((input: { period?: string; buildingId?: string }) => input)
		.query(async ({ input }) => {
			const conditions = [];
			if (input.period) conditions.push(eq(utilityReadings.period, input.period));
			if (input.buildingId) conditions.push(eq(rooms.buildingId, input.buildingId));

			const result = await db
				.select({
					id: utilityReadings.id,
					roomId: utilityReadings.roomId,
					period: utilityReadings.period,
					electricityReading: utilityReadings.electricityReading,
					waterReading: utilityReadings.waterReading,
					electricityUsage: utilityReadings.electricityUsage,
					waterUsage: utilityReadings.waterUsage,
					isAnomaly: utilityReadings.isAnomaly,
					verified: utilityReadings.verified,
					createdAt: utilityReadings.createdAt,
					roomNumber: rooms.roomNumber,
					buildingName: buildings.name
				})
				.from(utilityReadings)
				.leftJoin(rooms, eq(utilityReadings.roomId, rooms.id))
				.leftJoin(buildings, eq(rooms.buildingId, buildings.id))
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(utilityReadings.createdAt));

			return result;
		}),

	create: roleProcedure('admin', 'finance')
		.input((input: { roomId: string; electricity: number; water: number; period: string }) => input)
		.mutation(async ({ input, ctx }) => {
			const [prevReading] = await db
				.select()
				.from(utilityReadings)
				.where(and(eq(utilityReadings.roomId, input.roomId)))
				.orderBy(desc(utilityReadings.createdAt))
				.limit(1);

			const prevElec = prevReading?.electricityReading ?? 0;
			const prevWater = prevReading?.waterReading ?? 0;
			const elecUsage = Math.max(0, input.electricity - prevElec);
			const waterUsage = Math.max(0, input.water - prevWater);
			const isAnomaly = elecUsage > 5000 || waterUsage > 500;

			const [reading] = await db
				.insert(utilityReadings)
				.values({
					roomId: input.roomId,
					period: input.period,
					electricityReading: input.electricity,
					waterReading: input.water,
					electricityUsage: elecUsage,
					waterUsage: waterUsage,
					isAnomaly,
					readerId: ctx.user!.id
				})
				.returning();

			return reading;
		}),

	verify: roleProcedure('admin', 'finance')
		.input((input: { readingId: string; verified: boolean; note?: string }) => input)
		.mutation(async ({ input }) => {
			const [reading] = await db
				.update(utilityReadings)
				.set({ verified: input.verified })
				.where(eq(utilityReadings.id, input.readingId))
				.returning();
			return reading;
		})
});
