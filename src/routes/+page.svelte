<script lang="ts">
	import { trpc } from '$lib/trpc';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		formatDate, formatDateTime, getTaskTypeLabel, getTaskStatusLabel, getStatusBadge,
		getPriorityLabel, getPriorityBadge, getAnomalyTypeLabel, getComplaintSeverityLabel
	} from '$lib/utils';

	let summary: any = null;
	let todayTasks: any[] = [];
	let pendingAnomalies: any[] = [];
	let openComplaints: any[] = [];
	let cleanerPerf: any[] = [];
	let loading = true;

	onMount(async () => {
		const today = new Date();
		const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14);
		const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14);

		summary = await trpc().report.getSummary.query({ startDate: start, endDate: end });

		const tasksRes = await trpc().cleaningTask.list.query({
			dateFrom: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
			dateTo: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
			pageSize: 10
		});
		todayTasks = tasksRes.items;

		const anomRes = await trpc().anomaly.list.query({ status: 'pending', pageSize: 5 });
		pendingAnomalies = anomRes.items;

		const compRes = await trpc().complaint.list.query({ status: 'open', pageSize: 5 });
		openComplaints = compRes.items;

		cleanerPerf = await trpc().report.getCleanerPerformance.query({
			startDate: new Date(today.getFullYear(), today.getMonth(), 1),
			endDate: today
		});

		loading = false;
	});
</script>

