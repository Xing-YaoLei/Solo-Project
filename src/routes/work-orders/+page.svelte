<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		Search, Filter, User, Wrench, Calendar, ChevronDown, ChevronRight,
		Download, FileSpreadsheet, CheckSquare, Square, X, Plus,
		UserPlus, RefreshCw
	} from 'lucide-svelte';
	import {
		mockWorkOrders, mockUsers, delay,
		type MockWorkOrder, type WoStatus
	} from '$lib/mock/data';

	// TODO: tRPC 调用 - 替换为真实数据
	// import { trpc } from '$lib/trpc/client';
	// const result = await trpc.workOrder.list.query({ ...filters, page, pageSize });

	let loading = true;
	let workOrders: MockWorkOrder[] = [];
	let filtered: MockWorkOrder[] = [];

	let searchQuery = '';
	let statusFilter: WoStatus | 'ALL' = 'ALL';
	let advisorFilter: string = 'ALL';
	let techFilter: string = 'ALL';
	let dateFrom: string = '';
	let dateTo: string = '';
	let plateSearch = '';

	$: {
		let list = workOrders;
		if (statusFilter !== 'ALL') list = list.filter(w => w.status === statusFilter);
		if (advisorFilter !== 'ALL') list = list.filter(w => w.advisorId === advisorFilter);
		if (techFilter !== 'ALL') list = list.filter(w => w.technicianId === techFilter);
		if (dateFrom) {
			const from = new Date(dateFrom).getTime();
			list = list.filter(w => w.createdAt.getTime() >= from);
		}
		if (dateTo) {
			const to = new Date(dateTo).getTime() + 86400000;
			list = list.filter(w => w.createdAt.getTime() < to);
		}
		if (plateSearch) list = list.filter(w => w.vehicle.plateNumber.includes(plateSearch));
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			list = list.filter(w =>
				w.orderNo.toLowerCase().includes(q)
				|| w.customer.name.toLowerCase().includes(q)
				|| w.vehicle.plateNumber.toLowerCase().includes(q)
				|| w.vehicle.brand?.toLowerCase().includes(q)
				|| w.vehicle.model?.toLowerCase().includes(q)
			);
		}
		filtered = list;
	}

	$: selected = workOrders.filter(w => selectedIds.has(w.id));
	let selectedIds: Set<string> = new Set();

	let showAssignModal = false;
	let showStatusModal = false;
	let assignTechId = '';
	let assignStatus: WoStatus = 'CONFIRMED';
	let showFilter = false;

	onMount(async () => {
		await delay(null, 300);
		workOrders = mockWorkOrders;
		loading = false;
	});

	function toggleSelect(id: string) {
		const s = new Set(selectedIds);
		if (s.has(id)) s.delete(id);
		else s.add(id);
		selectedIds = s;
	}

	function handleRowClick(e: MouseEvent, woId: string) {
		const target = e.target as any;
		if (target && target.closest && target.closest('button, input, label, select, a')) return;
		goto(`/work-orders/${woId}`);
	}

	function toggleSelectAll() {
		if (filtered.length === 0) return;
		const s = new Set(selectedIds);
		const allSelected = filtered.every(w => s.has(w.id));
		if (allSelected) {
			filtered.forEach(w => s.delete(w.id));
		} else {
			filtered.forEach(w => s.add(w.id));
		}
		selectedIds = s;
	}

	function statusClass(s: WoStatus) {
		switch (s) {
			case 'PENDING': return 'bg-slate-100 text-slate-700';
			case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
			case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700';
			case 'INSPECTION': return 'bg-purple-100 text-purple-700';
			case 'COMPLETED': return 'bg-green-100 text-green-700';
			case 'CANCELLED': return 'bg-red-100 text-red-700';
			default: return 'bg-slate-100 text-slate-700';
		}
	}
	function statusName(s: WoStatus) {
		switch (s) {
			case 'PENDING': return '待确认';
			case 'CONFIRMED': return '已确认';
			case 'IN_PROGRESS': return '施工中';
			case 'INSPECTION': return '质检中';
			case 'COMPLETED': return '已完成';
			case 'CANCELLED': return '已取消';
			default: return s;
		}
	}
	async function handleBatchAssign() {
		if (!assignTechId) return;
		// TODO: tRPC 调用
		// await trpc.workOrder.batchAssign.mutate({ ids: [...selectedIds], technicianId: assignTechId });
		await delay(null, 500);
		workOrders = workOrders.map(w =>
			selectedIds.has(w.id)
				? { ...w, technicianId: assignTechId, technician: mockUsers.find(u => u.id === assignTechId) }
				: w
		);
		showAssignModal = false;
		selectedIds = new Set();
	}
	async function handleBatchStatus() {
		// TODO: tRPC 调用
		// await trpc.workOrder.batchUpdateStatus.mutate({ ids: [...selectedIds], status: assignStatus });
		await delay(null, 500);
		workOrders = workOrders.map(w =>
			selectedIds.has(w.id) ? { ...w, status: assignStatus } : w
		);
		showStatusModal = false;
		selectedIds = new Set();
	}
	async function handleExport() {
		// TODO: tRPC 调用或实际导出逻辑
		// await trpc.workOrder.export.mutate({ ids: selected.size > 0 ? [...selected] : undefined, ...filters });
		alert(`即将导出 ${selectedIds.size > 0 ? selectedIds.size : filtered.length} 条工单数据`);
	}
	function resetFilters() {
		statusFilter = 'ALL';
		advisorFilter = 'ALL';
		techFilter = 'ALL';
		dateFrom = '';
		dateTo = '';
		plateSearch = '';
		searchQuery = '';
	}
