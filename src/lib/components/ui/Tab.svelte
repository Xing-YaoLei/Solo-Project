<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { cn } from '$lib/utils/cn';

	export let value: string = '';

	type TabType = { value: string; label: string };
	export let tabs: TabType[] = [];
	let className: string | undefined = undefined;
	export { className as class };
	export let tabClass: string | undefined = undefined;
	export let contentClass: string | undefined = undefined;

	const dispatch = createEventDispatcher<{
		change: string;
	}>();

	function handleTabChange(tabValue: string) {
		value = tabValue;
		dispatch('change', tabValue);
	}

	$: if (tabs.length > 0 && !value) {
		value = tabs[0].value;
	}
</script>

<div class={cn('w-full', className)}>
	<div
		class="inline-flex h-10 items-center justify-center rounded-lg bg-industrial-800 p-1 text-industrial-400 border border-industrial-700"
		role="tablist"
	>
		{#each tabs as tab}
			<button
				type="button"
				role="tab"
				aria-selected={value === tab.value}
				tabindex={value === tab.value ? 0 : -1}
				on:click={() => handleTabChange(tab.value)}
				on:keydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleTabChange(tab.value);
					}
				}}
				class={cn(
					'inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 outline-none',
					'focus-visible:ring-2 focus-visible:ring-primary-500/50',
					'disabled:pointer-events-none disabled:opacity-50',
					value === tab.value
						? 'bg-primary-600 text-white shadow-industrial'
						: 'text-industrial-400 hover:text-white hover:bg-industrial-700/50',
					tabClass
				)}
			>
				{tab.label}
			</button>
		{/each}
		{#if $$slots.triggers}
			<slot name="triggers" />
		{/if}
	</div>

	<div class={cn('mt-4', contentClass)} role="tabpanel">
		{#if value}
			{@const activeTab = tabs.find((t) => t.value === value)}
			<div
				class="animate-fade-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-industrial-900"
				tabindex={0}
			>
				<slot {activeTab} {value} />
			</div>
		{/if}
		{#if $$slots.contents}
			<slot name="contents" />
		{/if}
	</div>
</div>
