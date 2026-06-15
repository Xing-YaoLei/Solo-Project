import { z } from 'zod';
import { router, protectedProcedure, requirePermission } from '../trpc';
import { todos, todoComments, todoMaterials, users } from '../../db/schema';
import { eq, desc, and, or, like, sql } from 'drizzle-orm';
import { generateId } from 'lucia';
import { TRPCError } from '@trpc/server';
import type { TodoStatus, TodoPriority } from '../../db/schema/todos';

export const todosRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				status: z.string().optional(),
				priority: z.string().optional(),
				source: z.string().optional(),
				category: z.string().optional(),
				assigneeId: z.string().optional(),
				relatedUserId: z.string().optional(),
				relatedCourseId: z.string().optional(),
				keyword: z.string().optional(),
				myTasksOnly: z.boolean().default(false)
			})
		)
		.query(async ({ ctx, input }) => {
			const whereConditions = [];

			if (input.status) {
				whereConditions.push(eq(todos.status, input.status));
			}
			if (input.priority) {
				whereConditions.push(eq(todos.priority, input.priority));
			}
			if (input.source) {
				whereConditions.push(eq(todos.source, input.source));
			}
			if (input.category) {
				whereConditions.push(eq(todos.category, input.category));
			}
			if (input.assigneeId) {
				whereConditions.push(eq(todos.assigneeId, input.assigneeId));
			}
			if (input.relatedUserId) {
				whereConditions.push(eq(todos.relatedUserId, input.relatedUserId));
			}
			if (input.relatedCourseId) {
				whereConditions.push(eq(todos.relatedCourseId, input.relatedCourseId));
			}
			if (input.keyword) {
				whereConditions.push(
					or(like(todos.title, `%${input.keyword}%`), like(todos.description, `%${input.keyword}%`))
				);
			}
			if (input.myTasksOnly) {
				whereConditions.push(eq(todos.assigneeId, ctx.user.id));
			}

			const [items, total] = await Promise.all([
				ctx.db.query.todos.findMany({
					where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
					orderBy: [desc(todos.priority), desc(todos.createdAt)],
					limit: input.pageSize,
					offset: (input.page - 1) * input.pageSize,
					with: {
						assignee: {
							columns: {
								id: true,
								name: true,
								avatar: true
							}
						},
						creator: {
							columns: {
								id: true,
								name: true
							}
						},
						relatedUser: {
							columns: {
								id: true,
								name: true,
								email: true
							}
						},
						relatedCourse: {
							columns: {
								id: true,
								title: true
							}
						}
					}
				}),
				ctx.db
					.select({ count: sql<number>`count(*)`.mapWith(Number) })
					.from(todos)
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
			const todo = await ctx.db.query.todos.findFirst({
				where: eq(todos.id, input.id),
				with: {
					assignee: {
						columns: {
							id: true,
							name: true,
							avatar: true,
							email: true
						}
					},
					creator: {
						columns: {
							id: true,
							name: true
						}
					},
					relatedUser: {
						columns: {
							id: true,
							name: true,
							email: true
						}
					},
					relatedCourse: {
						columns: {
							id: true,
							title: true
						}
					},
					comments: {
						with: {
							user: {
								columns: {
									id: true,
									name: true,
									avatar: true
								}
							}
						},
						orderBy: desc(todoComments.createdAt)
					},
					materials: {
						with: {
							uploader: {
								columns: {
									id: true,
									name: true
								}
							}
						},
						orderBy: desc(todoMaterials.createdAt)
					}
				}
			});

			if (!todo) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '待办不存在' });
			}

			return todo;
		}),

	create: protectedProcedure
		.input(
			z.object({
				title: z.string().min(1).max(200),
				description: z.string().optional(),
				priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
				source: z.enum(['progress_delay', 'manual', 'system', 'exam_failed']).default('manual'),
				category: z.string().optional(),
				relatedUserId: z.string().optional(),
				relatedCourseId: z.string().optional(),
				relatedExamId: z.string().optional(),
				assigneeId: z.string().optional(),
				assigneeRole: z.string().optional(),
				dueDate: z.string().optional(),
				metadata: z.any().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateId(15);

			await ctx.db.insert(todos).values({
				id,
				title: input.title,
				description: input.description,
				priority: input.priority,
				source: input.source,
				category: input.category,
				relatedUserId: input.relatedUserId,
				relatedCourseId: input.relatedCourseId,
				relatedExamId: input.relatedExamId,
				assigneeId: input.assigneeId,
				assigneeRole: input.assigneeRole,
				creatorId: ctx.user.id,
				dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
				metadata: input.metadata
			});

			return { id };
		}),

	updateStatus: requirePermission('todo.process')
		.input(
			z.object({
				id: z.string(),
				status: z.enum(['pending', 'processing', 'completed', 'rejected', 'transferred'])
			})
		)
		.mutation(async ({ ctx, input }) => {
			const updateData: Partial<typeof todos.$inferInsert> = {
				status: input.status,
				updatedAt: new Date()
			};

			if (input.status === 'completed') {
				updateData.completedAt = new Date();
			}

			await ctx.db.update(todos).set(updateData).where(eq(todos.id, input.id));

			return { success: true };
		}),

	transfer: requirePermission('todo.transfer')
		.input(
			z.object({
				id: z.string(),
				newAssigneeId: z.string(),
				newAssigneeRole: z.string().optional(),
				reason: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const todo = await ctx.db.query.todos.findFirst({
				where: eq(todos.id, input.id)
			});

			if (!todo) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '待办不存在' });
			}

			await ctx.db
				.update(todos)
				.set({
					assigneeId: input.newAssigneeId,
					assigneeRole: input.newAssigneeRole,
					previousAssigneeId: todo.assigneeId,
					transferReason: input.reason,
					status: 'transferred',
					updatedAt: new Date()
				})
				.where(eq(todos.id, input.id));

			return { success: true };
		}),

	addComment: protectedProcedure
		.input(
			z.object({
				todoId: z.string(),
				content: z.string(),
				attachments: z.array(z.any()).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateId(15);

			await ctx.db.insert(todoComments).values({
				id,
				todoId: input.todoId,
				userId: ctx.user.id,
				content: input.content,
				attachments: input.attachments
			});

			return { id };
		}),

	addMaterial: requirePermission('todo.material.upload')
		.input(
			z.object({
				todoId: z.string(),
				title: z.string(),
				description: z.string().optional(),
				fileUrl: z.string(),
				fileType: z.string().optional(),
				fileSize: z.number().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const id = generateId(15);

			await ctx.db.insert(todoMaterials).values({
				id,
				todoId: input.todoId,
				uploaderId: ctx.user.id,
				title: input.title,
				description: input.description,
				fileUrl: input.fileUrl,
				fileType: input.fileType,
				fileSize: input.fileSize
			});

			return { id };
		}),

	myTodoStats: protectedProcedure.query(async ({ ctx }) => {
		const stats = await ctx.db
			.select({
				status: todos.status,
				count: sql<number>`count(*)`.mapWith(Number)
			})
			.from(todos)
			.where(eq(todos.assigneeId, ctx.user.id))
			.groupBy(todos.status);

		const result: Record<string, number> = {
			pending: 0,
			processing: 0,
			completed: 0,
			rejected: 0,
			transferred: 0,
			total: 0
		};

		for (const stat of stats) {
			result[stat.status] = stat.count;
			result.total += stat.count;
		}

		return result;
	})
});
