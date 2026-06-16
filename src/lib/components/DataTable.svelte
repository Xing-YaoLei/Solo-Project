<script lang="ts" context="module">
	import type { ComponentType } from 'svelte';

	export interface Column<T = unknown> {
		key: keyof T | string;
		title: string;
		width?: string;
		className?: string;
		render?: (item: T, index: number) => string | number | null | undefined;
		component?: ComponentType;
		componentProps?: (item: T, index: number) => Record<string, unknown>;
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import EmptyState from './EmptyState.svelte';
	import { Loader2 } from 'lucide-svelte';

	type ItemType = unknown;

	export let columns: Column<ItemType>[] = [];
	export let data: ItemType[] = [];
	export let loading = false;
	export let emptyTitle = '暂无数据';
	export let emptyDescription = '';
	export let rowKey: string | undefined = undefined;
	export let className = '';
	export let onRowClick: ((item: ItemType, index: number) => void) | undefined = undefined;

	function handleRowClick(item: ItemType, index: number) {
		onRowClick?.(item, index);
	}

	function getKeyValue(item: ItemType, key: string): unknown {
		const keys = key.split('.');
		let value: unknown = item;
		for (const k of keys) {
			if (value && typeof value === 'object' && k in value) {
				value = (value as Record<string, unknown>)[k];
			} else {
				return undefined;
			}
		}
		return value;
	}

	function getCellContent(item: ItemType, column: Column<ItemType>, index: number): string | number | null | undefined {
		if (column.render) {
			return column.render(item, index);
		}
		const value = getKeyValue(item, column.key as string);
		if (value instanceof Date) {
			return value.toLocaleDateString('zh-CN');
		}
		return value as string | number | null | undefined;
	}

	function getRowKey(item: ItemType, index: number): string | number {
		if (!rowKey) return index;
		const value = getKeyValue(item, rowKey);
		return value !== undefined && value !== null ? String(value) : index;
	}
</script>

<div class={cn('card overflow-hidden', className)}>
	<div class="overflow-x-auto">
		<table class="w-full">
			<thead>
				<tr class="bg-gray-50 border-b border-gray-100">
					{#each columns as column}
						<th
							class={cn(
								'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider',
								column.className
							)}
							style={column.width ? `width: ${column.width}` : undefined}
						>
							{column.title}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#if loading}
					<tr>
						<td colspan={columns.length || 1} class="px-4 py-16">
							<div class="flex flex-col items-center justify-center gap-3">
								<Loader2 class="w-8 h-8 text-primary-500 animate-spin" />
								<p class="text-sm text-gray-500">加载中...</p>
							</div>
						</td>
					</tr>
				{:else if data.length === 0}
					<tr>
						<td colspan={columns.length || 1} class="px-4 py-8">
							<EmptyState title={emptyTitle} description={emptyDescription} />
						</td>
					</tr>
				{:else}
					{#each data as item, index (getRowKey(item, index))}
						<tr
							class={cn(
								'transition-colors duration-150',
								onRowClick && 'hover:bg-primary-50 cursor-pointer'
							)}
							on:click={() => handleRowClick(item, index)}
						>
							{#each columns as column}
								<td class={cn('px-4 py-3 text-sm text-gray-700', column.className)}>
									{#if column.component}
										<svelte:component
											this={column.component}
											{...(column.componentProps ? column.componentProps(item, index) : { item, index })}
										/>
									{:else}
										{getCellContent(item, column, index)}
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
