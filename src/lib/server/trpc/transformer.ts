import superjson from 'superjson';
import type { TransformerOptions } from 'unctx';

export const transformer = {
	input: superjson,
	output: superjson
} as const;