<div class="p-8">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-gray-900">协同台总览</h1>
		<p class="text-gray-500 mt-1">今日概览 · 近30天数据</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="text-gray-500">加载数据中...</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			<div class="card card-body">
				<div class="flex items-start justify-between">
					<div>
						<p class="text-sm text-gray-500 mb-1">保洁任务</p>
						<p class="text-3xl font-bold text-gray-900">{summary?.summary.totalTasks || 0}</p>
						<div class="mt-3 space-y-1 text-xs text-gray-500">
							<div class="flex justify-between">
								<span>已完成</span>
								<span class="text-green-600 font-medium">{summary?.summary.completedTasks || 0}</span>
							</div>
							<div class="flex justify-between">
								<span>完成率</span>
								<span class="font-medium text-gray-700">{summary?.summary.completionRate || 0}%</span>
							</div>
						</div>
					</div>
					<div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
						🧹
					</div>
				</div>
			</div>

			<div class="card card-body">
				<div class="flex items-start justify-between">
					<div>
						<p class="text-sm text-gray-500 mb-1">准时率</p>
						<p class="text-3xl font-bold text-gray-900">{summary?.summary.onTimeRate || 0}%</p>
						<div class="mt-3 space-y-1 text-xs text-gray-500">
							<div class="flex justify-between">
								<span>准时完成</span>
								<span class="text-green-600 font-medium">{summary?.summary.onTimeCompleted || 0}</span>
							</div>
							<div class="flex justify-between">
								<span>进行中</span>
								<span class="text-yellow-600 font-medium">{summary?.summary.inProgressTasks || 0}</span>
							</div>
						</div>
					</div>
					<div class="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl">
						⏱️
					</div>
				</div>
			</div>

			<div class="card card-body">
				<div class="flex items-start justify-between">
					<div>
						<p class="text-sm text-gray-500 mb-1">待处理异常</p>
						<p class="text-3xl font-bold text-red-600">{pendingAnomalies?.length || 0}</p>
						<div class="mt-3 space-y-1 text-xs text-gray-500">
							<div class="flex justify-between">
								<span>漏单</span>
								<span class="text-red-600 font-medium">{summary?.summary.missedTasks || 0}</span>
							</div>
							<div class="flex justify-between">
								<span>待处理客诉</span>
								<span class="text-orange-600 font-medium">{openComplaints?.length || 0}</span>
							</div>
						</div>
					</div>
					<div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-2xl">
						⚠️
					</div>
				</div>
			</div>

			<div class="card card-body">
				<div class="flex items-start justify-between">
					<div>
						<p class="text-sm text-gray-500 mb-1">平均质量分</p>
						<p class="text-3xl font-bold text-gray-900">{summary?.summary.avgQualityScore || 0}</p>
						<div class="mt-3 space-y-1 text-xs text-gray-500">
							<div class="flex justify-between">
								<span>已验收</span>
								<span class="text-green-600 font-medium">{summary?.summary.verifiedTasks || 0}</span>
							</div>
							<div class="flex justify-between">
								<span>已取消</span>
								<span class="text-gray-500 font-medium">{summary?.summary.cancelledTasks || 0}</span>
							</div>
						</div>
					</div>
					<div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl">
						⭐
					</div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2 space-y-6">
				<div class="card">
					<div class="card-header flex justify-between items-center">
						<h2 class="font-semibold text-gray-900">今日/近期保洁任务</h2>
						<button class="btn-secondary text-sm" on:click={() => goto('/tasks')}>
							查看全部 →
						</button>
					</div>
					<div class="overflow-x-auto">
						<table class="table">
							<thead>
								<tr>
									<th>房源</th>
									<th>日期</th>
									<th>保洁员</th>
									<th>类型</th>
									<th>优先级</th>
									<th>状态</th>
								</tr>
							</thead>
							<tbody>
								{#each todayTasks.slice(0, 8) as row}
									<tr>
										<td class="font-medium">{row.property?.name || '-'}</td>
										<td class="text-gray-500">{formatDate(row.task.scheduledDate)}</td>
										<td>{#if row.cleaner?.realName}{row.cleaner.realName}{:else}<span class="text-gray-400">未分配</span>{/if}</td>
										<td>{getTaskTypeLabel(row.task.type)}</td>
										<td><span class="badge badge-{getPriorityBadge(row.task.priority)}">{getPriorityLabel(row.task.priority)}</span></td>
										<td><span class="badge badge-{getStatusBadge(row.task.status)}">{getTaskStatusLabel(row.task.status)}</span></td>
									</tr>
								{/each}
								{#if todayTasks.length === 0}
									<tr><td colspan="6" class="text-center py-8 text-gray-400">暂无任务</td></tr>
								{/if}
							</tbody>
						</table>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="card">
						<div class="card-header flex justify-between items-center">
							<h2 class="font-semibold text-gray-900">待处理异常</h2>
							<button class="btn-secondary text-sm" on:click={() => goto('/anomalies')}>全部 →</button>
						</div>
						<div class="card-body divide-y">
							{#each pendingAnomalies as a}
								<div class="py-3 first:pt-0 last:pb-0">
									<div class="flex items-center">
										<span class="badge badge-danger mr-2">{getAnomalyTypeLabel(a.anomaly.type)}</span>
										<p class="font-medium text-sm">{a.anomaly.title}</p>
									</div>
									<div class="text-xs text-gray-500 mt-1">
										{a.property?.name || '-'} · {formatDateTime(a.anomaly.discoveredAt)}
									</div>
								</div>
							{:else}
								<p class="text-center py-6 text-gray-400 text-sm">暂无待处理异常 🎉</p>
							{/each}
						</div>
					</div>

					<div class="card">
						<div class="card-header flex justify-between items-center">
							<h2 class="font-semibold text-gray-900">待处理客诉</h2>
							<button class="btn-secondary text-sm" on:click={() => goto('/complaints')}>全部 →</button>
						</div>
						<div class="card-body divide-y">
							{#each openComplaints as c}
								<div class="py-3 first:pt-0 last:pb-0">
									<div class="flex items-center">
										<span class="badge badge-warning mr-2">{getComplaintSeverityLabel(c.complaint.severity)}</span>
										<p class="font-medium text-sm truncate">{c.complaint.title}</p>
									</div>
									<div class="text-xs text-gray-500 mt-1">
										{c.property?.name || '-'} · {formatDateTime(c.complaint.filedAt)}
									</div>
								</div>
							{:else}
								<p class="text-center py-6 text-gray-400 text-sm">暂无待处理客诉 🎉</p>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<div class="space-y-6">
				<div class="card">
					<div class="card-header">
						<h2 class="font-semibold text-gray-900">保洁员表现</h2>
						<p class="text-xs text-gray-500 mt-1">本月准时率排名</p>
					</div>
					<div class="card-body space-y-4">
						{#each cleanerPerf as p}
							<div>
								<div class="flex items-center justify-between mb-1">
									<div class="flex items-center">
										<div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
											{p.cleaner.realName?.charAt(0)}
										</div>
										<span class="ml-2 font-medium text-sm">{p.cleaner.realName}</span>
									</div>
									<div class="text-right">
										<span class="font-semibold text-{p.onTimeRate >= 95 ? 'green-600' : p.onTimeRate >= 85 ? 'yellow-600' : 'red-600'}">
											{p.onTimeRate}%
										</span>
									</div>
								</div>
								<div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
									<div class="h-full rounded-full transition-all"
										style="width: {p.onTimeRate}%; background-color: {p.onTimeRate >= 95 ? '#10b981' : p.onTimeRate >= 85 ? '#f59e0b' : '#ef4444'};"></div>
								</div>
								<div class="flex justify-between text-xs text-gray-400 mt-1">
									<span>完成 {p.completed}/{p.total}</span>
									<span>漏单 {p.missed}</span>
								</div>
							</div>
						{:else}
							<p class="text-center py-6 text-gray-400 text-sm">暂无数据</p>
						{/each}
					</div>
				</div>

				<div class="card">
					<div class="card-header">
						<h2 class="font-semibold text-gray-900">快速入口</h2>
					</div>
					<div class="card-body grid grid-cols-2 gap-3">
						<button on:click={() => goto('/tasks')} class="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 text-left transition">
							<div class="text-2xl mb-1">➕</div>
							<div class="text-sm font-medium">创建任务</div>
						</button>
						<button on:click={() => goto('/calendar')} class="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 text-left transition">
							<div class="text-2xl mb-1">📅</div>
							<div class="text-sm font-medium">查看日历</div>
						</button>
						<button on:click={() => goto('/properties')} class="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 text-left transition">
							<div class="text-2xl mb-1">🏠</div>
							<div class="text-sm font-medium">房源管理</div>
						</button>
						<button on:click={() => goto('/reports')} class="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 text-left transition">
							<div class="text-2xl mb-1">📊</div>
							<div class="text-sm font-medium">导出报表</div>
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<script lang="ts" context="module">
</script>
