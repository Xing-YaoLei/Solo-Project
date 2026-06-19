import { router, authedProcedure, createPermissionGuard } from '$server/trpc/context';
import { z } from 'zod';
import { db } from '$server/db';
import { attachments } from '$server/db/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

const supplementGuard = authedProcedure.use(createPermissionGuard(['complaint:supplement']));
const operatorGuard = authedProcedure.use(createPermissionGuard(['tag:manage']));

export const attachmentRouter = router({
	list: authedProcedure
		.input(z.object({ complaintId: z.string() }))
		.query(async ({ input }) => {
			return await db
				.select()
				.from(attachments)
				.where(eq(attachments.complaintId, input.complaintId));
		}),

	create: supplementGuard
		.input(z.object({
			complaintId: z.string(),
			fileName: z.string(),
			fileUrl: z.string(),
			fileType: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			const [created] = await db.insert(attachments).values({
				complaintId: input.complaintId,
				fileName: input.fileName,
				fileUrl: input.fileUrl,
				fileType: input.fileType,
				uploadedBy: ctx.user.id
			}).returning();
			return created;
		}),

	delete: operatorGuard
		.input(z.object({ id: z.string() }))
		.mutation(async ({ input }) => {
			const [deleted] = await db.delete(attachments).where(eq(attachments.id, input.id)).returning();
			if (!deleted) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '附件不存在' });
			}
			return { success: true };
		})
});
