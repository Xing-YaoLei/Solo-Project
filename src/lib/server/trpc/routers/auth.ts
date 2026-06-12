import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { db } from '$lib/server/db';
import { userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { Argon2id } from 'oslo/password';
import { lucia } from '$lib/server/lucia';
import { generateId } from 'lucia';
import { TRPCError } from '@trpc/server';

export const authRouter = createTRPCRouter({
	login: publicProcedure
		.input(z.object({ username: z.string(), password: z.string() }))
		.mutation(async ({ input }) => {
			const users = await db
				.select()
				.from(userTable)
				.where(eq(userTable.username, input.username));

			if (users.length === 0) {
				return { success: false, error: '用户名或密码错误' };
			}

			const user = users[0];
			const validPassword = await new Argon2id().verify(user.passwordHash, input.password);

			if (!validPassword) {
				return { success: false, error: '用户名或密码错误' };
			}

			const session = await lucia.createSession(user.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);

			return {
				success: true,
				sessionCookie: {
					name: sessionCookie.name,
					value: sessionCookie.value,
					attributes: sessionCookie.attributes
				},
				user: {
					id: user.id,
					username: user.username,
					role: user.role,
					realName: user.realName,
					region: user.region
				}
			};
		}),

	logout: protectedProcedure.mutation(async ({ ctx }) => {
		if (ctx.sessionId) {
			await lucia.invalidateSession(ctx.sessionId);
		}
		const sessionCookie = lucia.createBlankSessionCookie();
		return {
			sessionCookie: {
				name: sessionCookie.name,
				value: sessionCookie.value,
				attributes: sessionCookie.attributes
			}
		};
	}),

	getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
		return ctx.user;
	}),

	getUserList: protectedProcedure.query(async () => {
		const users = await db
			.select({
				id: userTable.id,
				username: userTable.username,
				realName: userTable.realName,
				role: userTable.role,
				region: userTable.region
			})
			.from(userTable);
		return users;
	})
});
