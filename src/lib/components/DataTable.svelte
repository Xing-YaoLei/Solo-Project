<script lang="ts">
	interface Column<T> {
		key: keyof T | string;
		label: string;
		sortable?: boolean;
		render?: (item: T) => string;
		width?: string;
	}

	let {
		data,
		columns,
		selectable = false,
		selectedRows = new Set<string>(),
		onRowClick,
		onSelectionChange,
		sortKey,
		sortOrder = 'asc',
		onSort,
		currentPage = 1,
		totalPages = 1,
		totalItems = 0,
		pageSize = 10,
		onPageChange,
		rowKey = 'id'
	}: {
		data: T[];
		columns: Column<T>[];
		selectable?: boolean;
		selectedRows?: Set<string>;
		onRowClick?: (item: T) => void;
		onSelectionChange?: (selected: Set<string>) => void;
		sortKey?: string;
		sortOrder?: 'asc' | 'desc';
		onSort?: (key: string, order: 'asc' | 'desc') => void;
		currentPage?: number;
		totalPages?: number;
		totalItems?: number;
		pageSize?: number;
		onPageChange?: (page: number) => void;
		rowKey?: keyof T;
	} = $props();

	function toggleSelectAll() {
		if (!selectable || !onSelectionChange) return;
		const newSelected = new Set(selectedRows);
		const allSelected = data.every((item) => newSelected.has(String(item[rowKey])));
		if (allSelected) {
			data.forEach((item) => newSelected.delete(String(item[rowKey])));
		} else {
			data.forEach((item) => newSelected.add(String(item[rowKey])));
		}
		onSelectionChange(newSelected);
	}

	function toggleSelect(item: T) {
		if (!selectable || !onSelectionChange) return;
		const newSelected = new Set(selectedRows);
		const key = String(item[rowKey]);
		if (newSelected.has(key)) {
			newSelected.delete(key);
		} else {
			newSelected.add(key);
		}
		onSelectionChange(newSelected);
	}

	function handleSort(column: Column<T>) {
		if (!column.sortable || !onSort) return;
		const key = String(column.key);
		const newOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
		onSort(key, newOrder);
	}

	function getValue<T>(item: T, key: keyof T | string) {
		if (typeof key === 'string' && key in item) {
			return item[key as keyof T];
		}
		return item[key as keyof T];
	}

	const allSelected = $derived(data.length > 0 && data.every((item) => selectedRows.has(String(item[rowKey]))));
	const someSelected = $derived(data.some((item) => selectedRows.has(String(item[rowKey]))));
</script>

<div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
	<table class="min-w-full divide-y divide-gray-300">
		<thead class="bg-gray-50">
			<tr>
				{#if selectable}
					<th class="relative w-12 px-3 py-3.5">
						<input
							type="checkbox"
							class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
							checked={allSelected}
							indeterminate={someSelected && !allSelected}
							onchange={toggleSelectAll}
						/>
					</th>
				{/if}
				{#each columns as column}
					<th
						class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 {column.sortable
							? 'cursor-pointer hover:bg-gray-100'
							: ''}"
						style={column.width ? `width: ${column.width}` : ''}
						onclick={() => handleSort(column)}
					>
						<div class="flex items-center gap-1">
							{column.label}
							{#if column.sortable && sortKey === column.key}
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
									{#if sortOrder === 'asc'}
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
									{:else}
										<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
									{/if}
								</svg>
							{/if}
						</div>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white">
			{#if data.length === 0}
				<tr>
					<td
						colspan={columns.length + (selectable ? 1 : 0)}
						class="px-3 py-12 text-center text-sm text-gray-500"
					>
						暂无数据
					</td>
				</tr>
			{:else}
				{#each data as item (String(item[rowKey]))}
					<tr
						class="hover:bg-gray-50 cursor-pointer transition-colors {selectedRows.has(String(item[rowKey]))
							? 'bg-primary-50'
							: ''}"
						onclick={() => onRowClick?.(item)}
					>
						{#if selectable}
							<td class="relative w-12 px-3 py-3" onclick={(e) => e.stopPropagation()}>
								<input
									type="checkbox"
									class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
									checked={selectedRows.has(String(item[rowKey]))}
									onchange={() => toggleSelect(item)}
								/>
							</td>
						{/if}
						{#each columns as column}
							<td class="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
								{#if column.render}
									{@html column.render(item)}
								{:else}
									{getValue(item, column.key)}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>

	{#if totalPages > 1}
		<div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
			<div class="flex flex-1 justify-between sm:hidden">
				<button
					type="button"
					class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={currentPage <= 1}
					onclick={() => onPageChange?.(currentPage - 1)}
				>
					上一页
				</button>
				<button
					type="button"
					class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={currentPage >= totalPages}
					onclick={() => onPageChange?.(currentPage + 1)}
				>
					下一页
				</button>
			</div>
			<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
				<div>
					<p class="text-sm text-gray-700">
						共 <span class="font-medium">{totalItems}</span> 条，第
						<span class="font-medium">{currentPage}</span> / {totalPages} 页
					</p>
				</div>
				<div>
					<nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
						<button
							type="button"
							class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={currentPage <= 1}
							onclick={() => onPageChange?.(currentPage - 1)}
						>
							<span class="sr-only">上一页</span>
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path
									fill-rule="evenodd"
									d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
						{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1) as page}
							{@const pageNum = page + Math.max(0, currentPage - 3)}
							{#if pageNum <= totalPages}
								<button
									type="button"
									class="relative inline-flex items-center px-4 py-2 text-sm font-semibold {pageNum === currentPage
										? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
										: 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}"
									onclick={() => onPageChange?.(pageNum)}
								>
									{pageNum}
								</button>
							{/if}
						{/each}
						<button
							type="button"
							class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={currentPage >= totalPages}
							onclick={() => onPageChange?.(currentPage + 1)}
						>
							<span class="sr-only">下一页</span>
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path
									fill-rule="evenodd"
									d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
					</nav>
				</div>
			</div>
		</div>
	{/if}
</div>
