import { and, between, eq, lte, gte, count, sum, sql } from 'drizzle-orm';
import type { DB } from '$server/db';
import { roomCalendar, order, property, exceptionOrder } from '$server/db/schema';
import { eachDayOfInterval, startOfDay, endOfDay, format, differenceInDays } from 'date-fns';
import type { RoomStatusType, OccupancyRateResult } from '$lib/types';

export interface ConflictResult {
	hasConflict: boolean;
	conflicts: {
		date: Date;
		currentStatus: RoomStatusType;
		existingOrderId?: string;
	}[];
}

export async function checkRoomStatusConflict(
	database: DB,
	propertyId: string,
	checkIn: Date,
	checkOut: Date,
	excludeOrderId?: string
): Promise<ConflictResult> {
	const start = startOfDay(checkIn);
	const end = startOfDay(checkOut);
	const days = eachDayOfInterval({ start, end: new Date(end.getTime() - 86400000) });

	const calendars = await database
		.select()
		.from(roomCalendar)
		.where(
			and(
				eq(roomCalendar.propertyId, propertyId),
				gte(roomCalendar.date, start),
				lte(roomCalendar.date, end)
			)
		);

	const conflicts: ConflictResult['conflicts'] = [];
	const occupiedStatuses: RoomStatusType[] = ['booked', 'occupied'];

	for (const day of days) {
		const cal = calendars.find((c) => startOfDay(new Date(c.date)).getTime() === startOfDay(day).getTime());
		if (cal && occupiedStatuses.includes(cal.status as RoomStatusType)) {
			if (excludeOrderId && cal.orderId === excludeOrderId) continue;
			conflicts.push({
				date: day,
				currentStatus: cal.status as RoomStatusType,
				existingOrderId: cal.orderId ?? undefined
			});
		}
	}

	return {
		hasConflict: conflicts.length > 0,
		conflicts
	};
}

export async function detectAllConflicts(database: DB): Promise<ConflictResult[]> {
	const allProperties = await database.select().from(property).where(eq(property.status, 'active'));
	const activeOrders = await database
		.select()
		.from(order)
		.where(sql`status IN ('pending','confirmed','checked_in')`);

	const results: ConflictResult[] = [];

	for (const prop of allProperties) {
		const propOrders = activeOrders.filter((o) => o.propertyId === prop.id);
		for (let i = 0; i < propOrders.length; i++) {
			for (let j = i + 1; j < propOrders.length; j++) {
				const o1 = propOrders[i];
				const o2 = propOrders[j];
				const o1Start = startOfDay(new Date(o1.checkInDate));
				const o1End = startOfDay(new Date(o1.checkOutDate));
				const o2Start = startOfDay(new Date(o2.checkInDate));
				const o2End = startOfDay(new Date(o2.checkOutDate));

				const hasOverlap = o1Start < o2End && o2Start < o1End;
				if (hasOverlap) {
					results.push({
						hasConflict: true,
						conflicts: [{
							date: new Date(Math.max(o1Start.getTime(), o2Start.getTime())),
							currentStatus: 'booked',
							existingOrderId: o1.id
						}]
					});
				}
			}
		}
	}

	return results;
}

export async function calculateOccupancyRate(
	database: DB,
	startDate: Date,
	endDate: Date,
	propertyIds?: string[]
): Promise<OccupancyRateResult> {
	const start = startOfDay(startDate);
	const end = startOfDay(endDate);

	const properties = await database
		.select()
		.from(property)
		.where(
			and(
				eq(property.status, 'active'),
				propertyIds && propertyIds.length > 0
					? sql`${property.id} IN (${propertyIds.join(',')})`
					: sql`1=1`
			)
		);

	const calendars = await database
		.select()
		.from(roomCalendar)
		.where(
			and(
				gte(roomCalendar.date, start),
				lte(roomCalendar.date, end),
				propertyIds && propertyIds.length > 0
					? sql`${roomCalendar.propertyId} IN (${propertyIds.join(',')})`
					: sql`1=1`
			)
		);

	const propertyMap = new Map(properties.map((p) => [p.id, p.name]));
	const totalDays = differenceInDays(end, start);
	const totalRoomNights = properties.length * Math.max(totalDays, 1);

	let occupiedRoomNights = 0;
	let revenue = 0;
	let pricedNights = 0;

	const details: OccupancyRateResult['details'] = [];
	const occupiedStatuses: RoomStatusType[] = ['booked', 'occupied'];

	for (const cal of calendars) {
		const calDate = new Date(cal.date);
		const status = cal.status as RoomStatusType;
		const isOccupied = occupiedStatuses.includes(status);
		if (isOccupied) occupiedRoomNights++;
		if (cal.price && cal.price > 0) {
			revenue += cal.price;
			pricedNights++;
		}
		details.push({
			date: calDate,
			propertyId: cal.propertyId,
			propertyName: propertyMap.get(cal.propertyId) ?? '未知房源',
			status,
			price: cal.price ?? null
		});
	}

	return {
		period: `${format(start, 'yyyy-MM-dd')} ~ ${format(end, 'yyyy-MM-dd')}`,
		totalRoomNights,
		occupiedRoomNights,
		occupancyRate: totalRoomNights > 0 ? (occupiedRoomNights / totalRoomNights) * 100 : 0,
		averageDailyRate: pricedNights > 0 ? revenue / pricedNights : 0,
		revenue,
		details
	};
}
