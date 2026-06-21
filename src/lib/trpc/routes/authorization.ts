import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { router, workerProcedure, managerProcedure } from '../trpc';
import { authorizationScopeTable } from '$server/db/schema';

export const authorizationRouter = router({
	listByProject: workerProcedure
		.input(z.object({ projectId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			return await ctx.db
				.select()
				.from(authorizationScopeTable)
				.where(eq(authorizationScopeTable.projectId, input.projectId))
				.orderBy(desc(authorizationScopeTable.createdAt));
		}),

	create: workerProcedure
		.input(
			z.object({
				projectId: z.string().uuid(),
				scopeType: z.string().min(2).max(64),
				description: z.string().optional(),
				expiresAt: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [auth] = await ctx.db
				.insert(authorizationScopeTable)
				.values({
					...input,
					expiresAt: input.expiresAt ? new Date(input.expiresAt) : null
				})
				.returning();
			return auth;
		}),

	approve: managerProcedure
		.input(
			z.object({
				id: z.string().uuid()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [auth] = await ctx.db
				.update(authorizationScopeTable)
				.set({
					status: 'approved',
					authorizedBy: ctx.user.id,
					authorizedAt: new Date()
				})
				.where(eq(authorizationScopeTable.id, input.id))
				.returning();
			return auth;
		}),

	reject: managerProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				description: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [auth] = await ctx.db
				.update(authorizationScopeTable)
				.set({
					status: 'rejected',
					authorizedBy: ctx.user.id,
					authorizedAt: new Date(),
					description: input.description
				})
				.where(eq(authorizationScopeTable.id, input.id))
				.returning();
			return auth;
		}),

	update: workerProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				scopeType: z.string().min(2).max(64).optional(),
				description: z.string().optional(),
				expiresAt: z.string().optional().nullable()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const updateData: any = { ...input };
			if (updateData.expiresAt !== undefined) {
				updateData.expiresAt = updateData.expiresAt ? new Date(updateData.expiresAt) : null;
			}
			delete updateData.id;

			const [auth] = await ctx.db
				.update(authorizationScopeTable)
				.set(updateData)
				.where(eq(authorizationScopeTable.id, input.id))
				.returning();
			return auth;
		})
});
