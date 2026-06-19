<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let activeTab = $state<'duration' | 'date' | 'assignee'>('duration');
	let startDate = $state(data.filters.startDate ?? '');
	let endDate = $state(data.filters.endDate ?? '');

	const tabs = [
		{ key: 'duration', label: '关闭时长分布' },
		{ key: 'date', label: '日期趋势' },
		{ key: 'assignee', label: '负责人统计' }
	];

	function applyDateFilter() {
		const params = new URLSearchParams();
		if (startDate) params.set('startDate', startDate);
		if (endDate) params.set('endDate', endDate);
		goto(`/reports?${params.toString()}`);
	}

	function clearDateFilter() {
		startDate = '';
		endDate = '';
		goto('/reports');
	}

	const maxDurationCount = $derived(
		Math.max(...data.closureDurationReport.buckets.map((b) => b.count), 1)
	);

	const maxDateTotal = $derived(
		Math.max(...data.dateReport.dates.map((d) => d.total), 1)
	);

	const maxAssigneeTotal = $derived(
		Math.max(...data.assigneeReport.assignees.map((a) => a.total), 1)
	);

	const totalComplaints = $derived(
		data.dateReport.dates.reduce((sum, d) => sum + d.total, 0)
	);

	const avgCloseHours = $derived(() => {
		const all = data.closureDurationReport.buckets;
		let total = 0;
		let count = 0;
		for (const b of all) {
			total += b.avgHours * b.count;
			count += b.count;
		}
		return count > 0 ? total / count : 0;
	});
</script>

