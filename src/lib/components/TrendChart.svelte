<script lang="ts">
	import BaseChart from './BaseChart.svelte';
	import type { TrendPoint } from '$lib/types';

	export let data: TrendPoint[] = [];
	export let title = '客户线索变化趋势';
	export let height = 320;

	let option: import('echarts').EChartsOption;

	$: option = {
		backgroundColor: 'transparent',
		title: {
			text: title,
			textStyle: { color: '#fff', fontSize: 14, fontWeight: 600 },
			left: 16,
			top: 12
		},
		tooltip: {
			trigger: 'axis',
			backgroundColor: 'rgba(15,23,42,0.95)',
			borderColor: '#334155',
			textStyle: { color: '#e2e8f0' }
		},
		legend: {
			data: ['新增线索', '完成试驾'],
			textStyle: { color: '#94a3b8' },
			right: 20,
			top: 12
		},
		grid: {
			left: 48,
			right: 24,
			top: 56,
			bottom: 36
		},
		xAxis: {
			type: 'category' as const,
			data: data.map((d) => d.date.slice(5)),
			axisLine: { lineStyle: { color: '#334155' } },
			axisLabel: { color: '#64748b', fontSize: 11 }
		},
		yAxis: {
			type: 'value' as const,
			splitLine: { lineStyle: { color: 'rgba(51,65,85,0.4)' } },
			axisLabel: { color: '#64748b', fontSize: 11 }
		},
		series: [
			{
				name: '新增线索',
				type: 'line',
				smooth: true,
				symbol: 'circle',
				symbolSize: 5,
				data: data.map((d) => d.leadsCount),
				itemStyle: { color: '#22d3ee' },
				lineStyle: { width: 2.5 },
				areaStyle: {
					color: {
						type: 'linear',
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: 'rgba(34,211,238,0.35)' },
							{ offset: 1, color: 'rgba(34,211,238,0.02)' }
						]
					}
				}
			},
			{
				name: '完成试驾',
				type: 'line',
				smooth: true,
				symbol: 'circle',
				symbolSize: 5,
				data: data.map((d) => d.testDriveCount),
				itemStyle: { color: '#10b981' },
				lineStyle: { width: 2.5 },
				areaStyle: {
					color: {
						type: 'linear',
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: 'rgba(16,185,129,0.35)' },
							{ offset: 1, color: 'rgba(16,185,129,0.02)' }
						]
					}
				}
			}
		]
	};
</script>

<BaseChart {option} {height} />
