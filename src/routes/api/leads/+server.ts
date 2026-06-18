import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAuth, getScopeFilter, acceptArrow, arrowResponse } from '$lib/server/utils/apiHelper';
import { queryLeads, countLeads } from '$lib/server/repositories/leadRepository';
import { serializeLeadsToArrow } from '$lib/server/services/arrowService';
import type { LeadStatus } from '$lib/types';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const scope = getScopeFilter(user);

	const status = event.url.searchParams.get('status') as LeadStatus | undefined;
	const limit = Number(event.url.searchParams.get('limit') ?? 200);
	const offset = Number(event.url.searchParams.get('offset') ?? 0);

	const opts = { ...scope, status, limit, offset };
	const leads = queryLeads(opts);
	const total = countLeads(opts);

	if (acceptArrow(event)) {
		return arrowResponse(serializeLeadsToArrow(leads));
	}

	return json({ items: leads, total });
};
