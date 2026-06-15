import { z } from 'zod';
import { router, protectedProcedure, requirePermission } from '../trpc';
import { questions, questionTags, questionTagRelations } from '../../db/schema';
import { eq, desc, like, and, inArray } from 'drizzle-orm';
import { generateId } from 'lucia';
import { TRPCError } from '@trpc/server';
import { sql } from 'drizzle-orm';

export const questionsRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				courseId: z.string().optional(),
				chapterId: z.string().optional(),
				tagIds: z.array(z.string()).optional(),
				type: z.string().optional(),
				difficulty: z.number().optional(),
				keyword: z.string().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const whereConditions = [];

			if (input.courseId) {
				whereConditions.push(eq(questions.courseId, input.courseId));
			}
			if (input.chapterId) {
				whereConditions.push(eq(questions.chapterId, input.chapterId));
			}
			if (input.type) {
				whereConditions.push(eq(questions.type, input.type));
			}
			if (input.difficulty) {
				whereConditions.push(eq(questions.difficulty, input.difficulty));
			}
			if (input.keyword) {
				whereConditions.push(like(questions.content, `%${input.keyword}%`));
			}

			const [items, total] = await Promise.all([
				ctx.db.query.questions.findMany({
					where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
					orderBy: desc(questions.createdAt),
					limit: input.pageSize,
					offset: (input.page - 1) * input.pageSize,
					with: {
						tags: {
							with: {
								tag: true
							}
						}
					}
				}),
				ctx.db
					.select({ count: sql<number>`count(*)`.mapWith(Number) })
					.from(questions)
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

	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const question = await ctx.db.query.questions.findFirst({
				where: eq(questions.id, input.id),
				with: {
					tags: {
						with: {
							tag: true
						}
					}
				}
			});

			if (!question) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '题目不存在' });
			}

			return question;
		}),

	create: requirePermission('question.manage')
		.input(
			z.object({
				courseId: z.string(),
				chapterId: z.string().optional(),
				type: z.enum(['single', 'multiple', 'judge', 'fill', 'essay']),
				content: z.string(),
				options: z.array(z.string()).optional(),
				answer: z.string(),
				analysis: z.string().optional(),
				difficulty: z.number().default(2),
				score: z.number().default(1),
				tagIds: z.array(z.string()).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateId(15);

			await ctx.db.insert(questions).values({
				id,
				courseId: input.courseId,
				chapterId: input.chapterId,
				type: input.type,
				content: input.content,
				options: input.options,
				answer: input.answer,
				analysis: input.analysis,
				difficulty: input.difficulty,
				score: input.score,
				creatorId: ctx.user.id
			});

			if (input.tagIds && input.tagIds.length > 0) {
				const tagRelations = input.tagIds.map((tagId) => ({
					id: generateId(15),
					questionId: id,
					tagId
				}));
				await ctx.db.insert(questionTagRelations).values(tagRelations);
			}

			return { id };
		}),

	update: requirePermission('question.manage')
		.input(
			z.object({
				id: z.string(),
				type: z.enum(['single', 'multiple', 'judge', 'fill', 'essay']).optional(),
				content: z.string().optional(),
				options: z.array(z.string()).optional(),
				answer: z.string().optional(),
				analysis: z.string().optional(),
				difficulty: z.number().optional(),
				score: z.number().optional(),
				tagIds: z.array(z.string()).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, tagIds, ...data } = input;

			await ctx.db
				.update(questions)
				.set({
					...data,
					updatedAt: new Date()
				})
				.where(eq(questions.id, id));

			if (tagIds !== undefined) {
				await ctx.db
					.delete(questionTagRelations)
					.where(eq(questionTagRelations.questionId, id));

				if (tagIds.length > 0) {
					const tagRelations = tagIds.map((tagId) => ({
						id: generateId(15),
						questionId: id,
						tagId
					}));
					await ctx.db.insert(questionTagRelations).values(tagRelations);
				}
			}

			return { success: true };
		}),

	delete: requirePermission('question.manage')
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(questions).where(eq(questions.id, input.id));
			return { success: true };
		}),

	listTags: protectedProcedure.query(async ({ ctx }) => {
		const tags = await ctx.db.query.questionTags.findMany({
			orderBy: questionTags.name
		});
		return tags;
	}),

	createTag: requirePermission('question.manage')
		.input(
			z.object({
				name: z.string().min(1).max(50),
				color: z.string().optional(),
				description: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateId(15);
			await ctx.db.insert(questionTags).values({
				id,
				name: input.name,
				color: input.color,
				description: input.description
			});
			return { id };
		})
});
