import { router, authedProcedure } from '$server/trpc/context';
import { z } from 'zod';
import { db } from '$server/db';
import { escalationRecords, complaints, users } from '$server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const escalationRouter = router({
	list: authedProcedure
		.input(z.object({ complaintId: z.string() }))
		.query(async ({ input }) => {
			return await db
				.select()
				.from(escalationRecords)
				.where(eq(escalationRecords.complaintId, input.complaintId))
				.orderBy(desc(escalationRecords.createdAt));
		}),

	listAll: authedProcedure.query(async () => {
		return await db
			.select({
				id: escalationRecords.id,
				complaintId: escalationRecords.complaintId,
				fromUserId: escalationRecords.fromUserId,
				toUserId: escalationRecords.toUserId,
				reason: escalationRecords.reason,
				level: escalationRecords.level,
				createdAt: escalationRecords.createdAt,
				complaintDescription: complaints.description,
				complaintStatus: complaints.status
			})
			.from(escalationRecords)
			.innerJoin(complaints, eq(escalationRecords.complaintId, complaints.id))
			.orderBy(desc(escalationRecords.createdAt));
	})
});
