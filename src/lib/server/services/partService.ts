import { z } from 'zod';
import { and, desc, eq, inArray, like, lte, or, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import type { MovementType } from '../db/schema';
import type { AuthUser } from '$lib/trpc/server';

export const ListPartSchema = z.object({
	keyword: z.string().optional(),
	category: z.string().optional(),
	lowStock: z.boolean().optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(50)
});

export const CreatePartSchema = z.object({
	sku: z.string().min(1).max(50),
	name: z.string().min(1).max(200),
	category: z.string().optional(),
	stockQuantity: z.number().int().min(0).default(0),
	safetyStock: z.number().int().min(0).default(0),
	unitPrice: z.number().min(0).default(0),
	unit: z.string().default('个')
});

export const UpdatePartSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(200).optional(),
	category: z.string().nullable().optional(),
	stockQuantity: z.number().int().min(0).optional(),
	safetyStock: z.number().int().min(0).optional(),
	unitPrice: z.number().min(0).optional(),
	unit: z.string().optional()
});

export const MovementSchema = z.object({
	partId: z.string().uuid(),
	type: z.enum(schema.movementType as unknown as [MovementType, ...MovementType[]]),
	quantity: z.number().int().min(1),
	source: z.string().optional(),
	workOrderId: z.string().uuid().optional(),
	remark: z.string().optional()
});

export const BatchOutSchema = z.object({
	items: z.array(
		z.object({
			partId: z.string().uuid(),
			quantity: z.number().int().min(1),
			workOrderId: z.string().uuid().optional()
		})
	).min(1)
});

export async function listParts(
	input: z.infer<typeof ListPartSchema>
) {
	const { keyword, category, lowStock, page, pageSize } = input;

	const conditions = [];

	if (keyword) {
		conditions.push(
			or(
				like(schema.parts.name, `%${keyword}%`),
				like(schema.parts.sku, `%${keyword}%`)
			)
		);
	}
	if (category) {
		conditions.push(eq(schema.parts.category, category));
	}
	if (lowStock) {
		conditions.push(
			lte(schema.parts.stockQuantity, schema.parts.safetyStock)
		);
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;
	const offset = (page - 1) * pageSize;

	const items = await db
		.select()
		.from(schema.parts)
		.where(where)
		.orderBy(desc(schema.parts.stockQuantity))
		.limit(pageSize)
		.offset(offset);

	const totalResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(schema.parts)
		.where(where);

	const total = Number(totalResult[0]?.count ?? 0);

	return { items, total };
}

export async function getLowStockParts() {
	return await db
		.select()
		.from(schema.parts)
		.where(
			lte(schema.parts.stockQuantity, schema.parts.safetyStock)
		)
		.orderBy(schema.parts.stockQuantity);
}

export async function createPart(
	input: z.infer<typeof CreatePartSchema>,
	user: AuthUser
) {
	if (user.role !== 'PARTS' && user.role !== 'MANAGER') {
		throw new Error('权限不足');
	}

	const existing = await db.query.parts.findFirst({
		where: eq(schema.parts.sku, input.sku)
	});

	if (existing) {
		throw new Error('SKU 已存在');
	}

	const [part] = await db
		.insert(schema.parts)
		.values({
			sku: input.sku,
			name: input.name,
			category: input.category,
			stockQuantity: input.stockQuantity,
			safetyStock: input.safetyStock,
			unitPrice: String(input.unitPrice),
			unit: input.unit
		})
		.returning();

	return part;
}

export async function updatePart(
	input: z.infer<typeof UpdatePartSchema>,
	user: AuthUser
) {
	if (user.role !== 'PARTS' && user.role !== 'MANAGER') {
		throw new Error('权限不足');
	}

	const existing = await db.query.parts.findFirst({
		where: eq(schema.parts.id, input.id)
	});

	if (!existing) {
		throw new Error('配件不存在');
	}

	const updateData: Partial<typeof existing> = {};

	if (input.name !== undefined) updateData.name = input.name;
	if (input.category !== undefined) updateData.category = input.category;
	if (input.stockQuantity !== undefined) updateData.stockQuantity = input.stockQuantity;
	if (input.safetyStock !== undefined) updateData.safetyStock = input.safetyStock;
	if (input.unitPrice !== undefined) updateData.unitPrice = String(input.unitPrice);
	if (input.unit !== undefined) updateData.unit = input.unit;

	const [updated] = await db
		.update(schema.parts)
		.set(updateData)
		.where(eq(schema.parts.id, input.id))
		.returning();

	return updated;
}

export async function createMovement(
	input: z.infer<typeof MovementSchema>,
	user: AuthUser
) {
	if (user.role !== 'PARTS' && user.role !== 'MANAGER') {
		throw new Error('权限不足');
	}

	return await db.transaction(async (tx) => {
		const part = await tx.query.parts.findFirst({
			where: eq(schema.parts.id, input.partId)
		});

		if (!part) {
			throw new Error('配件不存在');
		}

		let newQuantity = part.stockQuantity;
		if (input.type === 'IN') {
			newQuantity += input.quantity;
		} else if (input.type === 'OUT') {
			if (part.stockQuantity < input.quantity) {
				throw new Error('库存不足');
			}
			newQuantity -= input.quantity;
		} else if (input.type === 'ADJUST') {
			newQuantity = input.quantity;
		}

		await tx
			.update(schema.parts)
			.set({ stockQuantity: newQuantity })
			.where(eq(schema.parts.id, input.partId));

		const [movement] = await tx
			.insert(schema.partMovements)
			.values({
				partId: input.partId,
				workOrderId: input.workOrderId,
				type: input.type,
				quantity: input.quantity,
				source: input.source,
				remark: input.remark
			})
			.returning();

		return movement;
	});
}

export async function batchOut(
	input: z.infer<typeof BatchOutSchema>,
	user: AuthUser
) {
	if (user.role !== 'PARTS' && user.role !== 'MANAGER') {
		throw new Error('权限不足');
	}

	return await db.transaction(async (tx) => {
		for (const item of input.items) {
			const part = await tx.query.parts.findFirst({
				where: eq(schema.parts.id, item.partId)
			});

			if (!part) {
				throw new Error(`配件 ${item.partId} 不存在`);
			}

			if (part.stockQuantity < item.quantity) {
				throw new Error(`配件 ${part.name} 库存不足`);
			}

			const newQuantity = part.stockQuantity - item.quantity;

			await tx
				.update(schema.parts)
				.set({ stockQuantity: newQuantity })
				.where(eq(schema.parts.id, item.partId));

			await tx.insert(schema.partMovements).values({
				partId: item.partId,
				workOrderId: item.workOrderId,
				type: 'OUT',
				quantity: item.quantity,
				source: '工单领用'
			});
		}
	});
}

export async function getPartMovements(partId: string) {
	return await db
		.select()
		.from(schema.partMovements)
		.where(eq(schema.partMovements.partId, partId))
		.orderBy(desc(schema.partMovements.createdAt));
}
