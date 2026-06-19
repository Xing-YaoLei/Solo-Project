import { createCaller } from '$server/trpc/caller';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const caller = await createCaller(event);
	const url = event.url;

	const page = parseInt(url.searchParams.get('page') ?? '1') || 1;
	const pageSize = parseInt(url.searchParams.get('pageSize') ?? '20') || 20;

	const [overdueComplaints, staff] = await Promise.all([
		caller.complaint.overdueList({ page, pageSize }),
		caller.user.listStaff()
	]);

	return {
		overdueComplaints,
		staff,
		filters: { page, pageSize }
	};
};
