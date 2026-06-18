import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAuth, getScopeFilter, acceptArrow, arrowResponse } from '$lib/server/utils/apiHelper';
import { getFeedbackFunnel } from '$lib/server/repositories/leadRepository';
import { serializeFunnelToArrow } from '$lib/server/services/arrowService';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const scope = getScopeFilter(user);
	const funnel = getFeedbackFunnel(scope.salespersonId);

	if (acceptArrow(event)) {
		return arrowResponse(serializeFunnelToArrow(funnel));
	}

	return json(funnel);
};
