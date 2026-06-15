import { z } from 'zod';
import { router, protectedProcedure, requirePermission } from '../trpc';
import { courses, chapters } from '../../db/schema';
import { eq, desc, like, and, sql } from 'drizzle-orm';
import { generateId } from 'lucia';
import { TRPCError } from '@trpc/server';

export const coursesRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(10),
				keyword: z.string().optional(),
				category: z.string().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const whereConditions = [];

			if (input.keyword) {
				whereConditions.push(like(courses.title, `%${input.keyword}%`));
			}
			if (input.category) {
				whereConditions.push(eq(courses.category, input.category));
			}

			const [items, totalResult] = await Promise.all([
				ctx.db.query.courses.findMany({
					where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
					orderBy: desc(courses.createdAt),
					limit: input.pageSize,
					offset: (input.page - 1) * input.pageSize,
					with: {
						creator: {
							columns: {
								id: true,
								name: true
							}
						}
					}
				}),
				ctx.db
					.select({ count: sql<number>`count(*)` })
					.from(courses)
					.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
			]);

			const total = totalResult[0]?.count || 0;

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
			const course = await ctx.db.query.courses.findFirst({
				where: eq(courses.id, input.id),
				with: {
					creator: {
						columns: {
							id: true,
							name: true
						}
					},
					chapters: {
						orderBy: chapters.sortOrder
					}
				}
			});

			if (!course) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '课程不存在' });
			}

			return course;
		}),

	create: requirePermission('course.manage')
		.input(
			z.object({
				title: z.string().min(1).max(200),
				description: z.string().optional(),
				category: z.string().optional(),
				coverImage: z.string().optional(),
				credits: z.number().optional(),
				difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
				isPublished: z.boolean().default(false)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateId(15);

			await ctx.db.insert(courses).values({
				id,
				...input,
				creatorId: ctx.user.id
			});

			const course = await ctx.db.query.courses.findFirst({
				where: eq(courses.id, id)
			});

			return course;
		}),

	update: requirePermission('course.manage')
		.input(
			z.object({
				id: z.string(),
				title: z.string().min(1).max(200).optional(),
				description: z.string().optional(),
				category: z.string().optional(),
				coverImage: z.string().optional(),
				credits: z.number().optional(),
				difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
				isPublished: z.boolean().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			await ctx.db
				.update(courses)
				.set({
					...data,
					updatedAt: new Date()
				})
				.where(eq(courses.id, id));

			const course = await ctx.db.query.courses.findFirst({
				where: eq(courses.id, id)
			});

			return course;
		}),

	delete: requirePermission('course.manage')
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(courses).where(eq(courses.id, input.id));
			return { success: true };
		}),

	listChapters: protectedProcedure
		.input(z.object({ courseId: z.string() }))
		.query(async ({ ctx, input }) => {
			const chaptersList = await ctx.db.query.chapters.findMany({
				where: eq(chapters.courseId, input.courseId),
				orderBy: chapters.sortOrder
			});

			return chaptersList;
		})
});
