<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { ComponentType, SvelteComponentTyped } from 'svelte';

	type Variant = 'primary' | 'accent' | 'secondary' | 'ghost';
	type Size = 'sm' | 'md';

	type $$Props = Record<string, unknown>;

	export let variant: Variant = 'primary';
	export let size: Size = 'md';
	export let disabled = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let href: string | undefined = undefined;
	export let icon: ComponentType<SvelteComponentTyped> | undefined = undefined;
	export let iconRight: ComponentType<SvelteComponentTyped> | undefined = undefined;
	let className: string | undefined = undefined;
	export { className as class };
	export let loading = false;

	$: baseClasses = cn(
		'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-industrial-900 select-none whitespace-nowrap',
		disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:shadow-lg active:scale-[0.98]',
		sizeClasses,
		variantClasses,
		className
	);

	$: sizeClasses = size === 'sm'
		? 'px-3 py-1.5 text-sm'
		: 'px-4 py-2.5 text-sm';

	$: variantClasses = {
		primary: 'bg-primary-600 text-white hover:bg-primary-500 focus:ring-primary-500/50 shadow-industrial',
		accent: 'bg-accent-500 text-white hover:bg-accent-400 focus:ring-accent-500/50 shadow-industrial',
		secondary: 'bg-industrial-700 text-industrial-100 hover:bg-industrial-600 border border-industrial-600 focus:ring-industrial-500/50',
		ghost: 'bg-transparent text-industrial-300 hover:bg-industrial-800 hover:text-white focus:ring-industrial-600/50'
	}[variant];
</script>

{#if href && !disabled}
	<a {href} class={baseClasses} {...$$restProps}>
		{#if icon}
			<svelte:component this={icon} class={size === 'sm' ? 'w-4 h-4' : 'w-4 h-4'} strokeWidth={2} />
		{/if}
		{#if loading}
			<svg class="animate-spin {size === 'sm' ? 'w-4 h-4' : 'w-4 h-4'}" viewBox="0 0 24 24" fill="none">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
			</svg>
		{/if}
		<slot />
		{#if iconRight}
			<svelte:component this={iconRight} class={size === 'sm' ? 'w-4 h-4' : 'w-4 h-4'} strokeWidth={2} />
		{/if}
	</a>
{:else}
	<button {type} {disabled} class={cn(baseClasses, className)} {...$$restProps}>
		{#if icon}
			<svelte:component this={icon} class={size === 'sm' ? 'w-4 h-4' : 'w-4 h-4'} strokeWidth={2} />
		{/if}
		{#if loading}
			<svg class="animate-spin {size === 'sm' ? 'w-4 h-4' : 'w-4 h-4'}" viewBox="0 0 24 24" fill="none">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
			</svg>
		{/if}
		<slot />
		{#if iconRight}
			<svelte:component this={iconRight} class={size === 'sm' ? 'w-4 h-4' : 'w-4 h-4'} strokeWidth={2} />
		{/if}
	</button>
{/if}
