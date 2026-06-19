import { createCaller } from '$server/trpc/caller';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const caller = await createCaller(event);
	const url = event.url;

	const status = url.searchParams.get('status') ?? undefined;
	const tagCode = url.searchParams.get('tagCode') ?? undefined;
	const assigneeId = url.searchParams.get('assigneeId') ?? undefined;
	const page = parseInt(url.searchParams.get('page') ?? '1') || 1;

	const [complaints, tags, staff] = await Promise.all([
		caller.complaint.list({ status, tagCode, assigneeId, page }),
		caller.tag.list({}),
		caller.user.listStaff()
	]);

	return {
		complaints,
		tags,
		staff,
		filters: { status: status ?? null, tagCode: tagCode ?? null, assigneeId: assigneeId ?? null, page }
	};
};
