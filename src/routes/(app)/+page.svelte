<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let records: any[] = [];
	let total = 0;
	let page = 1;
	let pageSize = 20;
	let loading = false;
	let showCreateModal = false;

	let filters = {
		status: '',
		abnormalType: '',
		search: '',
		startDate: '',
		endDate: ''
	};

	const statusOptions = [
		{ value: '', label: '全部状态' },
		{ value: 'pending', label: '待处理' },
		{ value: 'processing', label: '处理中' },
		{ value: 'abnormal', label: '异常' },
		{ value: 'reviewing', label: '复核中' },
		{ value: 'completed', label: '已完成' },
		{ value: 'closed', label: '已关闭' }
	];

	const abnormalOptions = [
		{ value: 'all', label: '全部异常' },
		{ value: 'none', label: '无异常' },
		{ value: 'damaged', label: '物品损坏' },
		{ value: 'lost', label: '物品丢失' },
		{ value: 'wrong_item', label: '物品错误' },
		{ value: 'quantity_mismatch', label: '数量不符' },
		{ value: 'other', label: '其他异常' }
	];

	function getStatusLabel(status: string) {
		const opt = statusOptions.find((o) => o.value === status);
		return opt?.label || status;
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'processing':
				return 'bg-blue-100 text-blue-800';
			case 'abnormal':
				return 'bg-red-100 text-red-800';
			case 'reviewing':
				return 'bg-purple-100 text-purple-800';
			case 'completed':
				return 'bg-green-100 text-green-800';
			case 'closed':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getAbnormalLabel(type: string) {
		const opt = abnormalOptions.find((o) => o.value === type);
		return opt?.label || type;
	}

	function getAbnormalColor(type: string) {
		if (type === 'none' || !type) return 'bg-green-100 text-green-800';
		return 'bg-red-100 text-red-800';
	}

	async function loadRecords() {
		loading = true;
		try {
			const params = new URLSearchParams({
				page: String(page),
				pageSize: String(pageSize),
				...filters
			});

			const res = await fetch(`/api/trpc/verification.list?batch=1`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					'0': {
						json: {
							page,
							pageSize,
							status: filters.status || undefined,
							abnormalType: filters.abnormalType || undefined,
							search: filters.search || undefined,
							startDate: filters.startDate || undefined,
							endDate: filters.endDate || undefined
						}
					}
				})
			});

			const data = await res.json();
			if (data[0]?.result?.data?.json) {
				records = data[0].result.data.json.records;
				total = data[0].result.data.json.total;
			}
		} catch (e) {
			console.error('Failed to load records:', e);
		} finally {
			loading = false;
		}
	}

	function handleFilter() {
		page = 1;
		loadRecords();
	}

	function openDetail(id: string) {
		goto(`/record/${id}`);
	}

	function formatDate(date: string | Date) {
		const d = new Date(date);
		return d.toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	$: totalPages = Math.ceil(total / pageSize);

	onMount(() => {
		loadRecords();
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">核验记录</h1>
		<button class="btn-primary" on:click={() => (showCreateModal = true)}>
			+ 新建核验
		</button>
	</div>

	<!-- Filters -->
	<div class="card p-4">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
			<div>
				<label class="label">状态</label>
				<select class="select" bind:value={filters.status} on:change={handleFilter}>
					{#each statusOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="label">异常类型</label>
				<select class="select" bind:value={filters.abnormalType} on:change={handleFilter}>
					{#each abnormalOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="label">搜索</label>
				<input
					type="text"
					class="input"
					placeholder="订单号/物品名称"
					bind:value={filters.search}
					on:keydown={(e) => e.key === 'Enter' && handleFilter()}
				/>
			</div>

			<div>
				<label class="label">开始日期</label>
				<input type="date" class="input" bind:value={filters.startDate} on:change={handleFilter} />
			</div>

			<div>
				<label class="label">结束日期</label>
				<input type="date" class="input" bind:value={filters.endDate} on:change={handleFilter} />
			</div>
		</div>
	</div>

	<!-- Records table -->
	<div class="card overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							订单号
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							物品
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							骑手
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							状态
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							异常
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							创建时间
						</th>
						<th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
							操作
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#if loading}
						<tr>
							<td colspan="7" class="px-6 py-12 text-center text-gray-500">
								加载中...
							</td>
						</tr>
					{:else if records.length === 0}
						<tr>
							<td colspan="7" class="px-6 py-12 text-center text-gray-500">
								暂无数据
							</td>
						</tr>
					{:else}
						{#each records as record}
							<tr class="hover:bg-gray-50 cursor-pointer" on:click={() => openDetail(record.id)}>
								<td class="whitespace-nowrap px-6 py-4">
									<div class="text-sm font-medium text-gray-900">{record.orderNo}</div>
								</td>
								<td class="px-6 py-4">
									<div class="text-sm text-gray-900">{record.itemName}</div>
									<div class="text-sm text-gray-500">x{record.itemQuantity}</div>
								</td>
								<td class="whitespace-nowrap px-6 py-4">
									<div class="text-sm text-gray-900">
										{record.rider?.name || '未分配'}
									</div>
									{#if record.rider}
										<div class="text-xs text-gray-500">{record.rider.phone}</div>
									{/if}
								</td>
								<td class="whitespace-nowrap px-6 py-4">
									<span class="badge {getStatusColor(record.status)}">
										{getStatusLabel(record.status)}
									</span>
								</td>
								<td class="whitespace-nowrap px-6 py-4">
									<span class="badge {getAbnormalColor(record.abnormalType)}">
										{getAbnormalLabel(record.abnormalType)}
									</span>
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
									{formatDate(record.createdAt)}
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-right text-sm">
									<button
										class="text-indigo-600 hover:text-indigo-900"
										on:click|stopPropagation={() => openDetail(record.id)}
									>
										查看
									</button>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if total > 0}
			<div class="flex items-center justify-between border-t border-gray-200 px-6 py-3">
				<div class="text-sm text-gray-500">
					共 {total} 条记录，第 {page} / {totalPages} 页
				</div>
				<div class="flex space-x-2">
					<button
						class="btn-secondary px-3 py-1"
						disabled={page <= 1}
						on:click={() => {
							page--;
							loadRecords();
						}}
					>
						上一页
					</button>
					<button
						class="btn-secondary px-3 py-1"
						disabled={page >= totalPages}
						on:click={() => {
							page++;
							loadRecords();
						}}
					>
						下一页
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Create Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:p-0">
			<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" on:click={() => (showCreateModal = false)} />

			<div class="relative inline-block w-full max-w-2xl transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all">
				<div class="px-6 py-4 border-b border-gray-200">
					<h3 class="text-lg font-medium text-gray-900">新建核验记录</h3>
				</div>

				<div class="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
					<p class="text-sm text-gray-500">
						请前往详情页创建完整的核验记录，或使用扫码录入。
					</p>
					<p class="text-sm text-gray-500">
						功能开发中...
					</p>
				</div>

				<div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
					<button class="btn-secondary" on:click={() => (showCreateModal = false)}>
						取消
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
