import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '$lib/server/db';
import { projects, flowRecords, documentTypeEnum, statusEnum } from '$lib/server/db/schema';
import { eq, desc, ilike, and, type SQL } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const projectsRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				search: z.string().optional(),
				status: z.enum(['draft', 'pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled']).optional()
			})
		)
		.query(async ({ input }) => {
			const where: SQL<unknown>[] = [];
			if (input.search) {
				where.push(ilike(projects.name, `%${input.search}%`));
			}
			if (input.status) {
				where.push(eq(projects.status, input.status));
			}

			const data = await db
				.select()
				.from(projects)
				.where(where.length > 0 ? and(...where) : undefined)
				.orderBy(desc(projects.createdAt))
				.limit(input.pageSize)
				.offset((input.page - 1) * input.pageSize);

			const total = await db.$count(projects, where.length > 0 ? and(...where) : undefined);

			return { data, total, page: input.page, pageSize: input.pageSize };
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ input }) => {
			const [project] = await db
				.select()
				.from(projects)
				.where(eq(projects.id, input.id))
				.limit(1);

			if (!project) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '项目不存在' });
			}

			return project;
		}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).max(200),
				address: z.string().min(1),
				clientName: z.string().min(1).max(100),
				clientPhone: z.string().optional(),
				projectManagerId: z.string().uuid().optional(),
				startDate: z.date().optional(),
				expectedEndDate: z.date().optional(),
				budget: z.number().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [project] = await db
				.insert(projects)
				.values({
					...input
				})
				.returning();

			if (project) {
				await db.insert(flowRecords).values({
					documentId: project.id,
					documentType: 'change_order',
					toStatus: 'processing',
					action: 'create',
					comments: '项目创建',
					performedById: ctx.user.id
				});
			}

			return project;
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1).max(200).optional(),
				address: z.string().min(1).optional(),
				clientName: z.string().min(1).max(100).optional(),
				clientPhone: z.string().optional(),
				projectManagerId: z.string().uuid().optional(),
				startDate: z.date().optional(),
				expectedEndDate: z.date().optional(),
				actualEndDate: z.date().optional(),
				budget: z.number().optional(),
				status: z.enum(['draft', 'pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled']).optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { id, ...data } = input;
			const [project] = await db
				.update(projects)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(projects.id, id))
				.returning();

			if (!project) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '项目不存在' });
			}

			return project;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ input }) => {
			const result = await db.delete(projects).where(eq(projects.id, input.id));
			if ((result as unknown as { rowCount: number }).rowCount === 0) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '项目不存在' });
			}
			return { success: true };
		})
});
