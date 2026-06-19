import { router, publicProcedure, authedProcedure } from '$server/trpc/context';
import { z } from 'zod';
import { db } from '$server/db';
import { users } from '$server/db/schema';
import { eq } from 'drizzle-orm';
import { lucia } from '$server/auth';
import { verifyPassword } from '$server/auth/password';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
	login: publicProcedure
		.input(z.object({ username: z.string(), password: z.string() }))
		.mutation(async ({ input }) => {
			const [user] = await db.select().from(users).where(eq(users.username, input.username));

			if (!user) {
				throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户名或密码错误' });
			}

			const valid = await verifyPassword(input.password, user.passwordHash);

			if (!valid) {
				throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户名或密码错误' });
			}

			const session = await lucia.createSession(user.id, {});

			return {
				sessionId: session.id,
				user: {
					id: user.id,
					username: user.username,
					displayName: user.displayName,
					roleId: user.roleId,
					phone: user.phone
				}
			};
		}),

	logout: authedProcedure
		.input(z.object({ sessionId: z.string() }))
		.mutation(async ({ input }) => {
			await lucia.invalidateSession(input.sessionId);
			return { success: true };
		}),

	me: authedProcedure.query(({ ctx }) => {
		return ctx.user;
	})
});
