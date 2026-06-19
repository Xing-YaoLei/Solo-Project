import { createCaller } from '$server/trpc/caller';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const caller = await createCaller(event);
	const id = event.params.id;

	const [complaint, staff, tags] = await Promise.all([
		caller.complaint.get({ id }),
		caller.user.listStaff(),
		caller.tag.list({})
	]);

	return {
		complaint,
		staff,
		tags,
		userPermissions: event.locals.user?.permissions ?? [],
		userRoleName: event.locals.user?.roleName ?? 'unknown'
	};
};
