import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAuth, getScopeFilter, acceptArrow, arrowResponse } from '$lib/server/utils/apiHelper';
import { getTrendData } from '$lib/server/repositories/leadRepository';
import { serializeTrendToArrow } from '$lib/server/services/arrowService';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const scope = getScopeFilter(user);

	const days = Number(event.url.searchParams.get('days') ?? 30);
	const trends = getTrendData(scope.salespersonId, days);

	if (acceptArrow(event)) {
		return arrowResponse(serializeTrendToArrow(trends));
	}

	return json(trends);
};
