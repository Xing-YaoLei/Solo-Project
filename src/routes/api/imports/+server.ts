import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAuth, requireRole, acceptArrow, arrowResponse } from '$lib/server/utils/apiHelper';
import { listBatches } from '$lib/server/repositories/batchRepository';
import { serializeBatchesToArrow } from '$lib/server/services/arrowService';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	requireRole(event, ['manager']);

	const batches = listBatches(50);

	if (acceptArrow(event)) {
		return arrowResponse(serializeBatchesToArrow(batches));
	}

	return json(batches);
};
