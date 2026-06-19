import { z } from 'zod';
import { router, protectedProcedure, roleProcedure } from '../t';
import { eq, desc, and, gte, lte, sql, or } from 'drizzle-orm';
import { order, exceptionOrder } from '$server/db/schema';
import { createAuditLog, diffObject } from '$server/utils/audit';
import { checkRoomStatusConflict } from '$server/utils/conflict';
import { updateCalendarForOrder, clearCalendarForOrder, createExceptionFromConflict } from '$server/utils/calendar';
import { differenceInDays, startOfDay } from 'date-fns';

export const orderRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				status: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']).optional(),
				channel: z.enum(['airbnb', 'booking', 'tujia', 'meituan', 'xiaohongshu', 'direct', 'other']).optional(),
				propertyId: z.string().optional(),
				startDate: z.date().optional(),
				endDate: z.date().optional(),
				search: z.string().optional()
			}).optional()
		)
		.query(async ({ ctx, input }) => {
			const where: any[] = [];
			if (input?.status) where.push(eq(order.status, input.status));
			if (input?.channel) where.push(eq(order.channel, input.channel));
			if (input?.propertyId) where.push(eq(order.propertyId, input.propertyId));
			if (input?.startDate) where.push(gte(order.checkInDate, startOfDay(input.startDate)));
			if (input?.endDate) where.push(lte(order.checkOutDate, startOfDay(input.endDate)));
			if (input?.search) {
				const search = `%${input.search}%`;
				where.push(
					or(
						sql`${order.guestName} LIKE ${search}`,
						sql`${order.guestPhone} LIKE ${search}`,
						sql`${order.orderNo} LIKE ${search}`,
						sql`${order.channelOrderNo} LIKE ${search}`
					)
				);
			}

			return ctx.db
				.select()
				.from(order)
				.where(where.length > 0 ? and(...(where as any)) : undefined)
				.orderBy(desc(order.createdAt))
				.all();
		}),

	get: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.db.select().from(order).where(eq(order.id, input)).get();
		}),

	create: roleProcedure(['admin', 'manager', 'staff'])
		.input(
			z.object({
				propertyId: z.string(),
				channel: z.enum(['airbnb', 'booking', 'tujia', 'meituan', 'xiaohongshu', 'direct', 'other']).default('direct'),
				channelOrderNo: z.string().optional(),
				guestName: z.string(),
				guestPhone: z.string(),
				guestEmail: z.string().optional(),
				guestCount: z.number().int().default(1),
				checkInDate: z.date(),
				checkOutDate: z.date(),
				totalPrice: z.number().default(0),
				cleaningFee: z.number().default(0),
				depositAmount: z.number().default(0),
				channelFee: z.number().default(0),
				status: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']).default('pending'),
				paymentStatus: z.enum(['unpaid', 'partial', 'paid', 'refunded']).default('unpaid'),
				paidAmount: z.number().default(0),
				source: z.enum(['online', 'offline']).default('online'),
				contactPerson: z.string().optional(),
				contactPhone: z.string().optional(),
				remark: z.string().optional(),
				internalNote: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const nights = Math.max(differenceInDays(input.checkOutDate, input.checkInDate), 1);
			const pricePerNight = nights > 0 ? input.totalPrice / nights : 0;

			const conflict = await checkRoomStatusConflict(ctx.db, input.propertyId, input.checkInDate, input.checkOutDate);

			const id = crypto.randomUUID();
			const orderNo = `ORD${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

			const newOrder = await ctx.db
				.insert(order)
				.values({
					id,
					orderNo,
					nightCount: nights,
					createdBy: ctx.user.id,
					...input
				})
				.returning()
				.get();

			const calendarStatus = input.status === 'cancelled' || input.status === 'no_show' ? 'available' : 'booked';
			if (input.status !== 'cancelled' && input.status !== 'no_show') {
				await updateCalendarForOrder(
					ctx.db,
					input.propertyId,
					id,
					input.checkInDate,
					input.checkOutDate,
					calendarStatus,
					pricePerNight,
					input.remark
				);
			}

			if (conflict.hasConflict) {
				const uniqueOrderIds = [...new Set(conflict.conflicts.map((c) => c.existingOrderId).filter(Boolean))];
				for (const conflictingOrderId of uniqueOrderIds) {
					const affectedStart = conflict.conflicts[0].date;
					const affectedEnd = conflict.conflicts[conflict.conflicts.length - 1].date;
					await createExceptionFromConflict(
						ctx.db,
						input.propertyId,
						id,
						conflictingOrderId!,
						affectedStart,
						new Date(affectedEnd.getTime() + 86400000),
						ctx.user.id
					);
				}
			}

			await createAuditLog(
				{
					action: 'create',
					entityType: 'order',
					entityId: id,
					meta: { hasConflict: conflict.hasConflict }
				},
				ctx.user.id,
				ctx.db
			);

			return { order: newOrder, conflict };
		}),

	updateStatus: roleProcedure(['admin', 'manager', 'staff'])
		.input(
			z.object({
				id: z.string(),
				status: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'])
			})
		)
		.mutation(async ({ ctx, input }) => {
			const old = await ctx.db.select().from(order).where(eq(order.id, input.id)).get();
			if (!old) throw new Error('订单不存在');

			const updated = await ctx.db
				.update(order)
				.set({ status: input.status, updatedAt: new Date() })
				.where(eq(order.id, input.id))
				.returning()
				.get();

			const statusToCalendar: Record<string, string> = {
				pending: 'booked',
				confirmed: 'booked',
				checked_in: 'occupied',
				checked_out: 'cleaning',
				cancelled: 'available',
				no_show: 'available'
			};

			if (old.status !== input.status) {
				const calStatus = statusToCalendar[input.status];
				if (input.status === 'cancelled' || input.status === 'no_show') {
					await clearCalendarForOrder(ctx.db, old.propertyId, input.id, old.checkInDate, old.checkOutDate);
				} else {
					await updateCalendarForOrder(
						ctx.db,
						old.propertyId,
						input.id,
						old.checkInDate,
						old.checkOutDate,
						calStatus as any
					);
				}
			}

			await createAuditLog(
				{
					action: 'status_change',
					entityType: 'order',
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
				channel: z.enum(['airbnb', 'booking', 'tujia', 'meituan', 'xiaohongshu', 'direct', 'other']).optional(),
				channelOrderNo: z.string().optional(),
				guestName: z.string().optional(),
				guestPhone: z.string().optional(),
				guestEmail: z.string().optional(),
				guestCount: z.number().int().optional(),
				checkInDate: z.date().optional(),
				checkOutDate: z.date().optional(),
				totalPrice: z.number().optional(),
				cleaningFee: z.number().optional(),
				depositAmount: z.number().optional(),
				channelFee: z.number().optional(),
				paymentStatus: z.enum(['unpaid', 'partial', 'paid', 'refunded']).optional(),
				paidAmount: z.number().optional(),
				source: z.enum(['online', 'offline']).optional(),
				contactPerson: z.string().optional(),
				contactPhone: z.string().optional(),
				remark: z.string().optional(),
				internalNote: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const old = await ctx.db.select().from(order).where(eq(order.id, input.id)).get();
			if (!old) throw new Error('订单不存在');

			const { id, ...data } = input;
			const updateData: any = { ...data, updatedAt: new Date() };

			if (input.checkInDate || input.checkOutDate) {
				const newCheckIn = input.checkInDate ?? old.checkInDate;
				const newCheckOut = input.checkOutDate ?? old.checkOutDate;
				updateData.nightCount = Math.max(differenceInDays(newCheckOut, newCheckIn), 1);
			}

			const updated = await ctx.db
				.update(order)
				.set(updateData)
				.where(eq(order.id, id))
				.returning()
				.get();

			const dateOrPropChanged = input.checkInDate || input.checkOutDate || input.propertyId;
			if (dateOrPropChanged && old.status !== 'cancelled' && old.status !== 'no_show') {
				await clearCalendarForOrder(ctx.db, old.propertyId, id, old.checkInDate, old.checkOutDate);
				const newCheckIn = input.checkInDate ?? old.checkInDate;
				const newCheckOut = input.checkOutDate ?? old.checkOutDate;
				const newPropId = input.propertyId ?? old.propertyId;
				const nights = Math.max(differenceInDays(newCheckOut, newCheckIn), 1);
				const pricePerNight = updated.totalPrice && nights > 0 ? updated.totalPrice / nights : 0;

				const conflict = await checkRoomStatusConflict(ctx.db, newPropId, newCheckIn, newCheckOut, id);
				if (conflict.hasConflict) {
					const uniqueOrderIds = [...new Set(conflict.conflicts.map((c) => c.existingOrderId).filter(Boolean))];
					for (const conflictingOrderId of uniqueOrderIds) {
						const affectedStart = conflict.conflicts[0].date;
						const affectedEnd = conflict.conflicts[conflict.conflicts.length - 1].date;
						await createExceptionFromConflict(
							ctx.db,
							newPropId,
							id,
							conflictingOrderId!,
							affectedStart,
							new Date(affectedEnd.getTime() + 86400000),
							ctx.user.id
						);
					}
				}

				const statusToCalendar: Record<string, string> = {
					pending: 'booked',
					confirmed: 'booked',
					checked_in: 'occupied',
					checked_out: 'cleaning',
					cancelled: 'available',
					no_show: 'available'
				};
				await updateCalendarForOrder(
					ctx.db,
					newPropId,
					id,
					newCheckIn,
					newCheckOut,
					statusToCalendar[old.status] as any,
					pricePerNight
				);
			}

			if (old && updated) {
				const changes = diffObject(old as any, updated as any);
				for (const ch of changes) {
					await createAuditLog(
						{
							action: 'update',
							entityType: 'order',
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
			const old = await ctx.db.select().from(order).where(eq(order.id, input)).get();
			if (old && old.status !== 'cancelled' && old.status !== 'no_show') {
				await clearCalendarForOrder(ctx.db, old.propertyId, input, old.checkInDate, old.checkOutDate);
			}
			await ctx.db.delete(order).where(eq(order.id, input));
			await createAuditLog(
				{ action: 'delete', entityType: 'order', entityId: input },
				ctx.user.id,
				ctx.db
			);
			return { success: true };
		}),

	getUpcomingArrivals: protectedProcedure
		.input(z.object({ days: z.number().int().default(7) }).optional())
		.query(async ({ ctx, input }) => {
			const days = input?.days ?? 7;
			const today = startOfDay(new Date());
			const future = new Date(today.getTime() + days * 86400000);
			return ctx.db
				.select()
				.from(order)
				.where(
					and(
						gte(order.checkInDate, today),
						lte(order.checkInDate, future),
						sql`${order.status} IN ('pending','confirmed')`
					)
				)
				.orderBy(order.checkInDate)
				.all();
		}),

	getTodayDepartures: protectedProcedure.query(async ({ ctx }) => {
		const today = startOfDay(new Date());
		const tomorrow = new Date(today.getTime() + 86400000);
		return ctx.db
			.select()
			.from(order)
			.where(
				and(
					gte(order.checkOutDate, today),
					lte(order.checkOutDate, tomorrow),
					sql`${order.status} IN ('confirmed','checked_in')`
				)
			)
			.orderBy(order.checkOutDate)
			.all();
	})
});
