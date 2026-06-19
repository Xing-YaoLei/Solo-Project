<script lang="ts">
	import { trpc } from '$lib/client/trpc';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let checking = $state(false);

	const statCards = $derived([
		{ label: '待处理', count: data.complaintStats.pending, color: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700' },
		{ label: '处理中', count: data.complaintStats.inProgress, color: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700' },
		{ label: '已超时', count: data.complaintStats.overdue, color: 'bg-red-500', light: 'bg-red-50', text: 'text-red-700' },
		{ label: '已关闭', count: data.complaintStats.closed, color: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700' }
	]);

	const maxBucketCount = $derived(
		Math.max(...(data.closureDurationReport?.buckets ?? []).map((b) => b.count), 1)
	);

	async function handleCheckOverdue() {
		checking = true;
		try {
			await trpc.complaint.checkOverdue.mutate();
			await invalidateAll();
		} finally {
			checking = false;
		}
	}

	function truncate(str: string, len: number): string {
		if (str.length <= len) return str;
		return str.slice(0, len) + '…';
	}

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
	}
</script>

<svelte:head>
	<title>工作台 - 景区投诉协同台</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-slate-800">工作台</h1>
		<button
			onclick={handleCheckOverdue}
			disabled={checking}
			class="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			{checking ? '检查中...' : '检查超时'}
		</button>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each statCards as card}
			<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
				<div class="{card.light} {card.text} w-12 h-12 rounded-lg flex items-center justify-center">
					<span class="text-2xl font-bold">{card.count}</span>
				</div>
				<div>
					<p class="text-sm text-slate-500">{card.label}</p>
					<p class="text-2xl font-bold text-slate-800">{card.count}</p>
				</div>
				<div class="ml-auto w-1 h-10 {card.color} rounded-full"></div>
			</div>
		{/each}
	</div>

	{#if data.canViewReport}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
			<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
				<div class="flex items-center gap-2 mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
					</svg>
					<h2 class="text-base font-semibold text-slate-800">关闭时长分布</h2>
				</div>
				<div class="space-y-3">
					{#each data.closureDurationReport.buckets as bucket}
						<div>
							<div class="flex items-center justify-between text-sm mb-1">
								<span class="text-slate-600">{bucket.label}</span>
								<span class="font-medium text-slate-800">{bucket.count} 件</span>
							</div>
							<div class="w-full bg-slate-100 rounded-full h-5 overflow-hidden">
								<div
									class="h-full rounded-full transition-all duration-500 {bucket.label === '0-24h' ? 'bg-emerald-400' : bucket.label === '24-48h' ? 'bg-blue-400' : bucket.label === '48-72h' ? 'bg-amber-400' : 'bg-red-400'}"
									style="width: {Math.max((bucket.count / maxBucketCount) * 100, 2)}%"
								></div>
							</div>
							{#if bucket.count > 0}
								<p class="text-xs text-slate-400 mt-0.5">平均 {bucket.avgHours.toFixed(1)}h</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
				<div class="flex items-center gap-2 mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					<h2 class="text-base font-semibold text-slate-800">日期趋势</h2>
				</div>
				<div class="overflow-auto max-h-72">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-slate-100">
								<th class="text-left py-2 text-slate-500 font-medium">日期</th>
								<th class="text-right py-2 text-slate-500 font-medium">待处理</th>
								<th class="text-right py-2 text-slate-500 font-medium">处理中</th>
								<th class="text-right py-2 text-slate-500 font-medium">已解决</th>
								<th class="text-right py-2 text-slate-500 font-medium">已关闭</th>
							</tr>
						</thead>
						<tbody>
							{#each data.dateReport.dates.slice(-10).reverse() as row}
								<tr class="border-b border-slate-50">
									<td class="py-2 text-slate-700">{row.date}</td>
									<td class="text-right py-2"><span class="inline-block min-w-[20px] text-center text-amber-700 bg-amber-50 rounded px-1">{row.pending}</span></td>
									<td class="text-right py-2"><span class="inline-block min-w-[20px] text-center text-blue-700 bg-blue-50 rounded px-1">{row.inProgress}</span></td>
									<td class="text-right py-2"><span class="inline-block min-w-[20px] text-center text-violet-700 bg-violet-50 rounded px-1">{row.resolved}</span></td>
									<td class="text-right py-2"><span class="inline-block min-w-[20px] text-center text-emerald-700 bg-emerald-50 rounded px-1">{row.closed}</span></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
				<div class="flex items-center gap-2 mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
					<h2 class="text-base font-semibold text-slate-800">负责人统计</h2>
				</div>
				<div class="overflow-auto max-h-72">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-slate-100">
								<th class="text-left py-2 text-slate-500 font-medium">负责人</th>
								<th class="text-right py-2 text-slate-500 font-medium">总计</th>
								<th class="text-right py-2 text-slate-500 font-medium">已解决</th>
								<th class="text-right py-2 text-slate-500 font-medium">已关闭</th>
							</tr>
						</thead>
						<tbody>
							{#each data.assigneeReport.assignees as a}
								<tr class="border-b border-slate-50">
									<td class="py-2 text-slate-700">{a.assigneeName}</td>
									<td class="text-right py-2 font-medium text-slate-800">{a.total}</td>
									<td class="text-right py-2 text-violet-600">{a.resolved}</td>
									<td class="text-right py-2 text-emerald-600">{a.closed}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{:else}
		<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
			<div class="text-center">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				<p class="text-sm text-slate-500">报表功能需要报表查看权限</p>
				<p class="text-xs text-slate-400 mt-1">请联系管理员开通 report:view 权限</p>
			</div>
		</div>
	{/if}

	<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
		<div class="flex items-center justify-between mb-4">
			<div class="flex items-center gap-2">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<h2 class="text-base font-semibold text-slate-800">超时待办预览</h2>
			</div>
			<a href="/complaints/overdue" class="text-sm text-primary-600 hover:text-primary-700 font-medium transition">查看全部 →</a>
		</div>
		{#if data.overdueItems.items.length === 0}
			<p class="text-sm text-slate-400 text-center py-8">暂无超时待办</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-slate-100">
							<th class="text-left py-2.5 text-slate-500 font-medium">负责人</th>
							<th class="text-left py-2.5 text-slate-500 font-medium">描述</th>
							<th class="text-left py-2.5 text-slate-500 font-medium">截止时间</th>
							<th class="text-right py-2.5 text-slate-500 font-medium">操作</th>
						</tr>
					</thead>
					<tbody>
						{#each data.overdueItems.items as item}
							<tr class="border-b border-slate-50 hover:bg-slate-50 transition">
								<td class="py-2.5">
									<span class="inline-flex items-center gap-1.5">
										<span class="w-6 h-6 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xs font-medium">
											{item.assigneeName?.[0] ?? '-'}
										</span>
										<span class="text-slate-700">{item.assigneeName ?? '未分配'}</span>
									</span>
								</td>
								<td class="py-2.5 text-slate-600 max-w-xs">{truncate(item.description, 40)}</td>
								<td class="py-2.5">
									<span class="text-red-600 font-medium">{item.deadline ? formatDate(item.deadline) : '-'}</span>
								</td>
								<td class="text-right py-2.5">
									<a href="/complaints/{item.id}" class="text-primary-600 hover:text-primary-700 font-medium transition">查看</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
