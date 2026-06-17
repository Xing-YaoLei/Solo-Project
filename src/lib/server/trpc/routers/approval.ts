import { router, roleProcedure } from '../trpc';
import { db } from '$server/db';
import { approvals, contracts, tenants, rooms, buildings, users } from '$server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const approvalRouter = router({
	list: roleProcedure('admin', 'finance')
		.input((input: { action?: string }) => input)
		.query(async ({ input, ctx }) => {
			const conditions = [];
			if (input.action) conditions.push(eq(approvals.action, input.action as any));

			const result = await db
				.select({
					id: approvals.id,
					contractId: approvals.contractId,
					opinion: approvals.opinion,
					action: approvals.action,
					createdAt: approvals.createdAt,
					approverName: users.displayName,
					tenantName: tenants.companyName,
					roomNumber: rooms.roomNumber,
					buildingName: buildings.name,
					contractStatus: contracts.status
				})
				.from(approvals)
				.leftJoin(users, eq(approvals.approverId, users.id))
				.leftJoin(contracts, eq(approvals.contractId, contracts.id))
				.leftJoin(tenants, eq(contracts.tenantId, tenants.id))
				.leftJoin(rooms, eq(contracts.roomId, rooms.id))
				.leftJoin(buildings, eq(rooms.buildingId, buildings.id))
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(approvals.createdAt));

			return result;
		}),

	getDetail: roleProcedure('admin', 'finance')
		.input((input: { contractId: string }) => input)
		.query(async ({ input }) => {
			const approvalList = await db
				.select({
					id: approvals.id,
					opinion: approvals.opinion,
					action: approvals.action,
					createdAt: approvals.createdAt,
					approverName: users.displayName,
					approverRole: users.role
				})
				.from(approvals)
				.leftJoin(users, eq(approvals.approverId, users.id))
				.where(eq(approvals.contractId, input.contractId))
				.orderBy(desc(approvals.createdAt));

			return approvalList;
		})
});
