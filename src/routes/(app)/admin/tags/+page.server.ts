import { createCaller } from '$server/trpc/caller';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const caller = await createCaller(event);

	const tags = await caller.tag.list({});

	return {
		tags
	};
};
