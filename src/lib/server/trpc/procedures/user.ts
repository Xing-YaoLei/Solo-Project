import { router, authedProcedure, createPermissionGuard } from '$server/trpc/context';
import { z } from 'zod';
import { db } from '$server/db';
import { users, roles } from '$server/db/schema';
import { eq, or } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { hashPassword } from '$server/auth/password';

const userViewGuard = authedProcedure.use(createPermissionGuard(['user:view']));
const userCreateGuard = authedProcedure.use(createPermissionGuard(['user:create']));
const userEditGuard = authedProcedure.use(createPermissionGuard(['user:edit']));
const userDeleteGuard = authedProcedure.use(createPermissionGuard(['user:delete']));

export const userRouter = router({
	list: userViewGuard.query(async () => {
		return await db
			.select({
				id: users.id,
				username: users.username,
				displayName: users.displayName,
				phone: users.phone,
				roleId: users.roleId,
				createdAt: users.createdAt,
				roleName: roles.name,
				roleLabel: roles.label
			})
			.from(users)
			.innerJoin(roles, eq(users.roleId, roles.id));
	}),

	create: userCreateGuard
		.input(z.object({
			username: z.string(),
			password: z.string(),
			displayName: z.string(),
			phone: z.string().optional(),
			roleId: z.string()
		}))
		.mutation(async ({ input }) => {
			const passwordHash = await hashPassword(input.password);
			const [created] = await db.insert(users).values({
				username: input.username,
				passwordHash,
				displayName: input.displayName,
				phone: input.phone ?? null,
				roleId: input.roleId
			}).returning();
			return created;
		}),

	update: userEditGuard
		.input(z.object({
			id: z.string(),
			displayName: z.string().optional(),
			phone: z.string().optional(),
			roleId: z.string().optional()
		}))
		.mutation(async ({ input }) => {
			const { id, ...data } = input;
			const updateData: Record<string, unknown> = {};
			if (data.displayName !== undefined) updateData.displayName = data.displayName;
			if (data.phone !== undefined) updateData.phone = data.phone;
			if (data.roleId !== undefined) updateData.roleId = data.roleId;
			const [updated] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
			if (!updated) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '用户不存在' });
			}
			return updated;
		}),

	delete: userDeleteGuard
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input }) => {
			const [deleted] = await db.delete(users).where(eq(users.id, input.id)).returning();
			if (!deleted) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '用户不存在' });
			}
			return { success: true };
		}),

	listStaff: authedProcedure.query(async () => {
		return await db
			.select({
				id: users.id,
				displayName: users.displayName,
				phone: users.phone,
				roleName: roles.name,
				roleLabel: roles.label
			})
			.from(users)
			.innerJoin(roles, eq(users.roleId, roles.id))
			.where(or(
				eq(roles.name, 'ticket_agent'),
				eq(roles.name, 'patrol_agent'),
				eq(roles.name, 'operator')
			));
	})
});
