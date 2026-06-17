import { router, roleProcedure } from '../trpc';
import { db } from '$server/db';
import { contracts, tenants, rooms, buildings, approvals, users } from '$server/db/schema';
import { eq, and, desc, or, ilike } from 'drizzle-orm';

export const contractRouter = router({
	list: roleProcedure('admin', 'finance')
		.input((input: { status?: string; keyword?: string }) => input)
		.query(async ({ input }) => {
			const conditions = [];
			if (input.status) conditions.push(eq(contracts.status, input.status as any));

			const result = await db
				.select({
					id: contracts.id,
					tenantId: contracts.tenantId,
					roomId: contracts.roomId,
					startDate: contracts.startDate,
					endDate: contracts.endDate,
					monthlyRent: contracts.monthlyRent,
					status: contracts.status,
					createdAt: contracts.createdAt,
					tenantName: tenants.companyName,
					roomNumber: rooms.roomNumber,
					buildingName: buildings.name
				})
				.from(contracts)
				.leftJoin(tenants, eq(contracts.tenantId, tenants.id))
				.leftJoin(rooms, eq(contracts.roomId, rooms.id))
				.leftJoin(buildings, eq(rooms.buildingId, buildings.id))
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(contracts.createdAt));

			if (input.keyword) {
				return result.filter(r =>
					r.tenantName?.includes(input.keyword!) ||
					r.roomNumber?.includes(input.keyword!)
				);
			}
			return result;
		}),

	getById: roleProcedure('admin', 'finance')
		.input((input: { id: string }) => input)
		.query(async ({ input }) => {
			const [contract] = await db.select().from(contracts).where(eq(contracts.id, input.id)).limit(1);
			if (!contract) throw new Error('合同不存在');

			const [tenant] = await db.select().from(tenants).where(eq(tenants.id, contract.tenantId)).limit(1);
			const [room] = await db.select().from(rooms).where(eq(rooms.id, contract.roomId)).limit(1);

			const approvalList = await db
				.select({
					id: approvals.id,
					opinion: approvals.opinion,
					action: approvals.action,
					createdAt: approvals.createdAt,
					approverName: users.displayName
				})
				.from(approvals)
				.leftJoin(users, eq(approvals.approverId, users.id))
				.where(eq(approvals.contractId, input.id))
				.orderBy(desc(approvals.createdAt));

			return { ...contract, tenant, room, approvals: approvalList };
		}),

	submitApproval: roleProcedure('admin', 'finance')
		.input((input: { contractId: string; opinion: string }) => input)
		.mutation(async ({ input, ctx }) => {
			const [approval] = await db
				.insert(approvals)
				.values({
					contractId: input.contractId,
					approverId: ctx.user!.id,
					opinion: input.opinion,
					action: 'approve'
				})
				.returning();
			return approval;
		}),

	approve: roleProcedure('admin', 'finance')
		.input((input: { approvalId: string; opinion: string; action: 'approve' | 'reject' }) => input)
		.mutation(async ({ input }) => {
			const [approval] = await db
				.update(approvals)
				.set({ opinion: input.opinion, action: input.action })
				.where(eq(approvals.id, input.approvalId))
				.returning();

			if (input.action === 'approve') {
				await db.update(contracts).set({ status: 'active' }).where(eq(contracts.id, approval.contractId));
			}

			return approval;
		})
});
