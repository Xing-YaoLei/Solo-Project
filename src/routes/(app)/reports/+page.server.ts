import { createCaller } from '$server/trpc/caller';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const caller = await createCaller(event);
	const url = event.url;

	const startDate = url.searchParams.get('startDate') ?? undefined;
	const endDate = url.searchParams.get('endDate') ?? undefined;

	const [closureDurationReport, dateReport, assigneeReport] = await Promise.all([
		caller.report.byClosureDuration(),
		caller.report.byDate({ startDate, endDate }),
		caller.report.byAssignee()
	]);

	return {
		closureDurationReport,
		dateReport,
		assigneeReport,
		filters: { startDate: startDate ?? null, endDate: endDate ?? null }
	};
};
