import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	return {
		recordId: params.id
	};
};
