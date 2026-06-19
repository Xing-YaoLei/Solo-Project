import { router, authedProcedure, createPermissionGuard } from '$server/trpc/context';
import { z } from 'zod';
import { db } from '$server/db';
import { tags } from '$server/db/schema';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

const tagGuard = (code: string) => authedProcedure.use(createPermissionGuard([code]));

export const tagRouter = router({
	list: authedProcedure
		.input(z.object({ category: z.string().optional() }))
		.query(async ({ input }) => {
			const conditions = [];
			if (input.category) conditions.push(eq(tags.category, input.category));
			const where = conditions.length > 0 ? and(...conditions) : undefined;
			return await db.select().from(tags).where(where);
		}),

	create: tagGuard('tag:manage')
		.input(z.object({
			code: z.string(),
			label: z.string(),
			category: z.string()
		}))
		.mutation(async ({ input }) => {
			const [created] = await db.insert(tags).values(input).returning();
			return created;
		}),

	update: tagGuard('tag:manage')
		.input(z.object({
			id: z.string(),
			label: z.string().optional()
		}))
		.mutation(async ({ input }) => {
			const { id, ...data } = input;
			const [updated] = await db.update(tags).set(data).where(eq(tags.id, id)).returning();
			if (!updated) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '标签不存在' });
			}
			return updated;
		}),

	delete: tagGuard('tag:manage')
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input }) => {
			const [deleted] = await db.delete(tags).where(eq(tags.id, input.id)).returning();
			if (!deleted) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '标签不存在' });
			}
			return { success: true };
		})
});
