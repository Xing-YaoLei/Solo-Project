<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		BarChart2, LineChart, Package, TrendingDown, Calendar, ChevronRight,
		FileText
	} from 'lucide-svelte';
	import {
		mockReworkRateData, mockBusinessData, mockPartsRanking,
		mockWorkOrders, delay,
		type ReworkRateData, type BusinessData, type PartsRankingData
	} from '$lib/mock/data';

	type EChartsInstance = import('echarts').ECharts;

	// TODO: tRPC 调用 - 替换为真实数据
	// import { trpc } from '$lib/trpc/client';
	// const rework = await trpc.stats.reworkRate.query({ year: 2026 });
	// const business = await trpc.stats.business.query({ period: '30d' });
	// const ranking = await trpc.stats.partsRanking.query({ limit: 10 });

	let loading = true;
	let activeTab: 'rework' | 'business' | 'parts' = 'rework';

	let echartsLib: typeof import('echarts') | null = null;

	let reworkData: ReworkRateData[] = [];
	let businessData: BusinessData[] = [];
	let partsRanking: PartsRankingData[] = [];

	let reworkChartEl: HTMLDivElement | undefined;
	let businessChartEl: HTMLDivElement | undefined;
	let partsChartEl: HTMLDivElement | undefined;
	let reworkChart: EChartsInstance | null = null;
	let businessChart: EChartsInstance | null = null;
	let partsChart: EChartsInstance | null = null;

	let showReworkDrilldown = false;
	let drilldownMonth: ReworkRateData | null = null;

	onMount(async () => {
		await delay(null, 300);
		reworkData = mockReworkRateData;
		businessData = mockBusinessData;
		partsRanking = mockPartsRanking;
		loading = false;
		echartsLib = await import('echarts');
		await tick();
		initCharts();
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', handleResize);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', handleResize);
		}
		reworkChart?.dispose();
		businessChart?.dispose();
		partsChart?.dispose();
	});

	function handleResize() {
		if (typeof window === 'undefined') return;
		reworkChart?.resize();
		businessChart?.resize();
		partsChart?.resize();
	}

	async function initCharts() {
		if (!echartsLib) return;
		await tick();

		if (reworkChartEl && activeTab === 'rework') {
			reworkChart?.dispose();
			reworkChart = echartsLib.init(reworkChartEl);
			reworkChart.setOption({
				tooltip: {
					trigger: 'axis',
					axisPointer: { type: 'shadow' },
					backgroundColor: 'rgba(15, 23, 42, 0.95)',
					borderWidth: 0,
					textStyle: { color: '#f8fafc', fontSize: 13 },
					formatter: (params: any) => {
						const p = params[0];
						const data = reworkData[p.dataIndex];
						return `<div style="font-weight:600;margin-bottom:6px">${p.name}</div>
								<div style="color:#fb923c">返修率：<b>${p.value}%</b></div>
								<div style="color:#94a3b8;margin-top:4px">总工单：${data.totalOrders} · 返修：${data.reworkOrders}</div>
								<div style="color:#64748b;margin-top:8px;font-size:11px">点击查看返修工单详情 →</div>`;
					}
				},
				grid: { left: 50, right: 30, top: 40, bottom: 50 },
				xAxis: {
					type: 'category',
					data: reworkData.map(d => d.month.slice(5) + '月'),
					axisLine: { lineStyle: { color: '#e2e8f0' } },
					axisTick: { show: false },
					axisLabel: { color: '#64748b', fontSize: 12, fontWeight: 500 }
				},
				yAxis: {
					type: 'value',
					name: '返修率(%)',
					nameTextStyle: { color: '#94a3b8', fontSize: 11, padding: [0, 0, 0, -20] },
					max: 5,
					splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
					axisLine: { show: false },
					axisLabel: { color: '#64748b', fontSize: 11, formatter: '{value}%' }
				},
				series: [{
					type: 'bar',
					data: reworkData.map(d => ({
						value: d.rate,
						itemStyle: {
							color: new echartsLib.graphic.LinearGradient(0, 0, 0, 1, [
								{ offset: 0, color: d.rate >= 3 ? '#ef4444' : d.rate >= 2.5 ? '#f97316' : '#22c55e' },
								{ offset: 1, color: d.rate >= 3 ? '#b91c1c' : d.rate >= 2.5 ? '#c2410c' : '#15803d' }
							]),
							borderRadius: [8, 8, 0, 0]
						}
					})),
					barWidth: 40,
					label: {
						show: true,
						position: 'top',
						formatter: '{c}%',
						color: '#334155',
						fontWeight: 600,
						fontSize: 12
					}
				}]
			});
			reworkChart.on('click', (params: any) => {
				drilldownMonth = reworkData[params.dataIndex];
				showReworkDrilldown = true;
			});
		}

		if (businessChartEl && activeTab === 'business') {
			businessChart?.dispose();
			businessChart = echartsLib.init(businessChartEl);
			businessChart.setOption({
				tooltip: {
					trigger: 'axis',
					backgroundColor: 'rgba(15, 23, 42, 0.95)',
					borderWidth: 0,
					textStyle: { color: '#f8fafc', fontSize: 13 }
				},
				legend: {
					data: ['营收', '工单数量'],
					right: 20,
					top: 10,
					textStyle: { color: '#64748b', fontSize: 12 }
				},
				grid: { left: 60, right: 60, top: 50, bottom: 50 },
				xAxis: {
					type: 'category',
					data: businessData.map(d => d.date),
					boundaryGap: false,
					axisLine: { lineStyle: { color: '#e2e8f0' } },
					axisTick: { show: false },
					axisLabel: { color: '#64748b', fontSize: 10, interval: 3 }
				},
				yAxis: [
					{
						type: 'value',
						name: '营收(元)',
						nameTextStyle: { color: '#94a3b8', fontSize: 11 },
						splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
						axisLine: { show: false },
						axisLabel: { color: '#64748b', fontSize: 10, formatter: (v: number) => v >= 10000 ? (v / 10000) + 'w' : v }
					},
					{
						type: 'value',
						name: '工单(单)',
						nameTextStyle: { color: '#94a3b8', fontSize: 11 },
						splitLine: { show: false },
						axisLine: { show: false },
						axisLabel: { color: '#64748b', fontSize: 10 }
					}
				],
				series: [
					{
						name: '营收',
						type: 'line',
						smooth: true,
						data: businessData.map(d => d.revenue),
						symbol: 'circle',
						symbolSize: 0,
						showSymbol: false,
						lineStyle: { width: 3, color: '#1e40af' },
						areaStyle: {
							color: new echartsLib.graphic.LinearGradient(0, 0, 0, 1, [
								{ offset: 0, color: 'rgba(30, 64, 175, 0.25)' },
								{ offset: 1, color: 'rgba(30, 64, 175, 0.02)' }
							])
						},
						emphasis: { focus: 'series', lineStyle: { width: 4 } }
					},
					{
						name: '工单数量',
						type: 'bar',
						yAxisIndex: 1,
						data: businessData.map(d => d.orderCount),
						barWidth: 12,
						itemStyle: {
							color: new echartsLib.graphic.LinearGradient(0, 0, 0, 1, [
								{ offset: 0, color: 'rgba(249, 115, 22, 0.8)' },
								{ offset: 1, color: 'rgba(249, 115, 22, 0.3)' }
							]),
							borderRadius: [4, 4, 0, 0]
						}
					}
				]
			});
		}

		if (partsChartEl && activeTab === 'parts') {
			partsChart?.dispose();
			partsChart = echartsLib.init(partsChartEl);
			const top10 = [...partsRanking].sort((a, b) => b.usageCount - a.usageCount).slice(0, 10).reverse();
			partsChart.setOption({
				tooltip: {
					trigger: 'axis',
					axisPointer: { type: 'shadow' },
					backgroundColor: 'rgba(15, 23, 42, 0.95)',
					borderWidth: 0,
					textStyle: { color: '#f8fafc', fontSize: 13 },
					formatter: (params: any) => {
						const p = params[0];
						const d = top10[p.dataIndex];
						return `<div style="font-weight:600;margin-bottom:6px">${d.name}</div>
								<div style="color:#3b82f6">使用次数：<b>${p.value.toLocaleString()}</b></div>
								<div style="color:#fb923c;margin-top:4px">使用金额：¥${d.usageAmount.toLocaleString()}</div>
								<div style="color:#94a3b8;margin-top:4px">分类：${d.category}</div>`;
					}
				},
				grid: { left: 130, right: 60, top: 20, bottom: 30 },
				xAxis: {
					type: 'value',
					splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
					axisLine: { show: false },
					axisLabel: { color: '#64748b', fontSize: 11 }
				},
				yAxis: {
					type: 'category',
					data: top10.map(d => d.name),
					axisLine: { show: false },
					axisTick: { show: false },
					axisLabel: { color: '#334155', fontSize: 12, fontWeight: 500 }
				},
				series: [{
					type: 'bar',
					data: top10.map((d, i) => ({
						value: d.usageCount,
						itemStyle: {
							color: new echartsLib.graphic.LinearGradient(1, 0, 0, 0, [
								{ offset: 0, color: ['#1e40af', '#f97316', '#22c55e', '#06b6d4', '#8b5cf6'][i % 5] },
								{ offset: 1, color: ['#60a5fa', '#fb923c', '#4ade80', '#67e8f9', '#c4b5fd'][i % 5] }
							]),
							borderRadius: [0, 6, 6, 0]
						}
					})),
					barWidth: 22,
					label: {
						show: true,
						position: 'right',
						formatter: '{c}次',
						color: '#64748b',
						fontSize: 11,
						fontWeight: 600
					}
				}]
			});
		}
	}

	$: if (!loading && echartsLib) {
		tick().then(initCharts);
	}

	const tabs = [
		{ key: 'rework' as const, label: '返修率分析', icon: TrendingDown, desc: '月度返修率统计，支持点击下钻' },
		{ key: 'business' as const, label: '经营概览', icon: BarChart2, desc: '营收走势与工单数量' },
		{ key: 'parts' as const, label: '配件排行', icon: Package, desc: '配件使用量与金额排行' }
	];

	const reworkRelatedOrders = mockWorkOrders.filter(w => w.status === 'COMPLETED').slice(0, 6);
