import { json } from '@sveltejs/kit';
import { getParentFeedback } from '$lib/server/analysisService';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const days = parseInt(url.searchParams.get('days') || '30');
	const course = url.searchParams.get('course') || undefined;
	const data = await getParentFeedback(days, course);

	return json({
		success: true,
		data
	});
};
