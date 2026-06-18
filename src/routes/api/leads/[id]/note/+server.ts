import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/utils/apiHelper';
import { getLeadById, updateNoShowNote } from '$lib/server/repositories/leadRepository';

export const POST: RequestHandler = async (event) => {
	const user = requireAuth(event);
	const leadId = event.params.id ?? '';

	try {
		const body = await event.request.json();
		const note = String(body?.note ?? '');

		if (!note || note.trim().length === 0) {
			return json({ error: '注释内容不能为空' }, { status: 400 });
		}

		const lead = getLeadById(leadId);
		if (!lead) {
			return json({ error: '线索不存在' }, { status: 404 });
		}

		if (user.role === 'sales' && lead.salespersonId !== user.id) {
			return json({ error: '无权限修改此线索' }, { status: 403 });
		}

		const trimmedNote = note.trim();
		updateNoShowNote(leadId, trimmedNote);

		return json({ success: true, lead: getLeadById(leadId) });
	} catch (e) {
		return json({ error: '更新失败' }, { status: 500 });
	}
};
