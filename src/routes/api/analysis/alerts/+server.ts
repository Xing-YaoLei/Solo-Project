import { json } from '@sveltejs/kit';
import { getRiskAlerts } from '$lib/server/analysisService';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const course = url.searchParams.get('course') || undefined;
	const data = await getRiskAlerts(course);

	return json({
		success: true,
		data
	});
};
