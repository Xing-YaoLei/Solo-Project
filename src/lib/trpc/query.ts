import { writable, derived } from 'svelte/store';
import { getTrpcClient } from './client';
import type { AnyProcedure, AnyRouter } from '@trpc/server';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '$server/trpc';

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

interface QueryState<TData> {
	data: TData | null;
	isLoading: boolean;
	error: Error | null;
	isFetching: boolean;
}

export function createQuery<TInput, TOutput>(
	path: string,
	getInput: () => TInput | undefined,
	options?: { enabled?: boolean; refetchOnWindowFocus?: boolean }
) {
	const enabled = options?.enabled ?? true;
	const state = writable<QueryState<TOutput>>({
		data: null,
		isLoading: enabled,
		error: null,
		isFetching: false
	});

	async function fetchData(): Promise<TOutput | null> {
		if (!enabled) return null;

		const input = getInput();
		if (input === undefined) return null;

		state.update((s) => ({ ...s, isLoading: true, isFetching: true, error: null }));

		try {
			const trpc = getTrpcClient();
			const keys = path.split('.');
			let procedure: any = trpc;
			for (const key of keys) {
				procedure = procedure[key];
			}

			const data = await procedure.query(input);
			state.set({ data, isLoading: false, error: null, isFetching: false });
			return data;
		} catch (error) {
			state.set({
				data: null,
				isLoading: false,
				error: error as Error,
				isFetching: false
			});
			throw error;
		}
	}

	if (enabled && typeof window !== 'undefined') {
		fetchData();
	}

	async function refetch() {
		return fetchData();
	}

	return {
		...derived(state, (s) => s),
		refetch,
		state
	};
}

export function createMutation<TInput = void, TOutput = unknown>(path: string) {
	const state = writable({
		isLoading: false,
		error: null as Error | null
	});

	async function mutate(input?: TInput): Promise<TOutput> {
		state.set({ isLoading: true, error: null });

		try {
			const trpc = getTrpcClient();
			const keys = path.split('.');
			let procedure: any = trpc;
			for (const key of keys) {
				procedure = procedure[key];
			}

			const data = await procedure.mutate(input);
			state.set({ isLoading: false, error: null });
			return data;
		} catch (error) {
			state.set({ isLoading: false, error: error as Error });
			throw error;
		}
	}

	return {
		...derived(state, (s) => s),
		mutate,
		state
	};
}
