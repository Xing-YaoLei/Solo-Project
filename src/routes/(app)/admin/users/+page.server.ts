import { createCaller } from '$server/trpc/caller';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const caller = await createCaller(event);

	const [users, roles] = await Promise.all([
		caller.user.list(),
		caller.role.list()
	]);

	return {
		users,
		roles
	};
};
