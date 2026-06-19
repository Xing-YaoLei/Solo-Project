import { z } from 'zod';
import { and, asc, between, desc, eq, inArray, isNull, like, or, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import type {
	WoStatus,
	WoItemStatus,
	UserRole
} from '../db/schema';
import type { AuthUser } from '$lib/trpc/server';

export const WorkOrderFilterSchema = z.object({
	status: z.array(z.enum(schema.woStatus as unknown as [WoStatus, ...WoStatus[]])).optional(),
	advisorId: z.string().uuid().optional(),
	technicianId: z.string().uuid().optional(),
	plateNumber: z.string().optional(),
	dateFrom: z.string().optional(),
	dateTo: z.string().optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(20)
});

export const CreateWorkOrderItemSchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().min(1).max(200),
	laborHours: z.number().min(0).default(0),
	laborPrice: z.number().min(0).default(0),
	partsPrice: z.number().min(0).default(0),
	status: z.enum(schema.woItemStatus as unknown as [WoItemStatus, ...WoItemStatus[]]).default('TODO')
});

export const CreateWorkOrderSchema = z.object({
	customerId: z.string().uuid(),
	vehicleId: z.string().uuid(),
	advisorId: z.string().uuid().optional(),
	technicianId: z.string().uuid().optional(),
	status: z.enum(schema.woStatus as unknown as [WoStatus, ...WoStatus[]]).default('PENDING'),
	remark: z.string().optional(),
	items: z.array(CreateWorkOrderItemSchema).default([])
});

export const UpdateWorkOrderSchema = z.object({
	id: z.string().uuid(),
	technicianId: z.string().uuid().nullable().optional(),
	status: z.enum(schema.woStatus as unknown as [WoStatus, ...WoStatus[]]).optional(),
	remark: z.string().nullable().optional()
});

export const BatchAssignSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
	technicianId: z.string().uuid()
});

export const BatchUpdateStatusSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
	status: z.enum(schema.woStatus as unknown as [WoStatus, ...WoStatus[]])
});

export const AddWorkOrderItemSchema = z.object({
	workOrderId: z.string().uuid(),
	item: CreateWorkOrderItemSchema
});

export const UpdateItemStatusSchema = z.object({
	itemId: z.string().uuid(),
	status: z.enum(schema.woItemStatus as unknown as [WoItemStatus, ...WoItemStatus[]])
});

function generateOrderNo(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, '0');
	const d = String(now.getDate()).padStart(2, '0');
	const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
	return `WO${y}${m}${d}${rand}`;
}

