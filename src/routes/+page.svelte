<script lang="ts">
	import { onMount } from 'svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import AlertPanel from '$lib/components/AlertPanel.svelte';
	import TagChart from '$lib/components/TagChart.svelte';
	import ProgressChart from '$lib/components/ProgressChart.svelte';
	import ScoreChart from '$lib/components/ScoreChart.svelte';
	import type { AlertItem } from '$lib/components/AlertPanel.svelte';
	import type { TagData } from '$lib/components/TagChart.svelte';
	import type { ProgressItem } from '$lib/components/ProgressChart.svelte';
	import type { ScoreItem } from '$lib/components/ScoreChart.svelte';

	let loading = $state(true);
	let stats = $state({
		totalStudents: 0,
		completionRate: 0,
		averageScore: 0,
		alertCount: 0
	});
	let alerts: AlertItem[] = $state([]);
	let tagData: TagData[] = $state([]);
	let progressData: ProgressItem[] = $state([]);
	let scoreData: ScoreItem[] = $state([]);
	let mockDataReady = $state(false);

	async function initMockData() {
		try {
			const res = await fetch('/api/mock-data', { method: 'POST' });
			const data = await res.json();
			if (data.success) {
				mockDataReady = true;
				await loadData();
			}
		} catch (e) {
			console.error('初始化模拟数据失败', e);
		}
	}

	async function loadData() {
		loading = true;
		try {
			const [alertsRes, tagsRes, progressRes, scoresRes] = await Promise.all([
				fetch('/api/analysis/alerts'),
				fetch('/api/analysis/tags'),
				fetch('/api/analysis/progress?days=14'),
				fetch('/api/analysis/scores')
			]);

			const alertsData = await alertsRes.json();
			const tagsData = await tagsRes.json();
			const progressData_ = await progressRes.json();
			const scoresData = await scoresRes.json();

			alerts = alertsData.data || [];
			tagData = tagsData.data || [];
			progressData = progressData_.data || [];
			scoreData = scoresData.data || [];

			const latestProgress = progressData[progressData.length - 1];
			const avgScore = progressData.length
				? progressData.reduce((sum, p) => sum + p.averageScore, 0) / progressData.length
				: 0;

			stats = {
				totalStudents: latestProgress?.totalCount || 0,
				completionRate: latestProgress?.completionRate || 0,
				averageScore: avgScore,
				alertCount: alerts.length
			};
		} catch (e) {
			console.error('加载数据失败', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		initMockData();
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">监测总览</h2>
			<p class="text-gray-500 mt-1">实时监控青少年培训作业批改风险指标</p>
		</div>
		{#if !loading}
			<button
				onclick={loadData}
				class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
			>
				🔄 刷新数据
			</button>
		{/if}
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="text-center">
				<div class="text-4xl mb-4">⏳</div>
				<p class="text-gray-500">正在加载数据...</p>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<StatCard
				title="学生总数"
				value={stats.totalStudents}
				subtitle="在册学员"
				icon="👨‍🎓"
				color="blue"
			/>
			<StatCard
				title="作业完成率"
				value="{(stats.completionRate * 100).toFixed(1)}%"
				subtitle="近期作业"
				icon="📊"
				color={stats.completionRate < 0.6 ? 'red' : stats.completionRate < 0.8 ? 'yellow' : 'green'}
				trend={stats.completionRate > 0.8 ? 'up' : 'down'}
				trendValue="较上周"
			/>
			<StatCard
				title="平均成绩"
				value="{stats.averageScore.toFixed(1)}分"
				subtitle="近14天"
				icon="📈"
				color={stats.averageScore < 60 ? 'red' : stats.averageScore < 75 ? 'yellow' : 'green'}
			/>
			<StatCard
				title="风险预警"
				value={stats.alertCount}
				subtitle="待处理"
				icon="🚨"
				color={stats.alertCount > 3 ? 'red' : stats.alertCount > 0 ? 'yellow' : 'green'}
			/>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2 space-y-6">
				<ProgressChart data={progressData} title="学习进度趋势（近14天）" />
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<ScoreChart data={scoreData} title="成绩分布" />
					<TagChart data={tagData.slice(0, 8)} title="薄弱知识点 Top 8" />
				</div>
			</div>
			<div>
				<AlertPanel {alerts} />
			</div>
		</div>
	{/if}
</div>
