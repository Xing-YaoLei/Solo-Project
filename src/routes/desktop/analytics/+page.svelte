<script lang="ts">
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';

	interface ScheduleAnalysis {
		projectId: string;
		projectName: string;
		plannedDuration: number;
		actualDuration: number;
		deviationDays: number;
		status: 'delayed' | 'ahead' | 'on_schedule';
	}

	let analysisData: ScheduleAnalysis[] = [];
	let loading = true;
	let statusFilter = 'all';

	const delayReasons = [
		{ name: '材料延期', count: 12, color: 'bg-red-500' },
		{ name: '设计变更', count: 8, color: 'bg-amber-500' },
		{ name: '天气原因', count: 5, color: 'bg-blue-500' },
		{ name: '施工问题', count: 4, color: 'bg-green-500' },
		{ name: '其他原因', count: 3, color: 'bg-purple-500' }
	];

	let maxDuration = 0;
	let totalDelayDays = 0;
	let avgDelayDays = 0;
	let delayedCount = 0;
	let aheadCount = 0;
	let onScheduleCount = 0;
	let totalReasons = 0;

	const filteredData = $derived(statusFilter === 'all'
		? analysisData
		: analysisData.filter((d) => d.status === statusFilter));

	$effect(() => {
		if (analysisData.length > 0) {
			maxDuration = Math.max(...filteredData.flatMap((d) => [d.plannedDuration, d.actualDuration]));

			delayedCount = analysisData.filter((d) => d.status === 'delayed').length;
			aheadCount = analysisData.filter((d) => d.status === 'ahead').length;
			onScheduleCount = analysisData.filter((d) => d.status === 'on_schedule').length;

			totalDelayDays = analysisData
				.filter((d) => d.deviationDays > 0)
				.reduce((sum, d) => sum + d.deviationDays, 0);

			avgDelayDays = delayedCount > 0 ? Math.round(totalDelayDays / delayedCount) : 0;

			totalReasons = delayReasons.reduce((sum, r) => sum + r.count, 0);
		}
	});

	onMount(async () => {
		try {
			analysisData = await trpc.common.getScheduleAnalysis.query();
		} catch (error) {
			console.error('Failed to load schedule analysis:', error);
		} finally {
			loading = false;
		}
	});

	async function handleExport() {
		const result = await trpc.common.exportData.query({
			type: 'change_order',
			filters: { status: statusFilter }
		});
		const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', result.fileName);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function getStatusLabel(status: string) {
		switch (status) {
			case 'delayed':
				return '延期';
			case 'ahead':
				return '提前';
			case 'on_schedule':
				return '按时';
			default:
				return status;
		}
	}

	function getStatusClass(status: string) {
		switch (status) {
			case 'delayed':
				return 'bg-red-100 text-red-800';
			case 'ahead':
				return 'bg-green-100 text-green-800';
			case 'on_schedule':
				return 'bg-blue-100 text-blue-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getDeviationClass(days: number) {
		if (days > 0) return 'text-red-600';
		if (days < 0) return 'text-green-600';
		return 'text-gray-600';
	}

	function getPieSliceStyle(count: number, index: number) {
		const percentage = (count / totalReasons) * 100;
		let rotation = 0;
		for (let i = 0; i < index; i++) {
			rotation += (delayReasons[i].count / totalReasons) * 360;
		}
		return `--percentage: ${percentage}; --rotation: ${rotation}deg;`;
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">工期偏差分析</h1>
			<p class="mt-1 text-sm text-gray-500">分析各项目的工期执行情况，识别延期风险</p>
		</div>
		<button
			onclick={handleExport}
			class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
			</svg>
			导出报告
		</button>
	</div>

	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-500">项目总数</p>
					<p class="mt-2 text-3xl font-bold text-gray-900">{analysisData.length}</p>
				</div>
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500 text-white">
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
					</svg>
				</div>
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-500">延期项目</p>
					<p class="mt-2 text-3xl font-bold text-red-600">{delayedCount}</p>
				</div>
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500 text-white">
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
					</svg>
				</div>
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-500">提前项目</p>
					<p class="mt-2 text-3xl font-bold text-green-600">{aheadCount}</p>
				</div>
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500 text-white">
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6-6 6 6M6 7.5h12" />
					</svg>
				</div>
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-500">平均延期</p>
					<p class="mt-2 text-3xl font-bold text-amber-600">{avgDelayDays} 天</p>
				</div>
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500 text-white">
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
					</svg>
				</div>
			</div>
		</div>
	</div>

	<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<h2 class="text-lg font-semibold text-gray-900">工期偏差柱状图</h2>
			<div class="flex flex-wrap items-center gap-4">
				<div class="flex items-center gap-2 text-sm">
					<div class="h-3 w-3 rounded bg-blue-500" />
					<span class="text-gray-600">计划工期</span>
				</div>
				<div class="flex items-center gap-2 text-sm">
					<div class="h-3 w-3 rounded bg-amber-500" />
					<span class="text-gray-600">实际工期</span>
				</div>
				<select
					bind:value={statusFilter}
					class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
				>
					<option value="all">全部状态</option>
					<option value="delayed">延期</option>
					<option value="ahead">提前</option>
					<option value="on_schedule">按时</option>
				</select>
			</div>
		</div>

		{#if loading}
			<div class="mt-8 flex h-64 items-center justify-center">
				<div class="text-gray-500">加载中...</div>
			</div>
		{:else if filteredData.length === 0}
			<div class="mt-8 flex h-64 items-center justify-center">
				<div class="text-gray-500">暂无数据</div>
			</div>
		{:else}
			<div class="mt-8">
				<div class="flex items-end justify-between gap-2 h-64 px-4 overflow-x-auto">
					{#each filteredData as item}
						<div class="flex min-w-[80px] flex-col items-center gap-2">
							<div class="flex w-full items-end justify-center gap-1 h-48">
								<div
									class="w-6 bg-blue-500 rounded-t transition-all hover:opacity-80"
									style="height: {(item.plannedDuration / maxDuration) * 100}%"
									title={`计划工期: ${item.plannedDuration}天`}
								/>
								<div
									class="w-6 bg-amber-500 rounded-t transition-all hover:opacity-80"
									style="height: {(item.actualDuration / maxDuration) * 100}%"
									title={`实际工期: ${item.actualDuration}天`}
								/>
							</div>
							<div class="text-center">
								<p class="text-xs font-medium text-gray-900 truncate max-w-[80px]" title={item.projectName}>
									{item.projectName}
								</p>
								<p class={`text-xs font-medium ${getDeviationClass(item.deviationDays)}`}>
									{item.deviationDays > 0 ? `+${item.deviationDays}` : item.deviationDays}天
								</p>
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-4 border-t border-gray-200 pt-4">
					<div class="flex items-center justify-between text-xs text-gray-500">
						<span>0天</span>
						<span>{maxDuration}天</span>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
			<h2 class="text-lg font-semibold text-gray-900">延期原因分布</h2>
			<div class="mt-6 flex items-center justify-center">
				<div class="relative h-48 w-48">
					{#each delayReasons as reason, index}
						<div
							class="absolute inset-0 rounded-full"
							style={`
								background: conic-gradient(
									transparent 0deg,
									transparent calc((reason.count / totalReasons) * 360deg),
									${reason.color.replace('bg-', '') === 'red-500' ? '#ef4444' :
										reason.color.replace('bg-', '') === 'amber-500' ? '#f59e0b' :
										reason.color.replace('bg-', '') === 'blue-500' ? '#3b82f6' :
										reason.color.replace('bg-', '') === 'green-500' ? '#22c55e' :
										'#a855f7'} calc((reason.count / totalReasons) * 360deg),
									${reason.color.replace('bg-', '') === 'red-500' ? '#ef4444' :
										reason.color.replace('bg-', '') === 'amber-500' ? '#f59e0b' :
										reason.color.replace('bg-', '') === 'blue-500' ? '#3b82f6' :
										reason.color.replace('bg-', '') === 'green-500' ? '#22c55e' :
										'#a855f7'} calc(((reason.count + delayReasons.slice(index).reduce((s, r) => s + r.count, 0) - reason.count) / totalReasons) * 360deg),
									transparent calc(((reason.count + delayReasons.slice(index).reduce((s, r) => s + r.count, 0) - reason.count) / totalReasons) * 360deg)
								);
								transform: rotate(${delayReasons.slice(0, index).reduce((s, r) => s + (r.count / totalReasons) * 360, 0)}deg);
							`}
						/>
					{/each}
					<div class="absolute inset-4 rounded-full bg-white" />
					<div class="absolute inset-0 flex flex-col items-center justify-center">
						<p class="text-2xl font-bold text-gray-900">{totalReasons}</p>
						<p class="text-xs text-gray-500">延期次数</p>
					</div>
				</div>
			</div>
			<div class="mt-6 space-y-2">
				{#each delayReasons as reason}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class={`h-3 w-3 rounded ${reason.color}`} />
							<span class="text-sm text-gray-600">{reason.name}</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium text-gray-900">{reason.count}</span>
							<span class="text-xs text-gray-500">({Math.round((reason.count / totalReasons) * 100)}%)</span>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
			<h2 class="text-lg font-semibold text-gray-900">详细分析数据</h2>
			<div class="mt-6 overflow-x-auto">
				{#if loading}
					<div class="flex h-64 items-center justify-center">
						<div class="text-gray-500">加载中...</div>
					</div>
				{:else if analysisData.length === 0}
					<div class="flex h-64 items-center justify-center">
						<div class="text-gray-500">暂无数据</div>
					</div>
				{:else}
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-gray-200 text-left">
								<th class="py-3 pr-4 font-medium text-gray-500">项目名称</th>
								<th class="py-3 pr-4 font-medium text-gray-500">计划工期</th>
								<th class="py-3 pr-4 font-medium text-gray-500">实际工期</th>
								<th class="py-3 pr-4 font-medium text-gray-500">偏差</th>
								<th class="py-3 pr-4 font-medium text-gray-500">状态</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							{#each analysisData as item}
								<tr class="hover:bg-gray-50">
									<td class="py-3 pr-4 font-medium text-gray-900">{item.projectName}</td>
									<td class="py-3 pr-4 text-gray-600">{item.plannedDuration}天</td>
									<td class="py-3 pr-4 text-gray-600">
										{item.actualDuration > 0 ? `${item.actualDuration}天` : '-'}
									</td>
									<td class={`py-3 pr-4 font-medium ${getDeviationClass(item.deviationDays)}`}>
										{item.actualDuration > 0 ? `${item.deviationDays > 0 ? '+' : ''}${item.deviationDays}天` : '-'}
									</td>
									<td class="py-3 pr-4">
										<span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getStatusClass(item.status)}">
											{getStatusLabel(item.status)}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		</div>
	</div>
</div>
