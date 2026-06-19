<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { ChevronDown } from 'lucide-svelte';

	type $$Props = Record<string, unknown>;

	export let value: string | number | undefined = undefined;
	export let placeholder = '请选择';
	export let disabled = false;
	export let error: string | undefined = undefined;
	export let id: string | undefined = undefined;
	let className: string | undefined = undefined;
	export { className as class };

	type Option = { value: string | number; label: string; disabled?: boolean };
	export let options: Option[] = [];
</script>

<div class="w-full">
	<div class="relative">
		<select
			{value}
			{disabled}
			{id}
			on:change
			on:focus
			on:blur
			class={cn(
				'w-full appearance-none rounded-lg border bg-industrial-900/50 text-sm text-industrial-100 transition-all duration-200 px-4 py-2.5 pr-10',
				error
					? 'border-danger-500/50 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/30'
					: 'border-industrial-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:bg-industrial-900',
				disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-industrial-600',
				'focus:outline-none',
				className
			)}
			{...$$restProps}
		>
			{#if placeholder}
				<option value="" disabled selected={!value}>{placeholder}</option>
			{/if}
			{#each options as opt}
				<option value={opt.value} disabled={opt.disabled}>{opt.label}</option>
			{/each}
		</select>
		<div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-industrial-400">
			<ChevronDown class="w-4 h-4" strokeWidth={2} />
		</div>
	</div>
	{#if error}
		<p class="mt-1.5 text-xs text-danger-400">{error}</p>
	{/if}
</div>
