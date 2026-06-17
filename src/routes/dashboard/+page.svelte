<script lang="ts">
	import { trpc } from '$lib/trpc';
	import {
		LayoutDashboard,
		RefreshCw,
		Loader2,
		TrendingUp,
		AlertTriangle,
		CheckCircle2,
		Wrench,
		Clock,
		BarChart3,
		Building2,
		Flag
	} from 'lucide-svelte';

	let loading = $state(true);
	let dateRange = $state<'day' | 'week' | 'month'>('week');
	let stats = $state<any>(null);
	let trendData = $state<any[]>([]);
	let overdueByArea = $state<any[]>([]);
	let overdueByType = $state<any[]>([]);
	let groupBy = $state<'area' | 'type'>('area');

	async function loadData() {
		loading = true;
		try {
			const now = new Date();
			const startDate = new Date();
			if (dateRange === 'day') startDate.setDate(now.getDate() - 1);
			else if (dateRange === 'week') startDate.setDate(now.getDate() - 7);
			else startDate.setDate(now.getDate() - 30);

			[stats, trendData, overdueByArea, overdueByType] = await Promise.all([
				trpc.dashboard.getCompletionRate.query(),
				trpc.dashboard.getResponseTrend.query({
					range: dateRange,
					startDate: startDate.toISOString(),
					endDate: now.toISOString()
				}),
				trpc.dashboard.getOverdueRate.query({ groupBy: 'area' }),
				trpc.dashboard.getOverdueRate.query({ groupBy: 'type' })
			]);
		} catch (e) {
			console.error('Failed to load dashboard:', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadData();
	});

	const priorityLabels: Record<string, string> = {
		low: '低优先级',
		medium: '中优先级',
		high: '高优先级',
		urgent: '紧急'
	};

	function formatPercent(v: any, total: any) {
		if (!total || total == 0) return '0%';
		return ((Number(v) / Number(total)) * 100).toFixed(1) + '%';
	}

	let maxTrendValue = $derived(
		Math.max(1, ...trendData.map((d: any) => Number(d.avgResponseMinutes || 0)))
	);
	let maxAreaTotal = $derived(
		Math.max(1, ...overdueByArea.map((d: any) => Number(d.total || 0)))
	);
</script>

<div class="p-6 space-y-6 animate-fade-in">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div class="flex items-center gap-3">
			<LayoutDashboard class="w-7 h-7 text-primary" />
			<div>
				<h1 class="text-2xl font-bold text-text">数据看板</h1>
				<p class="text-sm text-text-muted">管理层报修响应趋势与工单概览</p>
			</div>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			<select
				bind:value={dateRange}
				onchange={loadData}
				class="px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer"
			>
				<option value="day">近1天</option>
				<option value="week">近7天</option>
				<option value="month">近30天</option>
			</select>
			<button
				onclick={loadData}
				disabled={loading}
				class="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
			>
				<RefreshCw class="w-4 h-4" class:animate-spin={loading} />
				刷新
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex flex-col items-center justify-center py-16 text-text-muted">
			<Loader2 class="w-8 h-8 animate-spin mb-3" />
			<p>加载中...</p>
		</div>
	{:else}
		<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="bg-surface rounded-xl shadow-sm border border-border p-5">
				<div class="flex items-start justify-between mb-4">
					<div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
						<Wrench class="w-5 h-5" />
					</div>
				</div>
				<div class="text-3xl font-bold text-text mb-1">{stats?.total || 0}</div>
				<div class="text-sm text-text-secondary">工单总数</div>
			</div>

			<div class="bg-surface rounded-xl shadow-sm border border-border p-5">
				<div class="flex items-start justify-between mb-4">
					<div class="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center text-success">
						<CheckCircle2 class="w-5 h-5" />
					</div>
				</div>
				<div class="text-3xl font-bold text-text mb-1">{stats?.completed || 0}</div>
				<div class="text-sm text-text-secondary">
					已完成
					<span class="text-success ml-1">
						({formatPercent(stats?.completed, stats?.total)})
					</span>
				</div>
			</div>

			<div class="bg-surface rounded-xl shadow-sm border border-border p-5">
				<div class="flex items-start justify-between mb-4">
					<div class="w-11 h-11 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
						<Clock class="w-5 h-5" />
					</div>
				</div>
				<div class="text-3xl font-bold text-text mb-1">{stats?.pending || 0} + {stats?.inProgress || 0}</div>
				<div class="text-sm text-text-secondary">处理中 (待受理 + 进行中)</div>
			</div>

			<div class="bg-surface rounded-xl shadow-sm border border-border p-5" class:border-danger={Number(stats?.overdue || 0) > 0}>
				<div class="flex items-start justify-between mb-4">
					<div
						class="w-11 h-11 rounded-xl flex items-center justify-center"
						class:bg-danger/10={Number(stats?.overdue || 0) > 0}
						class:text-danger={Number(stats?.overdue || 0) > 0}
						class:bg-gray-100={Number(stats?.overdue || 0) === 0}
						class:text-gray-500={Number(stats?.overdue || 0) === 0}
					>
						<AlertTriangle class="w-5 h-5" />
					</div>
				</div>
				<div
					class="text-3xl font-bold mb-1"
					class:text-danger={Number(stats?.overdue || 0) > 0}
					class:text-text={Number(stats?.overdue || 0) === 0}
				>
					{stats?.overdue || 0}
				</div>
				<div class="text-sm text-text-secondary">超时工单</div>
			</div>
		</section>

		<section class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<div class="bg-surface rounded-xl shadow-sm border border-border p-5">
				<div class="flex items-center justify-between mb-5">
					<h3 class="text-base font-semibold text-text flex items-center gap-2">
						<TrendingUp class="w-5 h-5 text-primary" />
						平均响应时长趋势
					</h3>
					<span class="text-xs text-text-muted">单位：分钟</span>
				</div>

				{#if trendData.length === 0}
					<div class="text-center py-12 text-text-muted text-sm">
						<BarChart3 class="w-10 h-10 mx-auto mb-2 opacity-40" />
						暂无已完成工单数据
					</div>
				{:else}
					<div class="space-y-3">
						{#each trendData as item (item.date)}
							<div>
								<div class="flex items-center justify-between text-sm mb-1.5">
									<span class="text-text-secondary">{item.date}</span>
									<span class="font-medium text-text">
										{Number(item.avgResponseMinutes || 0).toFixed(0)} 分钟
										<span class="text-text-muted text-xs ml-2">({item.count || 0}单)</span>
									</span>
								</div>
								<div class="h-2.5 bg-gray-100 rounded-full overflow-hidden">
									<div
										class="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
										style="width: {Math.min(100, (Number(item.avgResponseMinutes || 0) / maxTrendValue) * 100)}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="bg-surface rounded-xl shadow-sm border border-border p-5">
				<div class="flex items-center justify-between mb-5">
					<h3 class="text-base font-semibold text-text flex items-center gap-2">
						<BarChart3 class="w-5 h-5 text-danger" />
						超时分布统计
					</h3>
					<select
						bind:value={groupBy}
						onchange={() => {}}
						class="px-2.5 py-1.5 border border-border rounded-lg bg-surface text-xs focus:outline-none cursor-pointer"
					>
						<option value="area">按区域</option>
						<option value="type">按优先级</option>
					</select>
				</div>

				{#if groupBy === 'area'}
					{#if overdueByArea.length === 0}
						<div class="text-center py-12 text-text-muted text-sm">
							<Building2 class="w-10 h-10 mx-auto mb-2 opacity-40" />
							暂无数据
						</div>
					{:else}
						<div class="space-y-3">
							{#each overdueByArea as item (item.buildingName || 'unknown')}
								<div>
									<div class="flex items-center justify-between text-sm mb-1.5">
										<span class="text-text-secondary flex items-center gap-1.5">
											<Building2 class="w-3.5 h-3.5" />
											{item.buildingName || '未知楼宇'}
										</span>
										<span class="font-medium text-text">
											{item.overdue || 0} / {item.total || 0}
											<span
												class="ml-1.5 text-xs"
												class:text-danger={Number(item.overdue || 0) > 0}
											>
												({formatPercent(item.overdue, item.total)})
											</span>
										</span>
									</div>
									<div class="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
										<div
											class="h-full bg-danger rounded-l-full transition-all duration-500"
											style="width: {Number(item.overdue || 0) / Math.max(1, Number(item.total || 0)) * 100}%"
										></div>
										<div
											class="h-full bg-green-400 rounded-r-full transition-all duration-500"
											style="width: {(Number(item.total || 0) - Number(item.overdue || 0)) / Math.max(1, Number(item.total || 0)) * 100}%"
										></div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{:else}
					{#if overdueByType.length === 0}
						<div class="text-center py-12 text-text-muted text-sm">
							<Flag class="w-10 h-10 mx-auto mb-2 opacity-40" />
							暂无数据
						</div>
					{:else}
						<div class="space-y-3">
							{#each overdueByType as item (item.priority)}
								<div>
									<div class="flex items-center justify-between text-sm mb-1.5">
										<span class="text-text-secondary flex items-center gap-1.5">
											<Flag class="w-3.5 h-3.5" />
											{priorityLabels[item.priority] || item.priority}
										</span>
										<span class="font-medium text-text">
											{item.overdue || 0} / {item.total || 0}
											<span
												class="ml-1.5 text-xs"
												class:text-danger={Number(item.overdue || 0) > 0}
											>
												({formatPercent(item.overdue, item.total)})
											</span>
										</span>
									</div>
									<div class="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
										<div
											class="h-full bg-danger rounded-l-full transition-all duration-500"
											style="width: {Number(item.overdue || 0) / Math.max(1, Number(item.total || 0)) * 100}%"
										></div>
										<div
											class="h-full bg-green-400 rounded-r-full transition-all duration-500"
											style="width: {(Number(item.total || 0) - Number(item.overdue || 0)) / Math.max(1, Number(item.total || 0)) * 100}%"
										></div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		</section>
	{/if}
</div>
