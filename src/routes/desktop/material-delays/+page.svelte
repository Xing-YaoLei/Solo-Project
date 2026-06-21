<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';

	interface AffectedObject {
		objectType: string;
		objectName: string;
		impactDescription: string;
		estimatedDelayDays: number;
	}

	interface MaterialDelay {
		id: string;
		projectId: string;
		projectName: string;
		materialName: string;
		materialType: string;
		quantity: string;
		originalDeliveryDate: string;
		expectedDeliveryDate: string;
		delayDays: number;
		reason: string;
		description: string;
		status: string;
		responsibleRole: string;
		responsibleName: string | null;
		previousResponsibleName: string | null;
		lastTransferAt: string | null;
		transferNote: string | null;
		affectedObjects: AffectedObject[];
		createdAt: string;
	}

	let searchQuery = '';
	let projectFilter = '';
	let statusFilter = '';
	let reasonFilter = '';
	let currentPage = 1;
	let sortKey = 'createdAt';
	let sortOrder: 'asc' | 'desc' = 'desc';
	let selectedDelay: MaterialDelay | null = null;
	let detailOpen = false;
	let transferModalOpen = false;
	let transferToRole = '';
	let transferNote = '';

	const projects = [
		{ id: '1', name: '阳光花园别墅装修' },
		{ id: '2', name: '万达广场商铺装修' },
		{ id: '3', name: '科技园办公楼改造' }
	];

	const users = [
		{ id: '1', name: '张三', role: 'project_manager' },
		{ id: '2', name: '李四', role: 'designer' },
		{ id: '3', name: '王五', role: 'foreman' },
		{ id: '4', name: '赵六', role: 'supplier' }
	];

	const roleLabels: Record<string, string> = {
		project_manager: '项目经理',
		designer: '设计师',
		foreman: '工长',
		supplier: '供应商',
		client: '客户',
		admin: '管理员'
	};

	const reasonLabels: Record<string, string> = {
		supplier_delay: '供应商延迟',
		production_issue: '生产问题',
		transport_issue: '运输问题',
		customs_clearance: '清关问题',
		other: '其他'
	};

	const mockDelays: MaterialDelay[] = [
		{
			id: '1',
			projectId: '1',
			projectName: '阳光花园别墅装修',
			materialName: '意大利进口大理石',
			materialType: '石材',
			quantity: '100㎡',
			originalDeliveryDate: '2024-02-20',
			expectedDeliveryDate: '2024-02-27',
			delayDays: 7,
			reason: 'transport_issue',
			description: '海运集装箱延误',
			status: 'processing',
			responsibleRole: 'supplier',
			responsibleName: '赵六',
			previousResponsibleName: null,
			lastTransferAt: null,
			transferNote: null,
			affectedObjects: [
				{ objectType: 'work_item', objectName: '客厅地面铺装', impactDescription: '无法开始地面石材铺装', estimatedDelayDays: 7 },
				{ objectType: 'work_item', objectName: '厨房台面安装', impactDescription: '台面石材无法供应', estimatedDelayDays: 5 }
			],
			createdAt: '2024-02-18'
		},
		{
			id: '2',
			projectId: '2',
			projectName: '万达广场商铺装修',
			materialName: '定制木饰面',
			materialType: '木制品',
			quantity: '80㎡',
			originalDeliveryDate: '2024-02-25',
			expectedDeliveryDate: '2024-03-03',
			delayDays: 6,
			reason: 'production_issue',
			description: '工厂机器故障',
			status: 'processing',
			responsibleRole: 'designer',
			responsibleName: '李四',
			previousResponsibleName: '赵六',
			lastTransferAt: '2024-02-20',
			transferNote: '供应商产能不足，需要设计师调整设计方案',
			affectedObjects: [
				{ objectType: 'work_item', objectName: '墙面装饰', impactDescription: '木饰面安装延后', estimatedDelayDays: 6 }
			],
			createdAt: '2024-02-19'
		},
		{
			id: '3',
			projectId: '3',
			projectName: '科技园办公楼改造',
			materialName: '进口五金配件',
			materialType: '五金',
			quantity: '500套',
			originalDeliveryDate: '2024-02-15',
			expectedDeliveryDate: '2024-02-22',
			delayDays: 7,
			reason: 'customs_clearance',
			description: '海关清关延误',
			status: 'approved',
			responsibleRole: 'project_manager',
			responsibleName: '张三',
			previousResponsibleName: '赵六',
			lastTransferAt: '2024-02-16',
			transferNote: '清关时间超出预期，由项目经理协调加急处理',
			affectedObjects: [
				{ objectType: 'work_item', objectName: '门窗安装', impactDescription: '五金配件不全导致无法完成安装', estimatedDelayDays: 7 }
			],
			createdAt: '2024-02-14'
		}
	];

	const filteredDelays = $derived(mockDelays.filter((d) => {
		const matchesSearch = d.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			d.projectName.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesProject = !projectFilter || d.projectId === projectFilter;
		const matchesStatus = !statusFilter || d.status === statusFilter;
		const matchesReason = !reasonFilter || d.reason === reasonFilter;
		return matchesSearch && matchesProject && matchesStatus && matchesReason;
	}));

	const sortedDelays = $derived([...filteredDelays].sort((a, b) => {
		const aVal = a[sortKey as keyof MaterialDelay];
		const bVal = b[sortKey as keyof MaterialDelay];
		if (typeof aVal === 'number' && typeof bVal === 'number') {
			return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
		}
		if (typeof aVal === 'string' && typeof bVal === 'string') {
			return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
		}
		return 0;
	}));

	const totalItems = $derived(sortedDelays.length);
	const totalPages = $derived(Math.ceil(totalItems / 10));
	const paginatedDelays = $derived(sortedDelays.slice((currentPage - 1) * 10, currentPage * 10));

	const columns = [
		{ key: 'materialName', label: '材料名称', sortable: true },
		{ key: 'projectName', label: '项目', sortable: true },
		{ key: 'delayDays', label: '延期天数', sortable: true, render: (item: MaterialDelay) => `<span class="text-red-600 font-medium">+${item.delayDays}天</span>` },
		{ key: 'originalDeliveryDate', label: '原到货日期', sortable: true },
		{ key: 'expectedDeliveryDate', label: '预计到货日期', sortable: true },
		{
			key: 'reason',
			label: '延期原因',
			sortable: true,
			render: (item: MaterialDelay) => reasonLabels[item.reason] || item.reason
		},
		{
			key: 'responsibleRole',
			label: '责任角色',
			sortable: true,
			render: (item: MaterialDelay) => `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800">${roleLabels[item.responsibleRole] || item.responsibleRole}</span>`
		},
		{
			key: 'status',
			label: '状态',
			sortable: true,
			render: (item: MaterialDelay) => `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(item.status)}">${getStatusLabel(item.status)}</span>`
		},
		{
			key: 'actions',
			label: '操作',
			render: (item: MaterialDelay) => `
				<button class="text-primary-600 hover:text-primary-800 text-sm" onclick="window.viewDelay('${item.id}')">详情</button>
				<button class="ml-2 text-orange-600 hover:text-orange-800 text-sm" onclick="window.transferDelay('${item.id}')">转移责任</button>
			`
		}
	];

	function getStatusClass(status: string) {
		switch (status) {
			case 'processing': return 'bg-blue-100 text-blue-800';
			case 'approved': return 'bg-green-100 text-green-800';
			case 'completed': return 'bg-emerald-100 text-emerald-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusLabel(status: string) {
		switch (status) {
			case 'pending': return '待处理';
			case 'processing': return '处理中';
			case 'approved': return '已确认';
			case 'completed': return '已解决';
			default: return status;
		}
	}

	function handleSort(key: string, order: 'asc' | 'desc') {
		sortKey = key;
		sortOrder = order;
	}

	function viewDelay(id: string) {
		selectedDelay = mockDelays.find((d) => d.id === id) || null;
		if (selectedDelay) {
			detailOpen = true;
		}
	}

	function transferDelay(id: string) {
		selectedDelay = mockDelays.find((d) => d.id === id) || null;
		if (selectedDelay) {
			transferToRole = '';
			transferNote = '';
			transferModalOpen = true;
		}
	}

	function confirmTransfer() {
		if (selectedDelay && transferToRole) {
			const user = users.find((u) => u.id === transferToRole);
			console.log('Transfer delay:', selectedDelay.id, 'to:', user);
			transferModalOpen = false;
		}
	}

	(window as any).viewDelay = viewDelay;
	(window as any).transferDelay = transferDelay;
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">材料延期管理</h1>
			<p class="mt-1 text-sm text-gray-500">追踪和管理材料延期问题</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
		<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
			<p class="text-sm font-medium text-gray-500">延期总数</p>
			<p class="mt-2 text-2xl font-bold text-gray-900">{mockDelays.length}</p>
		</div>
		<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
			<p class="text-sm font-medium text-gray-500">处理中</p>
			<p class="mt-2 text-2xl font-bold text-blue-600">{mockDelays.filter(d => d.status === 'processing').length}</p>
		</div>
		<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
			<p class="text-sm font-medium text-gray-500">已确认</p>
			<p class="mt-2 text-2xl font-bold text-green-600">{mockDelays.filter(d => d.status === 'approved').length}</p>
		</div>
		<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
			<p class="text-sm font-medium text-gray-500">平均延期天数</p>
			<p class="mt-2 text-2xl font-bold text-red-600">
				{mockDelays.reduce((sum, d) => sum + d.delayDays, 0) / mockDelays.length}天
			</p>
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
					placeholder="搜索材料、项目..."
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
				<option value="pending">待处理</option>
				<option value="processing">处理中</option>
				<option value="approved">已确认</option>
				<option value="completed">已解决</option>
			</select>
			<select
				bind:value={reasonFilter}
				class="rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
			>
				<option value="">全部原因</option>
				<option value="supplier_delay">供应商延迟</option>
				<option value="production_issue">生产问题</option>
				<option value="transport_issue">运输问题</option>
				<option value="customs_clearance">清关问题</option>
				<option value="other">其他</option>
			</select>
		</div>
	</div>

	<DataTable
		data={paginatedDelays}
		columns={columns}
		sortKey={sortKey}
		sortOrder={sortOrder}
		onSort={handleSort}
		currentPage={currentPage}
		totalPages={totalPages}
		totalItems={totalItems}
		onPageChange={(p) => (currentPage = p)}
	/>
</div>

{#if detailOpen && selectedDelay}
	<div class="fixed inset-0 z-50 overflow-hidden">
		<div class="absolute inset-0 bg-gray-500/75" onclick={() => (detailOpen = false)} />
		<div class="absolute inset-y-0 right-0 flex max-w-full pl-10">
			<div class="w-screen max-w-2xl">
				<div class="flex h-full flex-col bg-white shadow-xl">
					<div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
						<h2 class="text-lg font-semibold text-gray-900">材料延期详情</h2>
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
								<dt class="text-sm font-medium text-gray-500">材料名称</dt>
								<dd class="mt-1 text-sm text-gray-900">{selectedDelay.materialName}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">项目</dt>
								<dd class="mt-1 text-sm text-gray-900">{selectedDelay.projectName}</dd>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<dt class="text-sm font-medium text-gray-500">类型</dt>
									<dd class="mt-1 text-sm text-gray-900">{selectedDelay.materialType}</dd>
								</div>
								<div>
									<dt class="text-sm font-medium text-gray-500">数量</dt>
									<dd class="mt-1 text-sm text-gray-900">{selectedDelay.quantity}</dd>
								</div>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<dt class="text-sm font-medium text-gray-500">原到货日期</dt>
									<dd class="mt-1 text-sm text-gray-900">{selectedDelay.originalDeliveryDate}</dd>
								</div>
								<div>
									<dt class="text-sm font-medium text-gray-500">预计到货日期</dt>
									<dd class="mt-1 text-sm text-gray-900">{selectedDelay.expectedDeliveryDate}</dd>
								</div>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">延期天数</dt>
								<dd class="mt-1 text-sm text-red-600 font-medium">+{selectedDelay.delayDays}天</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">延期原因</dt>
								<dd class="mt-1 text-sm text-gray-900">{reasonLabels[selectedDelay.reason] || selectedDelay.reason}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">详细说明</dt>
								<dd class="mt-1 text-sm text-gray-900">{selectedDelay.description}</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">状态</dt>
								<dd class="mt-1">
									<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusClass(selectedDelay.status)}">{getStatusLabel(selectedDelay.status)}</span>
								</dd>
							</div>
							<div>
								<dt class="text-sm font-medium text-gray-500">当前责任方</dt>
								<dd class="mt-1">
									<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800">
										{roleLabels[selectedDelay.responsibleRole] || selectedDelay.responsibleRole} - {selectedDelay.responsibleName || '未指定'}
									</span>
								</dd>
							</div>
							{#if selectedDelay.previousResponsibleName}
								<div>
									<dt class="text-sm font-medium text-gray-500">上次转移</dt>
									<dd class="mt-1 text-sm text-gray-900">
										从 {selectedDelay.previousResponsibleName} 转移，{selectedDelay.lastTransferAt}
									</dd>
									<dd class="mt-1 text-sm text-gray-500">{selectedDelay.transferNote}</dd>
								</div>
							{/if}
							<div>
								<dt class="text-sm font-medium text-gray-500">受影响对象</dt>
								<dd class="mt-2">
									<ul class="space-y-3">
										{#each selectedDelay.affectedObjects as obj}
											<li class="rounded-lg border border-gray-200 p-3">
												<div class="flex items-start justify-between">
													<div>
														<p class="font-medium text-gray-900">{obj.objectName}</p>
														<p class="text-xs text-gray-500">{obj.objectType}</p>
													</div>
													<span class="text-xs font-medium text-red-600">+{obj.estimatedDelayDays}天</span>
												</div>
												<p class="mt-1 text-xs text-gray-500">{obj.impactDescription}</p>
											</li>
										{/each}
									</ul>
								</dd>
							</div>
						</div>
					</div>
					<div class="px-6 py-4 border-t border-gray-200">
						<button
							type="button"
							class="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500"
							onclick={() => {
								detailOpen = false;
								transferDelay(selectedDelay!.id);
							}}
						>
							转移责任
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<Modal open={transferModalOpen} title="转移责任" onClose={() => (transferModalOpen = false)}>
	<div class="space-y-4">
		{#if selectedDelay}
			<p class="text-sm text-gray-600">
				将 <strong>{selectedDelay.materialName}</strong> 的责任转移给：
			</p>
			<div>
				<label class="block text-sm font-medium text-gray-700">选择负责人</label>
				<select
					bind:value={transferToRole}
					class="mt-1 block w-full rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
				>
					<option value="">请选择</option>
					{#each users as user}
						<option value={user.id}>{roleLabels[user.role]} - {user.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700">转移说明</label>
				<textarea
					bind:value={transferNote}
					rows={3}
					class="mt-1 block w-full rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
					placeholder="请说明转移原因..."
				/>
			</div>
			<div class="flex justify-end gap-3 pt-4">
				<button
					type="button"
					class="rounded-lg px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
					onclick={() => (transferModalOpen = false)}
				>
					取消
				</button>
				<button
					type="button"
					class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
					onclick={confirmTransfer}
				>
					确认转移
				</button>
			</div>
		{/if}
	</div>
</Modal>
