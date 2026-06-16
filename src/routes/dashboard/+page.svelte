<script lang="ts">
	import { onMount } from 'svelte';
	import { Line, Doughnut, Bar } from 'svelte-chartjs';
	import {
		Chart as ChartJS,
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		BarElement,
		ArcElement,
		Title,
		Tooltip,
		Legend,
		Filler
	} from 'chart.js';
	import { riskEventTypeMap } from '$lib/client-utils';
	import { formatDate } from '$lib/server/utils';

	ChartJS.register(
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		BarElement,
		ArcElement,
		Title,
		Tooltip,
		Legend,
		Filler
	);

	type OverviewData = {
		totalElderly: number;
		todayMedReminders: number;
		todayMedTaken: number;
		todayActivities: number;
		openRiskEvents: number;
	};

	type ComplianceTrendItem = {
		date: number;
		medicationComplianceRate: number;
		activityComplianceRate: number;
		overallComplianceRate: number;
	};

	type RiskStatItem = {
		eventType: string;
		count: number;
	};

	let overview: OverviewData | null = null;
	let complianceTrend: ComplianceTrendItem[] = [];
	let riskStats: RiskStatItem[] = [];
	let loading = true;
	let selectedDays = 30;

	$: medicationComplianceRate =
		overview && overview.todayMedReminders > 0
			? Math.round((overview.todayMedTaken / overview.todayMedReminders) * 100)
			: 0;

	$: trendChartData = (() => {
		const labels = complianceTrend.map((item) => formatDate(item.date));
		return {
			labels,
			datasets: [
				{
					label: '用药达标率',
					data: complianceTrend.map((item) => item.medicationComplianceRate),
					borderColor: '#2563eb',
					backgroundColor: 'rgba(37, 99, 235, 0.1)',
					fill: true,
					tension: 0.4
				},
				{
					label: '活动达标率',
					data: complianceTrend.map((item) => item.activityComplianceRate),
					borderColor: '#059669',
					backgroundColor: 'rgba(5, 150, 105, 0.1)',
					fill: true,
					tension: 0.4
				},
				{
					label: '综合达标率',
					data: complianceTrend.map((item) => item.overallComplianceRate),
					borderColor: '#7c3aed',
					backgroundColor: 'rgba(124, 58, 237, 0.1)',
					fill: true,
					tension: 0.4,
					borderWidth: 3
				}
			]
		};
	})();

	const lineOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'top' as const
			},
			title: {
				display: false
			}
		},
		scales: {
			y: {
				beginAtZero: true,
				max: 100,
				ticks: {
					callback: (value: string | number) => `${value}%`
				}
			}
		}
	};

	$: riskChartData = (() => {
		const labels = riskStats.map((item) => riskEventTypeMap[item.eventType]?.label || item.eventType);
		const colors = riskStats.map((item) => {
			const colorMap = riskEventTypeMap[item.eventType]?.color || 'bg-gray-100';
			const colorMapToHex: Record<string, string> = {
				'bg-red-100 text-red-800': '#ef4444',
				'bg-orange-100 text-orange-800': '#f97316',
				'bg-yellow-100 text-yellow-800': '#eab308',
				'bg-purple-100 text-purple-800': '#a855f7',
				'bg-blue-100 text-blue-800': '#3b82f6',
				'bg-gray-100 text-gray-800': '#6b7280'
			};
			return colorMapToHex[colorMap] || '#6b7280';
		});
		return {
			labels,
			datasets: [
				{
					data: riskStats.map((item) => item.count),
					backgroundColor: colors,
					borderWidth: 0
				}
			]
		};
	})();

	const doughnutOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'right' as const
			}
		}
	};

	onMount(async () => {
		await loadAll();
	});

	async function loadAll() {
		loading = true;
		try {
			const [overviewRes, trendRes, riskRes] = await Promise.all([
				fetch('/api/trpc/dashboard.overview', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'dashboard.overview' })
				}),
				fetch('/api/trpc/dashboard.complianceTrend', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						jsonrpc: '2.0',
						id: 2,
						method: 'dashboard.complianceTrend',
						params: { input: { days: selectedDays } }
					})
				}),
				fetch('/api/trpc/dashboard.riskStats', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'dashboard.riskStats' })
				})
			]);

			const overviewData = await overviewRes.json();
			const trendData = await trendRes.json();
			const riskData = await riskRes.json();

			overview = overviewData.result?.data;
			complianceTrend = trendData.result?.data || [];
			riskStats = riskData.result?.data || [];
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function changeDays(days: number) {
		selectedDays = days;
		await loadAll();
	}
