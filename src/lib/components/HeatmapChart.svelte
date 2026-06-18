<script lang="ts">
	import BaseChart from './BaseChart.svelte';
	import type { TimeSlotData } from '$lib/types';

	export let data: TimeSlotData[] = [];
	export let title = '预约时段分布';
	export let height = 360;

	const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
	const hours = Array.from({ length: 13 }, (_, i) => `${i + 8}:00`);

	$: {
		const map = new Map<string, number>();
		let max = 0;
		for (const d of data) {
			const k = `${d.dayOfWeek}_${d.hour}`;
			map.set(k, d.count);
			if (d.count > max) max = d.count;
		}

		const heatData: [number, number, number][] = [];
		for (let day = 0; day < 7; day++) {
			for (let h = 0; h < 13; h++) {
				const hour = h + 8;
				heatData.push([h, day, map.get(`${day}_${hour}`) ?? 0]);
			}
		}

		option = {
			backgroundColor: 'transparent',
			title: {
				text: title,
				textStyle: { color: '#fff', fontSize: 14, fontWeight: 600 },
				left: 16,
				top: 12
			},
			tooltip: {
				backgroundColor: 'rgba(15,23,42,0.95)',
				borderColor: '#334155',
				textStyle: { color: '#e2e8f0' },
				formatter: (params: unknown) => {
					const p = params as { value: [number, number, number] };
					const [h, d, v] = p.value;
					return `<div>${days[d]} ${hours[h]}</div>
						<div>预约数：<span class="text-cyan-400 font-semibold">${v}</span></div>`;
				}
			},
			grid: {
				left: 60,
				right: 40,
				top: 56,
				bottom: 40
			},
			xAxis: {
				type: 'category',
				data: hours,
				splitArea: { show: true },
				axisLabel: { color: '#64748b', fontSize: 10 },
				axisLine: { lineStyle: { color: '#334155' } }
			},
			yAxis: {
				type: 'category',
				data: days,
				splitArea: { show: true },
				axisLabel: { color: '#64748b', fontSize: 11 },
				axisLine: { lineStyle: { color: '#334155' } }
			},
			visualMap: {
				min: 0,
				max: Math.max(max, 1),
				calculable: true,
				orient: 'horizontal',
				right: 20,
				bottom: 4,
				textStyle: { color: '#94a3b8', fontSize: 10 },
				inRange: {
					color: ['#0b1625', '#0e7490', '#22d3ee', '#a5f3fc']
				}
			},
			series: [
				{
					type: 'heatmap',
					data: heatData,
					label: {
						show: true,
						color: '#e2e8f0',
						fontSize: 10,
						formatter: (p: unknown) => {
							const v = (p as { value: [number, number, number] }).value;
							return v[2] > 0 ? v[2] : '';
						}
					},
					emphasis: {
						itemStyle: {
							shadowBlur: 10,
							shadowColor: 'rgba(34,211,238,0.5)'
						}
					}
				}
			] as unknown as import('echarts').EChartsOption['series']
		};
	}

	let option: import('echarts').EChartsOption = {};
</script>

<BaseChart {option} {height} />
