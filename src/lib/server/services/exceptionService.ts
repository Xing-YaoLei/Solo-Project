import { z } from 'zod';
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import type { ExceptionType, ExceptionStatus } from '../db/schema';
import type { AuthUser } from '$lib/trpc/server';

export const ListExceptionSchema = z.object({
	status: z.array(z.enum(schema.exceptionStatus as unknown as [ExceptionStatus, ...ExceptionStatus[]])).optional(),
	type: z.array(z.enum(schema.exceptionType as unknown as [ExceptionType, ...ExceptionType[]])).optional(),
	assigneeId: z.string().uuid().optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(20)
});

export const CreateExceptionSchema = z.object({
	workOrderId: z.string().uuid().optional(),
	assigneeId: z.string().uuid(),
	type: z.enum(schema.exceptionType as unknown as [ExceptionType, ...ExceptionType[]]),
	title: z.string().min(1).max(200),
	materialSource: z.string().optional()
});

export const AddProcessLogSchema = z.object({
	exceptionId: z.string().uuid(),
	content: z.string().min(1)
});

export const ReviewSchema = z.object({
	id: z.string().uuid(),
	passed: z.boolean(),
	reviewComment: z.string().min(1),
	closeConclusion: z.string().optional()
});

export async function listExceptions(
	input: z.infer<typeof ListExceptionSchema>,
	user: AuthUser
) {
	const { status, type, assigneeId, page, pageSize } = input;
	const conditions = [];

	if (user.role !== 'MANAGER') {
		conditions.push(
			or(
				eq(schema.exceptions.creatorId, user.id),
				eq(schema.exceptions.assigneeId, user.id)
			)
		);
	}

	if (status && status.length > 0) {
		conditions.push(inArray(schema.exceptions.status, status));
	}
	if (type && type.length > 0) {
		conditions.push(inArray(schema.exceptions.type, type));
	}
	if (assigneeId) {
		conditions.push(eq(schema.exceptions.assigneeId, assigneeId));
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;
	const offset = (page - 1) * pageSize;

	const creatorUsers = db.select().from(schema.users).as('creator_users');
	const assigneeUsers = db.select().from(schema.users).as('assignee_users');

	const items = await db
		.select({
			exceptions: schema.exceptions,
			work_orders: schema.workOrders,
			creator: creatorUsers,
			assignee: assigneeUsers
		})
		.from(schema.exceptions)
		.leftJoin(schema.workOrders, eq(schema.exceptions.workOrderId, schema.workOrders.id))
		.leftJoin(creatorUsers, eq(schema.exceptions.creatorId, creatorUsers.id))
		.leftJoin(assigneeUsers, eq(schema.exceptions.assigneeId, assigneeUsers.id))
		.where(where)
		.orderBy(desc(schema.exceptions.createdAt))
		.limit(pageSize)
		.offset(offset);

	const totalResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(schema.exceptions)
		.where(where);

	const total = Number(totalResult[0]?.count ?? 0);

	return { items, total };
}

export async function getException(id: string, user: AuthUser) {
	const result = await db
		.select()
		.from(schema.exceptions)
		.where(eq(schema.exceptions.id, id))
		.leftJoin(schema.workOrders, eq(schema.exceptions.workOrderId, schema.workOrders.id));

	if (result.length === 0) {
		return null;
	}

	const exc = result[0].exceptions;

	if (
		user.role !== 'MANAGER' &&
		exc.creatorId !== user.id &&
		exc.assigneeId !== user.id
	) {
		return null;
	}

	const logs = await db
		.select()
		.from(schema.exceptionLogs)
		.where(eq(schema.exceptionLogs.exceptionId, id))
		.orderBy(desc(schema.exceptionLogs.createdAt));

	const attachments = await db
		.select()
		.from(schema.attachments)
		.where(
			and(
				eq(schema.attachments.refType, 'EXCEPTION'),
				eq(schema.attachments.refId, id)
			)
		)
		.orderBy(desc(schema.attachments.createdAt));

	return {
		...result[0],
		logs,
		attachments
	};
}

export async function createException(
	input: z.infer<typeof CreateExceptionSchema>,
	user: AuthUser
) {
	const [exc] = await db
		.insert(schema.exceptions)
		.values({
			workOrderId: input.workOrderId,
			creatorId: user.id,
			assigneeId: input.assigneeId,
			type: input.type,
			status: 'PENDING',
			title: input.title,
			materialSource: input.materialSource
		})
		.returning();

	return exc;
}

export async function addProcessLog(
	input: z.infer<typeof AddProcessLogSchema>,
	user: AuthUser
) {
	const exc = await db.query.exceptions.findFirst({
		where: eq(schema.exceptions.id, input.exceptionId)
	});

	if (!exc) {
		throw new Error('异常不存在');
	}

	if (
		user.role !== 'MANAGER' &&
		exc.creatorId !== user.id &&
		exc.assigneeId !== user.id
	) {
		throw new Error('权限不足');
	}

	if (exc.status === 'CLOSED') {
		throw new Error('异常已关闭，无法添加处理日志');
	}

	return await db.transaction(async (tx) => {
		if (exc.status === 'PENDING') {
			await tx
				.update(schema.exceptions)
				.set({ status: 'PROCESSING' })
				.where(eq(schema.exceptions.id, input.exceptionId));
		}

		const [log] = await tx
			.insert(schema.exceptionLogs)
			.values({
				exceptionId: input.exceptionId,
				operatorId: user.id,
				content: input.content
			})
			.returning();

		return log;
	});
}

export async function submitForReview(id: string, user: AuthUser) {
	const exc = await db.query.exceptions.findFirst({
		where: eq(schema.exceptions.id, id)
	});

	if (!exc) {
		throw new Error('异常不存在');
	}

	if (
		exc.creatorId !== user.id &&
		exc.assigneeId !== user.id &&
		user.role !== 'MANAGER'
	) {
		throw new Error('权限不足');
	}

	if (exc.status !== 'PROCESSING') {
		throw new Error('当前状态不允许提交复核');
	}

	const [updated] = await db
		.update(schema.exceptions)
		.set({ status: 'REVIEWING' })
		.where(eq(schema.exceptions.id, id))
		.returning();

	return updated;
}

export async function reviewException(
	input: z.infer<typeof ReviewSchema>,
	user: AuthUser
) {
	if (user.role !== 'MANAGER') {
		throw new Error('仅厂长可进行复核操作');
	}

	const exc = await db.query.exceptions.findFirst({
		where: eq(schema.exceptions.id, input.id)
	});

	if (!exc) {
		throw new Error('异常不存在');
	}

	if (exc.status !== 'REVIEWING') {
		throw new Error('当前状态不允许复核');
	}

	return await db.transaction(async (tx) => {
		await tx
			.insert(schema.exceptionLogs)
			.values({
				exceptionId: input.id,
				operatorId: user.id,
				content: `复核${input.passed ? '通过' : '不通过'}：${input.reviewComment}`
			});

		const updateData: Partial<typeof exc> = {};

		if (input.passed) {
			updateData.status = 'CLOSED';
			if (input.closeConclusion) {
				updateData.closeConclusion = input.closeConclusion;
			}
		} else {
			updateData.status = 'PROCESSING';
		}

		const [updated] = await tx
			.update(schema.exceptions)
			.set(updateData)
			.where(eq(schema.exceptions.id, input.id))
			.returning();

		return updated;
	});
}
