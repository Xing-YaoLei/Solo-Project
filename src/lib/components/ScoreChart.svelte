<script lang="ts">
	import Chart from './Chart.svelte';
	import type { EChartsOption } from 'echarts';

	export interface ScoreItem {
		range: string;
		count: number;
		percentage: number;
	}

	let { data = [], title = '成绩分布' } = $props<{
		data?: ScoreItem[];
		title?: string;
	}>();

	const option = $derived<EChartsOption>({
		title: {
			text: title,
			left: 'center',
			textStyle: { fontSize: 16, fontWeight: 'normal' }
		},
		tooltip: {
			trigger: 'item',
			formatter: (params: unknown) => {
				const p = params as { name: string; value: number; percent: number };
				return `${p.name}<br/>人数: ${p.value} 人<br/>占比: ${p.percent}%`;
			}
		},
		legend: {
			orient: 'vertical',
			left: 'left',
			top: 'center'
		},
		series: [
			{
				name: '成绩分布',
				type: 'pie' as const,
				radius: ['40%', '70%'],
				center: ['60%', '55%'],
				avoidLabelOverlap: false,
				itemStyle: {
					borderRadius: 8,
					borderColor: '#fff',
					borderWidth: 2
				},
				label: {
					show: true,
					formatter: '{b}: {d}%'
				},
				emphasis: {
					label: {
						show: true,
						fontSize: 14,
						fontWeight: 'bold'
					}
				},
				labelLine: {
					show: true
				},
				data: data.map((d: ScoreItem, i: number) => ({
					value: d.count,
					name: d.range + '分',
					itemStyle: {
						color: getColor(i)
					}
				}))
			}
		]
	});

	function getColor(index: number): string {
		const colors = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];
		return colors[index % colors.length];
	}
</script>

<div class="bg-white rounded-lg shadow-sm p-4">
	<Chart option={option} height="380px" />
</div>
