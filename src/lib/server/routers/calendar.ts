import { z } from 'zod';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import { calendarEventTable, bookingTable, cleaningTaskTable } from '../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';

const eventTypeEnum = z.enum(['booking', 'cleaning', 'maintenance', 'other']);

export const calendarRouter = router({
	getEvents: protectedProcedure
		.input(
			z.object({
				start: z.date(),
				end: z.date(),
				propertyIds: z.array(z.string()).optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const conditions = [
				gte(calendarEventTable.startDate, input.start),
				lte(calendarEventTable.endDate, input.end)
			];
			if (input.propertyIds && input.propertyIds.length > 0) {
				conditions.push(eq(calendarEventTable.propertyId, input.propertyIds[0]));
			}

			const customEvents = await ctx.db
				.select()
				.from(calendarEventTable)
				.where(and(...conditions))
				;

			const bookings = await ctx.db
				.select()
				.from(bookingTable)
				.where(
					and(
						gte(bookingTable.checkInDate, input.start),
						lte(bookingTable.checkOutDate, input.end)
					)
				)
				;

			const tasks = await ctx.db
				.select()
				.from(cleaningTaskTable)
				.where(
					and(
						gte(cleaningTaskTable.scheduledDate, input.start),
						lte(cleaningTaskTable.scheduledDate, input.end)
					)
				)
				;

			const bookingEvents = bookings.map((b) => ({
				id: `booking_${b.id}`,
				propertyId: b.propertyId,
				title: `预订: ${b.guestName}`,
				type: 'booking' as const,
				referenceId: b.id,
				startDate: b.checkInDate,
				endDate: b.checkOutDate,
				isAllDay: true,
				color: getStatusColor(b.status),
				notes: b.notes,
				createdAt: b.createdAt,
				updatedAt: b.updatedAt,
				source: 'booking' as const,
				sourceData: b
			}));

			const taskEvents = tasks.map((t) => ({
				id: `task_${t.id}`,
				propertyId: t.propertyId,
				title: `保洁: ${getTaskTypeLabel(t.type)}`,
				type: 'cleaning' as const,
				referenceId: t.id,
				startDate: t.scheduledDate,
				endDate: new Date(t.scheduledDate.getTime() + 4 * 60 * 60 * 1000),
				isAllDay: true,
				color: getTaskStatusColor(t.status),
				notes: t.description,
				createdAt: t.createdAt,
				updatedAt: t.updatedAt,
				source: 'task' as const,
				sourceData: t
			}));

			return {
				custom: customEvents,
				bookings: bookingEvents,
				tasks: taskEvents,
				all: [...customEvents.map((e) => ({ ...e, source: 'custom' as const })), ...bookingEvents, ...taskEvents]
			};
		}),

	createEvent: managerProcedure
		.input(
			z.object({
				propertyId: z.string(),
				title: z.string().min(1),
				type: eventTypeEnum.default('other'),
				referenceId: z.string().optional(),
				startDate: z.date(),
				endDate: z.date(),
				isAllDay: z.boolean().default(true),
				color: z.string().optional(),
				notes: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateIdFromEntropySize(16);
			const [result] = await ctx.db
				.insert(calendarEventTable)
				.values({
					id,
					...input,
					startDate: input.startDate,
					endDate: input.endDate
				})
				.returning();
			return result;
		}),

	updateEvent: managerProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().min(1).optional(),
				type: eventTypeEnum.optional(),
				startDate: z.date().optional(),
				endDate: z.date().optional(),
				color: z.string().optional(),
				notes: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [result] = await ctx.db
				.update(calendarEventTable)
				.set({
					...data,
					startDate: data.startDate,
					endDate: data.endDate,
					updatedAt: new Date()
				})
				.where(eq(calendarEventTable.id, id))
				.returning();
			return result;
		}),

	deleteEvent: managerProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(calendarEventTable).where(eq(calendarEventTable.id, input.id));
			return true;
		})
});

function getStatusColor(status: string): string {
	switch (status) {
		case 'confirmed':
			return '#3b82f6';
		case 'checked_in':
			return '#10b981';
		case 'checked_out':
			return '#6b7280';
		case 'cancelled':
			return '#ef4444';
		default:
			return '#6b7280';
	}
}

function getTaskStatusColor(status: string): string {
	switch (status) {
		case 'pending':
			return '#6b7280';
		case 'assigned':
			return '#3b82f6';
		case 'accepted':
			return '#8b5cf6';
		case 'in_progress':
			return '#f59e0b';
		case 'completed':
			return '#10b981';
		case 'verified':
			return '#059669';
		case 'cancelled':
			return '#ef4444';
		case 'missed':
			return '#dc2626';
		default:
			return '#6b7280';
	}
}

function getTaskTypeLabel(type: string): string {
	switch (type) {
		case 'checkout_cleaning':
			return '退房保洁';
		case 'periodic_cleaning':
			return '日常保洁';
		case 'deep_cleaning':
			return '深度清洁';
		case 'maintenance':
			return '维修保养';
		default:
			return type;
	}
}
