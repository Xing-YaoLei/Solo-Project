<script lang="ts">
	import { cn } from '$lib/utils/cn';

	type $$Props = Record<string, unknown>;

	export let value = '';
	export let placeholder = '';
	export let disabled = false;
	export let error: string | undefined = undefined;
	export let id: string | undefined = undefined;
	export let rows = 4;
	export let resize = true;
	let className: string | undefined = undefined;
	export { className as class };
</script>

<div class="w-full">
	<textarea
		{value}
		{placeholder}
		{disabled}
		{id}
		{rows}
		on:input
		on:change
		on:focus
		on:blur
		class={cn(
			'w-full rounded-lg border bg-industrial-900/50 text-sm text-industrial-100 placeholder-industrial-500 transition-all duration-200 px-4 py-3',
			resize ? 'resize-y' : 'resize-none',
			error
				? 'border-danger-500/50 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/30'
				: 'border-industrial-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:bg-industrial-900',
			disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-industrial-600',
			'focus:outline-none min-h-[100px]',
			className
		)}
		{...$$restProps}
	/>
	{#if error}
		<p class="mt-1.5 text-xs text-danger-400">{error}</p>
	{/if}
</div>
