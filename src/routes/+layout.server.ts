import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	return {
		user: event.locals.user
			? {
					id: event.locals.user.id,
					username: event.locals.user.username,
					displayName: event.locals.user.displayName,
					role: event.locals.user.role
				}
			: null
	};
};
