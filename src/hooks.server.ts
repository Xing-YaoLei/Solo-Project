import type { Handle } from '@sveltejs/kit';
import { initDatabase } from '$lib/server/db';
import { initSchema } from '$lib/server/db/schema';
import db from '$lib/server/db';

let initialized = false;
let initLock: Promise<void> | null = null;

async function ensureInitialized() {
	if (initialized) return;
	if (initLock) return initLock;

	initLock = (async () => {
		await initDatabase();
		initSchema();
		const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
		if (!userCount || userCount.c === 0) {
			const { seedMockData } = await import('$lib/server/services/dataMergeService');
			seedMockData();
		}
		initialized = true;
	})();

	return initLock;
}

export const handle: Handle = async ({ event, resolve }) => {
	await ensureInitialized();

	const userId = event.cookies.get('user_id');
	if (userId) {
		const { findUserById } = await import('$lib/server/repositories/userRepository');
		const user = findUserById(userId);
		if (user) {
			event.locals.user = user;
		}
	}

	return resolve(event);
};
