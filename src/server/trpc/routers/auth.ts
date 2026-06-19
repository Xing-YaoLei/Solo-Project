import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, roleProcedure } from '../t';
import { eq, sql, desc } from 'drizzle-orm';
import { user } from '$server/db/schema';
import { Argon2id } from 'oslo/password';
import { lucia } from '$server/auth';
import { createAuditLog } from '$server/utils/audit';

export const authRouter = router({
	register: publicProcedure
		.input(
			z.object({
				email: z.string().email(),
				username: z.string().min(2),
				password: z.string().min(6),
				phone: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.select().from(user).where(eq(user.email, input.email)).then(r => r[0]);
			if (existing) {
				throw new Error('邮箱已注册');
			}
			const hashed = await new Argon2id().hash(input.password);
			const role = (await ctx.db.select().from(user)).length === 0 ? 'admin' : 'staff';

			const newUser = (await ctx.db
				.insert(user)
				.values({
					id: crypto.randomUUID(),
					email: input.email,
					username: input.username,
					passwordHash: hashed,
					phone: input.phone,
					role
				})
				.returning())[0];

			const session = await lucia.createSession(newUser.id, {});
			const cookie = lucia.createSessionCookie(session.id);
			ctx.event.cookies.set(cookie.name, cookie.value, { path: '.', ...cookie.attributes });

			await createAuditLog(
				{ action: 'register', entityType: 'user', entityId: newUser.id },
				newUser.id,
				ctx.db
			);

			return { success: true, user: newUser };
		}),

	login: publicProcedure
		.input(
			z.object({
				email: z.string().email(),
				password: z.string()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.select().from(user).where(eq(user.email, input.email)).then(r => r[0]);
			if (!existing) throw new Error('用户不存在');

			const valid = await new Argon2id().verify(existing.passwordHash, input.password);
			if (!valid) throw new Error('密码错误');

			const session = await lucia.createSession(existing.id, {});
			const cookie = lucia.createSessionCookie(session.id);
			ctx.event.cookies.set(cookie.name, cookie.value, { path: '.', ...cookie.attributes });

			await createAuditLog(
				{ action: 'login', entityType: 'user', entityId: existing.id },
				existing.id,
				ctx.db
			);

			return { success: true };
		}),

	logout: protectedProcedure.mutation(async ({ ctx }) => {
		if (ctx.event.cookies.get(lucia.sessionCookieName)) {
			await lucia.invalidateSession(ctx.event.cookies.get(lucia.sessionCookieName)!);
		}
		const cookie = lucia.createBlankSessionCookie();
		ctx.event.cookies.set(cookie.name, cookie.value, { path: '.', ...cookie.attributes });
		return { success: true };
	}),

	me: protectedProcedure.query(async ({ ctx }) => {
		return ctx.user;
	}),

	list: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db
			.select({
				id: user.id,
				email: user.email,
				username: user.username,
				role: user.role,
				phone: user.phone,
				avatar: user.avatar,
				createdAt: user.createdAt
			})
			.from(user)
			.orderBy(desc(user.createdAt));
	}),

	updateRole: roleProcedure(['admin'])
		.input(
			z.object({
				userId: z.string(),
				role: z.enum(['admin', 'manager', 'staff'])
			})
		)
		.mutation(async ({ ctx, input }) => {
			const old = await ctx.db.select().from(user).where(eq(user.id, input.userId)).then(r => r[0]);
			const updated = (await ctx.db
				.update(user)
				.set({ role: input.role, updatedAt: new Date() })
				.where(eq(user.id, input.userId))
				.returning())[0];

			await createAuditLog(
				{
					action: 'update_role',
					entityType: 'user',
					entityId: input.userId,
					field: 'role',
					oldValue: old?.role,
					newValue: input.role
				},
				ctx.user.id,
				ctx.db
			);

			return updated;
		})
});
