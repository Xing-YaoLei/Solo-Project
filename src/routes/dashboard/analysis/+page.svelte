<script lang="ts">
	import { onMount } from 'svelte';
	import TrendChart from '$lib/components/TrendChart.svelte';
	import FunnelChart from '$lib/components/FunnelChart.svelte';
	import HeatmapChart from '$lib/components/HeatmapChart.svelte';
	import { pageTitle } from '$lib/stores/page';
	import type { TrendPoint, FunnelStage, TimeSlotData } from '$lib/types';

	pageTitle.set('数据分析');

	let trends: TrendPoint[] = [];
	let feedbackFunnel: FunnelStage[] = [];
	let timeSlots: TimeSlotData[] = [];
	let loading = true;

	onMount(async () => {
		try {
			const [tr, fn, ts] = await Promise.all([
				fetch('/api/dashboard/trends').then((r) => r.json()),
				fetch('/api/dashboard/funnel').then((r) => r.json()),
				fetch('/api/dashboard/timeslots').then((r) => r.json())
			]);
			trends = tr;
			feedbackFunnel = fn;
			timeSlots = ts;
		} catch {
			/* ignore */
		} finally {
			loading = false;
		}
	});
</script>

<div class="space-y-6">
	<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
		<div class="card overflow-hidden">
			{#if !loading}
				<TrendChart data={trends} title="客户线索与试驾量变化" height={360} />
			{:else}
				<div class="h-80 flex items-center justify-center text-navy-400">加载中...</div>
			{/if}
		</div>

		<div class="card overflow-hidden">
			{#if !loading}
				<FunnelChart data={feedbackFunnel} title="试驾反馈漏斗" height={360} />
			{:else}
				<div class="h-80 flex items-center justify-center text-navy-400">加载中...</div>
			{/if}
		</div>
	</div>

	<div class="card overflow-hidden">
		{#if !loading}
			<HeatmapChart data={timeSlots} title="预约时段分布热力图" height={380} />
		{:else}
			<div class="h-96 flex items-center justify-center text-navy-400">加载中...</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
		<div class="card p-5">
			<div class="text-navy-400 text-xs uppercase tracking-wider mb-2">热门时段</div>
			<div class="text-white text-2xl font-bold">
				{#if timeSlots.length > 0}
					{(() => {
						const max = timeSlots.reduce((a, b) => (a.count > b.count ? a : b));
						return `${max.hour}:00`;
					})()}
				{/if}
			</div>
			<div class="text-navy-300 text-xs mt-1">预约最集中的时间段</div>
		</div>

		<div class="card p-5">
			<div class="text-navy-400 text-xs uppercase tracking-wider mb-2">日均试驾</div>
			<div class="text-white text-2xl font-bold">
				{trends.length > 0
					? Math.round(trends.reduce((s, t) => s + t.testDriveCount, 0) / trends.length)
					: 0}
			</div>
			<div class="text-navy-300 text-xs mt-1">近30天平均完成试驾数</div>
		</div>

		<div class="card p-5">
			<div class="text-navy-400 text-xs uppercase tracking-wider mb-2">反馈满意</div>
			<div class="text-white text-2xl font-bold">
				{feedbackFunnel.length > 2 ? feedbackFunnel[3].count : 0}
			</div>
			<div class="text-navy-300 text-xs mt-1">累计满意反馈客户数</div>
		</div>
	</div>
</div>
