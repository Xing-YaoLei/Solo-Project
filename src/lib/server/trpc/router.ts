import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from './t';
import { db } from '../db';
import { userTable, verificationRecordTable, riderTable, channelTable, operationLogTable } from '../db/schema';
import { eq, and, desc, like, or, sql, count } from 'drizzle-orm';
import { generateId } from 'lucia';
import { Argon2id } from 'oslo/password';
import { lucia } from '../auth/lucia';

export const authRouter = router({
	login: publicProcedure
		.input(
			z.object({
				username: z.string(),
				password: z.string()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const user = await db.query.userTable.findFirst({
				where: eq(userTable.username, input.username)
			});

			if (!user) {
				throw new Error('Invalid username or password');
			}

			const validPassword = await new Argon2id().verify(user.passwordHash, input.password);
			if (!validPassword) {
				throw new Error('Invalid username or password');
			}

			const session = await lucia.createSession(user.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);

			ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '/',
				...sessionCookie.attributes
			});

			return {
				user: {
					id: user.id,
					username: user.username,
					role: user.role
				}
			};
		}),

	logout: protectedProcedure.mutation(async ({ ctx }) => {
		const sessionId = ctx.event.cookies.get(lucia.sessionCookieName);
		if (sessionId) {
			await lucia.invalidateSession(sessionId);
		}
		const sessionCookie = lucia.createBlankSessionCookie();
		ctx.event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});
		return { success: true };
	}),

	register: publicProcedure
		.input(
			z.object({
				username: z.string().min(3),
				password: z.string().min(6),
				role: z.enum(['admin', 'operator', 'reviewer']).default('operator')
			})
		)
		.mutation(async ({ input }) => {
			const existingUser = await db.query.userTable.findFirst({
				where: eq(userTable.username, input.username)
			});

			if (existingUser) {
				throw new Error('Username already exists');
			}

			const userId = generateId(15);
			const passwordHash = await new Argon2id().hash(input.password);

			await db.insert(userTable).values({
				id: userId,
				username: input.username,
				passwordHash,
				role: input.role
			});

			return { success: true, userId };
		})
});

