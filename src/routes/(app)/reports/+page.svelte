<script lang="ts">
	import { trpcClient } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

	let properties: any[] = [];
	let loading = false;
	let result: any = null;
	let channelData: any[] = [];
	let monthlyTrend: any[] = [];
	let exportData: any = null;

	let filters = {
		startDateStr: format(subMonths(startOfMonth(new Date()), 1), 'yyyy-MM-dd'),
		endDateStr: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
		propertyIds: [] as string[],
		format: 'csv' as 'csv' | 'json'
	};

	async function loadInitial() {
		properties = await trpcClient.property.list.query({ status: 'active' });
		filters.propertyIds = properties.map((p) => p.id);
		await runQuery();
	}
	onMount(loadInitial);

	async function runQuery() {
		loading = true;
		try {
			const start = new Date(filters.startDateStr + 'T00:00:00');
			const end = new Date(filters.endDateStr + 'T00:00:00');
			const propIds = filters.propertyIds.length > 0 ? filters.propertyIds : undefined;
			[result, channelData, monthlyTrend] = await Promise.all([
				trpcClient.reports.occupancyRate.query({ startDate: start, endDate: end, propertyIds: propIds }),
				trpcClient.reports.channelRevenue.query({ startDate: start, endDate: end }),
				trpcClient.reports.monthlyOccupancyTrend.query({ months: 6 })
			]);
		} finally { loading = false; }
	}
	async function doExport() {
		const start = new Date(filters.startDateStr + 'T00:00:00');
		const end = new Date(filters.endDateStr + 'T00:00:00');
		const propIds = filters.propertyIds.length > 0 ? filters.propertyIds : undefined;
		exportData = await trpcClient.reports.exportOccupancy.mutate({
			startDate: start, endDate: end, propertyIds: propIds, format: filters.format
		});
	}
	function downloadFile() {
		if (!exportData) return;
		let content: string;
		let mime: string;
		if (exportData.format === 'csv') {
			content = exportData.content;
			mime = 'text/csv;charset=utf-8';
		} else {
			content = JSON.stringify(exportData, null, 2);
			mime = 'application/json;charset=utf-8';
		}
		const bom = '\uFEFF';
		const blob = new Blob([bom + content], { type: mime });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url; a.download = exportData.filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	function toggleProp(id: string) {
		if (filters.propertyIds.includes(id)) filters.propertyIds = filters.propertyIds.filter((x) => x !== id);
		else filters.propertyIds.push(id);
	}
	const channelLabels: Record<string, string> = {
		airbnb: 'Airbnb', booking: 'Booking.com', tujia: '途家', meituan: '美团',
		xiaohongshu: '小红书', direct: '直订', other: '其他'
	};
	const maxRate = Math.max(...(monthlyTrend?.map((m) => m.occupancyRate) ?? [1]));
	$: channelTotal = channelData.reduce((s: number, c: any) => s + Number(c.totalRevenue || 0), 0) || 1;
</script>

<div class="space-y-6">
	<div class="card card-body">
		<div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
			<div>
				<label class="label">起始日期</label>
				<input type="date" bind:value={filters.startDateStr} class="input" />
			</div>
			<div>
				<label class="label">结束日期</label>
				<input type="date" bind:value={filters.endDateStr} class="input" />
			</div>
			<div>
				<label class="label">导出格式</label>
				<select bind:value={filters.format} class="select">
					<option value="csv">CSV (Excel打开)</option>
					<option value="json">JSON</option>
				</select>
			</div>
			<div>
				<button on:click={runQuery} class="btn-primary w-full" disabled={loading}>
					{loading ? '查询中...' : '运行查询'}
				</button>
			</div>
			<div>
				<button on:click={() => { doExport(); }} class="btn-secondary w-full">
					<svg class="h-4 w-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
					下载报表
				</button>
			</div>
		</div>
		<div class="mt-4">
			<div class="text-sm font-medium text-gray-700 mb-2">选择统计房源</div>
			<div class="flex flex-wrap gap-2">
				{#each properties as p}
					<label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm {filters.propertyIds.includes(p.id) ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}">
						<input type="checkbox" checked={filters.propertyIds.includes(p.id)} on:change={() => toggleProp(p.id)} class="w-3.5 h-3.5" />
						<span>{p.name}</span>
					</label>
				{/each}
			</div>
		</div>
	</div>

	{#if exportData && (exportData.meta || exportData.summary)}
		<div class="card border-l-4 border-l-primary-500">
			<div class="card-header flex items-center justify-between">
				<div>
					<div class="font-semibold">📄 报表取数说明</div>
					<div class="text-xs text-gray-500 mt-0.5">生成时间：{exportData.meta?.generatedAt?.toLocaleString?.('zh-CN') ?? new Date().toLocaleString('zh-CN')} · 生成人：{exportData.meta?.generatedBy ?? '-'}</div>
				</div>
				<button on:click={downloadFile} class="btn-primary">立即下载 {exportData.filename}</button>
			</div>
			<div class="card-body space-y-4">
				<div class="grid grid-cols-2 md:grid-cols-5 gap-3">
					<div class="rounded-lg bg-gray-50 p-3"><div class="text-xs text-gray-500">统计周期</div><div class="font-semibold text-gray-900 mt-1">{exportData.summary?.period ?? '-'}</div></div>
					<div class="rounded-lg bg-gray-50 p-3"><div class="text-xs text-gray-500">总可售夜数</div><div class="font-semibold text-gray-900 mt-1">{exportData.summary?.totalRoomNights ?? 0}</div></div>
					<div class="rounded-lg bg-gray-50 p-3"><div class="text-xs text-gray-500">已入住夜数</div><div class="font-semibold text-gray-900 mt-1">{exportData.summary?.occupiedRoomNights ?? 0}</div></div>
					<div class="rounded-lg bg-blue-50 p-3"><div class="text-xs text-blue-600">入住率</div><div class="font-bold text-blue-700 mt-1 text-lg">{(exportData.summary?.occupancyRate ?? 0).toFixed(2)}%</div></div>
					<div class="rounded-lg bg-green-50 p-3"><div class="text-xs text-green-600">收入</div><div class="font-bold text-green-700 mt-1 text-lg">¥{(exportData.summary?.revenue ?? 0).toFixed(2)}</div></div>
				</div>

				<div>
					<div class="font-semibold text-sm mb-2 text-gray-700">📐 指标口径定义（便于向团队解释变化）</div>
					<div class="space-y-2">
						{#each exportData.meta?.metrics ?? [] as m}
							<div class="border-l-2 border-primary-400 pl-3 py-1.5">
								<div class="font-medium text-sm text-gray-800">{m.name}</div>
								<div class="text-xs text-gray-600 mt-0.5">📖 定义：{m.definition}</div>
								<div class="text-xs text-primary-700 mt-0.5">🧮 计算公式：{m.calculation}</div>
							</div>
						{/each}
					</div>
				</div>

				{#if exportData.meta?.notes}
					<div>
						<div class="font-semibold text-sm mb-2 text-gray-700">⚠️ 取数注意事项</div>
						<pre class="text-xs whitespace-pre-wrap bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800">{exportData.meta.notes}</pre>
					</div>
				{/if}

				{#if exportData.meta?.filters}
					<div>
						<div class="font-semibold text-sm mb-2 text-gray-700">🔍 筛选条件</div>
						<pre class="text-xs bg-gray-50 rounded-lg p-3 border border-gray-200">{JSON.stringify(exportData.meta.filters, null, 2)}</pre>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if result}
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<div class="card card-body"><div class="text-sm text-gray-500">入住率</div><div class="text-3xl font-bold text-primary-600 mt-2">{result.occupancyRate.toFixed(2)}%</div></div>
			<div class="card card-body"><div class="text-sm text-gray-500">总房态夜数</div><div class="text-3xl font-bold text-gray-900 mt-2">{result.totalRoomNights}</div></div>
			<div class="card card-body"><div class="text-sm text-gray-500">已入住夜数</div><div class="text-3xl font-bold text-green-600 mt-2">{result.occupiedRoomNights}</div></div>
			<div class="card card-body"><div class="text-sm text-gray-500">平均日价 ADR</div><div class="text-3xl font-bold text-orange-600 mt-2">¥{result.averageDailyRate.toFixed(2)}</div></div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div class="card">
				<div class="card-header font-semibold">近6月入住率趋势</div>
				<div class="card-body">
					<div class="h-52 flex items-end gap-3">
						{#each monthlyTrend as m}
							<div class="flex-1 flex flex-col items-center gap-1">
								<div class="text-xs text-gray-600 font-medium">{m.occupancyRate.toFixed(0)}%</div>
								<div class="w-full flex-1 flex flex-col justify-end">
									<div class="w-full rounded-t-md bg-gradient-to-t from-primary-600 to-primary-400" style="height: {maxRate > 0 ? (m.occupancyRate / maxRate * 100) : 0}%"></div>
								</div>
								<div class="text-xs text-gray-500">{m.month}</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="card">
				<div class="card-header font-semibold">渠道收入构成</div>
				<div class="card-body">
					{#if channelData.length === 0}
						<div class="py-12 text-center text-gray-400 text-sm">暂无数据</div>
					{:else}
						<div class="space-y-3">
							{#each channelData as c}
								<div>
									<div class="flex items-center justify-between text-sm mb-1">
										<span class="font-medium text-gray-700">{channelLabels[c.channel] ?? c.channel}</span>
										<span class="text-gray-500">¥{Number(c.totalRevenue).toFixed(2)} ({(Number(c.totalRevenue) / channelTotal * 100).toFixed(1)}%)</span>
									</div>
									<div class="h-3 rounded-full bg-gray-100 overflow-hidden">
										<div class="h-full bg-gradient-to-r from-primary-500 to-primary-400" style="width: {Number(c.totalRevenue) / channelTotal * 100}%"></div>
									</div>
									<div class="flex gap-3 text-xs text-gray-500 mt-1">
										<span>订单数: {c.orderCount}</span>
										<span>均价: ¥{Number(c.avgOrderValue).toFixed(0)}</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
