import { z } from 'zod';
import { router, managerProcedure, adminProcedure, protectedProcedure } from '../trpc';
import { db } from '../../db';
import { users, type UserRole } from '../../db/schema';
import { eq, and, like, asc } from 'drizzle-orm';
import { generateId, hashPassword } from '../../utils';

export const userRouter = router({
	list: managerProcedure
		.input(
			z.object({
				search: z.string().optional(),
				role: z.enum(['admin', 'manager', 'nurse', 'caregiver']).optional()
			})
		)
		.query(async ({ input }) => {
			const conditions = [];
			if (input.search) {
				conditions.push(like(users.fullName, `%${input.search}%`));
			}
			if (input.role) {
				conditions.push(eq(users.role, input.role));
			}
			return db
				.select({
					id: users.id,
					username: users.username,
					fullName: users.fullName,
					role: users.role,
					phone: users.phone,
					avatar: users.avatar,
					createdAt: users.createdAt
				})
				.from(users)
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(asc(users.fullName));
		}),

	caregivers: protectedProcedure.query(async () => {
		return db
			.select({
				id: users.id,
				fullName: users.fullName,
				role: users.role
			})
			.from(users)
			.where(eq(users.role, 'caregiver'))
			.orderBy(asc(users.fullName));
	}),

	create: adminProcedure
		.input(
			z.object({
				username: z.string().min(3),
				password: z.string().min(6),
				fullName: z.string().min(1),
				role: z.enum(['admin', 'manager', 'nurse', 'caregiver']),
				phone: z.string().optional()
			})
		)
		.mutation(async ({ input }) => {
			const existing = await db.select().from(users).where(eq(users.username, input.username));
			if (existing.length > 0) {
				throw new Error('用户名已存在');
			}

			const id = generateId();
			const passwordHash = await hashPassword(input.password);

			await db.insert(users).values({
				id,
				username: input.username,
				passwordHash,
				fullName: input.fullName,
				role: input.role as UserRole,
				phone: input.phone
			});

			return id;
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				fullName: z.string().optional(),
				role: z.enum(['admin', 'manager', 'nurse', 'caregiver']).optional(),
				phone: z.string().optional()
			})
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input;
			await db.update(users).set(data).where(eq(users.id, id));
			return true;
		}),

	delete: adminProcedure.input(z.string()).mutation(async ({ input }) => {
		await db.delete(users).where(eq(users.id, input));
		return true;
	})
});
