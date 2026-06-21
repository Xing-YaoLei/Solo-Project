<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import { trpc } from '$lib/trpc/client';

	interface AcceptancePhoto {
		id: string;
		projectId: string;
		projectName: string;
		code: string;
		title: string;
		stage: string;
		status: string;
		accepted: boolean;
		photoCount: number;
		inspectedByName: string;
		createdAt: string;
	}

	let viewMode: 'list' | 'grid' = 'list';
	let searchQuery = '';
	let projectFilter = '';
	let statusFilter = '';
	let currentPage = 1;
	let selectedRows = new Set<string>();
	let sortKey = 'createdAt';
	let sortOrder: 'asc' | 'desc' = 'desc';

	const projects = [
		{ id: '1', name: '阳光花园别墅装修' },
		{ id: '2', name: '万达广场商铺装修' }
	];

	const mockPhotos: AcceptancePhoto[] = [
		{
			id: '1',
			projectId: '1',
			projectName: '阳光花园别墅装修',
			code: 'AP-2024-001',
			title: '水电工程验收',
			stage: '水电阶段',
			status: 'completed',
			accepted: true,
			photoCount: 12,
			inspectedByName: '张三',
			createdAt: '2024-02-15'
		},
		{
			id: '2',
			projectId: '1',
			projectName: '阳光花园别墅装修',
			code: 'AP-2024-002',
			title: '防水工程验收',
			stage: '防水阶段',
			status: 'pending',
			accepted: false,
			photoCount: 8,
			inspectedByName: '',
			createdAt: '2024-02-18'
		},
		{
			id: '3',
			projectId: '2',
			projectName: '万达广场商铺装修',
			code: 'AP-2024-003',
			title: '隐蔽工程验收',
			stage: '隐蔽工程',
			status: 'processing',
			accepted: false,
			photoCount: 15,
			inspectedByName: '李四',
			createdAt: '2024-02-20'
		},
		{
			id: '4',
			projectId: '1',
			projectName: '阳光花园别墅装修',
			code: 'AP-2024-004',
			title: '泥木工程验收',
			stage: '泥木阶段',
			status: 'completed',
			accepted: true,
			photoCount: 20,
			inspectedByName: '王五',
			createdAt: '2024-02-22'
		},
		{
			id: '5',
			projectId: '2',
			projectName: '万达广场商铺装修',
			code: 'AP-2024-005',
			title: '墙面基层验收',
			stage: '墙面阶段',
			status: 'rejected',
			accepted: false,
			photoCount: 6,
			inspectedByName: '张三',
			createdAt: '2024-02-25'
		}
	];

	const filteredPhotos = $derived(mockPhotos.filter((p) => {
		const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.code.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesProject = !projectFilter || p.projectId === projectFilter;
		const matchesStatus = !statusFilter || p.status === statusFilter;
		return matchesSearch && matchesProject && matchesStatus;
	}));

	const sortedPhotos = $derived([...filteredPhotos].sort((a, b) => {
		const aVal = a[sortKey as keyof AcceptancePhoto];
		const bVal = b[sortKey as keyof AcceptancePhoto];
		if (typeof aVal === 'string' && typeof bVal === 'string') {
			return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
		}
		return 0;
	}));

	const totalItems = $derived(sortedPhotos.length);
	const totalPages = $derived(Math.ceil(totalItems / 12));
	const paginatedPhotos = $derived(sortedPhotos.slice((currentPage - 1) * 12, currentPage * 12));

	const columns = [
		{ key: 'code', label: '编号', sortable: true, width: '120px' },
		{ key: 'projectName', label: '项目', sortable: true },
		{ key: 'title', label: '标题', sortable: true },
		{ key: 'stage', label: '阶段', sortable: true },
		{
			key: 'status',
			label: '状态',
			sortable: true,
			render: (item: AcceptancePhoto) => `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(item.status)}">${getStatusLabel(item.status)}</span>`
		},
		{ key: 'photoCount', label: '照片数', sortable: true },
		{ key: 'inspectedByName', label: '验收人', sortable: true },
		{ key: 'createdAt', label: '创建时间', sortable: true }
	];

	function getStatusClass(status: string) {
		switch (status) {
			case 'pending': return 'bg-yellow-100 text-yellow-800';
			case 'processing': return 'bg-blue-100 text-blue-800';
			case 'completed': return 'bg-green-100 text-green-800';
			case 'rejected': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusLabel(status: string) {
		switch (status) {
			case 'pending': return '待验收';
			case 'processing': return '验收中';
			case 'completed': return '已通过';
			case 'rejected': return '已驳回';
			default: return status;
		}
	}

	function handleSort(key: string, order: 'asc' | 'desc') {
		sortKey = key;
		sortOrder = order;
	}

	function handleSelectionChange(selected: Set<string>) {
		selectedRows = selected;
	}

	async function handleExport() {
		try {
			const result = await trpc.common.exportData.query({
				type: 'acceptance_photo',
				filters: { project: projectFilter, status: statusFilter }
			});
			
			const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' });
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = result.fileName;
			link.click();
		} catch (e) {
			console.error('Export failed:', e);
		}
	}

	async function handleBatchExport() {
		if (selectedRows.size === 0) {
			alert('请先选择要导出的记录');
			return;
		}
		await handleExport();
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">验收照片管理</h1>
			<p class="mt-1 text-sm text-gray-500">管理各阶段验收照片记录</p>
		</div>
		<div class="flex gap-3">
			{#if selectedRows.size > 0}
				<span class="text-sm text-gray-600 self-center">已选择 {selectedRows.size} 条</span>
				<button
					type="button"
					class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
					onclick={handleBatchExport}
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
					</svg>
					批量导出
				</button>
			{/if}
			<button
				type="button"
				class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
				onclick={handleExport}
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
				</svg>
				导出
			</button>
		</div>
	</div>

	<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="flex flex-wrap items-center gap-4 flex-1">
				<div class="relative flex-1 min-w-[200px] max-w-md">
					<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
						<svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="搜索编号、标题..."
						class="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500"
					/>
				</div>
				<select
					bind:value={projectFilter}
					class="rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
				>
					<option value="">全部项目</option>
					{#each projects as project}
						<option value={project.id}>{project.name}</option>
					{/each}
				</select>
				<select
					bind:value={statusFilter}
					class="rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
				>
					<option value="">全部状态</option>
					<option value="pending">待验收</option>
					<option value="processing">验收中</option>
					<option value="completed">已通过</option>
					<option value="rejected">已驳回</option>
				</select>
			</div>

			<div class="flex rounded-lg border border-gray-300 overflow-hidden">
				<button
					type="button"
					class="px-3 py-2 text-sm font-medium {viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}"
					onclick={() => (viewMode = 'list')}
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0Z" />
					</svg>
				</button>
				<button
					type="button"
					class="px-3 py-2 text-sm font-medium {viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}"
					onclick={() => (viewMode = 'grid')}
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6ZM13.5 6a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25ZM13.5 15.75a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25h-2.25A2.25 2.25 0 0113.5 18v-2.25Z" />
					</svg>
				</button>
			</div>
		</div>
	</div>

	{#if viewMode === 'list'}
		<DataTable
			data={paginatedPhotos}
			columns={columns}
			selectable={true}
			selectedRows={selectedRows}
			onSelectionChange={handleSelectionChange}
			sortKey={sortKey}
			sortOrder={sortOrder}
			onSort={handleSort}
			currentPage={currentPage}
			totalPages={totalPages}
			totalItems={totalItems}
			onPageChange={(p) => (currentPage = p)}
		/>
	{:else}
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each paginatedPhotos as photo}
				<div class="relative rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5 overflow-hidden hover:shadow-md transition-shadow">
					<div class="relative aspect-video bg-gray-200">
						<div class="absolute inset-0 flex items-center justify-center">
							<svg class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008H12V8.25Z" />
							</svg>
						</div>
						<div class="absolute top-2 left-2">
							<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusClass(photo.status)}">
								{getStatusLabel(photo.status)}
							</span>
						</div>
						<div class="absolute top-2 right-2">
							<input
								type="checkbox"
								class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
								checked={selectedRows.has(photo.id)}
								onchange={(e) => {
									const newSelected = new Set(selectedRows);
									if ((e.target as HTMLInputElement).checked) {
										newSelected.add(photo.id);
									} else {
										newSelected.delete(photo.id);
									}
									handleSelectionChange(newSelected);
								}}
							/>
						</div>
						<div class="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
							{photo.photoCount} 张
						</div>
					</div>
					<div class="p-4">
						<h3 class="font-medium text-gray-900 line-clamp-1">{photo.title}</h3>
						<p class="mt-1 text-xs text-gray-500">{photo.code} · {photo.stage}</p>
						<p class="mt-1 text-xs text-gray-500 line-clamp-1">{photo.projectName}</p>
						<p class="mt-2 text-xs text-gray-400">{photo.createdAt}</p>
					</div>
				</div>
			{/each}
		</div>

		{#if totalPages > 1}
			<div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 rounded-lg shadow-sm ring-1 ring-gray-900/5">
				<div>
					<p class="text-sm text-gray-700">
						共 <span class="font-medium">{totalItems}</span> 条，第
						<span class="font-medium">{currentPage}</span> / {totalPages} 页
					</p>
				</div>
				<div class="flex gap-2">
					<button
						type="button"
						class="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
						disabled={currentPage <= 1}
						onclick={() => (currentPage = currentPage - 1)}
					>
						上一页
					</button>
					<button
						type="button"
						class="relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
						disabled={currentPage >= totalPages}
						onclick={() => (currentPage = currentPage + 1)}
					>
						下一页
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>
