<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { Check } from 'lucide-svelte';

	export let checked = false;
	export let disabled = false;
	export let id: string | undefined = undefined;
	export let label: string | undefined = undefined;
	export let description: string | undefined = undefined;
	let className: string | undefined = undefined;
	export { className as class };
</script>

<label class={cn('inline-flex items-start gap-3 cursor-pointer select-none group', disabled && 'opacity-50 cursor-not-allowed', className)}>
	<div class="relative flex-shrink-0 mt-0.5">
		<input
			type="checkbox"
			bind:checked
			{disabled}
			{id}
			on:change
			class="peer sr-only"
		/>
		<div
			class={cn(
				'w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center',
				checked
					? 'bg-primary-600 border-primary-500 shadow-industrial'
					: 'bg-industrial-900/50 border-industrial-600 group-hover:border-industrial-500',
				disabled && 'cursor-not-allowed',
				'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-industrial-900 peer-focus-visible:outline-none'
			)}
		>
			<Check
				class={cn(
					'w-3.5 h-3.5 text-white transition-transform duration-200',
					checked ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
				)}
				strokeWidth={3}
			/>
		</div>
	</div>
	{#if label || description || $$slots.default}
		<div class="flex flex-col min-w-0">
			{#if label}
				<span class="text-sm font-medium text-industrial-100">{label}</span>
			{/if}
			{#if $$slots.default}
				<slot />
			{/if}
			{#if description}
				<span class="text-xs text-industrial-400 mt-0.5">{description}</span>
			{/if}
		</div>
	{/if}
</label>
