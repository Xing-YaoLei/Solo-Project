import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { AttachmentUploadMetaSchema, uploadAttachments } from '$lib/server/services/attachmentService';
import type { AuthUser } from '$lib/trpc/server';

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) {
		throw error(401, '未登录');
	}

	const user = event.locals.user as AuthUser;

	const formData = await event.request.formData();

	const metaStr = formData.get('meta');
	if (!metaStr || typeof metaStr !== 'string') {
		throw error(400, '缺少 meta 字段');
	}

	let meta: z.infer<typeof AttachmentUploadMetaSchema>;
	try {
		meta = AttachmentUploadMetaSchema.parse(JSON.parse(metaStr));
	} catch (e) {
		throw error(400, 'meta 格式错误');
	}

	const files: File[] = [];
	for (const [key, value] of formData.entries()) {
		if (key === 'files' && value instanceof File) {
			files.push(value);
		}
	}

	if (files.length === 0) {
		throw error(400, '没有上传文件');
	}

	try {
		const attachments = await uploadAttachments(meta, files, user);
		return json(attachments);
	} catch (e) {
		console.error('上传附件错误:', e);
		throw error(500, e instanceof Error ? e.message : '上传失败');
	}
};
