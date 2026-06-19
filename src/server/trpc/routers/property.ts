import { z } from 'zod';
import { router, protectedProcedure, roleProcedure } from '../t';
import { eq, desc, between, and, sql, gte, lte, inArray } from 'drizzle-orm';
import { property, roomCalendar } from '$server/db/schema';
import { createAuditLog, diffObject } from '$server/utils/audit';
import { eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';

export const propertyRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				status: z.enum(['active', 'inactive']).optional()
			}).optional()
		)
		.query(async ({ ctx, input }) => {
			const where = input?.status ? eq(property.status, input.status) : undefined;
			return ctx.db
				.select()
				.from(property)
				.where(where as any)
				.orderBy(desc(property.createdAt))
				.all();
		}),

	get: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.db.select().from(property).where(eq(property.id, input)).get();
		}),

	create: roleProcedure(['admin', 'manager'])
		.input(
			z.object({
				name: z.string(),
				address: z.string(),
				city: z.string(),
				type: z.enum(['apartment', 'house', 'villa', 'loft', 'other']),
				bedrooms: z.number().int().default(1),
				bathrooms: z.number().int().default(1),
				maxGuests: z.number().int().default(2),
				area: z.number().optional(),
				basePrice: z.number().default(0),
				cleaningFee: z.number().default(0),
				depositAmount: z.number().default(0),
				amenities: z.array(z.string()).default([]),
				images: z.array(z.string()).default([]),
				description: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = crypto.randomUUID();
			const newProp = await ctx.db
				.insert(property)
				.values({ id, ...input })
				.returning()
				.get();

			await createAuditLog(
				{ action: 'create', entityType: 'property', entityId: id },
				ctx.user.id,
				ctx.db
			);

			return newProp;
		}),

	update: roleProcedure(['admin', 'manager'])
		.input(
			z.object({
				id: z.string(),
				name: z.string().optional(),
				address: z.string().optional(),
				city: z.string().optional(),
				type: z.enum(['apartment', 'house', 'villa', 'loft', 'other']).optional(),
				bedrooms: z.number().int().optional(),
				bathrooms: z.number().int().optional(),
				maxGuests: z.number().int().optional(),
				area: z.number().optional(),
				basePrice: z.number().optional(),
				cleaningFee: z.number().optional(),
				depositAmount: z.number().optional(),
				amenities: z.array(z.string()).optional(),
				images: z.array(z.string()).optional(),
				description: z.string().optional(),
				status: z.enum(['active', 'inactive']).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const old = await ctx.db.select().from(property).where(eq(property.id, input.id)).get();
			const { id, ...data } = input;
			const updated = await ctx.db
				.update(property)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(property.id, id))
				.returning()
				.get();

			if (old && updated) {
				const changes = diffObject(old as any, updated as any);
				for (const ch of changes) {
					await createAuditLog(
						{
							action: 'update',
							entityType: 'property',
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

	delete: roleProcedure(['admin'])
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(property).where(eq(property.id, input));
			await createAuditLog(
				{ action: 'delete', entityType: 'property', entityId: input },
				ctx.user.id,
				ctx.db
			);
			return { success: true };
		}),

	getCalendar: protectedProcedure
		.input(
			z.object({
				propertyIds: z.array(z.string()).optional(),
				startDate: z.date(),
				endDate: z.date()
			})
		)
		.query(async ({ ctx, input }) => {
			const where = [
				gte(roomCalendar.date, startOfDay(input.startDate)),
				lte(roomCalendar.date, endOfDay(input.endDate))
			];
			if (input.propertyIds && input.propertyIds.length > 0) {
				where.push(inArray(roomCalendar.propertyId, input.propertyIds) as any);
			}

			return ctx.db
				.select()
				.from(roomCalendar)
				.where(and(...(where as any)))
				.orderBy(roomCalendar.propertyId, roomCalendar.date)
				.all();
		}),

	updateCalendarStatus: roleProcedure(['admin', 'manager', 'staff'])
		.input(
			z.object({
				propertyId: z.string(),
				date: z.date(),
				status: z.enum(['available', 'booked', 'occupied', 'cleaning', 'maintenance', 'blocked']),
				notes: z.string().optional(),
				price: z.number().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const day = startOfDay(input.date);
			const existing = await ctx.db
				.select()
				.from(roomCalendar)
				.where(
					and(
						eq(roomCalendar.propertyId, input.propertyId),
						sql`date(${roomCalendar.date}) = date(${day.toISOString()})`
					)
				)
				.get();

			const oldStatus = existing?.status;

			if (existing) {
				const updated = await ctx.db
					.update(roomCalendar)
					.set({
						status: input.status,
						notes: input.notes ?? existing.notes,
						price: input.price ?? existing.price,
						updatedAt: new Date()
					})
					.where(eq(roomCalendar.id, existing.id))
					.returning()
					.get();

				await createAuditLog(
					{
						action: 'status_change',
						entityType: 'calendar',
						entityId: existing.id,
						field: 'status',
						oldValue: oldStatus,
						newValue: input.status,
						meta: { propertyId: input.propertyId, date: day.toISOString() }
					},
					ctx.user.id,
					ctx.db
				);

				return updated;
			} else {
				const id = crypto.randomUUID();
				const created = await ctx.db
					.insert(roomCalendar)
					.values({
						id,
						propertyId: input.propertyId,
						date: day,
						status: input.status,
						notes: input.notes,
						price: input.price
					})
					.returning()
					.get();

				await createAuditLog(
					{
						action: 'status_change',
						entityType: 'calendar',
						entityId: id,
						field: 'status',
						oldValue: null,
						newValue: input.status,
						meta: { propertyId: input.propertyId, date: day.toISOString() }
					},
					ctx.user.id,
					ctx.db
				);

				return created;
			}
		})
});
