<script lang="ts">
	import { trpcClient } from '$lib/trpc/client';
	import { onMount } from 'svelte';

	let loading = true;
	let stats: any = null;
	let arrivals: any[] = [];
	let departures: any[] = [];
	let exceptions: any[] = [];
	let properties: any[] = [];

	let monthlyTrend: any[] = [];

	async function loadData() {
		loading = true;
		try {
			[stats, arrivals, departures, properties, exceptions, monthlyTrend] = await Promise.all([
				trpcClient.reports.dashboardStats.query(),
				trpcClient.order.getUpcomingArrivals.query({ days: 3 }),
				trpcClient.order.getTodayDepartures.query(),
				trpcClient.property.list.query({ status: 'active' }),
				trpcClient.exception.list.query({ status: 'open' }),
				trpcClient.reports.monthlyOccupancyTrend.query({ months: 6 })
			]);
		} finally {
			loading = false;
		}
	}

	onMount(loadData);

	function formatCurrency(n: number) {
		return '¥' + (n ?? 0).toFixed(2);
	}

	function formatDate(d: any) {
		if (!d) return '-';
		const dt = new Date(d);
		return dt.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', weekday: 'short' });
	}

	const maxRate = Math.max(...(monthlyTrend?.map((m) => m.occupancyRate) ?? [1, 1]));
</script>

<div class="space-y-6">
	{#if loading}
		<div class="card card-body py-12 text-center text-gray-500">加载中...</div>
	{:else}
		<!-- 统计卡片 -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="card card-body">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-sm text-gray-500">活跃房源</div>
						<div class="mt-2 text-3xl font-bold text-gray-900">{stats?.totalProperties ?? 0}</div>
					</div>
					<div class="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
					</div>
				</div>
			</div>
			<div class="card card-body">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-sm text-gray-500">当前订单</div>
						<div class="mt-2 text-3xl font-bold text-gray-900">{stats?.activeOrders ?? 0}</div>
					</div>
					<div class="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
					</div>
				</div>
			</div>
			<div class="card card-body">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-sm text-gray-500">本月入住率</div>
						<div class="mt-2 text-3xl font-bold text-gray-900">{(stats?.monthOccupancyRate ?? 0).toFixed(1)}%</div>
						<div class="mt-1 text-xs text-gray-500">
							{stats?.monthOccupancyDetails?.occupiedRoomNights ?? 0} / {stats?.monthOccupancyDetails?.totalRoomNights ?? 0} 夜
						</div>
					</div>
					<div class="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
					</div>
				</div>
			</div>
			<div class="card card-body">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-sm text-gray-500">本月收入</div>
						<div class="mt-2 text-3xl font-bold text-gray-900">{formatCurrency(stats?.monthRevenue ?? 0)}</div>
						<div class="mt-1 text-xs text-gray-500">
							ADR {formatCurrency(stats?.monthOccupancyDetails?.averageDailyRate ?? 0)}
						</div>
					</div>
					<div class="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
					</div>
				</div>
			</div>
		</div>

		<!-- 快捷信息 -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- 即将入住 -->
			<div class="card">
				<div class="card-header flex items-center justify-between">
					<h3 class="font-semibold text-gray-900">即将入住（3天内）</h3>
					<a href="/orders" class="text-sm text-primary-600 hover:text-primary-700">查看全部 →</a>
				</div>
				<div class="card-body divide-y">
					{#if arrivals.length === 0}
						<div class="py-8 text-center text-gray-400 text-sm">暂无即将入住的订单</div>
					{/if}
					{#each arrivals as ord}
						<div class="py-3 first:pt-0 last:pb-0">
							<div class="flex items-start justify-between">
								<div class="min-w-0">
									<div class="font-medium text-gray-900 truncate">{ord.guestName}</div>
									<div class="text-xs text-gray-500 mt-0.5">{ord.guestPhone}</div>
								</div>
								<div class="text-right">
									<div class="text-sm text-primary-600 font-medium">{formatDate(ord.checkInDate)}</div>
									<div class="text-xs text-gray-400">{ord.nightCount}夜 · {ord.guestCount}人</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 今日退房 -->
			<div class="card">
				<div class="card-header flex items-center justify-between">
					<h3 class="font-semibold text-gray-900">今日退房</h3>
					<div class="flex gap-2">
						<a href="/cleaning" class="text-sm text-primary-600 hover:text-primary-700">保洁 →</a>
						<a href="/orders" class="text-sm text-gray-500 hover:text-gray-700">订单 →</a>
					</div>
				</div>
				<div class="card-body divide-y">
					{#if departures.length === 0}
						<div class="py-8 text-center text-gray-400 text-sm">今日无退房订单</div>
					{/if}
					{#each departures as ord}
						<div class="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
							<div class="min-w-0">
								<div class="font-medium text-gray-900 truncate">{ord.guestName}</div>
								<div class="text-xs text-gray-500 mt-0.5">{ord.orderNo}</div>
							</div>
							<div>
								<span class="badge bg-amber-100 text-amber-800">待退房</span>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 待处理异常 -->
			<div class="card">
				<div class="card-header flex items-center justify-between">
					<h3 class="font-semibold text-gray-900">待处理异常</h3>
					<a href="/exceptions" class="text-sm text-red-600 hover:text-red-700 font-medium">
						{stats?.openExceptions ?? 0} 条待处理 →
					</a>
				</div>
				<div class="card-body divide-y">
					{#if exceptions.length === 0}
						<div class="py-8 text-center text-gray-400 text-sm">暂无待处理异常，运行良好</div>
					{/if}
					{#each exceptions.slice(0, 5) as ex}
						<div class="py-3 first:pt-0 last:pb-0">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<div class="font-medium text-gray-900 text-sm truncate">{ex.title}</div>
									<div class="text-xs text-gray-500 mt-0.5">{ex.exceptionNo} · {formatDate(ex.createdAt)}</div>
								</div>
								<div>
									{#if ex.severity === 'critical'}
										<span class="badge bg-red-100 text-red-800">紧急</span>
									{:else if ex.severity === 'high'}
										<span class="badge bg-orange-100 text-orange-800">高</span>
									{:else if ex.severity === 'medium'}
										<span class="badge bg-yellow-100 text-yellow-800">中</span>
									{:else}
										<span class="badge bg-gray-100 text-gray-800">低</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- 入住率趋势 -->
		<div class="card">
			<div class="card-header flex items-center justify-between">
				<h3 class="font-semibold text-gray-900">近6月入住率趋势</h3>
				<a href="/reports" class="text-sm text-primary-600 hover:text-primary-700">查看详细报表 →</a>
			</div>
			<div class="card-body">
				<div class="h-56 flex items-end gap-4">
					{#each monthlyTrend as m}
						<div class="flex-1 flex flex-col items-center gap-2">
							<div class="w-full flex flex-col justify-end h-44 relative">
								<div class="text-xs text-gray-600 absolute -top-5 left-1/2 -translate-x-1/2 font-medium">{m.occupancyRate.toFixed(0)}%</div>
								<div class="w-full rounded-t-md bg-gradient-to-t from-primary-600 to-primary-400 transition-all" style="height: {maxRate > 0 ? (m.occupancyRate / maxRate * 100) : 0}%"></div>
							</div>
							<div class="text-xs text-gray-500">{m.month}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
