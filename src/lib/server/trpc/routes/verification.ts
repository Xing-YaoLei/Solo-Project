import { z } from 'zod';
import { router, protectedProcedure, operatorProcedure } from '../trpc/trpc';
import { and, desc, eq, gte, lte, sql, sum, count, isNull, between } from 'drizzle-orm';
import {
	verifications,
	verificationLogs,
	statusTransitions,
	type NewVerificationLog
} from '../db/schema';
import type {
	PaginationOutput,
	VerificationStatus,
	VerifyChannel,
	VerificationSourceType
} from '$lib/shared/types';
import { randomUUID } from 'crypto';

export const verificationRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				eventId: z.string().optional(),
				sourceType: z.string().optional(),
				status: z.string().optional(),
				channel: z.string().optional(),
				serialNumber: z.string().optional(),
				holderName: z.string().optional(),
				holderPhone: z.string().optional(),
				dateRange: z
					.object({ startDate: z.string().optional(), endDate: z.string().optional() })
					.optional(),
				verifyDateRange: z
					.object({ startDate: z.string().optional(), endDate: z.string().optional() })
					.optional()
			})
		)
		.query(
			async ({ ctx, input }): Promise<PaginationOutput<(typeof verifications.$inferSelect)[]>> => {
				const {
					page,
					pageSize,
					eventId,
					sourceType,
					status,
					channel,
					serialNumber,
					holderName,
					holderPhone,
					dateRange,
					verifyDateRange
				} = input;
				const offset = (page - 1) * pageSize;

				const where = [];
				if (eventId) where.push(eq(verifications.eventId, eventId));
				if (sourceType)
					where.push(eq(verifications.sourceType, sourceType as VerificationSourceType));
				if (status) where.push(eq(verifications.status, status as VerificationStatus));
				if (channel) where.push(eq(verifications.verifyChannel, channel as VerifyChannel));
				if (serialNumber) where.push(sql`${verifications.serialNumber} ILIKE ${`%${serialNumber}%`}`);
				if (holderName) where.push(sql`${verifications.holderName} ILIKE ${`%${holderName}%`}`);
				if (holderPhone) where.push(sql`${verifications.holderPhone} ILIKE ${`%${holderPhone}%`}`);
				if (dateRange?.startDate) where.push(gte(verifications.createdAt, dateRange.startDate));
				if (dateRange?.endDate) where.push(lte(verifications.createdAt, dateRange.endDate));
				if (verifyDateRange?.startDate)
					where.push(gte(verifications.verifyTime, verifyDateRange.startDate));
				if (verifyDateRange?.endDate) where.push(lte(verifications.verifyTime, verifyDateRange.endDate));

				const [items, countResult] = await Promise.all([
					ctx.db
						.select()
						.from(verifications)
						.where(where.length ? and(...where) : undefined)
						.orderBy(desc(verifications.createdAt))
						.limit(pageSize)
						.offset(offset),
					ctx.db
						.select({ count: sql<number>`count(*)` })
						.from(verifications)
						.where(where.length ? and(...where) : undefined)
				]);

				const total = countResult[0]?.count ?? 0;

				return {
					items,
					total,
					page,
					pageSize,
					totalPages: Math.ceil(total / pageSize)
				};
			}
		),

	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const [verification, logs, transitions] = await Promise.all([
				ctx.db.query.verifications.findFirst({ where: eq(verifications.id, input.id) }),
				ctx.db
					.select()
					.from(verificationLogs)
					.where(eq(verificationLogs.verificationId, input.id))
					.orderBy(desc(verificationLogs.createdAt)),
				ctx.db
					.select()
					.from(statusTransitions)
					.where(
						and(eq(statusTransitions.entityType, 'verification'), eq(statusTransitions.entityId, input.id))
					)
					.orderBy(desc(statusTransitions.createdAt))
			]);
			return { verification, logs, transitions };
		}),

	verify: operatorProcedure
		.input(
			z.object({
				serialNumber: z.string().optional(),
				verificationId: z.string().optional(),
				holderName: z.string().optional(),
				holderPhone: z.string().optional(),
				holderIdCard: z.string().optional(),
				channel: z.enum(['gate', 'manual', 'online', 'self']).default('manual'),
				device: z.string().optional(),
				remark: z.string().optional()
			})
		)
		.refine((d) => d.serialNumber || d.verificationId, '需要 serialNumber 或 verificationId')
		.mutation(async ({ ctx, input }) => {
			const verification = await ctx.db.query.verifications.findFirst({
				where: input.serialNumber
					? eq(verifications.serialNumber, input.serialNumber)
					: eq(verifications.id, input.verificationId!)
			});

			if (!verification) {
				throw new Error('核销码不存在');
			}
			if (verification.status === 'verified') {
				throw new Error('该票已核销，不可重复核销');
			}
			if (verification.status === 'expired' || verification.status === 'cancelled') {
				throw new Error(`当前状态: ${verification.status}，无法核销`);
			}

			const now = new Date();
			const oldStatus = verification.status;

			const [updated] = await ctx.db.transaction(async (tx) => {
				const [upd] = await tx
					.update(verifications)
					.set({
						status: 'verified' as VerificationStatus,
						verifyTime: now,
						verifyChannel: input.channel,
						verifyOperatorId: ctx.user.id,
						verifyDevice: input.device ?? null,
						holderName: input.holderName ?? verification.holderName,
						holderPhone: input.holderPhone ?? verification.holderPhone,
						holderIdCard: input.holderIdCard ?? verification.holderIdCard,
						checkinCount: (verification.checkinCount ?? 0) + 1,
						lastCheckinAt: now,
						updatedAt: now
					})
					.where(eq(verifications.id, verification.id))
					.returning();

				await tx.insert(verificationLogs).values({
					id: randomUUID(),
					verificationId: verification.id,
					action: 'verify',
					oldStatus,
					newStatus: 'verified',
					operatorId: ctx.user.id,
					channel: input.channel,
					deviceInfo: input.device ? { device: input.device } : null,
					remark: input.remark ?? null
				} satisfies NewVerificationLog);

				await tx.insert(statusTransitions).values({
					id: randomUUID(),
					eventId: verification.eventId,
					entityType: 'verification' as any,
					entityId: verification.id,
					fromStatus: oldStatus,
					toStatus: 'verified',
					transitionType: 'ticket_verified',
					operatorId: ctx.user.id,
					channel: input.channel,
					triggerSource: 'operator',
					remark: input.remark ?? '核销成功'
				});

				return [upd];
			});

			return updated;
		}),

	batchVerify: operatorProcedure
		.input(
			z.object({
				serialNumbers: z.array(z.string()).min(1).max(100),
				channel: z.enum(['gate', 'manual', 'online', 'self']).default('manual'),
				device: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const results = await Promise.all(
				input.serialNumbers.map(async (sn) => {
					try {
						const v = await ctx.db.query.verifications.findFirst({
							where: eq(verifications.serialNumber, sn)
						});
						if (!v) return { serialNumber: sn, success: false, error: '未找到' };
						if (v.status !== 'issued' && v.status !== 'pending') {
							return { serialNumber: sn, success: false, error: `状态:${v.status}` };
						}
						const now = new Date();
						const [updated] = await ctx.db
							.update(verifications)
							.set({
								status: 'verified',
								verifyTime: now,
								verifyChannel: input.channel,
								verifyOperatorId: ctx.user.id,
								checkinCount: sql`${verifications.checkinCount} + 1`,
								lastCheckinAt: now,
								updatedAt: now
							})
							.where(eq(verifications.id, v.id))
							.returning();
						return { serialNumber: sn, success: true, id: v.id };
					} catch (e: any) {
						return { serialNumber: sn, success: false, error: e?.message ?? '未知错误' };
					}
				})
			);

			const successCount = results.filter((r) => r.success).length;
			await ctx.db.insert(statusTransitions).values({
				id: randomUUID(),
				entityType: 'verification' as any,
				entityId: results.find((r) => r.success)?.id ?? randomUUID(),
				fromStatus: 'issued',
				toStatus: 'verified',
				transitionType: 'batch_verify',
				operatorId: ctx.user.id,
				triggerSource: 'operator',
				metadata: {
					total: input.serialNumbers.length,
					successCount,
					failCount: input.serialNumbers.length - successCount
				},
				remark: `批量核销 ${successCount}/${input.serialNumbers.length}`
			});

			return { results, successCount, failCount: input.serialNumbers.length - successCount };
		}),

	updateHolderInfo: operatorProcedure
		.input(
			z.object({
				id: z.string(),
				holderName: z.string().optional(),
				holderPhone: z.string().optional(),
				holderIdCard: z.string().optional(),
				notes: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [updated] = await ctx.db
				.update(verifications)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(verifications.id, id))
				.returning();
			return updated;
		}),

	cancel: operatorProcedure
		.input(z.object({ id: z.string(), reason: z.string().optional() }))
		.mutation(async ({ ctx, input }) => {
			const original = await ctx.db.query.verifications.findFirst({
				where: eq(verifications.id, input.id)
			});
			if (!original) throw new Error('记录不存在');

			const [updated] = await ctx.db.transaction(async (tx) => {
				const [u] = await tx
					.update(verifications)
					.set({ status: 'cancelled' as VerificationStatus, updatedAt: new Date() })
					.where(eq(verifications.id, input.id))
					.returning();

				await tx.insert(statusTransitions).values({
					id: randomUUID(),
					eventId: original.eventId,
					entityType: 'verification' as any,
					entityId: input.id,
					fromStatus: original.status,
					toStatus: 'cancelled',
					transitionType: 'verification_cancelled',
					operatorId: ctx.user.id,
					triggerSource: 'operator',
					remark: input.reason ?? '作废'
				});

				return [u];
			});

			return updated;
		}),

	statistics: protectedProcedure
		.input(
			z.object({
				eventId: z.string().optional(),
				dateRange: z.object({ startDate: z.string().optional(), endDate: z.string().optional() }).optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const where = [];
			if (input.eventId) where.push(eq(verifications.eventId, input.eventId));
			if (input.dateRange?.startDate) where.push(gte(verifications.createdAt, input.dateRange.startDate));
			if (input.dateRange?.endDate) where.push(lte(verifications.createdAt, input.dateRange.endDate));
			const whereClause = where.length ? and(...where) : undefined;

			const [overview] = await ctx.db
				.select({
					total: sql<number>`count(*)`,
					verified: sql<number>`sum(case when ${verifications.status} = 'verified' then 1 else 0 end)`,
					issued: sql<number>`sum(case when ${verifications.status} = 'issued' then 1 else 0 end)`,
					pending: sql<number>`sum(case when ${verifications.status} = 'pending' then 1 else 0 end)`,
					cancelled: sql<number>`sum(case when ${verifications.status} = 'cancelled' then 1 else 0 end)`,
					refunded: sql<number>`sum(case when ${verifications.status} = 'refunded' then 1 else 0 end)`
				})
				.from(verifications)
				.where(whereClause);

			const bySource = await ctx.db
				.select({
					sourceType: verifications.sourceType,
					total: count(),
					verified: sql<number>`sum(case when ${verifications.status} = 'verified' then 1 else 0 end)`
				})
				.from(verifications)
				.where(whereClause)
				.groupBy(verifications.sourceType);

			const verifyTimeWhere = [...where];
			if (input.dateRange?.startDate)
				verifyTimeWhere[verifyTimeWhere.length - 1] = gte(
					verifications.verifyTime,
					input.dateRange.startDate
				);
			if (input.dateRange?.endDate)
				verifyTimeWhere.push(lte(verifications.verifyTime, input.dateRange.endDate));
			verifyTimeWhere.push(sql`${verifications.verifyTime} IS NOT NULL`);

			const byVerifyHour = await ctx.db
				.select({
					hour: sql<string>`to_char(${verifications.verifyTime}, 'YYYY-MM-DD HH24:00')`,
					count: count()
				})
				.from(verifications)
				.where(and(...verifyTimeWhere))
				.groupBy(sql`1`)
				.orderBy(sql`1`);

			return {
				overview,
				bySource,
				byVerifyHour
			};
		})
});
