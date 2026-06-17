import { createTRPCHandle } from 'trpc-sveltekit';
import { appRouter } from '$server/trpc/root';
import { createContext } from '$server/trpc';

export const handleTRPC = createTRPCHandle({
	router: appRouter,
	createContext,
	onError: ({ error }) => {
		console.error('tRPC Error:', error);
	}
});
