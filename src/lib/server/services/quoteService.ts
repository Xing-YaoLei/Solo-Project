import { z } from 'zod';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import type { QuoteStatus } from '../db/schema';
import type { AuthUser } from '$lib/trpc/server';

export const ListQuoteSchema = z.object({
	status: z.array(z.enum(schema.quoteStatus as unknown as [QuoteStatus, ...QuoteStatus[]])).optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(20)
});

export const CreateQuoteSchema = z.object({
	workOrderId: z.string().uuid().optional(),
	totalAmount: z.number().min(0).default(0),
	discount: z.number().min(0).max(100).default(0),
	status: z.enum(schema.quoteStatus as unknown as [QuoteStatus, ...QuoteStatus[]]).default('DRAFT')
});

export const UpdateQuoteStatusSchema = z.object({
	id: z.string().uuid(),
	status: z.enum(schema.quoteStatus as unknown as [QuoteStatus, ...QuoteStatus[]])
});

function generateQuoteNo(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, '0');
	const d = String(now.getDate()).padStart(2, '0');
	const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
	return `QT${y}${m}${d}${rand}`;
}

export async function listQuotes(
	input: z.infer<typeof ListQuoteSchema>,
	user: AuthUser
) {
	const { status, page, pageSize } = input;
	const conditions = [];

	if (user.role === 'ADVISOR') {
		conditions.push(
			eq(
				schema.workOrders.advisorId,
				user.id
			)
		);
	}

	if (status && status.length > 0) {
		conditions.push(inArray(schema.quotes.status, status));
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;
	const offset = (page - 1) * pageSize;

	const baseQuery = db
		.select()
		.from(schema.quotes)
		.leftJoin(schema.workOrders, eq(schema.quotes.workOrderId, schema.workOrders.id))
		.leftJoin(schema.customers, eq(schema.workOrders.customerId, schema.customers.id))
		.leftJoin(schema.vehicles, eq(schema.workOrders.vehicleId, schema.vehicles.id));

	const items = await baseQuery
		.where(where)
		.orderBy(desc(schema.quotes.id))
		.limit(pageSize)
		.offset(offset);

	const totalResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(schema.quotes)
		.where(where);

	const total = Number(totalResult[0]?.count ?? 0);

	return { items, total };
}

export async function getQuote(id: string, user: AuthUser) {
	const result = await db
		.select()
		.from(schema.quotes)
		.where(eq(schema.quotes.id, id))
		.leftJoin(schema.workOrders, eq(schema.quotes.workOrderId, schema.workOrders.id))
		.leftJoin(schema.customers, eq(schema.workOrders.customerId, schema.customers.id))
		.leftJoin(schema.vehicles, eq(schema.workOrders.vehicleId, schema.vehicles.id));

	if (result.length === 0) {
		return null;
	}

	const quote = result[0].quotes;
	const wo = result[0].work_orders;

	if (
		user.role === 'ADVISOR' &&
		wo &&
		wo.advisorId !== user.id
	) {
		return null;
	}

	const items = wo
		? await db
				.select()
				.from(schema.workOrderItems)
				.where(eq(schema.workOrderItems.workOrderId, wo.id))
		: [];

	return {
		...result[0],
		items
	};
}

export async function createQuote(
	input: z.infer<typeof CreateQuoteSchema>,
	user: AuthUser
) {
	if (user.role !== 'ADVISOR' && user.role !== 'MANAGER') {
		throw new Error('权限不足');
	}

	const quoteNo = generateQuoteNo();

	if (input.workOrderId) {
		const wo = await db.query.workOrders.findFirst({
			where: eq(schema.workOrders.id, input.workOrderId)
		});

		if (!wo) {
			throw new Error('工单不存在');
		}

		if (user.role === 'ADVISOR' && wo.advisorId !== user.id) {
			throw new Error('权限不足');
		}
	}

	const [quote] = await db
		.insert(schema.quotes)
		.values({
			quoteNo,
			workOrderId: input.workOrderId,
			totalAmount: String(input.totalAmount),
			discount: String(input.discount),
			status: input.status
		})
		.returning();

	return quote;
}

export async function updateQuoteStatus(
	input: z.infer<typeof UpdateQuoteStatusSchema>,
	user: AuthUser
) {
	if (user.role !== 'ADVISOR' && user.role !== 'MANAGER') {
		throw new Error('权限不足');
	}

	const existing = await db.query.quotes.findFirst({
		where: eq(schema.quotes.id, input.id)
	});

	if (!existing) {
		throw new Error('报价单不存在');
	}

	const updateData: Partial<typeof existing> = {
		status: input.status
	};

	if (input.status === 'CONFIRMED' && !existing.confirmedAt) {
		updateData.confirmedAt = new Date().toISOString().split('T')[0];
	}

	const [updated] = await db
		.update(schema.quotes)
		.set(updateData)
		.where(eq(schema.quotes.id, input.id))
		.returning();

	return updated;
}
