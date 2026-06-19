import { createCaller } from '$server/trpc/caller';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const caller = await createCaller(event);
	const perms = event.locals.user?.permissions ?? [];

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

	let closureDurationReport = { buckets: [] as Array<{ label: string; count: number; avgHours: number }> };
	let dateReport = { dates: [] as Array<{ date: string; total: number; pending: number; inProgress: number; resolved: number; closed: number }> };
	let assigneeReport = { assignees: [] as Array<{ assigneeId: string | null; assigneeName: string; total: number; pending: number; inProgress: number; resolved: number; closed: number; avgCloseHours: number }> };

	if (perms.includes('report:view')) {
		try {
			[closureDurationReport, dateReport, assigneeReport] = await Promise.all([
				caller.report.byClosureDuration(),
				caller.report.byDate({}),
				caller.report.byAssignee()
			]);
		} catch {
			// ignore report errors on dashboard
		}
	}

	return {
		complaintStats,
		overdueItems,
		closureDurationReport,
		dateReport,
		assigneeReport,
		canViewReport: perms.includes('report:view')
	};
};
