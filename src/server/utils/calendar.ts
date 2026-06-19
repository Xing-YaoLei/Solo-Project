import { eq } from 'drizzle-orm';
import type { DB } from '$server/db';
import { roomCalendar, exceptionOrder } from '$server/db/schema';
import { checkRoomStatusConflict } from './conflict';
import { eachDayOfInterval, startOfDay, differenceInDays } from 'date-fns';
import type { RoomStatusType } from '$lib/types';
import { createAuditLog, diffObject } from './audit';

export interface CalendarUpdateMeta {
	source?: 'order_create' | 'order_update' | 'order_checkin' | 'order_checkout' | 'order_cancel' | 'order_no_show' | 'manual' | 'cleaning_done';
	orderId?: string;
	orderNo?: string;
	userId?: string;
}

export async function updateCalendarForOrder(
	database: DB,
	propertyId: string,
	orderId: string,
	checkIn: Date,
	checkOut: Date,
	status: RoomStatusType,
	pricePerNight?: number,
	notes?: string,
	meta: CalendarUpdateMeta = {}
) {
	const start = startOfDay(checkIn);
	const end = startOfDay(checkOut);
	const days = eachDayOfInterval({ start, end: new Date(end.getTime() - 86400000) });

	const results: { date: Date; action: 'insert' | 'update'; old?: any; new: any }[] = [];

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
			const oldRec = { ...existing };
			const updated = (await database
				.update(roomCalendar)
				.set({
					status,
					orderId,
					price: pricePerNight ?? existing.price,
					notes: notes ?? existing.notes,
					updatedAt: new Date()
				})
				.where(eq(roomCalendar.id, existing.id))
				.returning())[0];

			results.push({ date: day, action: 'update', old: oldRec, new: updated });
		} else {
			const id = crypto.randomUUID();
			const created = (await database.insert(roomCalendar).values({
				id,
				propertyId,
				date: day,
				status,
				orderId,
				price: pricePerNight,
				notes
			}).returning())[0];

			results.push({ date: day, action: 'insert', new: created });
		}
	}

	if (meta.userId) {
		for (const r of results) {
			const auditMeta: Record<string, unknown> = {
				propertyId,
				date: r.date.toISOString().split('T')[0],
				source: meta.source || 'order_update',
				orderId: meta.orderId || orderId,
				orderNo: meta.orderNo
			};

			if (r.action === 'insert') {
				await createAuditLog(
					{
						action: 'status_change',
						entityType: 'calendar',
						entityId: r.new.id,
						field: 'status',
						oldValue: null,
						newValue: status,
						meta: auditMeta
					},
					meta.userId,
					database
				);
				if (r.new.price) {
					await createAuditLog(
						{
							action: 'update',
							entityType: 'calendar',
							entityId: r.new.id,
							field: 'price',
							oldValue: null,
							newValue: r.new.price,
							meta: auditMeta
						},
						meta.userId,
						database
					);
				}
			} else if (r.old) {
				const changes = diffObject(
					{ status: r.old.status, price: r.old.price, notes: r.old.notes, orderId: r.old.orderId },
					{ status: r.new.status, price: r.new.price, notes: r.new.notes, orderId: r.new.orderId }
				);
				for (const ch of changes) {
					await createAuditLog(
						{
							action: ch.field === 'status' ? 'status_change' : 'update',
							entityType: 'calendar',
							entityId: r.new.id,
							field: ch.field,
							oldValue: ch.old,
							newValue: ch.new,
							meta: auditMeta
						},
						meta.userId,
						database
					);
				}
			}
		}
	}

	return results;
}

export async function clearCalendarForOrder(
	database: DB,
	propertyId: string,
	orderId: string,
	checkIn: Date,
	checkOut: Date,
	meta: CalendarUpdateMeta = {}
) {
	const start = startOfDay(checkIn);
	const end = startOfDay(checkOut);
	const days = eachDayOfInterval({ start, end: new Date(end.getTime() - 86400000) });

	const results: { date: Date; old?: any; new: any }[] = [];

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
			const oldRec = { ...existing };
			const updated = (await database
				.update(roomCalendar)
				.set({
					status: 'available',
					orderId: null,
					updatedAt: new Date()
				})
				.where(eq(roomCalendar.id, existing.id))
				.returning())[0];

			results.push({ date: day, old: oldRec, new: updated });
		}
	}

	if (meta.userId) {
		for (const r of results) {
			if (r.old) {
				const auditMeta: Record<string, unknown> = {
					propertyId,
					date: r.date.toISOString().split('T')[0],
					source: meta.source || 'order_cancel',
					orderId: meta.orderId || orderId,
					orderNo: meta.orderNo
				};

				await createAuditLog(
					{
						action: 'status_change',
						entityType: 'calendar',
						entityId: r.new.id,
						field: 'status',
						oldValue: r.old.status,
						newValue: 'available',
						meta: auditMeta
					},
					meta.userId,
					database
				);
				await createAuditLog(
					{
						action: 'update',
						entityType: 'calendar',
						entityId: r.new.id,
						field: 'orderId',
						oldValue: r.old.orderId,
						newValue: null,
						meta: auditMeta
					},
					meta.userId,
					database
				);
			}
		}
	}

	return results;
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
	const ex = (await database
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
		.returning())[0];

	return ex;
}
