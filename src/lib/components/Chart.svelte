<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as echarts from 'echarts';
	import type { EChartsOption } from 'echarts';

	let { option, height = '400px', width = '100%' } = $props<{
		option: EChartsOption;
		height?: string;
		width?: string;
	}>();

	let chartDom: HTMLDivElement | undefined = $state();
	let chart: echarts.ECharts | undefined = $state();

	function resize() {
		chart?.resize();
	}

	$effect(() => {
		if (chart && option) {
			chart.setOption(option, true);
		}
	});

	onMount(() => {
		if (chartDom) {
			chart = echarts.init(chartDom);
			window.addEventListener('resize', resize);
		}
	});

	onDestroy(() => {
		window.removeEventListener('resize', resize);
		chart?.dispose();
	});
</script>

<div bind:this={chartDom} style="width: {width}; height: {height};"></div>
