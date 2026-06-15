import { z } from 'zod';
import { router, protectedProcedure, requirePermission } from '../trpc';
import { learningProgress, examScores } from '../../db/schema';
import { eq, desc, and, between, gte, lte } from 'drizzle-orm';
import { generateId } from 'lucia';
import { TRPCError } from '@trpc/server';
import { sql } from 'drizzle-orm';

export const progressRouter = router({
	getUserProgress: protectedProcedure
		.input(
			z.object({
				courseId: z.string().optional(),
				userId: z.string().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const targetUserId = input.userId || ctx.user.id;

			const whereConditions = [eq(learningProgress.userId, targetUserId)];
			if (input.courseId) {
				whereConditions.push(eq(learningProgress.courseId, input.courseId));
			}

			const progressList = await ctx.db.query.learningProgress.findMany({
				where: and(...whereConditions),
				orderBy: desc(learningProgress.updatedAt),
				with: {
					course: {
						columns: {
							id: true,
							title: true,
							category: true
						}
					}
				}
			});

			return progressList;
		}),

	updateProgress: requirePermission('progress.update')
		.input(
			z.object({
				userId: z.string(),
				courseId: z.string(),
				chapterId: z.string().optional(),
				progressPercent: z.number().min(0).max(100),
				completedQuestions: z.number().optional(),
				correctQuestions: z.number().optional(),
				studyTimeSeconds: z.number().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.query.learningProgress.findFirst({
				where: and(
					eq(learningProgress.userId, input.userId),
					eq(learningProgress.courseId, input.courseId)
				)
			});

			if (existing) {
				await ctx.db
					.update(learningProgress)
					.set({
						progressPercent: input.progressPercent,
						completedQuestions: input.completedQuestions,
						correctQuestions: input.correctQuestions,
						studyTimeSeconds: input.studyTimeSeconds,
						isCompleted: input.progressPercent >= 100,
						lastStudiedAt: new Date(),
						updatedAt: new Date()
					})
					.where(eq(learningProgress.id, existing.id));

				return { id: existing.id };
			} else {
				const id = generateId(15);
				await ctx.db.insert(learningProgress).values({
					id,
					userId: input.userId,
					courseId: input.courseId,
					chapterId: input.chapterId,
					progressPercent: input.progressPercent,
					completedQuestions: input.completedQuestions,
					correctQuestions: input.correctQuestions,
					studyTimeSeconds: input.studyTimeSeconds,
					isCompleted: input.progressPercent >= 100,
					lastStudiedAt: new Date()
				});

				return { id };
			}
		}),

	listExamScores: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(10),
				userId: z.string().optional(),
				courseId: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
				isPassed: z.boolean().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const whereConditions = [];

			if (input.userId) {
				whereConditions.push(eq(examScores.userId, input.userId));
			}
			if (input.courseId) {
				whereConditions.push(eq(examScores.courseId, input.courseId));
			}
			if (input.startDate) {
				whereConditions.push(gte(examScores.createdAt, new Date(input.startDate)));
			}
			if (input.endDate) {
				whereConditions.push(lte(examScores.createdAt, new Date(input.endDate)));
			}
			if (input.isPassed !== undefined) {
				whereConditions.push(eq(examScores.isPassed, input.isPassed));
			}

			const [items, total] = await Promise.all([
				ctx.db.query.examScores.findMany({
					where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
					orderBy: desc(examScores.createdAt),
					limit: input.pageSize,
					offset: (input.page - 1) * input.pageSize,
					with: {
						user: {
							columns: {
								id: true,
								name: true,
								email: true
							}
						},
						course: {
							columns: {
								id: true,
								title: true
							}
						}
					}
				}),
				ctx.db
					.select({ count: sql<number>`count(*)`.mapWith(Number) })
					.from(examScores)
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

	createExamScore: protectedProcedure
		.input(
			z.object({
				courseId: z.string(),
				examName: z.string(),
				score: z.number(),
				totalScore: z.number().default(100),
				passScore: z.number().default(60),
				answers: z.any().optional(),
				durationSeconds: z.number().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateId(15);
			const isPassed = input.score >= input.passScore;

			await ctx.db.insert(examScores).values({
				id,
				userId: ctx.user.id,
				courseId: input.courseId,
				examName: input.examName,
				totalScore: input.totalScore,
				score: input.score,
				isPassed,
				passScore: input.passScore,
				answers: input.answers,
				durationSeconds: input.durationSeconds,
				startedAt: new Date(Date.now() - (input.durationSeconds || 0) * 1000),
				finishedAt: new Date()
			});

			return { id, isPassed };
		})
});
