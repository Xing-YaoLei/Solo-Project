import { writable, derived, type Writable } from 'svelte/store';
import type { User } from '$lib/types';
import { browser } from '$app/environment';

interface AuthStore extends Writable<User | null> {
	logout: () => void;
}

function createAuthStore(): AuthStore {
	const stored = browser ? localStorage.getItem('user') : null;
	const initial = stored ? (JSON.parse(stored) as User | null) : null;

	const { subscribe, set, update } = writable<User | null>(initial);

	function persistSet(user: User | null) {
		if (browser) {
			if (user) {
				localStorage.setItem('user', JSON.stringify(user));
			} else {
				localStorage.removeItem('user');
			}
		}
		set(user);
	}

	return {
		subscribe,
		set: persistSet,
		update,
		logout: () => {
			if (browser) localStorage.removeItem('user');
			set(null);
		}
	};
}

export const currentUser = createAuthStore();
export const isManager = derived(currentUser, (u) => u?.role === 'manager');
export const isAuthenticated = derived(currentUser, (u) => u !== null);
