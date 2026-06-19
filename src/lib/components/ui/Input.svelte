<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { ComponentType, SvelteComponentTyped } from 'svelte';

	type $$Props = Record<string, unknown>;

	export let type: HTMLInputElement['type'] = 'text';
	export let value = '';
	export let placeholder = '';
	export let disabled = false;
	export let error: string | undefined = undefined;
	export let id: string | undefined = undefined;
	export let prefixIcon: ComponentType<SvelteComponentTyped> | undefined = undefined;
	export let suffixIcon: ComponentType<SvelteComponentTyped> | undefined = undefined;
	export let numeric = false;
	let className: string | undefined = undefined;
	export { className as class };
</script>

<div class="w-full">
	<div class="relative">
		{#if prefixIcon}
			<div class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-industrial-400">
				<svelte:component this={prefixIcon} class="w-4.5 h-4.5" strokeWidth={2} />
			</div>
		{/if}

		<input
			{type}
			{value}
			{placeholder}
			{disabled}
			{id}
			on:input
			on:change
			on:focus
			on:blur
			class={cn(
				'w-full rounded-lg border bg-industrial-900/50 text-sm text-industrial-100 placeholder-industrial-500 transition-all duration-200',
				'px-4 py-2.5',
				prefixIcon && 'pl-10',
				suffixIcon && 'pr-10',
				numeric && 'font-numeric tabular-nums',
				error
					? 'border-danger-500/50 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/30'
					: 'border-industrial-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:bg-industrial-900',
				disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-industrial-600',
				'focus:outline-none',
				className
			)}
			{...$$restProps}
		/>

		{#if suffixIcon}
			<div class="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-industrial-400">
				<svelte:component this={suffixIcon} class="w-4.5 h-4.5" strokeWidth={2} />
			</div>
		{/if}
	</div>

	{#if error}
		<p class="mt-1.5 text-xs text-danger-400">{error}</p>
	{/if}
</div>
