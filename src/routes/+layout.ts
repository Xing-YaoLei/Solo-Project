import '../app.css';
import type { LayoutLoad } from './$types';
import { createClient } from '$lib/trpc/client';

export const load: LayoutLoad = async ({ data, fetch }) => {
	const client = createClient();
	return {
		client,
		user: data?.user ?? null
	};
};
