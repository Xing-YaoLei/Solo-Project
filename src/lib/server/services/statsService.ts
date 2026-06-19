import { z } from 'zod';
import { and, between, desc, eq, gte, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import type { AuthUser } from '$lib/trpc/server';

export const ReworkRateSchema = z.object({
	months: z.number().int().min(1).max(12).default(6),
	technicianId: z.string().uuid().optional()
});

export const BusinessSchema = z.object({
	months: z.number().int().min(1).max(12).default(6)
});

export const PartsRankingSchema = z.object({
	topN: z.number().int().min(1).max(50).default(10)
});

export const MaintenanceRemindersSchema = z.object({
	year: z.number().int(),
	month: z.number().int().min(1).max(12)
});

function formatDateKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthRange(months: number): { start: Date; end: Date } {
	const end = new Date();
	end.setDate(1);
	end.setHours(23, 59, 59, 999);
	end.setMonth(end.getMonth() + 1);
	end.setDate(0);

	const start = new Date(end);
	start.setMonth(start.getMonth() - (months - 1));
	start.setDate(1);
	start.setHours(0, 0, 0, 0);

	return { start, end };
}

export async function getOverview(user: AuthUser) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const todayConditions = [
		gte(schema.workOrders.createdAt, today),
		sql`${schema.workOrders.createdAt} < ${tomorrow}`
	];

	if (user.role === 'ADVISOR') {
		todayConditions.push(eq(schema.workOrders.advisorId, user.id));
	} else if (user.role === 'TECHNICIAN') {
		todayConditions.push(eq(schema.workOrders.technicianId, user.id));
	}

	const todayOrdersResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(schema.workOrders)
		.where(and(...todayConditions));

	const pendingPickupConditions = [eq(schema.workOrders.status, 'COMPLETED')];
	if (user.role === 'ADVISOR') {
		pendingPickupConditions.push(eq(schema.workOrders.advisorId, user.id));
	} else if (user.role === 'TECHNICIAN') {
		pendingPickupConditions.push(eq(schema.workOrders.technicianId, user.id));
	}

	const pendingPickupResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(schema.workOrders)
		.where(and(...pendingPickupConditions));

	const openExceptionConditions = [
		sql`${schema.exceptions.status} != 'CLOSED'`
	];
	if (user.role !== 'MANAGER') {
		openExceptionConditions.push(
			sql`(${schema.exceptions.creator_id} = ${user.id} OR ${schema.exceptions.assignee_id} = ${user.id})`
		);
	}

	const openExceptionsResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(schema.exceptions)
		.where(and(...openExceptionConditions));

	const { start, end } = getMonthRange(1);
	const reworkConditions = [
		between(schema.workOrders.createdAt, start, end),
		eq(schema.exceptions.type, 'REWORK'),
		eq(schema.exceptions.status, 'CLOSED')
	];

	if (user.role === 'TECHNICIAN') {
		reworkConditions.push(eq(schema.workOrders.technicianId, user.id));
	}

	const totalMonthResult = await db
		.select({ count: sql<number>`count(distinct ${schema.workOrders.id})` })
		.from(schema.workOrders)
		.where(and(...reworkConditions.slice(0, 1)));

	const reworkResult = await db
		.select({ count: sql<number>`count(distinct ${schema.workOrders.id})` })
		.from(schema.workOrders)
		.innerJoin(schema.exceptions, eq(schema.workOrders.id, schema.exceptions.workOrderId))
		.where(and(...reworkConditions));

	const total = Number(totalMonthResult[0]?.count ?? 0);
	const rework = Number(reworkResult[0]?.count ?? 0);
	const reworkRate = total > 0 ? (rework / total) * 100 : 0;

	return {
		todayOrders: Number(todayOrdersResult[0]?.count ?? 0),
		pendingPickup: Number(pendingPickupResult[0]?.count ?? 0),
		openExceptions: Number(openExceptionsResult[0]?.count ?? 0),
		reworkRate: Math.round(reworkRate * 100) / 100
	};
}

