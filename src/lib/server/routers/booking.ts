import { z } from 'zod';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import { bookingTable, guestDocumentTable, userTable, propertyTable } from '../db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';
import { TRPCError } from '@trpc/server';

const bookingStatusEnum = z.enum(['confirmed', 'checked_in', 'checked_out', 'cancelled']);
const sourceEnum = z.enum(['airbnb', 'tujia', 'xiaozhu', 'meituan', 'direct', 'other']);
const idTypeEnum = z.enum(['id_card', 'passport', 'driver_license', 'other']);

export const bookingRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				propertyId: z.string().optional(),
				status: bookingStatusEnum.optional(),
				source: sourceEnum.optional(),
				dateFrom: z.date().optional(),
				dateTo: z.date().optional(),
				page: z.number().default(1),
				pageSize: z.number().default(50)
			})
		)
		.query(async ({ ctx, input }) => {
			const offset = (input.page - 1) * input.pageSize;

			const conditions = [];
			if (input.propertyId) {
				conditions.push(eq(bookingTable.propertyId, input.propertyId));
			}
			if (input.status) {
				conditions.push(eq(bookingTable.status, input.status));
			}
			if (input.source) {
				conditions.push(eq(bookingTable.source, input.source));
			}
			if (input.dateFrom) {
				conditions.push(gte(bookingTable.checkInDate, input.dateFrom));
			}
			if (input.dateTo) {
				conditions.push(lte(bookingTable.checkOutDate, input.dateTo));
			}

			const where = conditions.length > 0 ? and(...conditions) : undefined;

			const items = await ctx.db
				.select({
					booking: bookingTable,
					property: propertyTable
				})
				.from(bookingTable)
				.leftJoin(propertyTable, eq(bookingTable.propertyId, propertyTable.id))
				.where(where)
				.orderBy(desc(bookingTable.checkInDate))
				.limit(input.pageSize)
				.offset(offset)
				;

			const total = await ctx.db
				.select({ count: bookingTable.id })
				.from(bookingTable)
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

	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const [booking] = await ctx.db
				.select({
					booking: bookingTable,
					property: propertyTable
				})
				.from(bookingTable)
				.leftJoin(propertyTable, eq(bookingTable.propertyId, propertyTable.id))
				.where(eq(bookingTable.id, input.id));

			if (!booking) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '预订不存在' });
			}

			const documents = await ctx.db
				.select()
				.from(guestDocumentTable)
				.where(eq(guestDocumentTable.bookingId, input.id))
				;

			return { ...booking, documents };
		}),

	create: managerProcedure
		.input(
			z.object({
				propertyId: z.string(),
				guestName: z.string().min(1),
				guestPhone: z.string().min(1),
				checkInDate: z.date(),
				checkOutDate: z.date(),
				adults: z.number().default(1),
				children: z.number().default(0),
				source: sourceEnum.default('other'),
				totalPrice: z.number().optional(),
				notes: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateIdFromEntropySize(16);
			const [result] = await ctx.db
				.insert(bookingTable)
				.values({
					id,
					...input,
					checkInDate: input.checkInDate,
					checkOutDate: input.checkOutDate,
					status: 'confirmed'
				})
				.returning();
			return result;
		}),

	update: managerProcedure
		.input(
			z.object({
				id: z.string(),
				guestName: z.string().min(1).optional(),
				guestPhone: z.string().min(1).optional(),
				checkInDate: z.date().optional(),
				checkOutDate: z.date().optional(),
				adults: z.number().optional(),
				children: z.number().optional(),
				source: sourceEnum.optional(),
				totalPrice: z.number().optional().nullable(),
				status: bookingStatusEnum.optional(),
				notes: z.string().optional().nullable()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [result] = await ctx.db
				.update(bookingTable)
				.set({
					...data,
					checkInDate: data.checkInDate,
					checkOutDate: data.checkOutDate,
					updatedAt: new Date()
				})
				.where(eq(bookingTable.id, id))
				.returning();
			return result;
		}),

	addDocument: managerProcedure
		.input(
			z.object({
				bookingId: z.string(),
				guestName: z.string().min(1),
				idType: idTypeEnum.default('id_card'),
				idNumber: z.string().min(1),
				idFrontUrl: z.string().optional(),
				idBackUrl: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateIdFromEntropySize(16);
			const [result] = await ctx.db
				.insert(guestDocumentTable)
				.values({ id, ...input })
				.returning();
			return result;
		}),

	verifyDocument: managerProcedure
		.input(z.object({ documentId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const [result] = await ctx.db
				.update(guestDocumentTable)
				.set({
					verifiedAt: new Date(),
					verifiedById: ctx.user.id
				})
				.where(eq(guestDocumentTable.id, input.documentId))
				.returning();
			return result;
		}),

	getDocuments: protectedProcedure
		.input(z.object({ bookingId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db
				.select({
					document: guestDocumentTable,
					verifier: userTable
				})
				.from(guestDocumentTable)
				.leftJoin(userTable, eq(guestDocumentTable.verifiedById, userTable.id))
				.where(eq(guestDocumentTable.bookingId, input.bookingId))
				;
		})
});
