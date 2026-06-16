<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { Inbox } from 'lucide-svelte';
	import type { ComponentType } from 'svelte';

	export let title = '暂无数据';
	export let description = '';
	export let icon: ComponentType = Inbox;
	export let className = '';
</script>

<div class={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
	<div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
		<svelte:component this={icon} class="w-8 h-8 text-gray-400" />
	</div>
	<p class="text-base font-medium text-gray-700 mb-1">{title}</p>
	{#if description}
		<p class="text-sm text-gray-500 max-w-xs">{description}</p>
	{/if}
	{#if $$slots.default}
		<div class="mt-4">
			<slot />
		</div>
	{/if}
</div>
