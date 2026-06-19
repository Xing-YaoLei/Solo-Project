<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { Checkbox } from '.';
	import type { ComponentType, SvelteComponentTyped } from 'svelte';
	import { ChevronUp, ChevronDown } from 'lucide-svelte';

	export type Column<T> = {
		key: keyof T | string;
		title: string;
		width?: string;
		align?: 'left' | 'center' | 'right';
		sortable?: boolean;
		render?: (row: T, index: number) => unknown;
		className?: string;
	};

	export let data: T[] = [];
	export let columns: Column<T>[] = [];
	export let selectable = false;
	export let rowClickable = false;
	export let emptyText = '暂无数据';
	export let selected: Set<string | number> = new Set();
	export let rowKey: keyof T | ((row: T) => string | number) = 'id' as keyof T;
	export let sortKey: string | undefined = undefined;
	export let sortOrder: 'asc' | 'desc' | undefined = undefined;
	export let loading = false;
	export let stripe = true;
	export let compact = false;
	export let hoverable = true;
	export let bordered = true;
	let className: string | undefined = undefined;
	export { className as class };
	export let noWrap = true;

	function getRowKey(row: T, index: number): string | number {
		if (typeof rowKey === 'function') return rowKey(row);
		const val = (row as Record<string, unknown>)[rowKey as string];
		return val !== undefined && val !== null ? (val as string | number) : index;
	}

	$: allSelected = selectable && data.length > 0 && data.every((row, i) => selected.has(getRowKey(row, i)));
	$: someSelected = selectable && data.some((row, i) => selected.has(getRowKey(row, i))) && !allSelected;

	function toggleAll() {
		if (allSelected) {
			selected.clear();
		} else {
			data.forEach((row, i) => selected.add(getRowKey(row, i)));
		}
		selected = new Set(selected);
	}

	function toggleRow(row: T, index: number) {
		const key = getRowKey(row, index);
		if (selected.has(key)) {
			selected.delete(key);
		} else {
			selected.add(key);
		}
		selected = new Set(selected);
	}

	function handleRowClick(row: T, index: number, e: MouseEvent) {
		if (rowClickable) {
			dispatch('rowClick', { row, index, event: e });
		}
	}

	function handleSort(key: string) {
		const col = columns.find((c) => c.key === key);
		if (!col?.sortable) return;
		if (sortKey === key) {
			sortOrder = sortOrder === 'asc' ? 'desc' : sortOrder === 'desc' ? undefined : 'asc';
			if (!sortOrder) sortKey = undefined;
		} else {
			sortKey = key;
			sortOrder = 'asc';
		}
		dispatch('sort', { key, order: sortOrder });
	}

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher<{
		rowClick: { row: T; index: number; event: MouseEvent };
		sort: { key: string; order: 'asc' | 'desc' | undefined };
		selectionChange: Set<string | number>;
	}>();

	$: dispatch('selectionChange', selected);

	function getCellValue(row: T, col: Column<T>): unknown {
		const key = String(col.key);
		return (row as Record<string, unknown>)[key];
	}
</script>

