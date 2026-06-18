<script lang="ts">
	import BaseChart from './BaseChart.svelte';
	import type { FunnelStage } from '$lib/types';

	export let data: FunnelStage[] = [];
	export let title = '转化漏斗';
	export let height = 320;

	const colors = ['#22d3ee', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

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
			trigger: 'item',
			backgroundColor: 'rgba(15,23,42,0.95)',
			borderColor: '#334155',
			textStyle: { color: '#e2e8f0' },
			formatter: (params: unknown) => {
				const p = params as { name: string; value: number; data: FunnelStage };
				const rate = p.data.conversionRate;
				return `<div class="font-medium">${p.name}</div>
					<div>数量：<span class="text-cyan-400 font-semibold">${p.value}</span></div>
					${rate !== undefined ? `<div>转化率：<span class="text-emerald-400 font-semibold">${rate}%</span></div>` : ''}`;
			}
		},
		color: colors,
		series: [
			{
				type: 'funnel' as const,
				left: '5%',
				top: 60,
				bottom: 20,
				width: '90%',
				minSize: '20%',
				maxSize: '100%',
				sort: 'descending',
				gap: 3,
				label: {
					show: true,
					position: 'inside',
					formatter: (params: unknown) => {
						const p = params as { name: string; value: number };
						return `${p.name}\n${p.value}`;
					},
					color: '#0b1625',
					fontSize: 12,
					fontWeight: 600
				},
				labelLine: {
					length: 10,
					lineStyle: { width: 1, type: 'solid' }
				},
				itemStyle: {
					borderColor: 'rgba(15,23,42,0.5)',
					borderWidth: 1
				},
				emphasis: {
					label: { fontSize: 14 }
				},
				data: data.map((d, i) => ({
					value: d.count,
					name: d.label,
					conversionRate: d.conversionRate
				}))
			}
		]
	};
</script>

<BaseChart {option} {height} />
