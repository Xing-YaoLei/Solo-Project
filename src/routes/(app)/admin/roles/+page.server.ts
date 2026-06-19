import { createCaller } from '$server/trpc/caller';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const caller = await createCaller(event);

	const [roles, allPermissions] = await Promise.all([
		caller.role.list(),
		caller.role.list()
	]);

	return {
		roles
	};
};
