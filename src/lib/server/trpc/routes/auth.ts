import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc/trpc';
import { users, sessions } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { LuciaError } from 'lucia';
import { createSession, invalidateSession, lucia } from '../auth';
import { randomUUID } from 'crypto';

export const authRouter = router({
	signup: publicProcedure
		.input(
			z.object({
				username: z.string().min(3).max(32),
				email: z.string().email(),
				password: z.string().min(8).max(100),
				displayName: z.string().max(100).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const { default: crypto } = await import('node:crypto');
				const hashedPassword = crypto
					.createHash('sha256')
					.update(input.password)
					.digest('hex');

				const [user] = await ctx.db
					.insert(users)
					.values({
						id: randomUUID(),
						username: input.username,
						email: input.email,
						displayName: input.displayName ?? input.username,
						hashedPassword,
						role: 'viewer',
						emailVerified: false
					})
					.returning();

				const session = await createSession(user.id);
				const sessionCookie = lucia.createSessionCookie(session.id);
				ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
					path: '.',
					...sessionCookie.attributes
				});

				return { user: { id: user.id, username: user.username, email: user.email } };
			} catch (e: any) {
				if (e?.code === '23505') {
					throw new Error('用户名或邮箱已存在');
				}
				throw e;
			}
		}),

	login: publicProcedure
		.input(
			z.object({
				username: z.string(),
				password: z.string()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const user = await ctx.db.query.users.findFirst({
				where: eq(users.username, input.username)
			});

			if (!user) {
				throw new Error('用户名或密码错误');
			}

			const { default: crypto } = await import('node:crypto');
			const inputHash = crypto.createHash('sha256').update(input.password).digest('hex');

			if (inputHash !== user.hashedPassword) {
				throw new Error('用户名或密码错误');
			}

			const session = await createSession(user.id);
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
					displayName: user.displayName,
					role: user.role,
					avatarUrl: user.avatarUrl
				}
			};
		}),

	logout: protectedProcedure.mutation(async ({ ctx }) => {
		const sessionId = ctx.event.cookies.get(lucia.sessionCookieName);
		if (sessionId) {
			try {
				await invalidateSession(sessionId);
			} catch {}
		}
		const blankCookie = lucia.createBlankSessionCookie();
		ctx.event.cookies.set(blankCookie.name, blankCookie.value, {
			path: '.',
			...blankCookie.attributes
		});
		return { success: true };
	}),

	me: protectedProcedure.query(async ({ ctx }) => {
		return ctx.user;
	}),

	listUsers: adminProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(50)
			})
		)
		.query(async ({ ctx, input }) => {
			const offset = (input.page - 1) * input.pageSize;
			const [items, countResult] = await Promise.all([
				ctx.db
					.select()
					.from(users)
					.orderBy(desc(users.createdAt))
					.limit(input.pageSize)
					.offset(offset),
				ctx.db.select({ count: sql<number>`count(*)` }).from(users)
			]);
			const total = countResult[0]?.count ?? 0;
			return {
				items,
				total,
				page: input.page,
				pageSize: input.pageSize,
				totalPages: Math.ceil(total / input.pageSize)
			};
		}),

	updateRole: adminProcedure
		.input(
			z.object({
				userId: z.string(),
				role: z.enum(['admin', 'operator', 'finance', 'viewer'])
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(users)
				.set({ role: input.role, updatedAt: new Date() })
				.where(eq(users.id, input.userId))
				.returning();
			return updated;
		})
});
