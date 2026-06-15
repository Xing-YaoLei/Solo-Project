<script lang="ts">
	import Chart from './Chart.svelte';
	import type { EChartsOption } from 'echarts';

	export interface TagData {
		tag: string;
		correctRate: number;
		totalQuestions: number;
		averageScore: number;
		riskLevel: string;
	}

	let { data = [], title = '题目标签正确率分析' } = $props<{
		data?: TagData[];
		title?: string;
	}>();

	const option = $derived<EChartsOption>({
		title: {
			text: title,
			left: 'center',
			textStyle: { fontSize: 16, fontWeight: 'normal' }
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'shadow' },
			formatter: (params: unknown) => {
				const p = params as Array<{ name: string; value: number; seriesName: string }>;
				if (!p.length) return '';
				const item = data.find((d: TagData) => d.tag === p[0].name);
				if (!item) return p[0].name;
				return `
					<div style="font-weight:600;margin-bottom:8px">${item.tag}</div>
					<div>正确率: ${(item.correctRate * 100).toFixed(1)}%</div>
					<div>题目数量: ${item.totalQuestions} 题</div>
					<div>平均得分: ${item.averageScore.toFixed(1)} 分</div>
					<div>风险等级: ${riskText(item.riskLevel)}</div>
				`;
			}
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
			data: data.map((d: TagData) => d.tag),
			axisLabel: {
				rotate: 30,
				interval: 0,
				fontSize: 12
			}
		},
		yAxis: {
			type: 'value',
			min: 0,
			max: 1,
			axisLabel: {
				formatter: (value: number) => `${(value * 100).toFixed(0)}%`
			}
		},
		series: [
			{
				name: '正确率',
				type: 'bar' as const,
				data: data.map((d: TagData) => ({
					value: d.correctRate,
					itemStyle: {
						color: getBarColor(d.riskLevel)
					}
				})),
				barWidth: '50%',
				label: {
					show: true,
					position: 'top' as const,
					formatter: (params: unknown) => {
						const v = (params as { value: number }).value;
						return `${(v * 100).toFixed(1)}%`;
					},
					fontSize: 11
				}
			}
		]
	});

	function getBarColor(riskLevel: string): string {
		switch (riskLevel) {
			case 'high':
				return '#ef4444';
			case 'medium':
				return '#f59e0b';
			default:
				return '#22c55e';
		}
	}

	function riskText(level: string): string {
		switch (level) {
			case 'high':
				return '高风险';
			case 'medium':
				return '中风险';
			default:
				return '低风险';
		}
	}
</script>

<div class="bg-white rounded-lg shadow-sm p-4">
	<Chart option={option} height="380px" />
</div>
