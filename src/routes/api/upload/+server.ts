import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const UPLOAD_DIR = path.resolve(process.cwd(), 'static', 'uploads');

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, '请先登录');
	}

	const hasUploadPerm = (locals.user as any).permissions?.includes('complaint:create')
		|| (locals.user as any).permissions?.includes('complaint:supplement');

	if (!hasUploadPerm && !(locals.user as any).roleName) {
		// allow as fallback
	}

	try {
		await fs.mkdir(UPLOAD_DIR, { recursive: true });
	} catch (e) {
		// ignore
	}

	const formData = await request.formData();
	const file = formData.get('file') as File;

	if (!file) {
		throw error(400, '缺少文件');
	}

	if (file.size > 10 * 1024 * 1024) {
		throw error(400, '文件大小超过 10MB 限制');
	}

	const ext = path.extname(file.name) || '.bin';
	const hash = crypto.randomBytes(16).toString('hex');
	const filename = `${Date.now()}_${hash}${ext}`;
	const filepath = path.join(UPLOAD_DIR, filename);

	const buffer = Buffer.from(await file.arrayBuffer());
	await fs.writeFile(filepath, buffer);

	const url = `/uploads/${filename}`;

	return json({
		url,
		fileName: file.name,
		fileType: file.type || 'application/octet-stream',
		size: file.size
	});
};
