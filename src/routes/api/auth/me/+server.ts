import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/utils/apiHelper';

export const GET: RequestHandler = async (event) => {
	const user = requireAuth(event);
	return json({ user });
};
