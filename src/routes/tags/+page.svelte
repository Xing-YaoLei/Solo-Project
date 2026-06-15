<script lang="ts">
	import { onMount } from 'svelte';
	import TagChart from '$lib/components/TagChart.svelte';
	import type { TagData } from '$lib/components/TagChart.svelte';
	import Chart from '$lib/components/Chart.svelte';
	import type { EChartsOption } from 'echarts';

	let loading = $state(true);
	let tagData: TagData[] = $state([]);
	let sortBy: 'correctRate' | 'totalQuestions' = $state('correctRate');

	const sortedData = $derived([...tagData].sort((a, b) => {
		if (sortBy === 'correctRate') return a.correctRate - b.correctRate;
		return b.totalQuestions - a.totalQuestions;
	}));

	const radarOption = $derived<EChartsOption>({
		title: {
			text: '知识点掌握雷达图',
			left: 'center',
			textStyle: { fontSize: 16, fontWeight: 'normal' }
		},
		tooltip: {},
		legend: {
			data: ['正确率', '题目数量(归一化)'],
			bottom: 10
		},
		radar: {
			indicator: sortedData.slice(0, 8).map((d) => ({
				name: d.tag,
				max: 1
			})),
			center: ['50%', '55%'],
			radius: '60%'
		},
		series: [
			{
				name: '知识点分析',
				type: 'radar',
				data: [
					{
						value: sortedData.slice(0, 8).map((d) => d.correctRate),
						name: '正确率',
						itemStyle: { color: '#3b82f6' },
						areaStyle: { opacity: 0.3 }
					},
					{
						value: sortedData.slice(0, 8).map((d) => {
							const max = Math.max(...sortedData.map((t) => t.totalQuestions));
							return d.totalQuestions / max;
						}),
						name: '题目数量(归一化)',
						itemStyle: { color: '#10b981' },
						areaStyle: { opacity: 0.2 }
					}
				]
			}
		]
	});

	async function loadData() {
		loading = true;
		try {
			const res = await fetch('/api/analysis/tags');
			const data = await res.json();
			tagData = data.data || [];
		} catch (e) {
			console.error('加载数据失败', e);
		} finally {
			loading = false;
		}
	}

	function getRiskLabel(level: string): string {
		switch (level) {
			case 'high':
				return '高风险';
			case 'medium':
				return '中风险';
			default:
				return '低风险';
		}
	}

	function getRiskClass(level: string): string {
		switch (level) {
			case 'high':
				return 'bg-red-100 text-red-700';
			case 'medium':
				return 'bg-yellow-100 text-yellow-700';
			default:
				return 'bg-green-100 text-green-700';
		}
	}

	onMount(() => {
		loadData();
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">题目标签分析</h2>
			<p class="text-gray-500 mt-1">按知识点标签分析学生掌握情况</p>
		</div>
		<div class="flex items-center gap-2">
			<span class="text-sm text-gray-500">排序:</span>
			<select
				bind:value={sortBy}
				class="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
			>
				<option value="correctRate">按正确率</option>
				<option value="totalQuestions">按题目数量</option>
			</select>
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
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<TagChart data={sortedData} title="各知识点正确率" />
			<div class="bg-white rounded-lg shadow-sm p-4">
				<Chart option={radarOption} height="380px" />
			</div>
		</div>

		<div class="bg-white rounded-lg shadow-sm overflow-hidden">
			<div class="p-4 border-b">
				<h3 class="text-lg font-medium">知识点详情列表</h3>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-4 py-3 text-left text-sm font-medium text-gray-600">知识点</th>
							<th class="px-4 py-3 text-right text-sm font-medium text-gray-600">题目数量</th>
							<th class="px-4 py-3 text-right text-sm font-medium text-gray-600">正确率</th>
							<th class="px-4 py-3 text-right text-sm font-medium text-gray-600">平均得分</th>
							<th class="px-4 py-3 text-center text-sm font-medium text-gray-600">风险等级</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each sortedData as item (item.tag)}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3 text-sm font-medium">{item.tag}</td>
								<td class="px-4 py-3 text-sm text-right">{item.totalQuestions} 题</td>
								<td class="px-4 py-3 text-sm text-right">
									<div class="flex items-center justify-end gap-2">
										<div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
											<div
												class="h-full rounded-full transition-all"
												class:bg-red-500={item.riskLevel === 'high'}
												class:bg-yellow-500={item.riskLevel === 'medium'}
												class:bg-green-500={item.riskLevel === 'low'}
												style="width: {(item.correctRate * 100).toFixed(0)}%"
											/>
										</div>
										<span class="w-12 text-right">{(item.correctRate * 100).toFixed(1)}%</span>
									</div>
								</td>
								<td class="px-4 py-3 text-sm text-right">{item.averageScore.toFixed(1)} 分</td>
								<td class="px-4 py-3 text-center">
									<span
										class="inline-flex px-2 py-1 rounded-full text-xs font-medium {getRiskClass(item.riskLevel)}"
									>
										{getRiskLabel(item.riskLevel)}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
