<script lang="ts">
	import Chart from './Chart.svelte';
	import type { EChartsOption } from 'echarts';

	export interface ProgressItem {
		date: string;
		completionRate: number;
		submittedCount: number;
		totalCount: number;
		averageScore: number;
	}

	let { data = [], title = '学习进度趋势' } = $props<{
		data?: ProgressItem[];
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
			axisPointer: { type: 'cross' }
		},
		legend: {
			data: ['完成率', '平均分'],
			top: 30
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '3%',
			top: '80px',
			containLabel: true
		},
		xAxis: {
			type: 'category',
			data: data.map((d) => d.date),
			boundaryGap: false,
			axisLabel: {
				rotate: 30,
				fontSize: 11
			}
		},
		yAxis: [
			{
				type: 'value',
				name: '完成率',
				min: 0,
				max: 1,
				axisLabel: {
					formatter: (value: number) => `${(value * 100).toFixed(0)}%`
				},
				position: 'left'
			},
			{
				type: 'value',
				name: '平均分',
				min: 0,
				max: 100,
				axisLabel: {
					formatter: '{value}分'
				},
				position: 'right'
			}
		],
		series: [
			{
				name: '完成率',
				type: 'line',
				yAxisIndex: 0,
				data: data.map((d) => d.completionRate),
				smooth: true,
				itemStyle: { color: '#3b82f6' },
				areaStyle: {
					color: {
						type: 'linear',
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
							{ offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
						]
					}
				},
				label: {
					show: true,
					formatter: (params: { value: number }) => `${(params.value * 100).toFixed(0)}%`,
					fontSize: 10
				}
			},
			{
				name: '平均分',
				type: 'line',
				yAxisIndex: 1,
				data: data.map((d) => d.averageScore),
				smooth: true,
				itemStyle: { color: '#10b981' },
				label: {
					show: true,
					formatter: '{c}分',
					fontSize: 10
				}
			}
		]
	});
</script>

<div class="bg-white rounded-lg shadow-sm p-4">
	<Chart option={option} height="380px" />
</div>