</script>

{#if loading}
	<div class="flex items-center justify-center h-full">
		<div class="text-gray-500">加载中...</div>
	</div>
{:else}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-2xl font-bold text-gray-800">📊 数据看板</h2>
				<p class="text-gray-500 mt-1">管理层概览 · 护理质量监控</p>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-gray-800">{overview?.totalElderly || 0}</div>
						<div class="stat-label">在院老人</div>
					</div>
					<div class="text-4xl">👵</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-blue-700">{overview?.todayMedReminders || 0}</div>
						<div class="stat-label">今日用药提醒</div>
					</div>
					<div class="text-4xl">💊</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-green-700">{medicationComplianceRate}%</div>
						<div class="stat-label">今日用药达标率</div>
					</div>
					<div class="text-4xl">✅</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-teal-700">{overview?.todayActivities || 0}</div>
						<div class="stat-label">今日活动签到</div>
					</div>
					<div class="text-4xl">🏃</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-red-700">{overview?.openRiskEvents || 0}</div>
						<div class="stat-label">待处理风险</div>
					</div>
					<div class="text-4xl">⚠️</div>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="card-header flex items-center justify-between">
				<h3 class="font-semibold text-gray-800">📈 护理达标率趋势</h3>
				<div class="flex gap-2">
					{#each [7, 14, 30, 90] as days}
						<button
							class="btn btn-sm {selectedDays === days ? 'btn-primary' : 'btn-secondary'}"
							on:click={() => changeDays(days)}
						>
							{days}天
						</button>
					{/each}
				</div>
			</div>
			<div class="card-body">
				{#if complianceTrend.length === 0}
					<div class="empty-state" style="height: 350px;">
						<div class="empty-state-icon">📊</div>
						<div class="empty-state-text">暂无趋势数据</div>
						<div class="empty-state-subtext">系统运行后将自动生成统计数据</div>
					</div>
				{:else}
					<div style="height: 350px;">
						<Line data={trendChartData} options={lineOptions} />
					</div>
				{/if}
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div class="card">
				<div class="card-header">
					<h3 class="font-semibold text-gray-800">🎯 近30天风险事件分布</h3>
				</div>
				<div class="card-body">
					{#if riskStats.length === 0}
						<div class="empty-state" style="height: 300px;">
							<div class="empty-state-icon">✨</div>
							<div class="empty-state-text">暂无风险事件</div>
							<div class="empty-state-subtext">安全运行中</div>
						</div>
					{:else}
						<div style="height: 300px;">
							<Doughnut data={riskChartData} options={doughnutOptions} />
						</div>
					{/if}
				</div>
			</div>

			<div class="card">
				<div class="card-header">
					<h3 class="font-semibold text-gray-800">📋 风险事件明细</h3>
				</div>
				<div class="card-body">
					{#if riskStats.length === 0}
						<div class="empty-state" style="height: 300px;">
							<div class="empty-state-icon">✨</div>
							<div class="empty-state-text">暂无风险事件</div>
						</div>
					{:else}
						<div class="space-y-3">
							{#each riskStats as stat}
								<div class="flex items-center justify-between p-3 rounded-lg bg-gray-50">
									<div class="flex items-center gap-3">
										<span class="badge {riskEventTypeMap[stat.eventType]?.color || 'bg-gray-100 text-gray-800'}">
											{riskEventTypeMap[stat.eventType]?.label || stat.eventType}
										</span>
									</div>
									<div class="flex items-center gap-4">
										<div class="flex items-center gap-2">
											<div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
												<div
													class="h-full bg-primary-500 rounded-full"
													style="width: {Math.min(100, (stat.count / Math.max(...riskStats.map(r => r.count))) * 100)}%;"
												></div>
											</div>
										</div>
										<span class="font-bold text-gray-800 w-8 text-right">{stat.count}</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