<div class={cn('w-full overflow-hidden rounded-xl bg-industrial-800', bordered && 'border border-industrial-700', className)}>
	<div class="overflow-x-auto">
		<table class="w-full border-collapse">
			<thead>
				<tr class="bg-industrial-900/60 border-b border-industrial-700">
					{#if selectable}
						<th class="w-12 px-4 py-3 text-left">
							<Checkbox
								checked={allSelected}
								indeterminate={someSelected}
								on:change={toggleAll}
							/>
						</th>
					{/if}
					{#each columns as col}
						<th
							class={cn(
								'px-4 text-xs font-semibold uppercase tracking-wider text-industrial-400',
								compact ? 'py-2.5' : 'py-3.5',
								col.align === 'center' && 'text-center',
								col.align === 'right' && 'text-right',
								col.className,
								col.sortable && 'cursor-pointer select-none hover:text-industrial-200 transition-colors'
							)}
							style={col.width ? `width: ${col.width}; min-width: ${col.width}` : undefined}
							on:click={() => handleSort(String(col.key))}
						>
							<div class={cn(
								'inline-flex items-center gap-1',
								col.align === 'center' && 'justify-center w-full',
								col.align === 'right' && 'justify-end w-full'
							)}>
								{col.title}
								{#if col.sortable}
									<span class="relative w-3 h-3">
										<ChevronUp
											class={cn(
												'absolute -top-1 left-0 w-3 h-3 transition-colors',
												sortKey === col.key && sortOrder === 'asc' ? 'text-primary-400' : 'text-industrial-600'
											)}
										/>
										<ChevronDown
											class={cn(
												'absolute top-0.5 left-0 w-3 h-3 transition-colors',
												sortKey === col.key && sortOrder === 'desc' ? 'text-primary-400' : 'text-industrial-600'
											)}
										/>
									</span>
								{/if}
							</div>
						</th>
					{/each}
					{#if $$slots.actions}
						<th class="px-4 text-xs font-semibold uppercase tracking-wider text-industrial-400 text-right w-28">
							操作
						</th>
					{/if}
				</tr>
			</thead>
			<tbody class="divide-y divide-industrial-700/60">
				{#if loading}
					<tr>
						<td
							colspan={columns.length + (selectable ? 1 : 0) + ($$slots.actions ? 1 : 0)}
							class="px-4 py-12 text-center"
						>
							<div class="flex flex-col items-center gap-3">
								<svg class="animate-spin w-8 h-8 text-primary-400" viewBox="0 0 24 24" fill="none">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
								</svg>
								<span class="text-sm text-industrial-400">加载中...</span>
							</div>
						</td>
					</tr>
				{:else if data.length === 0}
					<tr>
						<td
							colspan={columns.length + (selectable ? 1 : 0) + ($$slots.actions ? 1 : 0)}
							class="px-4 py-16 text-center"
						>
							<div class="flex flex-col items-center gap-3">
								<svg class="w-12 h-12 text-industrial-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
									<path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
								</svg>
								<span class="text-sm text-industrial-500">{emptyText}</span>
								{#if $$slots.emptyExtra}
									<div class="mt-1">
										<slot name="emptyExtra" />
									</div>
								{/if}
							</div>
						</td>
					</tr>
				{:else}
					{#each data as row, index}
						{@const key = getRowKey(row, index)}
						<tr
							class={cn(
								'transition-colors duration-150',
								stripe && index % 2 === 1 && 'bg-industrial-800/30',
								hoverable && !selectable && 'hover:bg-industrial-700/30',
								selectable && selected.has(key) && 'bg-primary-600/10',
								(rowClickable || selectable) && 'cursor-pointer'
							)}
							on:click={(e) => handleRowClick(row, index, e)}
						>
							{#if selectable}
								<td class="px-4 py-3" on:click|stopPropagation>
									<Checkbox
										checked={selected.has(key)}
										on:change={() => toggleRow(row, index)}
									/>
								</td>
							{/if}
							{#each columns as col}
								<td
									class={cn(
										'px-4 text-sm text-industrial-200',
										compact ? 'py-2.5' : 'py-3.5',
										noWrap && 'whitespace-nowrap',
										col.align === 'center' && 'text-center',
										col.align === 'right' && 'text-right font-numeric',
										col.className
									)}
								>
									{#if col.render}
										{@const rendered = col.render(row, index)}
										{rendered}
									{:else}
										{getCellValue(row, col)}
									{/if}
								</td>
							{/each}
							{#if $$slots.actions}
								<td class="px-4 py-3 text-right whitespace-nowrap" on:click|stopPropagation>
									<div class="inline-flex items-center gap-1 justify-end">
										<slot name="actions" {row} {index} />
									</div>
								</td>
							{/if}
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
	{#if $$slots.footer}
		<div class="px-4 py-3 border-t border-industrial-700 bg-industrial-900/30">
			<slot name="footer" />
		</div>
	{/if}
</div>
