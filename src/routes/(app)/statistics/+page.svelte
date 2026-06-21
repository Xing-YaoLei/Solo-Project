<script lang="ts">
	import { onMount } from 'svelte';

	let loading = true;
	let stats: any = null;
	let startDate = '';
	let endDate = '';

	const statusLabels: Record<string, string> = {
		pending: '待处理',
		processing: '处理中',
		abnormal: '异常',
		reviewing: '复核中',
		completed: '已完成',
		closed: '已关闭'
	};

	const abnormalLabels: Record<string, string> = {
		none: '无异常',
		damaged: '物品损坏',
		lost: '物品丢失',
		wrong_item: '物品错误',
		quantity_mismatch: '数量不符',
		other: '其他异常'
	};

	async function loadStats() {
		loading = true;
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
			if (data[0]?.result?.data?.json) {
				stats = data[0].result.data.json;
			}
		} catch (e) {
			console.error('Failed to load statistics:', e);
		} finally {
			loading = false;
		}
	}

	function handleFilter() {
		loadStats();
	}

	function getTotalRecords() {
		if (!stats?.statusCounts) return 0;
		return stats.statusCounts.reduce((sum: number, s: any) => sum + s.count, 0);
	}

	function getTotalAbnormal() {
		if (!stats?.abnormalCounts) return 0;
		return stats.abnormalCounts
			.filter((a: any) => a.abnormalType !== 'none')
			.reduce((sum: number, a: any) => sum + a.count, 0);
	}

	onMount(() => {
		loadStats();
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">数据统计</h1>
	</div>

	<!-- Filters -->
	<div class="card p-4">
		<div class="flex items-end gap-4">
			<div class="flex-1 max-w-xs">
				<label class="label">开始日期</label>
				<input type="date" class="input" bind:value={startDate} />
			</div>
			<div class="flex-1 max-w-xs">
				<label class="label">结束日期</label>
				<input type="date" class="input" bind:value={endDate} />
			</div>
			<button class="btn-primary" on:click={handleFilter}>
				查询
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center h-64">
			<div class="text-gray-500">加载中...</div>
		</div>
	{:else}
		<!-- Summary cards -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<div class="card p-6">
				<div class="text-sm text-gray-500">总核验数</div>
				<div class="text-3xl font-bold text-gray-900 mt-2">{getTotalRecords()}</div>
			</div>
			<div class="card p-6">
				<div class="text-sm text-gray-500">异常总数</div>
				<div class="text-3xl font-bold text-red-600 mt-2">{getTotalAbnormal()}</div>
			</div>
			<div class="card p-6">
				<div class="text-sm text-gray-500">已完成</div>
				<div class="text-3xl font-bold text-green-600 mt-2">
					{stats?.statusCounts?.find((s: any) => s.status === 'completed')?.count || 0}
				</div>
			</div>
			<div class="card p-6">
				<div class="text-sm text-gray-500">已关闭</div>
				<div class="text-3xl font-bold text-gray-600 mt-2">
					{stats?.statusCounts?.find((s: any) => s.status === 'closed')?.count || 0}
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Status distribution -->
			<div class="card p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">状态分布</h2>
				<div class="space-y-3">
					{#each stats?.statusCounts || [] as item}
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">{statusLabels[item.status] || item.status}</span>
							<div class="flex items-center">
								<div class="w-32 h-2 bg-gray-100 rounded-full mr-3 overflow-hidden">
									<div
										class="h-full bg-indigo-500 rounded-full"
										style="width: {getTotalRecords() ? (item.count / getTotalRecords() * 100) : 0}%"
									/>
								</div>
								<span class="text-sm font-medium text-gray-900 w-12 text-right">{item.count}</span>
							</div>
						</div>
					{:else}
						<p class="text-gray-500 text-sm">暂无数据</p>
					{/each}
				</div>
			</div>

			<!-- Abnormal distribution -->
			<div class="card p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">异常类型分布</h2>
				<div class="space-y-3">
					{#each (stats?.abnormalCounts || []).filter((a: any) => a.abnormalType !== 'none') as item}
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">{abnormalLabels[item.abnormalType] || item.abnormalType}</span>
							<div class="flex items-center">
								<div class="w-32 h-2 bg-gray-100 rounded-full mr-3 overflow-hidden">
									<div
										class="h-full bg-red-500 rounded-full"
										style="width: {getTotalAbnormal() ? (item.count / getTotalAbnormal() * 100) : 0}%"
									/>
								</div>
								<span class="text-sm font-medium text-gray-900 w-12 text-right">{item.count}</span>
							</div>
						</div>
					{:else}
						<p class="text-gray-500 text-sm">暂无异常数据</p>
					{/each}
				</div>
			</div>

			<!-- Channel stats -->
			<div class="card p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">来源渠道统计</h2>
				<div class="space-y-3">
					{#each stats?.channelStats || [] as item}
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">{item.channelName || '未分配'}</span>
							<span class="text-sm font-medium text-gray-900">{item.count} 单</span>
						</div>
					{:else}
						<p class="text-gray-500 text-sm">暂无数据</p>
					{/each}
				</div>
			</div>

			<!-- Rider stats -->
			<div class="card p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">骑手活跃度 Top 20</h2>
				<div class="space-y-3 max-h-64 overflow-y-auto">
					{#each stats?.riderStats || [] as item}
						<div class="flex items-center justify-between">
							<div class="flex items-center">
								<span class="text-sm text-gray-900">{item.riderName || '未分配'}</span>
								{#if item.isActive}
									<span class="ml-2 w-2 h-2 rounded-full bg-green-500" />
								{:else}
									<span class="ml-2 w-2 h-2 rounded-full bg-gray-300" />
								{/if}
							</div>
							<span class="text-sm font-medium text-gray-900">{item.count} 单</span>
						</div>
					{:else}
						<p class="text-gray-500 text-sm">暂无数据</p>
					{/each}
				</div>
			</div>

			<!-- Close reasons -->
			<div class="card p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">关闭原因统计</h2>
				<div class="space-y-3">
					{#each stats?.closeReasons || [] as item}
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">{item.closeReason}</span>
							<span class="text-sm font-medium text-gray-900">{item.count} 单</span>
						</div>
					{:else}
						<p class="text-gray-500 text-sm">暂无关闭记录</p>
					{/each}
				</div>
			</div>

			<!-- Responsible person stats -->
			<div class="card p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">责任人统计</h2>
				<div class="space-y-3">
					{#each stats?.responsiblePersonStats || [] as item}
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">{item.responsiblePerson}</span>
							<span class="text-sm font-medium text-gray-900">{item.count} 单</span>
						</div>
					{:else}
						<p class="text-gray-500 text-sm">暂无数据</p>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
