import { z } from 'zod';
import { t, publicProcedure } from '../init';
import { db } from '$lib/server/db';
import { exceptionRecord, exceptionAction } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const exceptionRouter = t.router({
	list: publicProcedure
		.input(
			z
				.object({
					performanceId: z.string().optional(),
					status: z.string().optional(),
					type: z.string().optional(),
					handlerId: z.string().optional()
				})
				.optional()
		)
		.query(async ({ input }) => {
			const conditions = [];
			if (input?.performanceId)
				conditions.push(eq(exceptionRecord.performance_id, input.performanceId));
			if (input?.status) conditions.push(eq(exceptionRecord.status, input.status));
			if (input?.type) conditions.push(eq(exceptionRecord.type, input.type));
			if (input?.handlerId)
				conditions.push(eq(exceptionRecord.handler_id, input.handlerId));

			return db
				.select()
				.from(exceptionRecord)
				.where(conditions.length > 0 ? and(...conditions) : undefined);
		}),

	get: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			const [record] = await db
				.select()
				.from(exceptionRecord)
				.where(eq(exceptionRecord.id, input.id));

			const actions = await db
				.select()
				.from(exceptionAction)
				.where(eq(exceptionAction.exception_id, input.id));

			return { ...record, actions };
		}),

	create: publicProcedure
		.input(
			z.object({
				performance_id: z.string(),
				type: z.string(),
				description: z.string(),
				source: z.string().optional()
			})
		)
		.mutation(async ({ input }) => {
			const [created] = await db
				.insert(exceptionRecord)
				.values({ ...input, status: 'pending' })
				.returning();
			return created;
		}),

	addAction: publicProcedure
		.input(
			z.object({
				exception_id: z.string(),
				action_type: z.string(),
				content: z.string()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [action] = await db
				.insert(exceptionAction)
				.values({
					...input,
					operator_id: ctx.user?.id ?? ''
				})
				.returning();

			if (input.action_type === 'status_change') {
				const statusMap: Record<string, string> = {
					escalate: 'escalated',
					resolve: 'resolved',
					request_docs: 'missing_docs'
				};
				const newStatus = statusMap[input.content];
				if (newStatus) {
					await db
						.update(exceptionRecord)
						.set({ status: newStatus, updated_at: new Date() })
						.where(eq(exceptionRecord.id, input.exception_id));
				}
			}

			return action;
		}),

	assign: publicProcedure
		.input(
			z.object({
				id: z.string(),
				handler_id: z.string()
			})
		)
		.mutation(async ({ input }) => {
			const [updated] = await db
				.update(exceptionRecord)
				.set({ handler_id: input.handler_id, status: 'processing', updated_at: new Date() })
				.where(eq(exceptionRecord.id, input.id))
				.returning();
			return updated;
		}),

	close: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input }) => {
			const [updated] = await db
				.update(exceptionRecord)
				.set({ status: 'closed', updated_at: new Date() })
				.where(eq(exceptionRecord.id, input.id))
				.returning();
			return updated;
		})
});
