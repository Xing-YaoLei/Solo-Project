<script lang="ts">
	import { onMount, onDestroy, afterUpdate } from 'svelte';
	import * as echarts from 'echarts';
	import type { EChartsOption } from 'echarts';

	export let option: EChartsOption = {};
	export let height = 320;

	let container: HTMLDivElement | undefined;
	let chart: echarts.ECharts | undefined;
	let resizeObserver: ResizeObserver | undefined;

	onMount(() => {
		if (container) {
			chart = echarts.init(container, undefined, { renderer: 'canvas' });
			chart.setOption(option);

			resizeObserver = new ResizeObserver(() => {
				chart?.resize();
			});
			resizeObserver.observe(container);
		}
	});

	afterUpdate(() => {
		if (chart) {
			chart.setOption(option, true);
		}
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		chart?.dispose();
	});
</script>

<div bind:this={container} style="height: {height}px; width: 100%;"></div>
