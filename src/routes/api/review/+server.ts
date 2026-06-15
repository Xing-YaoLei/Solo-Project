import { json } from '@sveltejs/kit';
import { generateReviewMaterial } from '$lib/server/analysisService';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const period = parseInt(url.searchParams.get('period') || '7');
	const course = url.searchParams.get('course') || undefined;
	const data = await generateReviewMaterial(period, course);

	return json({
		success: true,
		data
	});
};
