import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAuth, getScopeFilter } from '$lib/server/utils/apiHelper';
import { getOverviewMetrics, getFunnelData } from '$lib/server/repositories/leadRepository';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const scope = getScopeFilter(user);

	const metrics = getOverviewMetrics(scope.salespersonId);
	const funnel = getFunnelData(scope.salespersonId);

	return json({ metrics, funnel });
};
