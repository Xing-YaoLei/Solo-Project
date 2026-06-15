import { z } from 'zod';
import { router, protectedProcedure, requirePermission } from '../trpc';
import { learningProgress, examScores, todos, courses, userRoles, roles, users } from '../../db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { generateId } from 'lucia';
import { TRPCError } from '@trpc/server';

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

				await checkAndCreateProgressDelayTodo(ctx, input.userId, input.courseId, input.progressPercent);

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

				await checkAndCreateProgressDelayTodo(ctx, input.userId, input.courseId, input.progressPercent);

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

			if (!isPassed) {
				await createExamFailedTodo(ctx, ctx.user.id, input.courseId, input.examName, input.score);
			}

			return { id, isPassed };
		})
});

async function checkAndCreateProgressDelayTodo(
	ctx: any,
	userId: string,
	courseId: string,
	progressPercent: number
) {
	if (progressPercent >= 70) return;

	const existingTodo = await ctx.db.query.todos.findFirst({
		where: and(
			eq(todos.relatedUserId, userId),
			eq(todos.relatedCourseId, courseId),
			eq(todos.source, 'progress_delay'),
			sql`${todos.status} not in ('completed', 'rejected')`
		)
	});

	if (existingTodo) return;

	const course = await ctx.db.query.courses.findFirst({
		where: eq(courses.id, courseId)
	});

	const assistants = await ctx.db
		.select({ id: users.id, name: users.name })
		.from(userRoles)
		.innerJoin(roles, eq(userRoles.roleId, roles.id))
		.innerJoin(users, eq(userRoles.userId, users.id))
		.where(eq(roles.code, 'assistant'))
		.limit(1);

	const assigneeId = assistants[0]?.id;
	const todoId = generateId(15);

	await ctx.db.insert(todos).values({
		id: todoId,
		title: `进度落后提醒 - ${course?.title || '课程'}`,
		description: `学员的学习进度为 ${progressPercent}%，低于预期进度 70%，请及时跟进并提供必要的辅导。`,
		priority: progressPercent < 40 ? 'urgent' : progressPercent < 50 ? 'high' : 'medium',
		source: 'progress_delay',
		category: '学习进度',
		relatedUserId: userId,
		relatedCourseId: courseId,
		assigneeId,
		assigneeRole: 'assistant',
		creatorId: 'system',
		metadata: {
			progressPercent,
			expectedProgress: 70,
			courseTitle: course?.title
		}
	});
}

async function createExamFailedTodo(
	ctx: any,
	userId: string,
	courseId: string,
	examName: string,
	score: number
) {
	const course = await ctx.db.query.courses.findFirst({
		where: eq(courses.id, courseId)
	});

	const assistants = await ctx.db
		.select({ id: users.id })
		.from(userRoles)
		.innerJoin(roles, eq(userRoles.roleId, roles.id))
		.innerJoin(users, eq(userRoles.userId, users.id))
		.where(eq(roles.code, 'assistant'))
		.limit(1);

	const assigneeId = assistants[0]?.id;
	const todoId = generateId(15);

	await ctx.db.insert(todos).values({
		id: todoId,
		title: `考试未通过 - ${examName}`,
		description: `学员在"${examName}"考试中得分 ${score} 分，未通过考试，请协助复习。`,
		priority: score < 40 ? 'urgent' : score < 50 ? 'high' : 'medium',
		source: 'exam_failed',
		category: '考试成绩',
		relatedUserId: userId,
		relatedCourseId: courseId,
		assigneeId,
		assigneeRole: 'assistant',
		creatorId: 'system',
		metadata: {
			examName,
			score,
			courseTitle: course?.title
		}
	});
}
