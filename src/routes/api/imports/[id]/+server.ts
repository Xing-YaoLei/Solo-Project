import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAuth, requireRole } from '$lib/server/utils/apiHelper';
import db from '$lib/server/db';
import { getBatchById } from '$lib/server/repositories/batchRepository';
import { getLeadsByBatchId } from '$lib/server/repositories/leadRepository';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	requireRole(event, ['manager']);

	const batchId = event.params.id ?? '';
	const batch = getBatchById(batchId);
	if (!batch) {
		return json({ error: '批次不存在' }, { status: 404 });
	}

	let records: unknown[] = [];
	if (batch.sourceType === 'finance') {
		records = db
			.prepare('SELECT * FROM finance_approvals WHERE import_batch_id = ? LIMIT 100')
			.all(batchId);
	} else if (batch.sourceType === 'crm') {
		records = db
			.prepare('SELECT * FROM crm_leads WHERE import_batch_id = ? LIMIT 100')
			.all(batchId);
	} else if (batch.sourceType === 'inspection') {
		records = db
			.prepare('SELECT * FROM inspection_reports WHERE import_batch_id = ? LIMIT 100')
			.all(batchId);
	}

	const mergedLeads = getLeadsByBatchId(batchId);

	return json({ batch, records, mergedLeads });
};
