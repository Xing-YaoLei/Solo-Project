import { writable, derived, get } from 'svelte/store';
import { trpcClient } from '$lib/trpc/client';
import type { User } from 'lucia';
import { goto } from '$app/navigation';
import { page } from '$app/stores';

interface AuthState {
	user: User | null;
	loading: boolean;
}

const createAuthStore = () => {
	const { subscribe, set, update } = writable<AuthState>({ user: null, loading: true });

	async function init() {
		try {
			const user = await trpcClient.auth.me.query();
			set({ user, loading: false });
		} catch {
			set({ user: null, loading: false });
		}
	}

	async function login(email: string, password: string) {
		update((s) => ({ ...s, loading: true }));
		try {
			await trpcClient.auth.login.mutate({ email, password });
			const user = await trpcClient.auth.me.query();
			set({ user, loading: false });
			return { success: true };
		} catch (e: any) {
			update((s) => ({ ...s, loading: false }));
			return { success: false, error: e?.message ?? '登录失败' };
		}
	}

	async function register(data: { email: string; username: string; password: string; phone?: string }) {
		update((s) => ({ ...s, loading: true }));
		try {
			await trpcClient.auth.register.mutate(data);
			const user = await trpcClient.auth.me.query();
			set({ user, loading: false });
			return { success: true };
		} catch (e: any) {
			update((s) => ({ ...s, loading: false }));
			return { success: false, error: e?.message ?? '注册失败' };
		}
	}

	async function logout() {
		try {
			await trpcClient.auth.logout.mutate();
		} catch {}
		set({ user: null, loading: false });
		goto('/auth/login');
	}

	return {
		subscribe,
		init,
		login,
		register,
		logout
	};
};

export const auth = createAuthStore();
export const isAuthenticated = derived(auth, ($auth) => $auth.user !== null);
