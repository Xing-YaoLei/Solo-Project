import { json } from '@sveltejs/kit';
import { generateMockData } from '$lib/server/mockData';
import { initDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	try {
		await initDb();
		const created = await generateMockData();

		return json({
			success: true,
			message: created ? '模拟数据生成成功' : '数据已存在，跳过生成',
			data: { created }
		});
	} catch (error) {
		return json(
			{ success: false, message: error instanceof Error ? error.message : '生成失败' },
			{ status: 500 }
		);
	}
};
