import { json } from '@sveltejs/kit';
import { getOverviewStats } from '$lib/server/analysisService';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const course = url.searchParams.get('course') || undefined;
	const data = await getOverviewStats(course);

	return json({
		success: true,
		data
	});
};