export async function getReworkRate(
	input: z.infer<typeof ReworkRateSchema>,
	user: AuthUser
) {
	const { start, end } = getMonthRange(input.months);

	const months: { key: string; label: string; total: number; rework: number; rate: number }[] = [];
	const current = new Date(start);
	while (current <= end) {
		const monthStart = new Date(current);
		const monthEnd = new Date(current);
		monthEnd.setMonth(monthEnd.getMonth() + 1);
		monthEnd.setDate(0);
		monthEnd.setHours(23, 59, 59, 999);

		const key = formatDateKey(current);
		const label = `${current.getFullYear()}年${current.getMonth() + 1}月`;

		const totalConditions = [
			gte(schema.workOrders.createdAt, monthStart),
			sql`${schema.workOrders.createdAt} <= ${monthEnd}`
		];
		if (input.technicianId) {
			totalConditions.push(eq(schema.workOrders.technicianId, input.technicianId));
		} else if (user.role === 'TECHNICIAN') {
			totalConditions.push(eq(schema.workOrders.technicianId, user.id));
		} else if (user.role === 'ADVISOR') {
			totalConditions.push(eq(schema.workOrders.advisorId, user.id));
		}

		const totalResult = await db
			.select({ count: sql<number>`count(distinct ${schema.workOrders.id})` })
			.from(schema.workOrders)
			.where(and(...totalConditions));

		const reworkConditions = [...totalConditions];
		reworkConditions.push(eq(schema.exceptions.type, 'REWORK'));
		reworkConditions.push(eq(schema.exceptions.status, 'CLOSED'));

		const reworkResult = await db
			.select({ count: sql<number>`count(distinct ${schema.workOrders.id})` })
			.from(schema.workOrders)
			.innerJoin(schema.exceptions, eq(schema.workOrders.id, schema.exceptions.workOrderId))
			.where(and(...reworkConditions));

		const total = Number(totalResult[0]?.count ?? 0);
		const rework = Number(reworkResult[0]?.count ?? 0);
		const rate = total > 0 ? (rework / total) * 100 : 0;

		months.push({
			key,
			label,
			total,
			rework,
			rate: Math.round(rate * 100) / 100
		});

		current.setMonth(current.getMonth() + 1);
	}

	return months;
}

export async function getBusinessData(
	input: z.infer<typeof BusinessSchema>,
	user: AuthUser
) {
	const { start, end } = getMonthRange(input.months);

	const months: {
		key: string;
		label: string;
		orderCount: number;
		revenue: number;
		avgAmount: number;
	}[] = [];

	const current = new Date(start);
	while (current <= end) {
		const monthStart = new Date(current);
		const monthEnd = new Date(current);
		monthEnd.setMonth(monthEnd.getMonth() + 1);
		monthEnd.setDate(0);
		monthEnd.setHours(23, 59, 59, 999);

		const key = formatDateKey(current);
		const label = `${current.getFullYear()}年${current.getMonth() + 1}月`;

		const conditions = [
			gte(schema.workOrders.createdAt, monthStart),
			sql`${schema.workOrders.createdAt} <= ${monthEnd}`,
			eq(schema.workOrders.status, 'COMPLETED')
		];
		if (user.role === 'TECHNICIAN') {
			conditions.push(eq(schema.workOrders.technicianId, user.id));
		} else if (user.role === 'ADVISOR') {
			conditions.push(eq(schema.workOrders.advisorId, user.id));
		}

		const result = await db
			.select({
				count: sql<number>`count(*)`,
				sum: sql<number>`COALESCE(SUM(${schema.workOrders.totalAmount}::numeric), 0)`
			})
			.from(schema.workOrders)
			.where(and(...conditions));

		const orderCount = Number(result[0]?.count ?? 0);
		const revenue = Number(result[0]?.sum ?? 0);
		const avgAmount = orderCount > 0 ? revenue / orderCount : 0;

		months.push({
			key,
			label,
			orderCount,
			revenue: Math.round(revenue * 100) / 100,
			avgAmount: Math.round(avgAmount * 100) / 100
		});

		current.setMonth(current.getMonth() + 1);
	}

	return months;
}

export async function getPartsRanking(input: z.infer<typeof PartsRankingSchema>) {
	const result = await db
		.select({
			partId: schema.partMovements.partId,
			partName: schema.parts.name,
			sku: schema.parts.sku,
			totalQuantity: sql<number>`SUM(${schema.partMovements.quantity})`,
			totalValue:
				sql<number>`SUM(${schema.partMovements.quantity} * ${schema.parts.unitPrice}::numeric)`
		})
		.from(schema.partMovements)
		.innerJoin(schema.parts, eq(schema.partMovements.partId, schema.parts.id))
		.where(eq(schema.partMovements.type, 'OUT'))
		.groupBy(schema.partMovements.partId, schema.parts.name, schema.parts.sku)
		.orderBy(desc(sql`SUM(${schema.partMovements.quantity})`))
		.limit(input.topN);

	return result.map((r) => ({
		partId: r.partId,
		partName: r.partName,
		sku: r.sku,
		totalQuantity: Number(r.totalQuantity ?? 0),
		totalValue: Math.round(Number(r.totalValue ?? 0) * 100) / 100
	}));
}

