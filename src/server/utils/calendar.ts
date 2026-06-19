import { eq } from 'drizzle-orm';
import type { DB } from '$server/db';
import { roomCalendar, exceptionOrder } from '$server/db/schema';
import { checkRoomStatusConflict } from './conflict';
import { eachDayOfInterval, startOfDay } from 'date-fns';
import type { RoomStatusType } from '$lib/types';

export async function updateCalendarForOrder(
	database: DB,
	propertyId: string,
	orderId: string,
	checkIn: Date,
	checkOut: Date,
	status: RoomStatusType,
	pricePerNight?: number,
	notes?: string
) {
	const start = startOfDay(checkIn);
	const end = startOfDay(checkOut);
	const days = eachDayOfInterval({ start, end: new Date(end.getTime() - 86400000) });

	for (const day of days) {
		const existing = await database
			.select()
			.from(roomCalendar)
			.where(
				eq(roomCalendar.propertyId, propertyId)
			)
			.then((rows) =>
				rows.find((r) => startOfDay(new Date(r.date)).getTime() === startOfDay(day).getTime())
			);

		if (existing) {
			await database
				.update(roomCalendar)
				.set({
					status,
					orderId,
					price: pricePerNight ?? existing.price,
					notes: notes ?? existing.notes,
					updatedAt: new Date()
				})
				.where(eq(roomCalendar.id, existing.id));
		} else {
			await database.insert(roomCalendar).values({
				id: crypto.randomUUID(),
				propertyId,
				date: day,
				status,
				orderId,
				price: pricePerNight,
				notes
			});
		}
	}
}

export async function clearCalendarForOrder(
	database: DB,
	propertyId: string,
	orderId: string,
	checkIn: Date,
	checkOut: Date
) {
	const start = startOfDay(checkIn);
	const end = startOfDay(checkOut);
	const days = eachDayOfInterval({ start, end: new Date(end.getTime() - 86400000) });

	for (const day of days) {
		const existing = await database
			.select()
			.from(roomCalendar)
			.then((rows) =>
				rows.find(
					(r) =>
						r.propertyId === propertyId &&
						startOfDay(new Date(r.date)).getTime() === startOfDay(day).getTime() &&
						r.orderId === orderId
				)
			);

		if (existing) {
			await database
				.update(roomCalendar)
				.set({
					status: 'available',
					orderId: null,
					updatedAt: new Date()
				})
				.where(eq(roomCalendar.id, existing.id));
		}
	}
}

export async function createExceptionFromConflict(
	database: DB,
	propertyId: string,
	orderId: string,
	conflictingOrderId: string,
	affectedStart: Date,
	affectedEnd: Date,
	createdBy: string
) {
	const existing = await database
		.select()
		.from(exceptionOrder)
		.where(
			eq(exceptionOrder.orderId, orderId)
		)
		.then((rows) =>
			rows.find(
				(r) =>
					r.conflictingOrderId === conflictingOrderId &&
					(r.status === 'open' || r.status === 'investigating')
			)
		);

	if (existing) return existing;

	const nightCount = differenceInDays(affectedEnd, affectedStart);
	const ex = await database
		.insert(exceptionOrder)
		.values({
			id: crypto.randomUUID(),
			exceptionNo: `EXC-${Date.now()}`,
			type: 'double_booking',
			status: 'open',
			severity: 'high',
			title: `房态冲突: 房源${propertyId} 存在重复预订`,
			description: `订单 ${orderId} 与订单 ${conflictingOrderId} 在日期范围 ${affectedStart.toISOString().split('T')[0]} 至 ${affectedEnd.toISOString().split('T')[0]} 存在房态冲突`,
			propertyId,
			orderId,
			conflictingOrderId,
			affectedStartDate: affectedStart,
			affectedEndDate: affectedEnd,
			affectedNights: nightCount,
			createdBy
		})
		.returning();

	return ex[0];
}

function differenceInDays(a: Date, b: Date) {
	return Math.ceil((b.getTime() - a.getTime()) / 86400000);
}
