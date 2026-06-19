<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { ComponentType, SvelteComponentTyped } from 'svelte';

	type Variant = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'secondary';
	type Size = 'sm' | 'md';

	export let variant: Variant = 'secondary';
	export let size: Size = 'md';
	export let dot = false;
	export let icon: ComponentType<SvelteComponentTyped> | undefined = undefined;
	let className: string | undefined = undefined;
	export { className as class };

	$: variantClasses = {
		primary: 'bg-primary-600/20 text-primary-300 border-primary-500/30',
		accent: 'bg-accent-500/20 text-accent-400 border-accent-500/30',
		success: 'bg-success-500/20 text-success-400 border-success-500/30',
		warning: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
		danger: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
		secondary: 'bg-industrial-700/60 text-industrial-300 border-industrial-600'
	}[variant];

	$: dotColor = {
		primary: 'bg-primary-400',
		accent: 'bg-accent-400',
		success: 'bg-success-400',
		warning: 'bg-warning-400',
		danger: 'bg-danger-400',
		secondary: 'bg-industrial-400'
	}[variant];

	$: classes = cn(
		'inline-flex items-center gap-1.5 rounded-full border font-medium',
		size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
		variantClasses,
		className
	);
</script>

<span class={classes}>
	{#if dot}
		<span class={cn('w-1.5 h-1.5 rounded-full', dotColor)} />
	{/if}
	{#if icon}
		<svelte:component this={icon} class={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} strokeWidth={2} />
	{/if}
	<slot />
</span>
