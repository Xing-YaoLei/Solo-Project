<script lang="ts">
	import ProgressChart from '$lib/components/ProgressChart.svelte';
	import type { ProgressItem } from '$lib/components/ProgressChart.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import Chart from '$lib/components/Chart.svelte';
	import * as echarts from 'echarts';
	import type { EChartsOption } from 'echarts';

	let loading = $state(true);
	let progressData: ProgressItem[] = $state([]);
	let days: number = $state(30);

	const completionTrendOption = $derived<EChartsOption>({
		title: {
			text: '每日提交人数',
			left: 'center',
			textStyle: { fontSize: 16, fontWeight: 'normal' }
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'shadow' }
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '3%',
			top: '60px',
			containLabel: true
		},
		xAxis: {
			type: 'category',
			data: progressData.map((d) => d.date),
			axisLabel: { rotate: 30, fontSize: 10 }
		},
		yAxis: {
			type: 'value',
			name: '人数'
		},
		series: [
			{
				name: '提交人数',
				type: 'bar',
				data: progressData.map((d) => d.submittedCount),
				itemStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: '#3b82f6' },
						{ offset: 1, color: '#93c5fd' }
					])
				},
				barWidth: '60%'
			}
		]
	});

	const avgCompletionRate = $derived(progressData.length
		? progressData.reduce((sum, p) => sum + p.completionRate, 0) / progressData.length
		: 0);

	const latestCompletion = $derived(progressData[progressData.length - 1]?.completionRate || 0);

	const totalSubmissions = $derived(progressData.reduce((sum, p) => sum + p.submittedCount, 0));

	async function loadData() {
		loading = true;
		try {
			const res = await fetch(`/api/analysis/progress?days=${days}`);
			const data = await res.json();
			progressData = data.data || [];
		} catch (e) {
			console.error('加载数据失败', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		days;
		loadData();
	});

	function changeDays(d: number) {
		days = d;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between flex-wrap gap-4">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">学习进度监测</h2>
			<p class="text-gray-500 mt-1">跟踪学生作业完成进度，及时发现落后学生</p>
		</div>
		<div class="flex items-center gap-3">
			<div class="flex bg-gray-100 rounded-lg p-1">
				{#each [7, 14, 30, 60] as d}
					<button
						onclick={() => changeDays(d)}
						class="px-3 py-1.5 text-sm rounded-md transition-colors
							{days === d ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}"
					>
						{d}天
					</button>
				{/each}
			</div>
			<button
				onclick={loadData}
				class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
			>
				🔄 刷新
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="text-center">
				<div class="text-4xl mb-4">⏳</div>
				<p class="text-gray-500">正在加载数据...</p>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<StatCard
				title="最新完成率"
				value="{(latestCompletion * 100).toFixed(1)}%"
				subtitle="最近一天"
				icon="✅"
				color={latestCompletion < 0.6 ? 'red' : latestCompletion < 0.8 ? 'yellow' : 'green'}
			/>
			<StatCard
				title="平均完成率"
				value="{(avgCompletionRate * 100).toFixed(1)}%"
				subtitle="近{days}天"
				icon="📊"
				color={avgCompletionRate < 0.6 ? 'red' : avgCompletionRate < 0.8 ? 'yellow' : 'green'}
			/>
			<StatCard
				title="总提交次数"
				value={totalSubmissions}
				subtitle="近{days}天"
				icon="📝"
				color="blue"
			/>
			<StatCard
				title="监测天数"
				value="{days}天"
				subtitle="数据周期"
				icon="📅"
				color="purple"
			/>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<ProgressChart data={progressData} title={`完成率与平均分趋势（近${days}天）`} />
			<div class="bg-white rounded-lg shadow-sm p-4">
				<Chart option={completionTrendOption} height="380px" />
			</div>
		</div>

		<div class="bg-white rounded-lg shadow-sm overflow-hidden">
			<div class="p-4 border-b">
				<h3 class="text-lg font-medium">每日进度详情</h3>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-4 py-3 text-left text-sm font-medium text-gray-600">日期</th>
							<th class="px-4 py-3 text-right text-sm font-medium text-gray-600">提交人数</th>
							<th class="px-4 py-3 text-right text-sm font-medium text-gray-600">总人数</th>
							<th class="px-4 py-3 text-right text-sm font-medium text-gray-600">完成率</th>
							<th class="px-4 py-3 text-right text-sm font-medium text-gray-600">平均分</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each [...progressData].reverse() as item (item.date)}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3 text-sm">{item.date}</td>
								<td class="px-4 py-3 text-sm text-right">{item.submittedCount} 人</td>
								<td class="px-4 py-3 text-sm text-right">{item.totalCount} 人</td>
								<td class="px-4 py-3 text-sm text-right">
									<span
										class:text-red-600={item.completionRate < 0.6}
										class:text-yellow-600={item.completionRate >= 0.6 && item.completionRate < 0.8}
										class:text-green-600={item.completionRate >= 0.8}
									>
										{(item.completionRate * 100).toFixed(1)}%
									</span>
								</td>
								<td class="px-4 py-3 text-sm text-right">
									{item.averageScore.toFixed(1)} 分
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
