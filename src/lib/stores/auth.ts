import { writable, derived, type Readable, type Writable } from 'svelte/store';
import type { SessionUser, UserRole } from '$shared/types';

const TOKEN_KEY = 'eldercare_token';
const USER_KEY = 'eldercare_user';

interface AuthState {
	user: SessionUser | null;
	token: string | null;
	loading: boolean;
}

function loadInitialState(): AuthState {
	if (typeof window === 'undefined') {
		return { user: null, token: null, loading: false };
	}
	try {
		const token = localStorage.getItem(TOKEN_KEY);
		const userStr = localStorage.getItem(USER_KEY);
		return {
			user: userStr ? JSON.parse(userStr) : null,
			token,
			loading: false
		};
	} catch {
		return { user: null, token: null, loading: false };
	}
}

function createAuthStore() {
	const { subscribe, set, update }: Writable<AuthState> = writable(loadInitialState());

	return {
		subscribe,
		set(user: SessionUser | null, token?: string | null) {
			if (typeof window !== 'undefined') {
				if (user && token) {
					localStorage.setItem(TOKEN_KEY, token);
					localStorage.setItem(USER_KEY, JSON.stringify(user));
				} else {
					localStorage.removeItem(TOKEN_KEY);
					localStorage.removeItem(USER_KEY);
				}
			}
			set({ user, token: token ?? null, loading: false });
		},
		setUser(user: SessionUser | null) {
			if (typeof window !== 'undefined' && user) {
				localStorage.setItem(USER_KEY, JSON.stringify(user));
			}
			update((state) => ({ ...state, user, loading: false }));
		},
		setToken(token: string | null) {
			if (typeof window !== 'undefined') {
				if (token) localStorage.setItem(TOKEN_KEY, token);
				else localStorage.removeItem(TOKEN_KEY);
			}
			update((state) => ({ ...state, token }));
		},
		setLoading(loading: boolean) {
			update((state) => ({ ...state, loading }));
		},
		logout() {
			if (typeof window !== 'undefined') {
				localStorage.removeItem(TOKEN_KEY);
				localStorage.removeItem(USER_KEY);
			}
			set({ user: null, token: null, loading: false });
		}
	};
}

export const auth = createAuthStore();

export const isAuthenticated: Readable<boolean> = derived(
	auth,
	($auth) => $auth.user !== null
);

export const currentUser: Readable<SessionUser | null> = derived(
	auth,
	($auth) => $auth.user
);

export function hasRole(role: UserRole | UserRole[]): Readable<boolean> {
	return derived(auth, ($auth) => {
		if (!$auth.user) return false;
		const roles = Array.isArray(role) ? role : [role];
		return roles.includes($auth.user.role);
	});
}

export const roleLabelMap: Record<UserRole, string> = {
	admin: '机构管理员',
	supervisor: '护理主管',
	nurse: '护理员',
	doctor: '驻院医生',
	family: '家属联络员'
};
