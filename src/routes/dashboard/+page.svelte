<script lang="ts">
	import { onMount } from 'svelte';
	import { isManager } from '$lib/stores/auth';
	import { pageTitle } from '$lib/stores/page';

	pageTitle.set('总览仪表盘');
	import KpiCard from '$lib/components/KpiCard.svelte';
	import FunnelChart from '$lib/components/FunnelChart.svelte';
	import RankingList from '$lib/components/RankingList.svelte';
	import type { OverviewMetrics, FunnelStage, RankingItem } from '$lib/types';

	let metrics: OverviewMetrics | null = null;
	let funnel: FunnelStage[] = [];
	let salesRanking: RankingItem[] = [];
	let vehicleRanking: RankingItem[] = [];
	let loading = true;

	onMount(async () => {
		try {
			const [ovRes, srRes, vrRes] = await Promise.all([
				fetch('/api/dashboard/overview').then((r) => r.json()),
				fetch('/api/dashboard/ranking?type=salesperson').then((r) => r.json()).catch(() => []),
				fetch('/api/dashboard/ranking?type=vehicle').then((r) => r.json()).catch(() => [])
			]);

			metrics = ovRes.metrics;
			funnel = ovRes.funnel;
			salesRanking = srRes;
			vehicleRanking = vrRes;
		} catch {
			/* ignore */
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
		{#each Array(4) as _}
			<div class="card p-5 animate-pulse">
				<div class="h-3 bg-navy-700/50 rounded w-24 mb-3" />
				<div class="h-8 bg-navy-700/50 rounded w-32" />
			</div>
		{/each}
	</div>
{:else if metrics}
	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
		<KpiCard label="总预约数" value={metrics.totalAppointments} color="cyan" trend={12} />
		<KpiCard label="实际到店" value={metrics.arrivalCount} color="emerald" trend={8} />
		<KpiCard label="完成试驾" value={metrics.testDriveCount} color="amber" trend={5} />
		<KpiCard label="试驾转化率" value={metrics.conversionRate} suffix="%" color="cyan" trend={3} />
		<KpiCard label="线索总量" value={metrics.totalLeads} color="cyan" />
		<KpiCard label="爽约数量" value={metrics.noShowCount} color="rose" />
		<KpiCard label="爽约率" value={metrics.noShowRate} suffix="%" color="rose" />
		<KpiCard label="成交潜力" value={Math.round(metrics.testDriveCount * 0.6)} color="emerald" trend={6} />
	</div>
{/if}

<div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
	<div class="xl:col-span-2 space-y-6">
		<div class="card overflow-hidden">
			<FunnelChart data={funnel} title="试驾预约转化漏斗" height={380} />
		</div>

		{#if $isManager && salesRanking.length > 0}
			<RankingList title="销售人员试驾排行" data={salesRanking} />
		{/if}
	</div>

	<div class="space-y-6">
		{#if vehicleRanking.length > 0}
			<RankingList title="车型试驾排行" data={vehicleRanking} />
		{/if}

		<div class="card overflow-hidden">
			<div class="card-header">
				<h3 class="text-white font-semibold text-sm">数据提示</h3>
			</div>
			<div class="p-5 space-y-3 text-sm text-navy-300">
				<div class="flex items-start">
					<div class="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 mr-3 flex-shrink-0" />
					<div>
						<span class="text-white font-medium">金融审批数据优先</span>
						<p class="text-navy-400 text-xs mt-0.5">合并顺序：金融审批 → CRM → 检测仪</p>
					</div>
				</div>
				<div class="flex items-start">
					<div class="w-2 h-2 rounded-full bg-amber-400 mt-1.5 mr-3 flex-shrink-0" />
					<div>
						<span class="text-white font-medium">试驾爽约可加注释</span>
						<p class="text-navy-400 text-xs mt-0.5">在线索明细页标注爽约原因</p>
					</div>
				</div>
				<div class="flex items-start">
					<div class="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 mr-3 flex-shrink-0" />
					<div>
						<span class="text-white font-medium">批次可回查</span>
						<p class="text-navy-400 text-xs mt-0.5">导入记录支持按批次追溯详情</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