export async function getTodoList(user: AuthUser) {
	const todos: {
		type: string;
		title: string;
		description?: string;
		priority: 'high' | 'medium' | 'low';
		link: string;
	}[] = [];

	if (user.role === 'ADVISOR' || user.role === 'MANAGER') {
		const pendingOrders = await db
			.select()
			.from(schema.workOrders)
			.where(
				and(
					eq(schema.workOrders.status, 'PENDING'),
					user.role === 'ADVISOR'
						? eq(schema.workOrders.advisorId, user.id)
						: undefined
				)
			)
			.orderBy(schema.workOrders.createdAt)
			.limit(5);

		for (const wo of pendingOrders) {
			todos.push({
				type: '工单确认',
				title: `工单 ${wo.orderNo} 待确认`,
				description: wo.remark || undefined,
				priority: 'high',
				link: `/work-orders/${wo.id}`
			});
		}

		const inspectionOrders = await db
			.select()
			.from(schema.workOrders)
			.where(
				and(
					eq(schema.workOrders.status, 'INSPECTION'),
					user.role === 'ADVISOR'
						? eq(schema.workOrders.advisorId, user.id)
						: undefined
				)
			)
			.orderBy(schema.workOrders.createdAt)
			.limit(5);

		for (const wo of inspectionOrders) {
			todos.push({
				type: '质检验收',
				title: `工单 ${wo.orderNo} 待验收`,
				priority: 'high',
				link: `/work-orders/${wo.id}`
			});
		}
	}

	if (user.role === 'TECHNICIAN') {
		const confirmedOrders = await db
			.select()
			.from(schema.workOrders)
			.where(
				and(
					eq(schema.workOrders.status, 'CONFIRMED'),
					eq(schema.workOrders.technicianId, user.id)
				)
			)
			.orderBy(schema.workOrders.createdAt)
			.limit(5);

		for (const wo of confirmedOrders) {
			todos.push({
				type: '待施工',
				title: `工单 ${wo.orderNo} 待开始施工`,
				priority: 'high',
				link: `/work-orders/${wo.id}`
			});
		}
	}

	if (user.role === 'PARTS' || user.role === 'MANAGER') {
		const lowStock = await db
			.select()
			.from(schema.parts)
			.where(
				sql`${schema.parts.stockQuantity} <= ${schema.parts.safetyStock}`
			)
			.orderBy(schema.parts.stockQuantity)
			.limit(5);

		for (const p of lowStock) {
			todos.push({
				type: '低库存预警',
				title: `配件 ${p.name} 库存不足`,
				description: `当前 ${p.stockQuantity}/${p.safetyStock + p.unit}`,
				priority: 'medium',
				link: '/parts'
			});
		}
	}

	const exceptionConditions = [
		sql`${schema.exceptions.status} != 'CLOSED'`
	];
	if (user.role !== 'MANAGER') {
		exceptionConditions.push(eq(schema.exceptions.assigneeId, user.id));
	}

	const myExceptions = await db
		.select()
		.from(schema.exceptions)
		.where(and(...exceptionConditions))
		.orderBy(schema.exceptions.createdAt)
		.limit(5);

	for (const exc of myExceptions) {
		todos.push({
			type: '异常处理',
			title: exc.title,
			description: `状态：${exc.status}`,
			priority: exc.status === 'REVIEWING' ? 'medium' : 'high',
			link: `/exceptions/${exc.id}`
		});
	}

	if (user.role === 'MANAGER') {
		const reviewing = await db
			.select()
			.from(schema.exceptions)
			.where(eq(schema.exceptions.status, 'REVIEWING'))
			.orderBy(schema.exceptions.createdAt)
			.limit(5);

		for (const exc of reviewing) {
			todos.push({
				type: '复核',
				title: `异常待复核：${exc.title}`,
				priority: 'high',
				link: `/exceptions/${exc.id}`
			});
		}
	}

	return todos.sort((a, b) => {
		const priorityOrder = { high: 0, medium: 1, low: 2 };
		return priorityOrder[a.priority] - priorityOrder[b.priority];
	});
}

export async function getMaintenanceReminders(
	input: z.infer<typeof MaintenanceRemindersSchema>
) {
	const { year, month } = input;
	const monthStart = new Date(year, month - 1, 1);
	const monthEnd = new Date(year, month, 0);

	const reminders = await db
		.select()
		.from(schema.maintenanceReminders)
		.innerJoin(
			schema.vehicles,
			eq(schema.maintenanceReminders.vehicleId, schema.vehicles.id)
		)
		.innerJoin(
			schema.customers,
			eq(schema.vehicles.customerId, schema.customers.id)
		)
		.where(
			and(
				gte(schema.maintenanceReminders.remindDate, monthStart),
				sql`${schema.maintenanceReminders.remindDate} <= ${monthEnd}`
			)
		)
		.orderBy(schema.maintenanceReminders.remindDate);

	const dayMap = new Map<
		number,
		{
			day: number;
			items: typeof reminders;
		}
	>();

	for (let d = 1; d <= monthEnd.getDate(); d++) {
		dayMap.set(d, { day: d, items: [] });
	}

	for (const r of reminders) {
		const date = new Date(r.maintenance_reminders.remindDate);
		const day = date.getDate();
		const entry = dayMap.get(day);
		if (entry) {
			entry.items.push(r);
		}
	}

	return Array.from(dayMap.values());
}