</script>

<div class="min-h-screen bg-slate-50 p-6 lg:p-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl lg:text-3xl font-bold text-slate-900 font-display">工单管理</h1>
			<p class="text-slate-500 mt-1">共 {filtered.length} 条工单记录</p>
		</div>
		<button
			on:click={() => alert('新建工单功能开发中')}
			class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
		>
			<Plus class="w-5 h-5" />
			新建工单
		</button>
	</div>

	<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
		<div class="p-5 border-b border-slate-100 space-y-4">
			<div class="flex flex-col lg:flex-row gap-3">
				<div class="relative flex-1">
					<Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="搜索工单号/客户/车型..."
						class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
					/>
				</div>
				<div class="relative lg:w-64">
					<Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
					<input
						type="text"
						bind:value={plateSearch}
						placeholder="车牌号"
						class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
					/>
				</div>
				<button
					on:click={() => showFilter = !showFilter}
					class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
				>
					<Filter class="w-4.5 h-4.5" />
					高级筛选
					<ChevronDown class="w-4 h-4 transition-transform {showFilter ? 'rotate-180' : ''}" />
				</button>
			</div>

			{#if showFilter}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
					<div>
						<label class="block text-xs font-medium text-slate-500 mb-1.5">工单状态</label>
						<select
							bind:value={statusFilter}
							class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
						>
							<option value="ALL">全部状态</option>
							<option value="PENDING">待确认</option>
							<option value="CONFIRMED">已确认</option>
							<option value="IN_PROGRESS">施工中</option>
							<option value="INSPECTION">质检中</option>
							<option value="COMPLETED">已完成</option>
							<option value="CANCELLED">已取消</option>
						</select>
					</div>
					<div>
						<label class="block text-xs font-medium text-slate-500 mb-1.5">服务顾问</label>
						<div class="relative">
							<User class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<select
								bind:value={advisorFilter}
								class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
							>
								<option value="ALL">全部顾问</option>
								{#each mockUsers.filter(u => u.role === 'ADVISOR') as u}
									<option value={u.id}>{u.name}</option>
								{/each}
								{#each mockUsers.filter(u => u.role === 'MANAGER') as u}
									<option value={u.id}>{u.name}</option>
								{/each}
							</select>
						</div>
					</div>
					<div>
						<label class="block text-xs font-medium text-slate-500 mb-1.5">负责技师</label>
						<div class="relative">
							<Wrench class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<select
								bind:value={techFilter}
								class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
							>
								<option value="ALL">全部技师</option>
								<option value="">未分配</option>
								{#each mockUsers.filter(u => u.role === 'TECHNICIAN') as u}
									<option value={u.id}>{u.name}</option>
								{/each}
							</select>
						</div>
					</div>
					<div>
						<label class="block text-xs font-medium text-slate-500 mb-1.5">创建时间起</label>
						<div class="relative">
							<Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<input
								type="date"
								bind:value={dateFrom}
								class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
							/>
						</div>
					</div>
					<div>
						<label class="block text-xs font-medium text-slate-500 mb-1.5">创建时间止</label>
						<div class="relative">
							<Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<input
								type="date"
								bind:value={dateTo}
								class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
							/>
						</div>
					</div>
				</div>
				<div class="flex justify-end gap-2 pt-2">
					<button
						on:click={resetFilters}
						class="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
					>
						重置
					</button>
				</div>
			{/if}
		</div>

		{#if selectedIds.size > 0}
			<div class="bg-primary-50 border-b border-primary-100 px-5 py-3 flex flex-wrap items-center gap-3">
				<span class="text-sm text-primary-700 font-medium">
					已选择 <span class="font-bold">{selectedIds.size}</span> 项工单
				</span>
				<div class="flex-1" />
				<button
					on:click={() => { selectedIds = new Set(); }}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-white transition-colors"
				>
					<X class="w-4 h-4" />
					取消选择
				</button>
				<button
					on:click={() => showAssignModal = true}
					class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white border border-primary-200 text-primary-700 hover:bg-primary-50 text-sm font-medium transition-colors shadow-sm"
				>
					<UserPlus class="w-4 h-4" />
					分配技师
				</button>
				<button
					on:click={() => showStatusModal = true}
					class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white border border-primary-200 text-primary-700 hover:bg-primary-50 text-sm font-medium transition-colors shadow-sm"
				>
					<RefreshCw class="w-4 h-4" />
					修改状态
				</button>
				<button
					on:click={handleExport}
					class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent-600 hover:bg-accent-700 text-white text-sm font-medium transition-colors shadow-sm"
				>
					<FileSpreadsheet class="w-4 h-4" />
					导出Excel
				</button>
			</div>
		{/if}

		<div class="overflow-x-auto">
			<table class="w-full min-w-[1100px]">
				<thead class="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
					<tr>
						<th class="py-3.5 px-5 text-left w-12">
							<button on:click={toggleSelectAll} class="text-slate-400 hover:text-primary-600 transition-colors">
								{#if filtered.length > 0 && filtered.every(w => selectedIds.has(w.id))}
									<CheckSquare class="w-5 h-5 text-primary-600" />
								{:else}
									<Square class="w-5 h-5" />
								{/if}
							</button>
						</th>
						<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-3">工单号</th>
						<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-3">车辆信息</th>
						<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-3">客户</th>
						<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-3">顾问</th>
						<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-3">技师</th>
						<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-3">金额</th>
						<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-3">状态</th>
						<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-3">创建时间</th>
						<th class="py-3.5 px-3 w-12" />
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if loading}
						<tr>
							<td colspan="10" class="py-20 text-center text-slate-400">
								<div class="inline-flex items-center gap-2">
									<svg class="animate-spin h-5 w-5 text-primary-500" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
									</svg>
									<span>加载中...</span>
								</div>
							</td>
						</tr>
					{:else if filtered.length === 0}
						<tr>
							<td colspan="10" class="py-20 text-center text-slate-400">
								暂无工单数据
							</td>
						</tr>
					{:else}
						{#each filtered as wo}
							<tr
								class="hover:bg-slate-50/80 transition-colors group"
								on:click={(e) => handleRowClick(e, wo.id)}
							>
								<td class="py-4 px-5" on:click|stopPropagation>
									<button on:click={() => toggleSelect(wo.id)} class="text-slate-400 hover:text-primary-600 transition-colors">
										{#if selectedIds.has(wo.id)}
											<CheckSquare class="w-5 h-5 text-primary-600" />
										{:else}
											<Square class="w-5 h-5 group-hover:text-slate-600" />
										{/if}
									</button>
								</td>
								<td class="py-4 px-3">
									<span class="font-mono text-sm font-semibold text-primary-700">{wo.orderNo}</span>
								</td>
								<td class="py-4 px-3">
									<div class="space-y-0.5">
										<div class="flex items-center gap-2">
											<span class="font-semibold text-slate-900">{wo.vehicle.plateNumber}</span>
											<span class="px-2 py-0.5 rounded bg-slate-100 text-xs text-slate-600">{wo.vehicle.brand} {wo.vehicle.model}</span>
										</div>
										<span class="text-xs text-slate-500">{wo.vehicle.mileage.toLocaleString()} km</span>
									</div>
								</td>
								<td class="py-4 px-3">
									<div class="space-y-0.5">
										<span class="text-sm font-medium text-slate-800">{wo.customer.name}</span>
										<br />
										<span class="text-xs text-slate-500">{wo.customer.phone}</span>
									</div>
								</td>
								<td class="py-4 px-3">
									<span class="text-sm text-slate-700">{wo.advisor.name}</span>
								</td>
								<td class="py-4 px-3">
									{#if wo.technician}
										<span class="inline-flex items-center gap-1.5 text-sm text-slate-700">
											<div class="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
												{wo.technician.name.charAt(0)}
											</div>
											{wo.technician.name}
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium">
											待分配
										</span>
									{/if}
								</td>
								<td class="py-4 px-3">
									<span class="text-sm font-semibold text-accent-600">¥{Number(wo.totalAmount).toLocaleString()}</span>
								</td>
								<td class="py-4 px-3">
									<span class={'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ' + statusClass(wo.status)}>
										{statusName(wo.status)}
									</span>
								</td>
								<td class="py-4 px-3">
									<span class="text-xs text-slate-500">
										{wo.createdAt.getFullYear()}-{String(wo.createdAt.getMonth() + 1).padStart(2, '0')}-{String(wo.createdAt.getDate()).padStart(2, '0')}
									</span>
								</td>
								<td class="py-4 px-3">
									<button
										on:click|stopPropagation={() => goto(`/work-orders/${wo.id}`)}
										class="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors opacity-0 group-hover:opacity-100"
									>
										<ChevronRight class="w-5 h-5" />
									</button>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<div class="flex items-center justify-between px-5 py-4 border-t border-slate-100 text-sm text-slate-500">
			<div>
				共 {filtered.length} 条，第 1 / 1 页
			</div>
			<div class="flex items-center gap-1">
				<button class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed">上一页</button>
				<button class="px-3 py-1.5 rounded-lg bg-primary-600 text-white">1</button>
				<button class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-not-allowed">下一页</button>
			</div>
		</div>
	</div>
</div>

{#if showAssignModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
		<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" on:click|stopPropagation>
			<div class="flex items-center justify-between mb-5">
				<h3 class="text-lg font-bold text-slate-900">批量分配技师</h3>
				<button on:click={() => showAssignModal = false} class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
					<X class="w-5 h-5" />
				</button>
			</div>
			<div class="space-y-4">
				<p class="text-sm text-slate-600">为选中的 <span class="font-semibold text-primary-600">{selectedIds.size}</span> 条工单分配技师：</p>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1.5">选择技师</label>
					<select
						bind:value={assignTechId}
						class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
					>
						<option value="">请选择技师...</option>
						{#each mockUsers.filter(u => u.role === 'TECHNICIAN') as u}
							<option value={u.id}>{u.name}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="flex justify-end gap-3 mt-6">
				<button on:click={() => showAssignModal = false} class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors">
					取消
				</button>
				<button
					on:click={handleBatchAssign}
					disabled={!assignTechId}
					class="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-medium transition-colors"
				>
					确认分配
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showStatusModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
		<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" on:click|stopPropagation>
			<div class="flex items-center justify-between mb-5">
				<h3 class="text-lg font-bold text-slate-900">批量修改状态</h3>
				<button on:click={() => showStatusModal = false} class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
					<X class="w-5 h-5" />
				</button>
			</div>
			<div class="space-y-4">
				<p class="text-sm text-slate-600">将选中的 <span class="font-semibold text-primary-600">{selectedIds.size}</span> 条工单更新为：</p>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1.5">选择状态</label>
					<select
						bind:value={assignStatus}
						class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
					>
						<option value="PENDING">待确认</option>
						<option value="CONFIRMED">已确认</option>
						<option value="IN_PROGRESS">施工中</option>
						<option value="INSPECTION">质检中</option>
						<option value="COMPLETED">已完成</option>
						<option value="CANCELLED">已取消</option>
					</select>
				</div>
			</div>
			<div class="flex justify-end gap-3 mt-6">
				<button on:click={() => showStatusModal = false} class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors">
					取消
				</button>
				<button
					on:click={handleBatchStatus}
					class="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors"
				>
					确认修改
				</button>
			</div>
		</div>
	</div>
{/if}
