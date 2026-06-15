import { z } from 'zod';
import { router, protectedProcedure, requirePermission } from '../trpc';
import { reminderRules, savedFilters, chapterTraces } from '../../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { generateId } from 'lucia';
import { TRPCError } from '@trpc/server';

export const settingsRouter = router({
	listReminderRules: protectedProcedure
		.input(
			z.object({
				isEnabled: z.boolean().optional(),
				ruleType: z.string().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const whereConditions = [];

			if (input.isEnabled !== undefined) {
				whereConditions.push(eq(reminderRules.isEnabled, input.isEnabled));
			}
			if (input.ruleType) {
				whereConditions.push(eq(reminderRules.ruleType, input.ruleType));
			}

			const rules = await ctx.db.query.reminderRules.findMany({
				where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
				orderBy: desc(reminderRules.createdAt)
			});

			return rules;
		}),

	createReminderRule: requirePermission('reminderRule.manage')
		.input(
			z.object({
				name: z.string().min(1).max(100),
				description: z.string().optional(),
				ruleType: z.string(),
				triggerCondition: z.any(),
				actionType: z.string().default('notification'),
				notificationChannels: z.array(z.string()).default(['site']),
				isEnabled: z.boolean().default(true)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateId(15);

			await ctx.db.insert(reminderRules).values({
				id,
				...input,
				creatorId: ctx.user.id
			});

			return { id };
		}),

	updateReminderRule: requirePermission('reminderRule.manage')
		.input(
			z.object({
				id: z.string(),
				name: z.string().optional(),
				description: z.string().optional(),
				triggerCondition: z.any().optional(),
				actionType: z.string().optional(),
				notificationChannels: z.array(z.string()).optional(),
				isEnabled: z.boolean().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			await ctx.db
				.update(reminderRules)
				.set({
					...data,
					updatedAt: new Date()
				})
				.where(eq(reminderRules.id, id));

			return { success: true };
		}),

	deleteReminderRule: requirePermission('reminderRule.manage')
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(reminderRules).where(eq(reminderRules.id, input.id));
			return { success: true };
		}),

	listChapterTraces: protectedProcedure
		.input(
			z.object({
				userId: z.string().optional(),
				chapterId: z.string().optional(),
				actionType: z.string().optional(),
				page: z.number().default(1),
				pageSize: z.number().default(20)
			})
		)
		.query(async ({ ctx, input }) => {
			const whereConditions = [];

			if (input.userId) {
				whereConditions.push(eq(chapterTraces.userId, input.userId));
			}
			if (input.chapterId) {
				whereConditions.push(eq(chapterTraces.chapterId, input.chapterId));
			}
			if (input.actionType) {
				whereConditions.push(eq(chapterTraces.actionType, input.actionType));
			}

			const [items, total] = await Promise.all([
				ctx.db.query.chapterTraces.findMany({
					where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
					orderBy: desc(chapterTraces.createdAt),
					limit: input.pageSize,
					offset: (input.page - 1) * input.pageSize,
					with: {
						user: {
							columns: {
								id: true,
								name: true
							}
						},
						chapter: {
							columns: {
								id: true,
								title: true
							}
						}
					}
				}),
				ctx.db
					.select({ count: sql<number>`count(*)`.mapWith(Number) })
					.from(chapterTraces)
					.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
					.then((res) => res[0]?.count || 0)
			]);

			return {
				items,
				total,
				page: input.page,
				pageSize: input.pageSize
			};
		}),

	createChapterTrace: protectedProcedure
		.input(
			z.object({
				chapterId: z.string(),
				actionType: z.string(),
				actionDetail: z.string().optional(),
				metadata: z.any().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateId(15);

			await ctx.db.insert(chapterTraces).values({
				id,
				userId: ctx.user.id,
				chapterId: input.chapterId,
				actionType: input.actionType,
				actionDetail: input.actionDetail,
				metadata: input.metadata
			});

			return { id };
		}),

	listSavedFilters: protectedProcedure
		.input(
			z.object({
				pageKey: z.string().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const whereConditions = [eq(savedFilters.userId, ctx.user.id)];

			if (input.pageKey) {
				whereConditions.push(eq(savedFilters.pageKey, input.pageKey));
			}

			const filters = await ctx.db.query.savedFilters.findMany({
				where: and(...whereConditions),
				orderBy: [savedFilters.isDefault, savedFilters.sortOrder, desc(savedFilters.createdAt)]
			});

			return filters;
		}),

	createSavedFilter: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).max(100),
				pageKey: z.string(),
				filterConfig: z.any(),
				isDefault: z.boolean().default(false)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateId(15);

			if (input.isDefault) {
				await ctx.db
					.update(savedFilters)
					.set({ isDefault: false })
					.where(and(eq(savedFilters.userId, ctx.user.id), eq(savedFilters.pageKey, input.pageKey)));
			}

			await ctx.db.insert(savedFilters).values({
				id,
				userId: ctx.user.id,
				name: input.name,
				pageKey: input.pageKey,
				filterConfig: input.filterConfig,
				isDefault: input.isDefault
			});

			return { id };
		}),

	deleteSavedFilter: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const filter = await ctx.db.query.savedFilters.findFirst({
				where: eq(savedFilters.id, input.id)
			});

			if (!filter || filter.userId !== ctx.user.id) {
				throw new TRPCError({ code: 'FORBIDDEN', message: '无权删除此筛选' });
			}

			await ctx.db.delete(savedFilters).where(eq(savedFilters.id, input.id));
			return { success: true };
		})
});
