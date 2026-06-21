<script lang="ts">
	import { trpc } from '$lib/trpc/client';

	interface AfterSalesOrder {
		id: string;
		code: string;
		title: string;
		type: string;
		description: string;
		priority: string;
		projectId: string;
		projectName: string;
		status: string;
		assignedToId: string | null;
		assignedToName: string | null;
		reportedByName: string;
		createdAt: string;
	}

	let viewMode: 'board' | 'list' = 'board';
	let searchQuery = '';
	let projectFilter = '';
	let priorityFilter = '';
	let selectedOrder: AfterSalesOrder | null = null;
	let detailOpen = false;
	let assignModalOpen = false;
	let assignTo = '';

	const projects = [
		{ id: '1', name: '阳光花园别墅装修' },
		{ id: '2', name: '滨江公寓翻新' }
	];

	const users = [
		{ id: '1', name: '张三' },
		{ id: '2', name: '李四' },
		{ id: '3', name: '王五' }
	];

	const statuses = [
		{ key: 'pending', label: '待处理', color: 'bg-yellow-500' },
		{ key: 'processing', label: '处理中', color: 'bg-blue-500' },
		{ key: 'approved', label: '已验收', color: 'bg-green-500' },
		{ key: 'completed', label: '已完成', color: 'bg-emerald-500' }
	];

	let mockOrders: AfterSalesOrder[] = [
		{
			id: '1',
			code: 'AS-2024-001',
			title: '墙面开裂',
			type: '质量问题',
			description: '客厅墙面出现多处细微裂缝',
			priority: 'high',
			projectId: '1',
			projectName: '阳光花园别墅装修',
			status: 'pending',
			assignedToId: null,
			assignedToName: null,
			reportedByName: '张先生',
			createdAt: '2024-02-25'
		},
		{
			id: '2',
			code: 'AS-2024-002',
			title: '水电维修',
			type: '维修',
			description: '主卫水龙头漏水',
			priority: 'normal',
			projectId: '1',
			projectName: '阳光花园别墅装修',
			status: 'processing',
			assignedToId: '1',
			assignedToName: '张三',
			reportedByName: '张先生',
			createdAt: '2024-02-24'
		},
		{
			id: '3',
			code: 'AS-2024-003',
			title: '橱柜调整',
			type: '调整',
			description: '厨房橱柜门缝不均匀',
			priority: 'low',
			projectId: '2',
			projectName: '滨江公寓翻新',
			status: 'processing',
			assignedToId: '2',
			assignedToName: '李四',
			reportedByName: '王先生',
			createdAt: '2024-02-23'
		},
		{
			id: '4',
			code: 'AS-2024-004',
			title: '瓷砖空鼓',
			type: '质量问题',
			description: '阳台地砖多处空鼓',
			priority: 'high',
			projectId: '1',
			projectName: '阳光花园别墅装修',
			status: 'approved',
			assignedToId: '3',
			assignedToName: '王五',
			reportedByName: '张先生',
			createdAt: '2024-02-22'
		},
		{
			id: '5',
			code: 'AS-2024-005',
			title: '门窗调试',
			type: '调试',
			description: '卧室窗户开关不顺畅',
			priority: 'normal',
			projectId: '2',
			projectName: '滨江公寓翻新',
			status: 'completed',
			assignedToId: '1',
			assignedToName: '张三',
			reportedByName: '王先生',
			createdAt: '2024-02-20'
		},
		{
			id: '6',
			code: 'AS-2024-006',
			title: '地板异响',
			type: '质量问题',
			description: '主卧地板走动时有异响',
			priority: 'normal',
			projectId: '1',
			projectName: '阳光花园别墅装修',
			status: 'pending',
			assignedToId: null,
			assignedToName: null,
			reportedByName: '张先生',
			createdAt: '2024-02-26'
		}
	];

	const filteredOrders = $derived(mockOrders.filter((o) => {
		const matchesSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			o.code.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesProject = !projectFilter || o.projectId === projectFilter;
		const matchesPriority = !priorityFilter || o.priority === priorityFilter;
		return matchesSearch && matchesProject && matchesPriority;
	}));

	const ordersByStatus = $derived(statuses.map((s) => ({
		...s,
		orders: filteredOrders.filter((o) => o.status === s.key)
	})));

	async function handleExport() {
		try {
			const result = await trpc.common.exportData.query({
				type: 'after_sales_order',
				filters: { project: projectFilter, priority: priorityFilter }
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

	function handleCardClick(order: AfterSalesOrder) {
		selectedOrder = order;
		detailOpen = true;
	}

	function handleDragStart(e: DragEvent, orderId: string) {
		e.dataTransfer?.setData('orderId', orderId);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	function handleDrop(e: DragEvent, status: string) {
		e.preventDefault();
		const orderId = e.dataTransfer?.getData('orderId');
		if (orderId) {
			mockOrders = mockOrders.map((o) =>
				o.id === orderId ? { ...o, status } : o
			);
		}
	}

	function openAssignModal(order: AfterSalesOrder) {
		selectedOrder = order;
		assignTo = order.assignedToId || '';
		assignModalOpen = true;
	}

	function confirmAssign() {
		if (selectedOrder && assignTo) {
			const user = users.find((u) => u.id === assignTo);
			mockOrders = mockOrders.map((o) =>
				o.id === selectedOrder.id
					? { ...o, assignedToId: assignTo, assignedToName: user?.name || null }
					: o
			);
			assignModalOpen = false;
		}
	}

	function getPriorityClass(priority: string) {
		switch (priority) {
			case 'high': return 'bg-red-100 text-red-700';
			case 'normal': return 'bg-yellow-100 text-yellow-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}

	function getPriorityLabel(priority: string) {
		switch (priority) {
			case 'high': return '高';
			case 'normal': return '中';
			default: return '低';
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">售后工单管理</h1>
			<p class="mt-1 text-sm text-gray-500">处理售后维修和质量问题</p>
		</div>
		<div class="flex gap-3">
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
			<div class="flex rounded-lg border border-gray-300 overflow-hidden">
				<button
					type="button"
					class="px-3 py-2 text-sm font-medium {viewMode === 'board' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}"
					onclick={() => (viewMode = 'board')}
				>
					看板
				</button>
				<button
					type="button"
					class="px-3 py-2 text-sm font-medium {viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}"
					onclick={() => (viewMode = 'list')}
				>
					列表
				</button>
			</div>
		</div>
	</div>

	<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
		<div class="flex flex-wrap items-center gap-4">
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
				bind:value={priorityFilter}
				class="rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
			>
				<option value="">全部优先级</option>
				<option value="high">高</option>
				<option value="normal">中</option>
				<option value="low">低</option>
			</select>
		</div>
	</div>

	{#if viewMode === 'board'}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
			{#each ordersByStatus as status}
				<div
					class="rounded-lg bg-gray-50 p-4"
					ondragover={handleDragOver}
					ondrop={(e) => handleDrop(e, status.key)}
				>
					<div class="flex items-center gap-2 mb-4">
						<div class="h-3 w-3 rounded-full {status.color}" />
						<h3 class="font-semibold text-gray-900">{status.label}</h3>
						<span class="text-sm text-gray-500">({status.orders.length})</span>
					</div>
					<div class="space-y-3">
						{#each status.orders as order}
							<div
								draggable="true"
								class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
								ondragstart={(e) => handleDragStart(e, order.id)}
								onclick={() => handleCardClick(order)}
							>
								<div class="flex items-start justify-between">
									<div>
										<p class="text-xs text-gray-500">{order.code}</p>
										<p class="mt-1 font-medium text-gray-900">{order.title}</p>
									</div>
									<span
										class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {getPriorityClass(order.priority)}"
									>
										{getPriorityLabel(order.priority)}
									</span>
								</div>
								<p class="mt-2 text-sm text-gray-500 line-clamp-2">{order.description}</p>
								<div class="mt-3 flex items-center justify-between text-xs text-gray-500">
									<span>{order.projectName}</span>
									{#if order.assignedToName}
										<span class="flex items-center gap-1">
											<div class="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-[10px]">
												{order.assignedToName[0]}
											</div>
											{order.assignedToName}
										</span>
									{:else}
										<button
											class="text-primary-600 hover:text-primary-700"
											onclick={(e) => {
												e.stopPropagation();
												openAssignModal(order);
											}}
										>
											分配
										</button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
			<table class="min-w-full divide-y divide-gray-300">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">编号</th>
						<th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">标题</th>
						<th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">类型</th>
						<th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">优先级</th>
						<th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">项目</th>
						<th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">负责人</th>
						<th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">操作</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each filteredOrders as order}
						<tr class="hover:bg-gray-50 cursor-pointer" onclick={() => handleCardClick(order)}>
							<td class="px-4 py-3 text-sm text-gray-900">{order.code}</td>
							<td class="px-4 py-3 text-sm text-gray-900">{order.title}</td>
							<td class="px-4 py-3 text-sm text-gray-500">{order.type}</td>
							<td class="px-4 py-3">
								<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {getPriorityClass(order.priority)}">
									{getPriorityLabel(order.priority)}
								</span>
							</td>
							<td class="px-4 py-3 text-sm text-gray-500">{order.projectName}</td>
							<td class="px-4 py-3 text-sm text-gray-500">
								{#if order.assignedToName}
									{order.assignedToName}
								{:else}
									<button
										class="text-primary-600 hover:text-primary-700"
										onclick={(e) => {
											e.stopPropagation();
											openAssignModal(order);
										}}
									>
										分配
									</button>
								{/if}
							</td>
							<td class="px-4 py-3 text-sm">
								<button
									class="text-primary-600 hover:text-primary-700"
									onclick={(e) => {
										e.stopPropagation();
										openAssignModal(order);
									}}
								>
									分配
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if detailOpen && selectedOrder}
	<div class="fixed inset-0 z-50 overflow-hidden">
		<div class="absolute inset-0 bg-gray-500/75" onclick={() => (detailOpen = false)} />
		<div class="absolute inset-y-0 right-0 flex max-w-full pl-10">
			<div class="w-screen max-w-2xl">
				<div class="flex h-full flex-col bg-white shadow-xl">
					<div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
						<h2 class="text-lg font-semibold text-gray-900">工单详情</h2>
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
								<dt class="text-sm font-medium text-gray-500">标题</dt>
								<dd class="mt-1 text-sm text-gray-900">{selectedOrder.title}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">类型</dt>
								<dd class="mt-1 text-sm text-gray-900">{selectedOrder.type}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">优先级</dt>
								<dd class="mt-1">
									<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getPriorityClass(selectedOrder.priority)}">
										{getPriorityLabel(selectedOrder.priority)}
									</span>
								</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">描述</dt>
								<dd class="mt-1 text-sm text-gray-900">{selectedOrder.description}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">项目</dt>
								<dd class="mt-1 text-sm text-gray-900">{selectedOrder.projectName}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">报修人</dt>
								<dd class="mt-1 text-sm text-gray-900">{selectedOrder.reportedByName}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">负责人</dt>
								<dd class="mt-1 text-sm text-gray-900">{selectedOrder.assignedToName || '未分配'}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">创建时间</dt>
								<dd class="mt-1 text-sm text-gray-900">{selectedOrder.createdAt}</dd>
							</div>
						</div>
					</div>
					<div class="px-6 py-4 border-t border-gray-200">
						{#if !selectedOrder.assignedToName}
							<button
								type="button"
								class="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
								onclick={() => openAssignModal(selectedOrder)}
							>
								分配负责人
							</button>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if assignModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div class="absolute inset-0 bg-gray-500/75" onclick={() => (assignModalOpen = false)} />
		<div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
			<div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
				<h3 class="text-lg font-semibold text-gray-900">分配负责人</h3>
				<button
					type="button"
					class="rounded-md bg-white text-gray-400 hover:text-gray-500"
					onclick={() => (assignModalOpen = false)}
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="px-6 py-4">
				<label class="block text-sm font-medium text-gray-700">选择负责人</label>
				<select
					bind:value={assignTo}
					class="mt-1 block w-full rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
				>
					<option value="">请选择</option>
					{#each users as user}
						<option value={user.id}>{user.name}</option>
					{/each}
				</select>
				<div class="mt-4 flex justify-end gap-3">
					<button
						type="button"
						class="rounded-lg px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
						onclick={() => (assignModalOpen = false)}
					>
						取消
					</button>
					<button
						type="button"
						class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
						onclick={confirmAssign}
					>
						确认
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