export async function listWorkOrders(
	input: z.infer<typeof WorkOrderFilterSchema>,
	user: AuthUser
) {
	const { status, advisorId, technicianId, plateNumber, dateFrom, dateTo, page, pageSize } = input;

	const conditions = [];

	if (user.role === 'ADVISOR') {
		conditions.push(eq(schema.workOrders.advisorId, user.id));
	} else if (user.role === 'TECHNICIAN') {
		conditions.push(eq(schema.workOrders.technicianId, user.id));
	}

	if (status && status.length > 0) {
		conditions.push(inArray(schema.workOrders.status, status));
	}
	if (advisorId) {
		conditions.push(eq(schema.workOrders.advisorId, advisorId));
	}
	if (technicianId) {
		conditions.push(eq(schema.workOrders.technicianId, technicianId));
	}
	if (plateNumber) {
		conditions.push(eq(schema.vehicles.plateNumber, plateNumber));
	}
	if (dateFrom && dateTo) {
		conditions.push(
			between(
				schema.workOrders.createdAt,
				new Date(dateFrom),
				new Date(dateTo + 'T23:59:59')
			)
		);
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;
	const offset = (page - 1) * pageSize;

	const advisorUsers = db.select().from(schema.users).as('advisor_users');
	const technicianUsers = db.select().from(schema.users).as('technician_users');

	const items = await db
		.select({
			work_orders: schema.workOrders,
			customers: schema.customers,
			vehicles: schema.vehicles,
			advisor: advisorUsers,
			technician: technicianUsers
		})
		.from(schema.workOrders)
		.innerJoin(schema.customers, eq(schema.workOrders.customerId, schema.customers.id))
		.innerJoin(schema.vehicles, eq(schema.workOrders.vehicleId, schema.vehicles.id))
		.leftJoin(advisorUsers, eq(schema.workOrders.advisorId, advisorUsers.id))
		.leftJoin(technicianUsers, eq(schema.workOrders.technicianId, technicianUsers.id))
		.where(where)
		.orderBy(desc(schema.workOrders.createdAt))
		.limit(pageSize)
		.offset(offset);

	const totalResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(schema.workOrders)
		.where(where);

	const total = Number(totalResult[0]?.count ?? 0);

	return { items, total };
}

export async function getWorkOrder(id: string, user: AuthUser) {
	const result = await db
		.select()
		.from(schema.workOrders)
		.where(eq(schema.workOrders.id, id))
		.innerJoin(schema.customers, eq(schema.workOrders.customerId, schema.customers.id))
		.innerJoin(schema.vehicles, eq(schema.workOrders.vehicleId, schema.vehicles.id));

	if (result.length === 0) {
		return null;
	}

	const wo = result[0].work_orders;

	if (
		user.role === 'ADVISOR' &&
		wo.advisorId !== user.id
	) {
		return null;
	}
	if (
		user.role === 'TECHNICIAN' &&
		wo.technicianId !== user.id
	) {
		return null;
	}

	const items = await db
		.select()
		.from(schema.workOrderItems)
		.where(eq(schema.workOrderItems.workOrderId, id))
		.orderBy(asc(schema.workOrderItems.id));

	const attachments = await db
		.select()
		.from(schema.attachments)
		.where(
			and(
				eq(schema.attachments.refType, 'WORK_ORDER'),
				eq(schema.attachments.refId, id)
			)
		)
		.orderBy(desc(schema.attachments.createdAt));

	return {
		...result[0],
		items,
		attachments
	};
}

export async function createWorkOrder(
	input: z.infer<typeof CreateWorkOrderSchema>,
	user: AuthUser
) {
	if (user.role !== 'ADVISOR' && user.role !== 'MANAGER') {
		throw new Error('权限不足');
	}

	const orderNo = generateOrderNo();
	const advisorId = user.role === 'ADVISOR' ? user.id : input.advisorId ?? user.id;

	let totalAmount = 0;
	for (const item of input.items) {
		totalAmount += item.laborPrice + item.partsPrice;
	}

	return await db.transaction(async (tx) => {
		const [wo] = await tx
			.insert(schema.workOrders)
			.values({
				orderNo,
				customerId: input.customerId,
				vehicleId: input.vehicleId,
				advisorId,
				technicianId: input.technicianId,
				status: input.status,
				totalAmount: String(totalAmount),
				remark: input.remark
			})
			.returning();

		if (input.items.length > 0) {
			await tx
				.insert(schema.workOrderItems)
				.values(
					input.items.map((item) => ({
						workOrderId: wo.id,
						name: item.name,
						laborHours: String(item.laborHours),
						laborPrice: String(item.laborPrice),
						partsPrice: String(item.partsPrice),
						status: item.status
					}))
				);
		}

		return wo;
	});
}

export async function updateWorkOrder(
	input: z.infer<typeof UpdateWorkOrderSchema>,
	user: AuthUser
) {
	const wo = await db.query.workOrders.findFirst({
		where: eq(schema.workOrders.id, input.id)
	});

	if (!wo) {
		throw new Error('工单不存在');
	}

	if (user.role === 'ADVISOR' && wo.advisorId !== user.id) {
		throw new Error('权限不足');
	}
	if (
		user.role === 'TECHNICIAN' &&
		wo.technicianId !== user.id &&
		!input.status
	) {
		throw new Error('权限不足');
	}

	const updateData: Partial<typeof wo> = {};

	if (input.technicianId !== undefined) {
		updateData.technicianId = input.technicianId;
	}
	if (input.status !== undefined) {
		updateData.status = input.status;
		if (input.status === 'COMPLETED' && !wo.completedAt) {
			updateData.completedAt = new Date();
		}
	}
	if (input.remark !== undefined) {
		updateData.remark = input.remark;
	}

	const [updated] = await db
		.update(schema.workOrders)
		.set(updateData)
		.where(eq(schema.workOrders.id, input.id))
		.returning();

	return updated;
}

export async function batchAssign(
	input: z.infer<typeof BatchAssignSchema>,
	user: AuthUser
) {
	if (user.role !== 'ADVISOR' && user.role !== 'MANAGER') {
		throw new Error('权限不足');
	}

	await db.transaction(async (tx) => {
		await tx
			.update(schema.workOrders)
			.set({ technicianId: input.technicianId })
			.where(inArray(schema.workOrders.id, input.ids));
	});
}

export async function batchUpdateStatus(
	input: z.infer<typeof BatchUpdateStatusSchema>,
	user: AuthUser
) {
	if (user.role === 'TECHNICIAN' && input.status !== 'IN_PROGRESS' && input.status !== 'INSPECTION') {
		throw new Error('权限不足');
	}

	await db.transaction(async (tx) => {
		const updateData: Partial<typeof schema.workOrders.$inferInsert> = {
			status: input.status
		};
		if (input.status === 'COMPLETED') {
			updateData.completedAt = new Date();
		}
		await tx
			.update(schema.workOrders)
			.set(updateData)
			.where(inArray(schema.workOrders.id, input.ids));
	});
}

export async function addWorkOrderItem(
	input: z.infer<typeof AddWorkOrderItemSchema>,
	user: AuthUser
) {
	const wo = await db.query.workOrders.findFirst({
		where: eq(schema.workOrders.id, input.workOrderId)
	});

	if (!wo) {
		throw new Error('工单不存在');
	}

	if (user.role === 'ADVISOR' && wo.advisorId !== user.id) {
		throw new Error('权限不足');
	}
	if (
		user.role === 'TECHNICIAN' &&
		wo.technicianId !== user.id
	) {
		throw new Error('权限不足');
	}

	await db.transaction(async (tx) => {
		const [item] = await tx
			.insert(schema.workOrderItems)
			.values({
				workOrderId: input.workOrderId,
				name: input.item.name,
				laborHours: String(input.item.laborHours),
				laborPrice: String(input.item.laborPrice),
				partsPrice: String(input.item.partsPrice),
				status: input.item.status
			})
			.returning();

		const currentTotal = Number(wo.totalAmount || 0);
		const newTotal = currentTotal + input.item.laborPrice + input.item.partsPrice;

		await tx
			.update(schema.workOrders)
			.set({ totalAmount: String(newTotal) })
			.where(eq(schema.workOrders.id, input.workOrderId));

		return item;
	});
}

export async function updateItemStatus(
	input: z.infer<typeof UpdateItemStatusSchema>,
	user: AuthUser
) {
	const item = await db.query.workOrderItems.findFirst({
		where: eq(schema.workOrderItems.id, input.itemId)
	});

	if (!item) {
		throw new Error('项目不存在');
	}

	const wo = await db.query.workOrders.findFirst({
		where: eq(schema.workOrders.id, item.workOrderId)
	});

	if (!wo) {
		throw new Error('工单不存在');
	}

	if (
		user.role === 'TECHNICIAN' &&
		wo.technicianId !== user.id
	) {
		throw new Error('权限不足');
	}

	const [updated] = await db
		.update(schema.workOrderItems)
		.set({ status: input.status })
		.where(eq(schema.workOrderItems.id, input.itemId))
		.returning();

	return updated;
}
