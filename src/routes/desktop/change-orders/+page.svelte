<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { trpc } from '$lib/trpc/client';

	interface ChangeOrder {
		id: string;
		projectId: string;
		projectName: string;
		code: string;
		title: string;
		status: string;
		costChange: number;
		timeChangeDays: number;
		createdByName: string;
		createdAt: string;
	}

	let searchQuery = '';
	let projectFilter = '';
	let statusFilter = '';
	let startDate = '';
	let endDate = '';
	let creatorFilter = '';
	let currentPage = 1;
	let sortKey = 'createdAt';
	let sortOrder: 'asc' | 'desc' = 'desc';
	let selectedRows = new Set<string>();
	let detailOpen = false;
	let selectedOrder: ChangeOrder | null = null;
	let showFilters = false;
	let batchStatusModalOpen = false;
	let batchStatus = '';

	const projects = [
		{ id: '1', name: '阳光花园别墅装修' },
		{ id: '2', name: '万达广场商铺装修' },
		{ id: '3', name: '滨江公寓翻新' },
		{ id: '4', name: '科技园办公楼改造' }
	];

	const users = [
		{ id: '1', name: '张三' },
		{ id: '2', name: '李四' },
		{ id: '3', name: '王五' }
	];

	const mockChangeOrders: ChangeOrder[] = [
		{
			id: '1',
			projectId: '1',
			projectName: '阳光花园别墅装修',
			code: 'CO-2024-001',
			title: '客厅吊顶设计变更',
			status: 'processing',
			costChange: 15000,
			timeChangeDays: 3,
			createdByName: '张三',
			createdAt: '2024-02-15'
		},
		{
			id: '2',
			projectId: '1',
			projectName: '阳光花园别墅装修',
			code: 'CO-2024-002',
			title: '卫生间防水方案调整',
			status: 'pending',
			costChange: 8000,
			timeChangeDays: 2,
			createdByName: '李四',
			createdAt: '2024-02-18'
		},
		{
			id: '3',
			projectId: '2',
			projectName: '万达广场商铺装修',
			code: 'CO-2024-003',
			title: '墙面材料升级',
			status: 'approved',
			costChange: 25000,
			timeChangeDays: 0,
			createdByName: '张三',
			createdAt: '2024-02-20'
		},
		{
			id: '4',
			projectId: '3',
			projectName: '滨江公寓翻新',
			code: 'CO-2024-004',
			title: '水电改造方案优化',
			status: 'rejected',
			costChange: 5000,
			timeChangeDays: 5,
			createdByName: '王五',
			createdAt: '2024-02-22'
		},
		{
			id: '5',
			projectId: '4',
			projectName: '科技园办公楼改造',
			code: 'CO-2024-005',
			title: '空调系统设计变更',
			status: 'completed',
			costChange: 50000,
			timeChangeDays: 7,
			createdByName: '李四',
			createdAt: '2024-02-25'
		},
		{
			id: '6',
			projectId: '1',
			projectName: '阳光花园别墅装修',
			code: 'CO-2024-006',
			title: '楼梯设计修改',
			status: 'draft',
			costChange: 30000,
			timeChangeDays: 4,
			createdByName: '张三',
			createdAt: '2024-02-28'
		}
	];

	const filteredOrders = $derived(mockChangeOrders.filter((o) => {
		const matchesSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			o.code.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesProject = !projectFilter || o.projectId === projectFilter;
		const matchesStatus = !statusFilter || o.status === statusFilter;
		const matchesCreator = !creatorFilter || o.createdByName === users.find(u => u.id === creatorFilter)?.name;
		const matchesStartDate = !startDate || o.createdAt >= startDate;
		const matchesEndDate = !endDate || o.createdAt <= endDate;
		return matchesSearch && matchesProject && matchesStatus && matchesCreator && matchesStartDate && matchesEndDate;
	}));

	const sortedOrders = $derived([...filteredOrders].sort((a, b) => {
		const aVal = a[sortKey as keyof ChangeOrder];
		const bVal = b[sortKey as keyof ChangeOrder];
		if (typeof aVal === 'number' && typeof bVal === 'number') {
			return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
		}
		if (typeof aVal === 'string' && typeof bVal === 'string') {
			return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
		}
		return 0;
	}));

	const totalItems = $derived(sortedOrders.length);
	const totalPages = $derived(Math.ceil(totalItems / 10));
	const paginatedOrders = $derived(sortedOrders.slice((currentPage - 1) * 10, currentPage * 10));

	const columns = [
		{ key: 'code', label: '编号', sortable: true, width: '120px' },
		{ key: 'projectName', label: '项目', sortable: true },
		{ key: 'title', label: '标题', sortable: true },
		{
			key: 'costChange',
			label: '费用变更',
			sortable: true,
			render: (item: ChangeOrder) => `<span class="${item.costChange >= 0 ? 'text-red-600' : 'text-green-600'}">${item.costChange >= 0 ? '+' : ''}¥${item.costChange.toLocaleString()}</span>`
		},
		{
			key: 'timeChangeDays',
			label: '工期变更',
			sortable: true,
			render: (item: ChangeOrder) => `<span class="${item.timeChangeDays > 0 ? 'text-red-600' : item.timeChangeDays < 0 ? 'text-green-600' : 'text-gray-600'}">${item.timeChangeDays > 0 ? '+' : ''}${item.timeChangeDays}天</span>`
		},
		{
			key: 'status',
			label: '状态',
			sortable: true,
			render: (item: ChangeOrder) => `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(item.status)}">${getStatusLabel(item.status)}</span>`
		},
		{ key: 'createdByName', label: '创建人', sortable: true },
		{ key: 'createdAt', label: '创建时间', sortable: true }
	];

	function getStatusClass(status: string) {
		switch (status) {
			case 'draft': return 'bg-gray-100 text-gray-800';
			case 'pending': return 'bg-yellow-100 text-yellow-800';
			case 'processing': return 'bg-blue-100 text-blue-800';
			case 'approved': return 'bg-green-100 text-green-800';
			case 'rejected': return 'bg-red-100 text-red-800';
			case 'completed': return 'bg-emerald-100 text-emerald-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusLabel(status: string) {
		switch (status) {
			case 'draft': return '草稿';
			case 'pending': return '待处理';
			case 'processing': return '处理中';
			case 'approved': return '已批准';
			case 'rejected': return '已拒绝';
			case 'completed': return '已完成';
			default: return status;
		}
	}

	function handleSort(key: string, order: 'asc' | 'desc') {
		sortKey = key;
		sortOrder = order;
	}

	function handleRowClick(item: ChangeOrder) {
		selectedOrder = item;
		detailOpen = true;
	}

	function handleSelectionChange(selected: Set<string>) {
		selectedRows = selected;
	}

	async function handleExport() {
		try {
			const result = await trpc.common.exportData.query({
				type: 'change_order',
				filters: {
					project: projectFilter,
					status: statusFilter,
					startDate,
					endDate,
					creator: creatorFilter
				}
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

	function handleBatchStatusUpdate() {
		if (selectedRows.size === 0) {
			alert('请先选择要更新的记录');
			return;
		}
		batchStatusModalOpen = true;
	}

	function confirmBatchStatusUpdate() {
		if (selectedRows) {
			console.log('Batch update status to:', batchStatus, 'for rows:', Array.from(selectedRows));
			batchStatusModalOpen = false;
			selectedRows = new Set();
		}
	}

	function resetFilters() {
		projectFilter = '';
		statusFilter = '';
		startDate = '';
		endDate = '';
		creatorFilter = '';
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">变更单管理</h1>
			<p class="mt-1 text-sm text-gray-500">管理所有设计变更单</p>
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
				<button
					type="button"
					class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
					onclick={handleBatchStatusUpdate}
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487 18.75 12.75H5.625" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75V6.75A3.75 3.75 0 0 1 15.75 3h1.5A2.25 2.25 0 0 1 19.5 5.25v1.5A2.25 2.25 0 0 1 17.25 9h-6.75Z" />
					</svg>
					批量更新状态
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
		<div class="flex flex-wrap items-center gap-4">
			<div class="relative flex-1 min-w-[200px]">
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
			<button
				type="button"
				class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
				onclick={() => (showFilters = !showFilters)}
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h7.5m-7.5 6h7.5m-7.5 6h7.5M4.5 6h.008v.008H4.5V6Zm0 6h.008v.008H4.5V12Zm0 6h.008v.008H4.5V18Z" />
				</svg>
				高级筛选
			</button>
		</div>

		{#if showFilters}
			<div class="mt-4 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 sm:grid-cols-2 lg:grid-cols-5">
				<div>
					<label class="block text-sm font-medium text-gray-700">项目</label>
					<select
						bind:value={projectFilter}
						class="mt-1 block w-full rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
					>
						<option value="">全部项目</option>
						{#each projects as project}
							<option value={project.id}>{project.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700">状态</label>
					<select
						bind:value={statusFilter}
						class="mt-1 block w-full rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
					>
						<option value="">全部状态</option>
						<option value="draft">草稿</option>
						<option value="pending">待处理</option>
						<option value="processing">处理中</option>
						<option value="approved">已批准</option>
						<option value="rejected">已拒绝</option>
						<option value="completed">已完成</option>
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700">开始日期</label>
					<input
						type="date"
						bind:value={startDate}
						class="mt-1 block w-full rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700">结束日期</label>
					<input
						type="date"
						bind:value={endDate}
						class="mt-1 block w-full rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
					/>
				</div>
				<div class="flex items-end gap-2">
					<button
						type="button"
						class="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
						onclick={resetFilters}
					>
						重置
					</button>
				</div>
			</div>
		{/if}
	</div>

	<DataTable
		data={paginatedOrders}
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
		onRowClick={handleRowClick}
	/>
</div>

<Modal open={batchStatusModalOpen} title="批量更新状态" onClose={() => (batchStatusModalOpen = false)}>
	<div class="space-y-4">
		<p class="text-sm text-gray-600">
			已选择 {selectedRows.size} 条记录，将更新为以下状态：
		</p>
		<select
			bind:value={batchStatus}
			class="block w-full rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
		>
			<option value="">请选择状态</option>
			<option value="pending">待处理</option>
			<option value="processing">处理中</option>
			<option value="approved">已批准</option>
			<option value="rejected">已拒绝</option>
			<option value="completed">已完成</option>
		</select>
		<div class="flex justify-end gap-3 pt-4">
			<button
				type="button"
				class="rounded-lg px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
				onclick={() => (batchStatusModalOpen = false)}
			>
				取消
			</button>
			<button
				type="button"
				class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
				onclick={confirmBatchStatusUpdate}
			>
				确认更新
			</button>
		</div>
	</div>
</Modal>

{#if detailOpen && selectedOrder}
	<div class="fixed inset-0 z-50 overflow-hidden">
		<div class="absolute inset-0 bg-gray-500/75" onclick={() => (detailOpen = false)} />
		<div class="absolute inset-y-0 right-0 flex max-w-full pl-10">
			<div class="w-screen max-w-2xl">
				<div class="flex h-full flex-col bg-white shadow-xl">
					<div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
						<h2 class="text-lg font-semibold text-gray-900">变更单详情</h2>
						<button
							type="button"
							class="rounded-md bg-white text-gray-400 hover:text-gray-500"
							onclick={() => (detailOpen = false)}
						>
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
					<div class="flex-1 overflow-y-auto px-6 py-4">
						<div class="space-y-6">
							<div>
								<dt class="text-sm font-medium text-gray-500">编号</dt>
								<dd class="mt-1 text-sm text-gray-900">{selectedOrder.code}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">项目</dt>
								<dd class="mt-1 text-sm text-gray-900">{selectedOrder.projectName}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">标题</dt>
								<dd class="mt-1 text-sm text-gray-900">{selectedOrder.title}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">状态</dt>
								<dd class="mt-1">
									<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusClass(selectedOrder.status)}">{getStatusLabel(selectedOrder.status)}</span>
								</dd>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<dt class="text-sm font-medium text-gray-500">费用变更</dt>
									<dd class="mt-1 text-sm text-gray-900">{selectedOrder.costChange >= 0 ? '+' : ''}¥{selectedOrder.costChange.toLocaleString()}</dd>
								</div>
								<div>
									<dt class="text-sm font-medium text-gray-500">工期变更</dt>
									<dd class="mt-1 text-sm text-gray-900">{selectedOrder.timeChangeDays > 0 ? '+' : ''}{selectedOrder.timeChangeDays}天</dd>
								</div>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">创建人</dt>
								<dd class="mt-1 text-sm text-gray-900">{selectedOrder.createdByName}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">创建时间</dt>
								<dd class="mt-1 text-sm text-gray-900">{selectedOrder.createdAt}</dd>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
