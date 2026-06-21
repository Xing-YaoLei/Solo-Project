import { z } from 'zod';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import { propertyTable } from '../db/schema';
import { eq, and, like, desc, asc, inArray, or } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';
import { TRPCError } from '@trpc/server';

export const propertyRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				search: z.string().optional(),
				status: z.enum(['active', 'maintenance', 'inactive']).optional(),
				type: z.enum(['apartment', 'house', 'villa', 'room']).optional(),
				page: z.number().default(1),
				pageSize: z.number().default(20)
			})
		)
		.query(async ({ ctx, input }) => {
			const offset = (input.page - 1) * input.pageSize;

			const conditions = [];
			if (input.search) {
				conditions.push(or(like(propertyTable.name, `%${input.search}%`), like(propertyTable.address, `%${input.search}%`)));
			}
			if (input.status) {
				conditions.push(eq(propertyTable.status, input.status));
			}
			if (input.type) {
				conditions.push(eq(propertyTable.type, input.type));
			}

			const where = conditions.length > 0 ? and(...conditions) : undefined;

			const items = await ctx.db
				.select()
				.from(propertyTable)
				.where(where)
				.orderBy(desc(propertyTable.createdAt))
				.limit(input.pageSize)
				.offset(offset)
				;

			const total = await ctx.db
				.select({ count: propertyTable.id })
				.from(propertyTable)
				.where(where)
				
				.then((rows) => rows.length);

			return {
				items,
				total,
				page: input.page,
				pageSize: input.pageSize,
				totalPages: Math.ceil(total / input.pageSize)
			};
		}),

	listAll: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db
			.select()
			.from(propertyTable)
			.where(eq(propertyTable.status, 'active'))
			.orderBy(asc(propertyTable.name))
			;
	}),

	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const [property] = await ctx.db
				.select()
				.from(propertyTable)
				.where(eq(propertyTable.id, input.id));

			if (!property) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '房源不存在' });
			}

			return property;
		}),

	create: managerProcedure
		.input(
			z.object({
				name: z.string().min(1),
				address: z.string().min(1),
				type: z.enum(['apartment', 'house', 'villa', 'room']).default('apartment'),
				bedrooms: z.number().default(1),
				bathrooms: z.number().default(1),
				area: z.number().optional(),
				phone: z.string().optional(),
				ownerName: z.string().optional(),
				ownerPhone: z.string().optional(),
				description: z.string().optional(),
				images: z.array(z.string()).default([])
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateIdFromEntropySize(16);
			const [result] = await ctx.db
				.insert(propertyTable)
				.values({
					id,
					...input,
					createdById: ctx.user.id
				})
				.returning();
			return result;
		}),

	update: managerProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				address: z.string().min(1).optional(),
				type: z.enum(['apartment', 'house', 'villa', 'room']).optional(),
				bedrooms: z.number().optional(),
				bathrooms: z.number().optional(),
				area: z.number().optional().nullable(),
				phone: z.string().optional().nullable(),
				ownerName: z.string().optional().nullable(),
				ownerPhone: z.string().optional().nullable(),
				description: z.string().optional().nullable(),
				images: z.array(z.string()).optional(),
				status: z.enum(['active', 'maintenance', 'inactive']).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [result] = await ctx.db
				.update(propertyTable)
				.set({
					...data,
					updatedAt: new Date()
				})
				.where(eq(propertyTable.id, id))
				.returning();
			return result;
		}),

	remove: managerProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.update(propertyTable)
				.set({ status: 'inactive', updatedAt: new Date() })
				.where(eq(propertyTable.id, input.id));
			return true;
		})
});
