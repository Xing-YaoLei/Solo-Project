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

	const user = event.locals.user;
	const userPerms: string[] = [];
	let userRoleName = 'unknown';
	if (user) {
		const ctx = await import('$server/trpc/context');
		const c = await ctx.createContext(event);
		if (c.user) {
			userRoleName = c.user.roleName;
			for (const p of c.user.permissions) userPerms.push(p);
		}
	}

	return {
		complaint,
		staff,
		tags,
		userPermissions: userPerms,
		userRoleName
	};
};