<svelte:head>
	<title>数据报表 - 景区投诉协同台</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-slate-800">数据报表</h1>
		<div class="flex items-center gap-2">
			{#if data.canExport}
				<a
					href={(() => {
						const params = new URLSearchParams();
						params.set('type', activeTab === 'duration' ? 'duration' : activeTab === 'date' ? 'date' : activeTab === 'assignee' ? 'assignee' : 'all');
						if (data.filters.startDate) params.set('startDate', data.filters.startDate);
						if (data.filters.endDate) params.set('endDate', data.filters.endDate);
						return `/api/export?${params.toString()}`;
					})()}
					class="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					导出报表
				</a>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
			<p class="text-sm text-slate-500 mb-1">投诉总数</p>
			<p class="text-2xl font-bold text-slate-800">{totalComplaints}</p>
		</div>
		<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
			<p class="text-sm text-slate-500 mb-1">平均关闭时长</p>
			<p class="text-2xl font-bold text-primary-600">{avgCloseHours().toFixed(1)}h</p>
		</div>
		<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
			<p class="text-sm text-slate-500 mb-1">已解决</p>
			<p class="text-2xl font-bold text-green-600">
				{data.dateReport.dates.reduce((sum, d) => sum + d.resolved, 0)}
			</p>
		</div>
		<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
			<p class="text-sm text-slate-500 mb-1">已关闭</p>
			<p class="text-2xl font-bold text-slate-600">
				{data.dateReport.dates.reduce((sum, d) => sum + d.closed, 0)}
			</p>
		</div>
	</div>

	<div class="bg-white rounded-xl shadow-sm border border-slate-200">
		<div class="border-b border-slate-200 px-5">
			<div class="flex items-center justify-between">
				<div class="flex gap-6">
					{#each tabs as tab}
						<button
							onclick={() => activeTab = tab.key as typeof activeTab}
							class="py-3 text-sm font-medium border-b-2 transition {activeTab === tab.key
								? 'border-primary-600 text-primary-600'
								: 'border-transparent text-slate-500 hover:text-slate-700'}"
						>
							{tab.label}
						</button>
					{/each}
				</div>

				{#if activeTab === 'date'}
					<div class="flex items-center gap-2 py-2">
						<input
							type="date"
							bind:value={startDate}
							class="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						/>
						<span class="text-slate-400">至</span>
						<input
							type="date"
							bind:value={endDate}
							class="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						/>
						<button
							onclick={applyDateFilter}
							class="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition"
						>
							筛选
						</button>
						{#if data.filters.startDate || data.filters.endDate}
							<button
								onclick={clearDateFilter}
								class="text-sm text-slate-500 hover:text-slate-700 transition"
							>
								清除
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<div class="p-5">
			{#if activeTab === 'duration'}
				<div class="space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{#each data.closureDurationReport.buckets as bucket}
							<div class="bg-slate-50 rounded-xl p-5">
								<div class="flex items-end justify-between mb-3">
									<div>
										<p class="text-sm text-slate-500">{bucket.label}</p>
										<p class="text-3xl font-bold text-slate-800 mt-1">{bucket.count}</p>
									</div>
									<span class="text-sm text-slate-400">件</span>
								</div>
								<div class="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
									<div
										class="h-full rounded-full transition-all duration-700 {bucket.label === '0-24h'
											? 'bg-emerald-500'
											: bucket.label === '24-48h'
											? 'bg-blue-500'
											: bucket.label === '48-72h'
											? 'bg-amber-500'
											: 'bg-red-500'}"
										style="width: {(bucket.count / maxDurationCount) * 100}%"
									></div>
								</div>
								<p class="text-xs text-slate-400 mt-2">
									平均 {bucket.avgHours.toFixed(1)} 小时
								</p>
							</div>
						{/each}
					</div>

					<div class="pt-4 border-t border-slate-100">
						<h3 class="text-sm font-semibold text-slate-800 mb-4">关闭时长分布详情</h3>
						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead>
									<tr class="border-b border-slate-200">
										<th class="text-left py-3 text-slate-600 font-medium">时长区间</th>
										<th class="text-right py-3 text-slate-600 font-medium">投诉数量</th>
										<th class="text-right py-3 text-slate-600 font-medium">占比</th>
										<th class="text-right py-3 text-slate-600 font-medium">平均时长</th>
									</tr>
								</thead>
								<tbody>
									{#each data.closureDurationReport.buckets as bucket}
										<tr class="border-b border-slate-100 hover:bg-slate-50">
											<td class="py-3">
												<span class="inline-flex items-center gap-2">
													<span class="w-3 h-3 rounded-full {bucket.label === '0-24h'
														? 'bg-emerald-500'
														: bucket.label === '24-48h'
														? 'bg-blue-500'
														: bucket.label === '48-72h'
														? 'bg-amber-500'
														: 'bg-red-500'}"></span>
													{bucket.label}
												</span>
											</td>
											<td class="text-right py-3 font-medium text-slate-800">{bucket.count}</td>
											<td class="text-right py-3 text-slate-600">
												{((bucket.count / Math.max(data.closureDurationReport.buckets.reduce((s, b) => s + b.count, 0), 1)) * 100).toFixed(1)}%
											</td>
											<td class="text-right py-3 text-slate-600">{bucket.avgHours.toFixed(1)}h</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>

			{:else if activeTab === 'date'}
				<div class="space-y-6">
					<div class="h-64 flex items-end gap-2 px-4">
						{#each data.dateReport.dates.slice(-14) as row}
							<div class="flex-1 flex flex-col items-center gap-2">
								<div class="w-full bg-slate-100 rounded-t-lg relative" style="height: {Math.max((row.total / maxDateTotal) * 100, 2)}%">
									<div class="absolute inset-0 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg hover:from-primary-600 hover:to-primary-500 transition cursor-pointer">
										<div class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-700 opacity-0 hover:opacity-100 transition">
											{row.total}
										</div>
									</div>
								</div>
								<span class="text-xs text-slate-500 whitespace-nowrap">
									{row.date.slice(5)}
								</span>
							</div>
						{/each}
					</div>

					<div class="pt-4 border-t border-slate-100">
						<h3 class="text-sm font-semibold text-slate-800 mb-4">日期明细</h3>
						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead>
									<tr class="border-b border-slate-200">
										<th class="text-left py-3 text-slate-600 font-medium">日期</th>
										<th class="text-right py-3 text-slate-600 font-medium">总数</th>
										<th class="text-right py-3 text-slate-600 font-medium">待处理</th>
										<th class="text-right py-3 text-slate-600 font-medium">处理中</th>
										<th class="text-right py-3 text-slate-600 font-medium">已解决</th>
										<th class="text-right py-3 text-slate-600 font-medium">已关闭</th>
									</tr>
								</thead>
								<tbody>
									{#each data.dateReport.dates.slice().reverse() as row}
										<tr class="border-b border-slate-100 hover:bg-slate-50">
											<td class="py-3 text-slate-800 font-medium">{row.date}</td>
											<td class="text-right py-3 text-slate-800 font-medium">{row.total}</td>
											<td class="text-right py-3">
												<span class="inline-block min-w-[24px] text-center text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 text-xs">
													{row.pending}
												</span>
											</td>
											<td class="text-right py-3">
												<span class="inline-block min-w-[24px] text-center text-blue-700 bg-blue-50 rounded px-1.5 py-0.5 text-xs">
													{row.inProgress}
												</span>
											</td>
											<td class="text-right py-3">
												<span class="inline-block min-w-[24px] text-center text-green-700 bg-green-50 rounded px-1.5 py-0.5 text-xs">
													{row.resolved}
												</span>
											</td>
											<td class="text-right py-3">
												<span class="inline-block min-w-[24px] text-center text-slate-700 bg-slate-100 rounded px-1.5 py-0.5 text-xs">
													{row.closed}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>

			{:else if activeTab === 'assignee'}
				<div class="space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each data.assigneeReport.assignees as person}
							<div class="bg-slate-50 rounded-xl p-5">
								<div class="flex items-center gap-3 mb-4">
									<div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
										<span class="text-lg font-semibold text-primary-700">
											{person.assigneeName?.[0] ?? '-'}
										</span>
									</div>
									<div>
										<p class="font-medium text-slate-800">{person.assigneeName}</p>
										<p class="text-sm text-slate-500">{person.total} 件投诉</p>
									</div>
								</div>
								<div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
									<div
										class="h-full bg-primary-500 rounded-full transition-all duration-500"
										style="width: {(person.total / maxAssigneeTotal) * 100}%"
									></div>
								</div>
								<div class="grid grid-cols-3 gap-2 mt-4 text-center">
									<div class="bg-white rounded-lg p-2">
										<p class="text-lg font-semibold text-slate-800">{person.pending}</p>
										<p class="text-xs text-slate-500">待处理</p>
									</div>
									<div class="bg-white rounded-lg p-2">
										<p class="text-lg font-semibold text-slate-800">{person.resolved}</p>
										<p class="text-xs text-slate-500">已解决</p>
									</div>
									<div class="bg-white rounded-lg p-2">
										<p class="text-lg font-semibold text-slate-800">{person.closed}</p>
										<p class="text-xs text-slate-500">已关闭</p>
									</div>
								</div>
								<p class="text-xs text-slate-400 mt-3 text-center">
									平均关闭时长: {person.avgCloseHours.toFixed(1)}h
								</p>
							</div>
						{/each}
					</div>

					<div class="pt-4 border-t border-slate-100">
						<h3 class="text-sm font-semibold text-slate-800 mb-4">负责人排行榜</h3>
						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead>
									<tr class="border-b border-slate-200">
										<th class="text-left py-3 text-slate-600 font-medium">排名</th>
										<th class="text-left py-3 text-slate-600 font-medium">负责人</th>
										<th class="text-right py-3 text-slate-600 font-medium">处理总数</th>
										<th class="text-right py-3 text-slate-600 font-medium">已解决</th>
										<th class="text-right py-3 text-slate-600 font-medium">已关闭</th>
										<th class="text-right py-3 text-slate-600 font-medium">平均关闭时长</th>
									</tr>
								</thead>
								<tbody>
									{#each [...data.assigneeReport.assignees].sort((a, b) => b.total - a.total) as person, index}
										<tr class="border-b border-slate-100 hover:bg-slate-50">
											<td class="py-3">
												{#if index === 0}
													<span class="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">1</span>
												{:else if index === 1}
													<span class="inline-flex items-center justify-center w-6 h-6 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">2</span>
												{:else if index === 2}
													<span class="inline-flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">3</span>
												{:else}
													<span class="text-slate-400 text-sm">{index + 1}</span>
												{/if}
											</td>
											<td class="py-3">
												<div class="flex items-center gap-2">
													<div class="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
														<span class="text-xs font-medium text-primary-700">
															{person.assigneeName?.[0] ?? '-'}
														</span>
													</div>
													<span class="text-slate-800 font-medium">{person.assigneeName}</span>
												</div>
											</td>
											<td class="text-right py-3 font-medium text-slate-800">{person.total}</td>
											<td class="text-right py-3 text-green-600">{person.resolved}</td>
											<td class="text-right py-3 text-slate-600">{person.closed}</td>
											<td class="text-right py-3 text-slate-600">{person.avgCloseHours.toFixed(1)}h</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
