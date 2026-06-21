<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let records: any[] = [];
	let total = 0;
	let page = 1;
	let pageSize = 20;
	let loading = false;

	let abnormalFilter = 'damaged';
	let search = '';
	let startDate = '';
	let endDate = '';

	const abnormalOptions = [
		{ value: 'all', label: '全部异常', count: 0 },
		{ value: 'damaged', label: '物品损坏', count: 0 },
		{ value: 'lost', label: '物品丢失', count: 0 },
		{ value: 'wrong_item', label: '物品错误', count: 0 },
		{ value: 'quantity_mismatch', label: '数量不符', count: 0 },
		{ value: 'other', label: '其他异常', count: 0 }
	];

	function getAbnormalLabel(type: string) {
		const opt = abnormalOptions.find((o) => o.value === type);
		return opt?.label || type;
	}

	function getStatusLabel(status: string) {
		const map: Record<string, string> = {
			pending: '待处理',
			processing: '处理中',
			abnormal: '异常',
			reviewing: '复核中',
			completed: '已完成',
			closed: '已关闭'
		};
		return map[status] || status;
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

	async function loadRecords() {
		loading = true;
		try {
			const res = await fetch(`/api/trpc/verification.list?batch=1`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					'0': {
						json: {
							page,
							pageSize,
							abnormalType: abnormalFilter === 'all' ? undefined : abnormalFilter,
							search: search || undefined,
							startDate: startDate || undefined,
							endDate: endDate || undefined
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

	async function loadStatistics() {
		try {
			const res = await fetch(`/api/trpc/statistics.summary?batch=1`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					'0': {
						json: {
							startDate: startDate || undefined,
							endDate: endDate || undefined
						}
					}
				})
			});

			const data = await res.json();
			if (data[0]?.result?.data?.json?.abnormalCounts) {
				const counts = data[0].result.data.json.abnormalCounts;
				let totalCount = 0;
				counts.forEach((c: any) => {
					const opt = abnormalOptions.find((o) => o.value === c.abnormalType);
					if (opt) {
						opt.count = c.count;
					}
					if (c.abnormalType !== 'none') {
						totalCount += c.count;
					}
				});
				const allOpt = abnormalOptions.find((o) => o.value === 'all');
				if (allOpt) allOpt.count = totalCount;
			}
		} catch (e) {
			console.error('Failed to load statistics:', e);
		}
	}

	function openDetail(id: string) {
		goto(`/record/${id}`);
	}

	$: totalPages = Math.ceil(total / pageSize);

	function handleFilter() {
		page = 1;
		loadRecords();
	}

	onMount(() => {
		loadRecords();
		loadStatistics();
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">异常处理</h1>
	</div>

	<!-- Abnormal type tabs -->
	<div class="card overflow-hidden">
		<div class="border-b border-gray-200">
			<nav class="flex -mb-px">
				{#each abnormalOptions as opt}
					<button
						class="whitespace-nowrap border-b-2 px-6 py-4 text-sm font-medium transition-colors
							{abnormalFilter === opt.value
								? 'border-red-500 text-red-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
						on:click={() => {
							abnormalFilter = opt.value;
							handleFilter();
						}}
					>
						{opt.label}
						<span class="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
							{opt.count}
						</span>
					</button>
				{/each}
			</nav>
		</div>

		<!-- Filters -->
		<div class="p-4 bg-gray-50 border-b border-gray-200">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
				<div>
					<label class="label">搜索</label>
					<input
						type="text"
						class="input"
						placeholder="订单号/物品名称"
						bind:value={search}
						on:keydown={(e) => e.key === 'Enter' && handleFilter()}
					/>
				</div>
				<div>
					<label class="label">开始日期</label>
					<input type="date" class="input" bind:value={startDate} on:change={handleFilter} />
				</div>
				<div>
					<label class="label">结束日期</label>
					<input type="date" class="input" bind:value={endDate} on:change={handleFilter} />
				</div>
				<div class="flex items-end">
					<button class="btn-secondary w-full" on:click={handleFilter}>
						筛选
					</button>
				</div>
			</div>
		</div>

		<!-- Records list -->
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
							异常类型
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							骑手
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							状态
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							责任人
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
							<td colspan="8" class="px-6 py-12 text-center text-gray-500">
								加载中...
							</td>
						</tr>
					{:else if records.length === 0}
						<tr>
							<td colspan="8" class="px-6 py-12 text-center text-gray-500">
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
								</td>
								<td class="whitespace-nowrap px-6 py-4">
									<span class="badge bg-red-100 text-red-800">
										{getAbnormalLabel(record.abnormalType)}
									</span>
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
									{record.rider?.name || '-'}
								</td>
								<td class="whitespace-nowrap px-6 py-4">
									<span class="badge {getStatusColor(record.status)}">
										{getStatusLabel(record.status)}
									</span>
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
									{record.responsiblePerson || '-'}
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
									{formatDate(record.createdAt)}
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-right text-sm">
									<button
										class="text-indigo-600 hover:text-indigo-900"
										on:click|stopPropagation={() => openDetail(record.id)}
									>
										处理
									</button>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

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
