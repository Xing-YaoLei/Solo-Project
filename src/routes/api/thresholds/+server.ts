import { json } from '@sveltejs/kit';
import { getThresholds, updateThresholds, getThresholdCategories } from '$lib/server/thresholdService';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const thresholds = await getThresholds();
	const categories = await getThresholdCategories();
	return json({
		success: true,
		data: {
			thresholds,
			categories
		}
	});
};

export const PUT: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { configs } = body;

		if (!Array.isArray(configs)) {
			return json({ success: false, message: '参数格式错误' }, { status: 400 });
		}

		await updateThresholds(configs);

		return json({
			success: true,
			message: '阈值配置已更新'
		});
	} catch (error) {
		return json(
			{ success: false, message: error instanceof Error ? error.message : '更新失败' },
			{ status: 500 }
		);
	}
};
