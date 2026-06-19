import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../server';
import { lucia } from '$lib/server/auth';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { hash, verify } from '@node-rs/argon2';

export const authRouter = createTRPCRouter({
	login: publicProcedure
		.input(
			z.object({
				username: z.string().min(1).max(50),
				password: z.string().min(1).max(255)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const existingUser = await db.query.users.findFirst({
				where: eq(schema.users.username, input.username)
			});

			if (!existingUser) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: '用户名或密码错误'
				});
			}

			const validPassword = await verify(existingUser.passwordHash, input.password, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});

			if (!validPassword) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: '用户名或密码错误'
				});
			}

			const session = await lucia.createSession(existingUser.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			ctx.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});

			return {
				id: existingUser.id,
				username: existingUser.username,
				name: existingUser.name,
				role: existingUser.role
			};
		}),

	logout: protectedProcedure.mutation(async ({ ctx }) => {
		if (!ctx.session) return;
		await lucia.invalidateSession(ctx.session.id);
		const sessionCookie = lucia.createBlankSessionCookie();
		ctx.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}),

	me: publicProcedure.query(async ({ ctx }) => {
		if (!ctx.user) return null;
		return {
			id: ctx.user.id,
			username: ctx.user.username,
			name: ctx.user.name,
			role: ctx.user.role
		};
	})
});
