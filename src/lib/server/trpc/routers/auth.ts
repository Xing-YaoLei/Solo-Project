import { router, publicProcedure, authenticatedProcedure } from '../trpc';
import { db } from '$server/db';
import { users, sessions } from '$server/db/schema';
import { eq } from 'drizzle-orm';
import { lucia } from '$server/auth';
import { hash, verify } from '$server/auth/password';

export const authRouter = router({
	getSession: publicProcedure.query(async ({ ctx }) => {
		return { user: ctx.user };
	}),

	login: publicProcedure
		.input((input: { username: string; password: string }) => input)
		.mutation(async ({ ctx, input }) => {
			const [user] = await db.select().from(users).where(eq(users.username, input.username)).limit(1);
			if (!user) {
				throw new Error('用户名或密码错误');
			}

			const valid = await verify(user.passwordHash, input.password);
			if (!valid) {
				throw new Error('用户名或密码错误');
			}

			const session = await lucia.createSession(user.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});

			return {
				user: {
					id: user.id,
					username: user.username,
					displayName: user.displayName,
					role: user.role
				}
			};
		}),

	logout: authenticatedProcedure.mutation(async ({ ctx }) => {
		if (ctx.sessionId) {
			await lucia.invalidateSession(ctx.sessionId);
		}
		const sessionCookie = lucia.createBlankSessionCookie();
		ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
		return { success: true };
	})
});
