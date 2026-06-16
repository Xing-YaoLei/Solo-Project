import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { db } from '../../db';
import { users, type UserRole } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword, generateId } from '../../utils';
import { lucia } from '../../auth/lucia';

export const authRouter = router({
	getCurrentUser: protectedProcedure.query(({ ctx }) => {
		return ctx.user;
	}),

	login: publicProcedure
		.input(
			z.object({
				username: z.string().min(1, '用户名不能为空'),
				password: z.string().min(1, '密码不能为空')
			})
		)
		.mutation(async ({ input, ctx }) => {
			const userList = await db.select().from(users).where(eq(users.username, input.username));
			const user = userList[0];

			if (!user) {
				throw new Error('用户名或密码错误');
			}

			const isPasswordValid = await verifyPassword(input.password, user.passwordHash);
			if (!isPasswordValid) {
				throw new Error('用户名或密码错误');
			}

			const session = await lucia.createSession(user.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);

			ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});

			return {
				id: user.id,
				username: user.username,
				fullName: user.fullName,
				role: user.role
			};
		}),

	logout: protectedProcedure.mutation(async ({ ctx }) => {
		if (ctx.session) {
			await lucia.invalidateSession(ctx.session.id);
		}
		const cookie = lucia.createBlankSessionCookie();
		ctx.event.cookies.set(cookie.name, cookie.value, { path: '.', ...cookie.attributes });
		return true;
	}),

	register: publicProcedure
		.input(
			z.object({
				username: z.string().min(3, '用户名至少3个字符'),
				password: z.string().min(6, '密码至少6个字符'),
				fullName: z.string().min(1, '姓名不能为空'),
				role: z.enum(['admin', 'manager', 'nurse', 'caregiver']).default('caregiver'),
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

			return { id };
		})
});
