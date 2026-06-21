import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, managerProcedure, adminProcedure } from '../trpc';
import { userTable, sessionTable } from '../db/schema';
import { eq, and, like, asc, desc } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';
import { Argon2id } from 'oslo/password';
import { lucia } from '../auth';
import { TimeSpan, createDate } from 'oslo';
import { TRPCError } from '@trpc/server';

export const userRouter = router({
	getCurrent: protectedProcedure.query(async ({ ctx }) => {
		return ctx.user;
	}),

	login: publicProcedure
		.input(
			z.object({
				username: z.string().min(1),
				password: z.string().min(1)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [existingUser] = await ctx.db
				.select()
				.from(userTable)
				.where(eq(userTable.username, input.username));

			if (!existingUser) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '用户名或密码错误' });
			}

			let validPassword = false;
			if (existingUser.passwordHash) {
				try {
					validPassword = await new Argon2id().verify(existingUser.passwordHash, input.password);
				} catch (e) {
					validPassword = false;
				}
			}

			if (!validPassword) {
				throw new TRPCError({ code: 'UNAUTHORIZED', message: '用户名或密码错误' });
			}

			const session = await lucia.createSession(existingUser.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '/',
				...sessionCookie.attributes
			});

			return existingUser;
		}),

	logout: protectedProcedure.mutation(async ({ ctx }) => {
		if (ctx.session) {
			await lucia.invalidateSession(ctx.session.id);
		}
		const sessionCookie = lucia.createBlankSessionCookie();
		ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});
		return true;
	}),

	list: managerProcedure
		.input(
			z.object({
				search: z.string().optional(),
				role: z.enum(['admin', 'manager', 'cleaner', 'viewer']).optional(),
				page: z.number().default(1),
				pageSize: z.number().default(20)
			})
		)
		.query(async ({ ctx, input }) => {
			const offset = (input.page - 1) * input.pageSize;

			let where = undefined;
			const conditions = [];
			if (input.search) {
				conditions.push(like(userTable.username, `%${input.search}%`));
			}
			if (input.role) {
				conditions.push(eq(userTable.role, input.role));
			}

			const [items, total] = await Promise.all([
				ctx.db
					.select()
					.from(userTable)
					.where(conditions.length > 0 ? and(...conditions) : undefined)
					.orderBy(desc(userTable.createdAt))
					.limit(input.pageSize)
					.offset(offset)
					,
				ctx.db
					.select({ count: userTable.id })
					.from(userTable)
					.where(conditions.length > 0 ? and(...conditions) : undefined)
					
					.then((rows) => rows.length)
			]);

			return {
				items,
				total,
				page: input.page,
				pageSize: input.pageSize,
				totalPages: Math.ceil(total / input.pageSize)
			};
		}),

	listCleaners: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db
			.select()
			.from(userTable)
			.where(eq(userTable.role, 'cleaner'))
			.orderBy(asc(userTable.realName))
			;
	}),

	create: adminProcedure
		.input(
			z.object({
				username: z.string().min(1),
				realName: z.string().min(1),
				email: z.string().email().optional(),
				phone: z.string().optional(),
				role: z.enum(['admin', 'manager', 'cleaner', 'viewer']).default('viewer'),
				password: z.string().min(6)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [existing] = await ctx.db
				.select()
				.from(userTable)
				.where(eq(userTable.username, input.username));

			if (existing) {
				throw new TRPCError({ code: 'CONFLICT', message: '用户名已存在' });
			}

			const userId = generateIdFromEntropySize(16);
			const hashedPassword = await new Argon2id().hash(input.password);

			const [user] = await ctx.db
				.insert(userTable)
				.values({
					id: userId,
					username: input.username,
					realName: input.realName,
					passwordHash: hashedPassword,
					email: input.email,
					phone: input.phone,
					role: input.role
				})
				.returning();

			return user;
		}),

	update: managerProcedure
		.input(
			z.object({
				id: z.string(),
				realName: z.string().min(1).optional(),
				email: z.string().email().optional().nullable(),
				phone: z.string().optional().nullable(),
				role: z.enum(['admin', 'manager', 'cleaner', 'viewer']).optional(),
				password: z.string().min(6).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, password, ...data } = input;
			const updateData: any = {
				...data,
				updatedAt: new Date()
			};

			if (password) {
				updateData.passwordHash = await new Argon2id().hash(password);
			}

			const [result] = await ctx.db
				.update(userTable)
				.set(updateData)
				.where(eq(userTable.id, id))
				.returning();
			return result;
		}),

	remove: adminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(userTable).where(eq(userTable.id, input.id));
			return true;
		})
});
