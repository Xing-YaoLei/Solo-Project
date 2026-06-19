import { z } from 'zod';
import { router, protectedProcedure, roleProcedure } from '../t';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import { guestRegistration } from '$server/db/schema';
import { createAuditLog, diffObject } from '$server/utils/audit';

export const guestRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				orderId: z.string().optional(),
				propertyId: z.string().optional(),
				search: z.string().optional()
			}).optional()
		)
		.query(async ({ ctx, input }) => {
			const where: any[] = [];
			if (input?.orderId) where.push(eq(guestRegistration.orderId, input.orderId));
			if (input?.propertyId) where.push(eq(guestRegistration.propertyId, input.propertyId));
			if (input?.search) {
				const search = `%${input.search}%`;
				where.push(
					or(
						sql`${guestRegistration.fullName} LIKE ${search}`,
						sql`${guestRegistration.idNumber} LIKE ${search}`,
						sql`${guestRegistration.phone} LIKE ${search}`
					)
				);
			}

			return ctx.db
				.select()
				.from(guestRegistration)
				.where(where.length > 0 ? and(...where) : undefined)
				.orderBy(desc(guestRegistration.createdAt))
				.all();
		}),

	get: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.db.select().from(guestRegistration).where(eq(guestRegistration.id, input)).get();
		}),

	create: roleProcedure(['admin', 'manager', 'staff'])
		.input(
			z.object({
				propertyId: z.string(),
				orderId: z.string().optional(),
				fullName: z.string(),
				idType: z.enum(['id_card', 'passport', 'driver_license', 'other']).default('id_card'),
				idNumber: z.string(),
				nationality: z.string().default('CN'),
				gender: z.enum(['male', 'female', 'other']).optional(),
				birthDate: z.date().optional(),
				address: z.string().optional(),
				phone: z.string().optional(),
				idFrontPhoto: z.string().optional(),
				idBackPhoto: z.string().optional(),
				facePhoto: z.string().optional(),
				isPrimary: z.boolean().default(false),
				checkInAt: z.date().optional(),
				remark: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = crypto.randomUUID();
			const reg = await ctx.db
				.insert(guestRegistration)
				.values({ id, ...input })
				.returning()
				.get();

			await createAuditLog(
				{ action: 'create', entityType: 'guest_registration', entityId: id },
				ctx.user.id,
				ctx.db
			);

			return reg;
		}),

	update: roleProcedure(['admin', 'manager', 'staff'])
		.input(
			z.object({
				id: z.string(),
				fullName: z.string().optional(),
				idType: z.enum(['id_card', 'passport', 'driver_license', 'other']).optional(),
				idNumber: z.string().optional(),
				nationality: z.string().optional(),
				gender: z.enum(['male', 'female', 'other']).optional(),
				birthDate: z.date().optional(),
				address: z.string().optional(),
				phone: z.string().optional(),
				idFrontPhoto: z.string().optional(),
				idBackPhoto: z.string().optional(),
				facePhoto: z.string().optional(),
				isPrimary: z.boolean().optional(),
				checkInAt: z.date().optional(),
				checkOutAt: z.date().optional(),
				remark: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const old = await ctx.db.select().from(guestRegistration).where(eq(guestRegistration.id, input.id)).get();
			const { id, ...data } = input;
			const updated = await ctx.db
				.update(guestRegistration)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(guestRegistration.id, id))
				.returning()
				.get();

			if (old && updated) {
				const changes = diffObject(old as any, updated as any);
				for (const ch of changes) {
					await createAuditLog(
						{
							action: 'update',
							entityType: 'guest_registration',
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
			await ctx.db.delete(guestRegistration).where(eq(guestRegistration.id, input));
			await createAuditLog(
				{ action: 'delete', entityType: 'guest_registration', entityId: input },
				ctx.user.id,
				ctx.db
			);
			return { success: true };
		})
});
