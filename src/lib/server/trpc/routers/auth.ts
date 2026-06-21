import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { lucia } from '$lib/server/auth';
import { Argon2id } from 'oslo/password';
import { generateId } from 'lucia';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
	login: publicProcedure
		.input(
			z.object({
				username: z.string(),
				password: z.string()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.username, input.username))
				.limit(1);

			if (!user) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: '用户名或密码错误'
				});
			}

			const validPassword = await new Argon2id().verify(user.passwordHash, input.password);
			if (!validPassword) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: '用户名或密码错误'
				});
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
					email: user.email,
					fullName: user.fullName,
					role: user.role,
					phone: user.phone
				}
			};
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

	getCurrentUser: publicProcedure.query(({ ctx }) => {
		return ctx.user;
	}),

	register: publicProcedure
		.input(
			z.object({
				username: z.string().min(3).max(50),
				email: z.string().email(),
				password: z.string().min(6),
				fullName: z.string().min(2).max(100),
				phone: z.string().optional(),
				role: z.enum(['project_manager', 'designer', 'foreman', 'worker', 'supplier', 'client', 'admin']).default('worker')
			})
		)
		.mutation(async ({ input }) => {
			const existingUser = await db
				.select()
				.from(users)
				.where(eq(users.username, input.username))
				.limit(1);

			if (existingUser.length > 0) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: '用户名已存在'
				} as const);
			}

			const existingEmail = await db
				.select()
				.from(users)
				.where(eq(users.email, input.email))
				.limit(1);

			if (existingEmail.length > 0) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: '邮箱已存在'
				} as const);
			}

			const userId = generateId(15);
			const passwordHash = await new Argon2id().hash(input.password);

			await db.insert(users).values({
				id: userId,
				username: input.username,
				email: input.email,
				passwordHash,
				fullName: input.fullName,
				phone: input.phone,
				role: input.role
			});

			return { success: true };
		})
});