export const verificationRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				status: z.string().optional(),
				abnormalType: z.string().optional(),
				riderId: z.string().optional(),
				channelId: z.string().optional(),
				search: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional()
			})
		)
		.query(async ({ input }) => {
			const where: any[] = [];
			if (input.status) {
				where.push(eq(verificationRecordTable.status, input.status as any));
			}
			if (input.abnormalType && input.abnormalType !== 'all') {
				where.push(eq(verificationRecordTable.abnormalType, input.abnormalType as any));
			}
			if (input.riderId) {
				where.push(eq(verificationRecordTable.riderId, input.riderId));
			}
			if (input.channelId) {
				where.push(eq(verificationRecordTable.channelId, input.channelId));
			}
			if (input.search) {
				where.push(
					or(
						like(verificationRecordTable.orderNo, `%${input.search}%`),
						like(verificationRecordTable.itemName, `%${input.search}%`)
					)
				);
			}
			if (input.startDate) {
				where.push(sql`${verificationRecordTable.createdAt} >= ${input.startDate}::timestamp`);
			}
			if (input.endDate) {
				where.push(sql`${verificationRecordTable.createdAt} <= ${input.endDate}::timestamp`);
			}

			const [records, totalResult] = await Promise.all([
				db
					.select()
					.from(verificationRecordTable)
					.leftJoin(riderTable, eq(verificationRecordTable.riderId, riderTable.id))
					.leftJoin(channelTable, eq(verificationRecordTable.channelId, channelTable.id))
					.where(and(...where))
					.orderBy(desc(verificationRecordTable.createdAt))
					.limit(input.pageSize)
					.offset((input.page - 1) * input.pageSize),
				db
					.select({ count: count() })
					.from(verificationRecordTable)
					.where(and(...where))
			]);

			return {
				records: records.map((r: any) => ({
					...r.verification_record,
					rider: r.rider,
					channel: r.channel
				})),
				total: totalResult[0]?.count || 0,
				page: input.page,
				pageSize: input.pageSize
			};
		}),

	get: protectedProcedure
		.input(z.string())
		.query(async ({ input }) => {
			const record = await db.query.verificationRecordTable.findFirst({
				where: eq(verificationRecordTable.id, input),
				with: {
					rider: true,
					channel: true,
					handler: true,
					reviewer: true
				}
			});

			if (!record) {
				throw new Error('Record not found');
			}

			const logs = await db.query.operationLogTable.findMany({
				where: eq(operationLogTable.recordId, input),
				with: {
					operator: true
				},
				orderBy: desc(operationLogTable.createdAt)
			});

			return { record, logs };
		}),

	create: protectedProcedure
		.input(
			z.object({
				orderNo: z.string(),
				riderId: z.string().optional(),
				channelId: z.string().optional(),
				deliveryAddress: z.string(),
				pickupAddress: z.string().optional(),
				itemName: z.string(),
				itemQuantity: z.number().default(1),
				itemDescription: z.string().optional(),
				photos: z.array(z.string()).default([]),
				evaluationTags: z.array(z.string()).default([]),
				remark: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [record] = await db
				.insert(verificationRecordTable)
				.values({
					...input,
					handlerId: ctx.user!.id
				})
				.returning();

			await db.insert(operationLogTable).values({
				recordId: record.id,
				operatorId: ctx.user!.id,
				action: 'create',
				newStatus: 'pending',
				remark: '创建核验记录'
			});

			return record;
		}),

	updateStatus: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(['pending', 'processing', 'abnormal', 'reviewing', 'completed', 'closed']),
				abnormalType: z
					.enum(['none', 'damaged', 'lost', 'wrong_item', 'quantity_mismatch', 'other'])
					.optional(),
				responsiblePerson: z.string().optional(),
				closeReason: z.string().optional(),
				remark: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const existing = await db.query.verificationRecordTable.findFirst({
				where: eq(verificationRecordTable.id, input.id)
			});

			if (!existing) {
				throw new Error('Record not found');
			}

			const updateData: any = {
				status: input.status,
				updatedAt: new Date()
			};

			if (input.abnormalType !== undefined) {
				updateData.abnormalType = input.abnormalType;
			}
			if (input.responsiblePerson !== undefined) {
				updateData.responsiblePerson = input.responsiblePerson;
			}
			if (input.closeReason !== undefined) {
				updateData.closeReason = input.closeReason;
			}
			if (input.status === 'closed') {
				updateData.closedAt = new Date();
			}
			if (input.status === 'reviewing' && !existing.reviewerId) {
				updateData.reviewerId = ctx.user!.id;
			}
			if (input.status === 'processing' && !existing.handlerId) {
				updateData.handlerId = ctx.user!.id;
			}

			const [updated] = await db
				.update(verificationRecordTable)
				.set(updateData)
				.where(eq(verificationRecordTable.id, input.id))
				.returning();

			await db.insert(operationLogTable).values({
				recordId: input.id,
				operatorId: ctx.user!.id,
				action: 'update_status',
				previousStatus: existing.status,
				newStatus: input.status,
				remark: input.remark
			});

			return updated;
		}),

	updateDetails: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				photos: z.array(z.string()).optional(),
				evaluationTags: z.array(z.string()).optional(),
				remark: z.string().optional(),
				itemDescription: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const existing = await db.query.verificationRecordTable.findFirst({
				where: eq(verificationRecordTable.id, input.id)
			});

			if (!existing) {
				throw new Error('Record not found');
			}

			const updateData: any = {
				updatedAt: new Date()
			};

			if (input.photos !== undefined) updateData.photos = input.photos;
			if (input.evaluationTags !== undefined) updateData.evaluationTags = input.evaluationTags;
			if (input.remark !== undefined) updateData.remark = input.remark;
			if (input.itemDescription !== undefined) updateData.itemDescription = input.itemDescription;

			const [updated] = await db
				.update(verificationRecordTable)
				.set(updateData)
				.where(eq(verificationRecordTable.id, input.id))
				.returning();

			await db.insert(operationLogTable).values({
				recordId: input.id,
				operatorId: ctx.user!.id,
				action: 'update_details',
				previousStatus: existing.status,
				newStatus: existing.status,
				remark: '更新核验详情'
			});

			return updated;
		})
});

