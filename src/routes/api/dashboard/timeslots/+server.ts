import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAuth, getScopeFilter, acceptArrow, arrowResponse } from '$lib/server/utils/apiHelper';
import { getTimeSlotDistribution } from '$lib/server/repositories/leadRepository';
import { serializeTimeSlotsToArrow } from '$lib/server/services/arrowService';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const scope = getScopeFilter(user);
	const slots = getTimeSlotDistribution(scope.salespersonId);

	if (acceptArrow(event)) {
		return arrowResponse(serializeTimeSlotsToArrow(slots));
	}

	return json(slots);
};
