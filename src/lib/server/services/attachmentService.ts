import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { db, schema } from '../db';
import type { AttachmentCategory } from '../db/schema';
import type { AuthUser } from '$lib/trpc/server';
import fs from 'node:fs';
import path from 'node:path';

export const ListByRefSchema = z.object({
	refType: z.string().min(1).max(32),
	refId: z.string().uuid()
});

export const AttachmentUploadMetaSchema = z.object({
	refType: z.string().min(1).max(32),
	refId: z.string().uuid(),
	category: z
		.enum(schema.attachmentCategory as unknown as [AttachmentCategory, ...AttachmentCategory[]])
		.default('OTHER')
});

export interface UploadedFile {
	name: string;
	size: number;
	type: string;
	filePath: string;
}

const UPLOAD_DIR = path.join(process.cwd(), 'static', 'uploads');

function ensureUploadDir() {
	if (!fs.existsSync(UPLOAD_DIR)) {
		fs.mkdirSync(UPLOAD_DIR, { recursive: true });
	}
}

function generateFileName(originalName: string): string {
	const ext = path.extname(originalName);
	const base = path.basename(originalName, ext);
	const timestamp = Date.now();
	const rand = Math.random().toString(36).substring(2, 8);
	const safeBase = base.replace(/[^a-zA-Z0-9_\-]/g, '_');
	return `${safeBase}_${timestamp}_${rand}${ext}`;
}

export async function saveFileToDisk(file: File): Promise<UploadedFile> {
	ensureUploadDir();
	const fileName = generateFileName(file.name);
	const relativePath = path.join('uploads', fileName);
	const fullPath = path.join(process.cwd(), 'static', relativePath);

	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	fs.writeFileSync(fullPath, buffer);

	return {
		name: file.name,
		size: file.size,
		type: file.type,
		filePath: `/${relativePath.replace(/\\/g, '/')}`
	};
}

export async function uploadAttachments(
	meta: z.infer<typeof AttachmentUploadMetaSchema>,
	files: File[],
	user: AuthUser
) {
	if (files.length === 0) {
		throw new Error('没有上传文件');
	}

	const results: (typeof schema.attachments.$inferSelect)[] = [];

	for (const file of files) {
		const uploaded = await saveFileToDisk(file);

		const [record] = await db
			.insert(schema.attachments)
			.values({
				refType: meta.refType,
				refId: meta.refId,
				fileName: uploaded.name,
				filePath: uploaded.filePath,
				fileSize: uploaded.size,
				mimeType: uploaded.type,
				category: meta.category
			})
			.returning();

		results.push(record);
	}

	return results;
}

export async function listByRef(
	input: z.infer<typeof ListByRefSchema>,
	user: AuthUser
) {
	if (input.refType === 'WORK_ORDER') {
		const wo = await db.query.workOrders.findFirst({
			where: eq(schema.workOrders.id, input.refId)
		});
		if (!wo) {
			throw new Error('工单不存在');
		}
		if (
			user.role === 'ADVISOR' &&
			wo.advisorId !== user.id
		) {
			throw new Error('权限不足');
		}
		if (
			user.role === 'TECHNICIAN' &&
			wo.technicianId !== user.id
		) {
			throw new Error('权限不足');
		}
	} else if (input.refType === 'EXCEPTION') {
		const exc = await db.query.exceptions.findFirst({
			where: eq(schema.exceptions.id, input.refId)
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
	}

	return await db
		.select()
		.from(schema.attachments)
		.where(
			and(
				eq(schema.attachments.refType, input.refType),
				eq(schema.attachments.refId, input.refId)
			)
		)
		.orderBy(desc(schema.attachments.createdAt));
}

export async function deleteAttachment(id: string, user: AuthUser) {
	const att = await db.query.attachments.findFirst({
		where: eq(schema.attachments.id, id)
	});

	if (!att) {
		throw new Error('附件不存在');
	}

	if (user.role !== 'MANAGER') {
		if (att.refType === 'WORK_ORDER') {
			const wo = await db.query.workOrders.findFirst({
				where: eq(schema.workOrders.id, att.refId)
			});
			if (
				!wo ||
				(user.role === 'ADVISOR' && wo.advisorId !== user.id) ||
				(user.role === 'TECHNICIAN' && wo.technicianId !== user.id)
			) {
				throw new Error('权限不足');
			}
		} else if (att.refType === 'EXCEPTION') {
			const exc = await db.query.exceptions.findFirst({
				where: eq(schema.exceptions.id, att.refId)
			});
			if (
				!exc ||
				(exc.creatorId !== user.id && exc.assigneeId !== user.id)
			) {
				throw new Error('权限不足');
			}
		} else {
			throw new Error('权限不足');
		}
	}

	const fullPath = path.join(process.cwd(), 'static', att.filePath);

	await db.delete(schema.attachments).where(eq(schema.attachments.id, id));

	if (fs.existsSync(fullPath)) {
		try {
			fs.unlinkSync(fullPath);
		} catch (e) {
			console.error('删除文件失败:', e);
		}
	}
}
