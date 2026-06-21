import { z } from 'zod';
import bcrypt from 'bcryptjs';
const { hash, compare } = bcrypt;
import { eq } from 'drizzle-orm';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { userTable } from '$server/db/schema';
import { lucia } from '$server/auth';

export const authRouter = router({
	signup: publicProcedure
		.input(
			z.object({
				username: z.string().min(3).max(64),
				password: z.string().min(6).max(255),
				fullName: z.string().min(2).max(128),
				phone: z.string().optional(),
				role: z.enum(['worker', 'manager', 'admin']).default('worker')
			})
		)
		.mutation(async ({ ctx, input }) => {
			const existingUser = await ctx.db.query.userTable.findFirst({
				where: eq(userTable.username, input.username)
			});
			if (existingUser) {
				throw new Error('用户名已存在');
			}

			const passwordHash = await hash(input.password, 10);

			const [user] = await ctx.db
				.insert(userTable)
				.values({
					username: input.username,
					passwordHash,
					fullName: input.fullName,
					phone: input.phone,
					role: input.role
				})
				.returning();

			const session = await lucia.createSession(user.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);

			ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});

			return { user, session };
		}),

	login: publicProcedure
		.input(
			z.object({
				username: z.string().min(3).max(64),
				password: z.string().min(6).max(255)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const user = await ctx.db.query.userTable.findFirst({
				where: eq(userTable.username, input.username)
			});
			if (!user) {
				throw new Error('用户名或密码错误');
			}

			const validPassword = await compare(input.password, user.passwordHash);
			if (!validPassword) {
				throw new Error('用户名或密码错误');
			}

			const session = await lucia.createSession(user.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);

			ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});

			return { user, session };
		}),

	logout: protectedProcedure.mutation(async ({ ctx }) => {
		await lucia.invalidateSession(ctx.session.id);
		const sessionCookie = lucia.createBlankSessionCookie();
		ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
		return { success: true };
	}),

	getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
		return ctx.user;
	})
});
