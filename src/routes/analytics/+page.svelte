<script lang="ts">
	import { onMount } from 'svelte';
	import {
		BarChart3,
		Users,
		Heart,
		AlertTriangle,
		CheckCircle2,
		Download,
		TrendingUp,
		TrendingDown,
		PieChart,
		Activity,
		Calendar
	} from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';
	import { formatPercentage } from '$lib/utils/format';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { createTRPCProxyClient } from '$lib/trpc/client';
	import type { DashboardStats } from '$shared/types';

	const trpc = createTRPCProxyClient();

	let loading = true;
	let stats: DashboardStats | null = null;
	let careLevelData: { level: string; count: number; percentage: number; id: string }[] = [];
	let incidentData: { date: string; count: number }[] = [];
	let complianceData: { date: string; rate: number }[] = [];
	let exporting = false;
	let exportType: 'elders' | 'assessments' | 'incidents' | 'medications' = 'incidents';

	const metricCards = [
		{
			label: '在院老人',
			value: 0,
			total: 0,
			icon: Users,
			color: 'from-primary-500 to-primary-600',
			lightBg: 'bg-primary-50',
			iconBg: 'bg-primary-100',
			iconColor: 'text-primary-600'
		},
		{
			label: '今日评估',
			value: 0,
			icon: Activity,
			color: 'from-accent-500 to-accent-600',
			lightBg: 'bg-accent-50',
			iconBg: 'bg-accent-100',
			iconColor: 'text-accent-600'
		},
		{
			label: '活跃跌倒事件',
			value: 0,
			icon: AlertTriangle,
			color: 'from-danger-500 to-danger-600',
			lightBg: 'bg-danger-50',
			iconBg: 'bg-danger-100',
			iconColor: 'text-danger-600'
		},
		{
			label: '护理达标率',
			value: 0,
			isPercent: true,
			trend: 'up',
			trendValue: '+2.3%',
			icon: CheckCircle2,
			color: 'from-green-500 to-green-600',
			lightBg: 'bg-green-50',
			iconBg: 'bg-green-100',
			iconColor: 'text-green-600'
		}
	];

	async function loadData() {
		loading = true;
		try {
			const [dashboard, careLevel, incidents, compliance] = await Promise.all([
				trpc.analytics.dashboard.query(),
				trpc.analytics.careLevelDistribution.query(),
				trpc.analytics.incidentStatistics.query({ days: 30 }),
				trpc.analytics.complianceRate.query({ days: 30 })
			]);

			stats = dashboard;
			careLevelData = careLevel;
			incidentData = incidents.dailyData;
			complianceData = compliance.dailyData;

			metricCards[0].value = dashboard.admittedElders;
			metricCards[0].total = dashboard.totalElders;
			metricCards[1].value = dashboard.todayAssessments;
			metricCards[2].value = dashboard.activeIncidents;
			metricCards[3].value = dashboard.complianceRate;
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function handleExport() {
		exporting = true;
		try {
			const result = await trpc.analytics.exportData.query({
				type: exportType,
				format: 'xlsx'
			});
			alert(`导出成功：${result.filename}（${result.totalRows} 条数据）`);
		} catch (e) {
			alert('导出失败，请重试');
		} finally {
			exporting = false;
		}
	}

	$: pieTotal = careLevelData.reduce((sum, d) => sum + d.count, 0);

	$: pieSegments = (() => {
		const colors = ['#1a5f7a', '#ff7f50', '#98d8c8', '#f4a261', '#e63946'];
		let cumulative = 0;
		return careLevelData.map((d, i) => {
			const percent = pieTotal > 0 ? d.count / pieTotal : 0;
			const startAngle = cumulative * 2 * Math.PI;
			cumulative += percent;
			const endAngle = cumulative * 2 * Math.PI;
			const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

			const cx = 80;
			const cy = 80;
			const r = 65;
			const x1 = cx + r * Math.sin(startAngle);
			const y1 = cy - r * Math.cos(startAngle);
			const x2 = cx + r * Math.sin(endAngle);
			const y2 = cy - r * Math.cos(endAngle);

			let path = '';
			if (percent >= 1) {
				path = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`;
			} else if (percent > 0) {
				path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
			}

			return {
				...d,
				path,
				color: colors[i % colors.length],
				percent: percent * 100
			};
		});
	})();

	$: maxIncidentCount = Math.max(1, ...incidentData.map((d) => d.count));

	$: incidentMonthData = (() => {
		const monthly: Record<string, number> = {};
		for (const d of incidentData) {
			const month = d.date.slice(0, 7);
			monthly[month] = (monthly[month] || 0) + d.count;
		}
		return Object.entries(monthly).map(([month, count]) => ({ month, count }));
	})();

	$: maxMonthCount = Math.max(1, ...incidentMonthData.map((d) => d.count));

	$: complianceStepX = complianceData.length > 1 ? 740 / (complianceData.length - 1) : 0;
	$: compliancePoints = complianceData.map((d, i) => {
		const x = 40 + i * complianceStepX;
		const y = 20 + (100 - d.rate) * 2;
		return `${x},${y}`;
	});
	$: complianceAreaPath = complianceData.length > 0
		? `M 40,220 L ${compliancePoints.join(' L ')} L ${40 + (complianceData.length - 1) * complianceStepX},220 Z`
		: '';

	onMount(() => {
		loadData();
	});
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-serif font-bold text-gray-800">数据分析</h1>
			<p class="text-sm text-gray-500 mt-1">机构运营数据统计与趋势分析</p>
		</div>
		<div class="flex items-center gap-2">
			<select bind:value={exportType} class="input !py-2 !px-3 text-sm w-auto">
				<option value="incidents">跌倒事件</option>
				<option value="elders">老人档案</option>
				<option value="assessments">评估记录</option>
				<option value="medications">用药执行</option>
			</select>
			<button type="button" on:click={handleExport} class="btn-primary" disabled={exporting}>
				{#if exporting}
					<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
					<span>导出中...</span>
				{:else}
					<Download class="w-4 h-4" />
					<span>批量导出 Excel</span>
				{/if}
			</button>
		</div>
	</div>

	{#if loading}
		<div class="card p-12 flex flex-col items-center justify-center text-gray-400">
			<div class="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-3" />
			<p class="text-sm">加载中...</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each metricCards as card, i}
				<div class="card p-5 overflow-hidden relative group hover:shadow-lg transition-all duration-300">
					<div class={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', card.color)} />
					<div class="flex items-start justify-between mb-4">
						<div class={cn('w-11 h-11 rounded-xl flex items-center justify-center', card.iconBg)}>
							<svelte:component this={card.icon} class={cn('w-5 h-5', card.iconColor)} />
						</div>
						{#if card.trend}
							<span class={cn(
								'inline-flex items-center gap-0.5 text-xs px-2 py-1 rounded-full',
								card.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
							)}>
								<svelte:component this={card.trend === 'up' ? TrendingUp : TrendingDown} class="w-3 h-3" />
								{card.trendValue}
							</span>
						{/if}
					</div>
					<div>
						<p class="text-sm text-gray-500 mb-1">{card.label}</p>
						<div class="flex items-baseline gap-1">
							<span class="text-3xl font-bold text-gray-800">{card.value}</span>
							{#if card.isPercent}
								<span class="text-lg text-gray-400">%</span>
							{/if}
							{#if card.total}
								<span class="text-sm text-gray-400">/ {card.total}</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>

		<div class="grid gap-6 lg:grid-cols-2">
			<div class="card p-6">
				<div class="flex items-center justify-between mb-6">
					<div class="flex items-center gap-2">
						<div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
							<PieChart class="w-5 h-5 text-primary-600" />
						</div>
						<div>
							<h2 class="text-lg font-semibold text-gray-800">护理等级分布</h2>
							<p class="text-xs text-gray-500">共 {pieTotal} 位在院老人</p>
						</div>
					</div>
				</div>

				<div class="flex flex-col sm:flex-row items-center gap-6">
					<div class="relative flex-shrink-0">
						<svg width="160" height="160" viewBox="0 0 160 160">
							{#each pieSegments as seg}
								{#if seg.path}
									<path d={seg.path} fill={seg.color} class="transition-all duration-300 hover:opacity-80 cursor-pointer" />
								{/if}
							{/each}
							<circle cx="80" cy="80" r="38" fill="white" />
						</svg>
						<div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
							<span class="text-2xl font-bold text-gray-800">{pieTotal}</span>
							<span class="text-xs text-gray-500">总计</span>
						</div>
					</div>

					<div class="flex-1 w-full space-y-2">
						{#each pieSegments as seg}
							<div class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
								<div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: {seg.color}" />
								<span class="text-sm text-gray-700 flex-1">{seg.level}</span>
								<span class="text-sm font-semibold text-gray-800">{seg.count}</span>
								<span class="text-xs text-gray-400 w-12 text-right">{seg.percent.toFixed(1)}%</span>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="card p-6">
				<div class="flex items-center justify-between mb-6">
					<div class="flex items-center gap-2">
						<div class="w-9 h-9 rounded-xl bg-accent-50 flex items-center justify-center">
							<BarChart3 class="w-5 h-5 text-accent-600" />
						</div>
						<div>
							<h2 class="text-lg font-semibold text-gray-800">月度跌倒事件</h2>
							<p class="text-xs text-gray-500">近30天统计</p>
						</div>
					</div>
				</div>

				<div class="h-56 flex items-end justify-between gap-2 px-2">
					{#if incidentMonthData.length === 0}
						<div class="w-full flex flex-col items-center justify-center text-gray-400 py-8">
							<AlertTriangle class="w-8 h-8 mb-2 opacity-50" />
							<p class="text-sm">暂无数据</p>
						</div>
					{:else}
						{#each incidentMonthData as data, idx}
							<div class="flex-1 flex flex-col items-center gap-2 group">
								<div class="w-full flex flex-col justify-end items-center h-44">
									<span class="text-xs font-medium text-gray-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
										{data.count}
									</span>
									<div
										class={cn(
											'w-full max-w-[40px] rounded-t-lg transition-all duration-300 hover:opacity-80',
											idx === incidentMonthData.length - 1
												? 'bg-gradient-to-t from-accent-600 to-accent-400'
												: 'bg-gradient-to-t from-primary-500 to-primary-400'
										)}
										style="height: {Math.max(4, (data.count / maxMonthCount) * 160)}px"
									/>
								</div>
								<span class="text-xs text-gray-500">{data.month.slice(5)}月</span>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<div class="card p-6">
			<div class="flex items-center justify-between mb-6">
				<div class="flex items-center gap-2">
					<div class="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
						<TrendingUp class="w-5 h-5 text-green-600" />
					</div>
					<div>
						<h2 class="text-lg font-semibold text-gray-800">护理达标率趋势</h2>
						<p class="text-xs text-gray-500">近30天用药执行达标情况</p>
					</div>
				</div>
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-1.5">
						<div class="w-3 h-0.5 bg-green-500 rounded" />
						<span class="text-xs text-gray-500">达标率</span>
					</div>
					<div class="flex items-center gap-1.5">
						<div class="w-3 h-0.5 bg-gray-300 rounded border-dashed border-t border-gray-400" style="border-top-style: dashed" />
						<span class="text-xs text-gray-500">100%</span>
					</div>
				</div>
			</div>

			<div class="relative h-64">
				{#if complianceData.length === 0}
					<div class="w-full h-full flex flex-col items-center justify-center text-gray-400">
						<Activity class="w-8 h-8 mb-2 opacity-50" />
						<p class="text-sm">暂无数据</p>
					</div>
				{:else}
					<svg viewBox="0 0 800 240" preserveAspectRatio="none" class="w-full h-full">
						<defs>
							<linearGradient id="complianceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" style="stop-color:#98d8c8;stop-opacity:0.3" />
								<stop offset="100%" style="stop-color:#98d8c8;stop-opacity:0" />
							</linearGradient>
						</defs>

						{#each [0, 1, 2, 3, 4] as i}
							{@const y = 20 + i * 50}
							<line x1="40" y1={y} x2="780" y2={y} stroke="#e5e7eb" stroke-dasharray="4 4" />
						{/each}

						{#each [100, 80, 60, 40, 20] as val, i}
							<text x="30" y={24 + i * 50} text-anchor="end" class="text-[10px] fill-gray-400">{val}%</text>
						{/each}

						{#if complianceAreaPath}
							<path d={complianceAreaPath} fill="url(#complianceGradient)" />
						{/if}

						{#if complianceData.length > 1}
							<polyline
								points={compliancePoints.join(' ')}
								fill="none"
								stroke="#10b981"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						{/if}

						{#each complianceData as d, i}
							{#if i % 5 === 0 || i === complianceData.length - 1}
								{@const x = 40 + i * complianceStepX}
								{@const y = 20 + (100 - d.rate) * 2}
								<circle cx={x} cy={y} r="4" fill="white" stroke="#10b981" stroke-width="2" />
								<text x={x} y="235" text-anchor="middle" class="text-[9px] fill-gray-400">
									{d.date.slice(5)}
								</text>
							{/if}
						{/each}
					</svg>
				{/if}
			</div>
		</div>
	{/if}
</div>
