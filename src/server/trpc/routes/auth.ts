import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { login, register, logout as authLogout } from '../../auth/service';
import { lucia } from '../../auth/lucia';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
	login: publicProcedure
		.input(
			z.object({
				email: z.string().email(),
				password: z.string().min(6)
			})
		)
		.mutation(async ({ input, ctx }) => {
			const result = await login(input.email, input.password);

			if (!result) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: '邮箱或密码错误'
				});
			}

			const sessionCookie = lucia.createSessionCookie(result.sessionId);
			ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});

			return { user: result.user };
		}),

	register: publicProcedure
		.input(
			z.object({
				email: z.string().email(),
				password: z.string().min(6),
				name: z.string().min(1).max(100)
			})
		)
		.mutation(async ({ input, ctx }) => {
			try {
				const user = await register({
					email: input.email,
					password: input.password,
					name: input.name
				});

				const session = await lucia.createSession(user.id, {});
				const sessionCookie = lucia.createSessionCookie(session.id);

				ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
					path: '.',
					...sessionCookie.attributes
				});

				return { user };
			} catch (error) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: error instanceof Error ? error.message : '注册失败'
				});
			}
		}),

	logout: protectedProcedure.mutation(async ({ ctx }) => {
		const sessionId = ctx.event.cookies.get(lucia.sessionCookieName);
		if (sessionId) {
			await authLogout(sessionId);
		}

		const sessionCookie = lucia.createBlankSessionCookie();
		ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		return { success: true };
	}),

	me: protectedProcedure.query(async ({ ctx }) => {
		return { user: ctx.user };
	})
});
