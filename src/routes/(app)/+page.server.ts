import { createCaller } from '$server/trpc/caller';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const caller = await createCaller(event);

	const [pendingRes, inProgressRes, overdueRes, closedRes] = await Promise.all([
		caller.complaint.list({ status: 'pending', pageSize: 1 }),
		caller.complaint.list({ status: 'in_progress', pageSize: 1 }),
		caller.complaint.list({ status: 'assigned', pageSize: 1 }),
		caller.complaint.list({ status: 'closed', pageSize: 1 })
	]);

	const complaintStats = {
		pending: pendingRes.total,
		inProgress: inProgressRes.total,
		overdue: overdueRes.total,
		closed: closedRes.total
	};

	const overdueItems = await caller.complaint.overdueList({ pageSize: 5 });

	const [closureDurationReport, dateReport, assigneeReport] = await Promise.all([
		caller.report.byClosureDuration(),
		caller.report.byDate({}),
		caller.report.byAssignee()
	]);

	return {
		complaintStats,
		overdueItems,
		closureDurationReport,
		dateReport,
		assigneeReport
	};
};