</script>

<div class="min-h-screen bg-slate-50 p-6 lg:p-8">
	<div class="mb-6">
		<h1 class="text-2xl lg:text-3xl font-bold text-slate-900 font-display">统计报表</h1>
		<p class="text-slate-500 mt-1">经营数据分析与可视化展示</p>
	</div>

	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
		<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
			<div class="text-xs text-slate-500 mb-1">本月工单</div>
			<div class="text-2xl font-bold text-slate-900">175</div>
			<div class="text-xs text-emerald-600 mt-1 flex items-center gap-1">↑ 6.1% 环比</div>
		</div>
		<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
			<div class="text-xs text-slate-500 mb-1">总营收</div>
			<div class="text-2xl font-bold text-primary-700">¥328,450</div>
			<div class="text-xs text-emerald-600 mt-1 flex items-center gap-1">↑ 12.3% 环比</div>
		</div>
		<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
			<div class="text-xs text-slate-500 mb-1">平均返修率</div>
			<div class="text-2xl font-bold text-accent-600">3.0%</div>
			<div class="text-xs text-red-600 mt-1 flex items-center gap-1">↑ 0.3% 环比</div>
		</div>
		<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
			<div class="text-xs text-slate-500 mb-1">客单价</div>
			<div class="text-2xl font-bold text-slate-900">¥1,877</div>
			<div class="text-xs text-emerald-600 mt-1 flex items-center gap-1">↑ 5.8% 环比</div>
		</div>
	</div>

	<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
		<div class="border-b border-slate-100 px-4 sm:px-6">
			<div class="flex gap-1 overflow-x-auto">
				{#each tabs as tab}
					<button
						on:click={() => activeTab = tab.key}
						class="group relative px-5 sm:px-6 py-4 whitespace-nowrap transition-colors {activeTab === tab.key ? '' : 'text-slate-500 hover:text-slate-700'}"
					>
						<div class="flex items-center gap-2">
							<svelte:component this={tab.icon} class="w-4.5 h-4.5 {activeTab === tab.key ? 'text-primary-600' : ''}" />
							<span class="text-sm font-semibold {activeTab === tab.key ? 'text-primary-700' : ''}">{tab.label}</span>
						</div>
						<p class="text-xs text-slate-400 mt-0.5 hidden sm:block">{tab.desc}</p>
						{#if activeTab === tab.key}
							<div class="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-primary-700 to-accent-500 rounded-t-full" />
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<div class="p-6">
			{#if loading}
				<div class="h-[480px] flex items-center justify-center">
					<div class="inline-flex items-center gap-2 text-slate-500">
						<svg class="animate-spin h-5 w-5 text-primary-500" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
						</svg>
						加载中...
					</div>
				</div>
			{:else}
				{#if activeTab === 'rework'}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold text-slate-900">2026年月度返修率趋势</h3>
							<div class="text-xs text-slate-500 flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
								<Calendar class="w-3.5 h-3.5" />
								点击柱状图可下钻查看返修工单
							</div>
						</div>
						<div bind:this={reworkChartEl} class="w-full h-[460px]" />
					</div>
				{:else if activeTab === 'business'}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold text-slate-900">近30天经营概览</h3>
						</div>
						<div bind:this={businessChartEl} class="w-full h-[460px]" />
					</div>
				{:else if activeTab === 'parts'}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold text-slate-900">配件使用量排行 Top 10</h3>
						</div>
						<div bind:this={partsChartEl} class="w-full h-[460px]" />

						<div class="pt-6 mt-6 border-t border-slate-100">
							<h4 class="font-semibold text-slate-900 mb-4 flex items-center gap-2">
								<Package class="w-4.5 h-4.5 text-accent-600" />
								详细排行数据
							</h4>
							<div class="overflow-x-auto rounded-xl border border-slate-200">
								<table class="w-full">
									<thead class="bg-slate-50">
										<tr>
											<th class="text-left text-xs font-semibold text-slate-500 uppercase py-3 px-4">排名</th>
											<th class="text-left text-xs font-semibold text-slate-500 uppercase py-3 px-4">配件名称</th>
											<th class="text-left text-xs font-semibold text-slate-500 uppercase py-3 px-4">分类</th>
											<th class="text-right text-xs font-semibold text-slate-500 uppercase py-3 px-4">使用次数</th>
											<th class="text-right text-xs font-semibold text-slate-500 uppercase py-3 px-4">使用金额</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-slate-100">
										{#each partsRanking as part, idx}
											<tr class="hover:bg-slate-50/60 transition-colors">
												<td class="py-3 px-4">
													<span class={'inline-flex w-7 h-7 rounded-lg items-center justify-center text-xs font-bold ' + (idx < 3 ? 'bg-gradient-to-br from-accent-500 to-accent-600 text-white' : 'bg-slate-100 text-slate-600')}>
														{idx + 1}
													</span>
												</td>
												<td class="py-3 px-4 font-medium text-slate-800">{part.name}</td>
												<td class="py-3 px-4">
													<span class="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs">{part.category}</span>
												</td>
												<td class="py-3 px-4 text-right font-semibold text-primary-600">{part.usageCount.toLocaleString()}</td>
												<td class="py-3 px-4 text-right font-bold text-accent-600">¥{part.usageAmount.toLocaleString()}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>

{#if showReworkDrilldown && drilldownMonth}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" on:click={() => showReworkDrilldown = false}>
		<div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden" on:click|stopPropagation>
			<div class="p-6 border-b border-slate-100 flex items-center justify-between">
				<div>
					<h3 class="text-xl font-bold text-slate-900">{drilldownMonth.month.replace('-', '年')}月 返修工单明细</h3>
					<p class="text-sm text-slate-500 mt-1">
						总工单 <span class="font-semibold text-slate-700">{drilldownMonth.totalOrders}</span> 单 ·
						返修 <span class="font-semibold text-red-600">{drilldownMonth.reworkOrders}</span> 单 ·
						返修率 <span class="font-semibold text-accent-600">{drilldownMonth.rate}%</span>
					</p>
				</div>
				<button on:click={() => showReworkDrilldown = false} class="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
					<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
				</button>
			</div>
			<div class="p-4 overflow-y-auto max-h-[60vh]">
				<div class="space-y-3">
					{#each reworkRelatedOrders as wo}
						<button
							on:click={() => { showReworkDrilldown = false; goto(`/work-orders/${wo.id}`); }}
							class="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-slate-50 transition-all group flex items-center gap-4"
						>
							<div class="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
								<FileText class="w-6 h-6" />
							</div>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-1">
									<span class="font-mono text-sm font-semibold text-primary-700">{wo.orderNo}</span>
									<span class="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">返修</span>
								</div>
								<div class="text-sm text-slate-700">
									<span class="font-semibold">{wo.vehicle.plateNumber}</span>
									<span class="text-slate-400 mx-1.5">·</span>
									{wo.vehicle.brand} {wo.vehicle.model}
								</div>
								<div class="text-xs text-slate-500 mt-1">
									客户：{wo.customer.name}
									<span class="text-slate-400 mx-1.5">·</span>
									{wo.createdAt.getMonth() + 1}月{wo.createdAt.getDate()}日
								</div>
							</div>
							<div class="text-right flex-shrink-0">
								<div class="text-sm font-bold text-accent-600">¥{Number(wo.totalAmount).toLocaleString()}</div>
								<div class="text-xs text-primary-600 flex items-center justify-end gap-0.5 mt-1 group-hover:gap-1.5 transition-all">
									查看详情 <ChevronRight class="w-3.5 h-3.5" />
								</div>
							</div>
						</button>
					{/each}
				</div>
			</div>
			<div class="p-4 border-t border-slate-100 flex justify-end">
				<button
					on:click={() => { showReworkDrilldown = false; goto('/work-orders'); }}
					class="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors inline-flex items-center gap-2"
				>
					查看全部工单
					<ChevronRight class="w-4 h-4" />
				</button>
			</div>
		</div>
	</div>
{/if}