export const ridersRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				isActive: z.boolean().optional(),
				channel: z.string().optional(),
				search: z.string().optional()
			})
		)
		.query(async ({ input }) => {
			const where: any[] = [];
			if (input.isActive !== undefined) {
				where.push(eq(riderTable.isActive, input.isActive));
			}
			if (input.channel) {
				where.push(eq(riderTable.channel, input.channel as any));
			}
			if (input.search) {
				where.push(
					or(
						like(riderTable.name, `%${input.search}%`),
						like(riderTable.phone, `%${input.search}%`)
					)
				);
			}

			return db
				.select()
				.from(riderTable)
				.where(and(...where))
				.orderBy(desc(riderTable.createdAt));
		}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string(),
				phone: z.string(),
				employeeId: z.string().optional(),
				channel: z.enum(['platform_a', 'platform_b', 'platform_c', 'other']).default('other')
			})
		)
		.mutation(async ({ input }) => {
			const [rider] = await db.insert(riderTable).values(input).returning();
			return rider;
		})
});

export const channelsRouter = router({
	list: protectedProcedure.query(async () => {
		return db
			.select()
			.from(channelTable)
			.where(eq(channelTable.isActive, true))
			.orderBy(channelTable.name);
	})
});

export const statisticsRouter = router({
	summary: protectedProcedure
		.input(
			z.object({
				startDate: z.string().optional(),
				endDate: z.string().optional()
			})
		)
		.query(async ({ input }) => {
			const where: any[] = [];
			if (input.startDate) {
				where.push(sql`${verificationRecordTable.createdAt} >= ${input.startDate}::timestamp`);
			}
			if (input.endDate) {
				where.push(sql`${verificationRecordTable.createdAt} <= ${input.endDate}::timestamp`);
			}

			const statusCounts = await db
				.select({
					status: verificationRecordTable.status,
					count: count()
				})
				.from(verificationRecordTable)
				.where(and(...where))
				.groupBy(verificationRecordTable.status);

			const abnormalCounts = await db
				.select({
					abnormalType: verificationRecordTable.abnormalType,
					count: count()
				})
				.from(verificationRecordTable)
				.where(and(...where, eq(verificationRecordTable.status, 'abnormal')))
				.groupBy(verificationRecordTable.abnormalType);

			const channelStats = await db
				.select({
					channelId: verificationRecordTable.channelId,
					channelName: channelTable.name,
					count: count()
				})
				.from(verificationRecordTable)
				.leftJoin(channelTable, eq(verificationRecordTable.channelId, channelTable.id))
				.where(and(...where))
				.groupBy(verificationRecordTable.channelId, channelTable.name);

			const riderStats = await db
				.select({
					riderId: verificationRecordTable.riderId,
					riderName: riderTable.name,
					isActive: riderTable.isActive,
					count: count()
				})
				.from(verificationRecordTable)
				.leftJoin(riderTable, eq(verificationRecordTable.riderId, riderTable.id))
				.where(and(...where))
				.groupBy(verificationRecordTable.riderId, riderTable.name, riderTable.isActive)
				.orderBy((fields: any) => desc(fields.count))
				.limit(20);

			const closeReasons = await db
				.select({
					closeReason: verificationRecordTable.closeReason,
					count: count()
				})
				.from(verificationRecordTable)
				.where(
					and(
						...where,
						eq(verificationRecordTable.status, 'closed'),
						sql`close_reason is not null`
					)
				)
				.groupBy(verificationRecordTable.closeReason);

			const responsiblePersonStats = await db
				.select({
					responsiblePerson: verificationRecordTable.responsiblePerson,
					count: count()
				})
				.from(verificationRecordTable)
				.where(and(...where, sql`responsible_person is not null`))
				.groupBy(verificationRecordTable.responsiblePerson);

			return {
				statusCounts,
				abnormalCounts,
				channelStats,
				riderStats,
				closeReasons,
				responsiblePersonStats
			};
		})
});

export const appRouter = router({
	auth: authRouter,
	verification: verificationRouter,
	riders: ridersRouter,
	channels: channelsRouter,
	statistics: statisticsRouter
});

export type AppRouter = typeof appRouter;
