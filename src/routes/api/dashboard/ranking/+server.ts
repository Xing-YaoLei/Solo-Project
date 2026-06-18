import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAuth, requireRole, acceptArrow, arrowResponse } from '$lib/server/utils/apiHelper';
import { getSalespersonRanking, getVehicleRanking } from '$lib/server/repositories/leadRepository';
import { serializeRankingToArrow } from '$lib/server/services/arrowService';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	requireRole(event, ['manager']);

	const type = event.url.searchParams.get('type') ?? 'salesperson';
	const limit = Number(event.url.searchParams.get('limit') ?? 10);

	const ranking = type === 'vehicle' ? getVehicleRanking(limit) : getSalespersonRanking(limit);

	if (acceptArrow(event)) {
		return arrowResponse(serializeRankingToArrow(ranking));
	}

	return json(ranking);
};
