<script lang="ts">
	import { onMount } from 'svelte';
	import { trpc } from '$trpc/client';
	import { goto } from '$app/navigation';

	export let data;

	$: user = data.user;

	let loading = true;
	let projects: any[] = [];
	let overallStats = {
		totalProjects: 0,
		avgCompleteness: 0,
		totalMissing: 0,
		criticalRisks: 0
	};
	let projectCompleteness: Array<{
		projectId: string;
		projectName: string;
		projectNo: string;
		completenessRate: number;
		missingCount: number;
		status: string;
	}> = [];

	async function loadDashboard() {
		loading = true;
		try {
			const result = await trpc.project.list.query({
				page: 1,
				pageSize: 100
			});
			projects = result.projects;

			let totalRate = 0;
			let totalMissing = 0;
			let criticalCount = 0;
			const completenessList: typeof projectCompleteness = [];

			for (const project of projects) {
				try {
					const completeness = await trpc.project.calculateCompleteness.mutate({
						projectId: project.id
					});

					totalRate += completeness.completenessRate;
					totalMissing += completeness.missingCategories.length;

					const hasCritical = completeness.missingCategories.some((cat: any) => {
						const highRiskCodes = ['contract', 'id_card', 'payment_proof', 'acceptance'];
						return highRiskCodes.includes(cat.code);
					});
					if (hasCritical) criticalCount++;

					completenessList.push({
						projectId: project.id,
						projectName: project.name,
						projectNo: project.projectNo,
						completenessRate: completeness.completenessRate,
						missingCount: completeness.missingCategories.length,
						status: project.status
					});
				} catch (e) {
					console.error(`Failed to calculate for project ${project.id}:`, e);
				}
			}

			projectCompleteness = completenessList.sort(
				(a, b) => a.completenessRate - b.completenessRate
			);

			overallStats = {
				totalProjects: projects.length,
				avgCompleteness: projects.length > 0 ? Math.round(totalRate / projects.length) : 0,
				totalMissing,
				criticalRisks: criticalCount
			};
		} catch (e) {
			console.error('Load dashboard failed:', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadDashboard();
	});

	function getCompletenessColor(rate: number) {
		if (rate >= 80) return 'var(--success)';
		if (rate >= 50) return 'var(--warning)';
		return 'var(--danger)';
	}

	function getStatusLabel(status: string) {
		const labels: Record<string, string> = {
			ongoing: '进行中',
			completed: '已完成',
			cancelled: '已取消',
			pending: '待开始'
		};
		return labels[status] || status;
	}

	function getStatusColor(status: string) {
		const colors: Record<string, string> = {
			ongoing: 'var(--primary)',
			completed: 'var(--success)',
			cancelled: 'var(--gray-500)',
			pending: 'var(--warning)'
		};
		return colors[status] || 'var(--gray-500)';
	}
</script>

<div class="page-header">
	<div>
		<h1>📊 管理层看板</h1>
		<p class="subtitle">全项目资料完整率趋势与风险概览</p>
	</div>
	<button class="refresh-btn" on:click={loadDashboard}>
		🔄 刷新数据
	</button>
</div>

{#if loading}
	<div class="loading">加载中... 正在计算全项目资料完整率</div>
{:else}
	<div class="stats-grid">
		<div class="stat-card primary">
			<div class="stat-icon">🏗️</div>
			<div>
				<div class="stat-value">{overallStats.totalProjects}</div>
				<div class="stat-label">项目总数</div>
			</div>
		</div>
		<div class="stat-card success">
			<div class="stat-icon">📈</div>
			<div>
				<div class="stat-value">{overallStats.avgCompleteness}%</div>
				<div class="stat-label">平均完整率</div>
			</div>
		</div>
		<div class="stat-card warning">
			<div class="stat-icon">📋</div>
			<div>
				<div class="stat-value">{overallStats.totalMissing}</div>
				<div class="stat-label">资料缺失项</div>
			</div>
		</div>
		<div class="stat-card danger">
			<div class="stat-icon">⚠️</div>
			<div>
				<div class="stat-value">{overallStats.criticalRisks}</div>
				<div class="stat-label">高风险项目</div>
			</div>
		</div>
	</div>

	<div class="section">
		<div class="section-header">
			<h2>📋 项目完整率排行</h2>
			<p class="section-desc">按资料完整率从低到高排序，优先关注落后项目</p>
		</div>

		<div class="project-ranking">
			{#each projectCompleteness as item, index}
				<div
					class="ranking-item"
					on:click={() => goto(`/projects/${item.projectId}?tab=dashboard`)}
				>
					<div class="rank-number" class:top-three={index < 3}>
						{index + 1}
					</div>
					<div class="project-info">
						<div class="project-header">
							<span class="project-no">{item.projectNo}</span>
							<span
								class="status-dot"
								style="background: {getStatusColor(item.status)}"
								title={getStatusLabel(item.status)}
							/>
							<span class="project-name">{item.projectName}</span>
						</div>
						<div class="progress-bar-container">
							<div
								class="progress-bar"
								style="width: {item.completenessRate}%; background: {getCompletenessColor(item.completenessRate)}"
							/>
						</div>
					</div>
					<div class="completeness-info">
						<div class="completeness-rate" style="color: {getCompletenessColor(item.completenessRate)}">
							{item.completenessRate}%
						</div>
						{#if item.missingCount > 0}
							<div class="missing-count">缺失 {item.missingCount} 项</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="section">
		<div class="section-header">
			<h2>🎯 资料完整率分布</h2>
			<p class="section-desc">各完整率区间的项目数量分布</p>
		</div>

		<div class="distribution-chart">
			<div class="dist-bar-wrapper">
				<div
					class="dist-bar danger"
					style="width: {projectCompleteness.filter(p => p.completenessRate < 50).length / Math.max(projectCompleteness.length, 1) * 100}%"
				>
					{projectCompleteness.filter(p => p.completenessRate < 50).length} 项
				</div>
				<div class="dist-label">
					<strong>严重</strong><br /><50%
				</div>
			</div>
			<div class="dist-bar-wrapper">
				<div
					class="dist-bar warning"
					style="width: {projectCompleteness.filter(p => p.completenessRate >= 50 && p.completenessRate < 80).length / Math.max(projectCompleteness.length, 1) * 100}%"
				>
					{projectCompleteness.filter(p => p.completenessRate >= 50 && p.completenessRate < 80).length} 项
				</div>
				<div class="dist-label">
					<strong>需关注</strong><br />50-80%
				</div>
			</div>
			<div class="dist-bar-wrapper">
				<div
					class="dist-bar success"
					style="width: {projectCompleteness.filter(p => p.completenessRate >= 80).length / Math.max(projectCompleteness.length, 1) * 100}%"
				>
					{projectCompleteness.filter(p => p.completenessRate >= 80).length} 项
				</div>
				<div class="dist-label">
					<strong>优秀</strong><br />≥80%
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 24px;
	}

	.page-header h1 {
		font-size: 28px;
		font-weight: 700;
		color: var(--gray-800);
		margin-bottom: 4px;
	}

	.subtitle {
		color: var(--gray-500);
		font-size: 14px;
	}

	.refresh-btn {
		padding: 10px 20px;
		background: white;
		border: 1px solid var(--gray-200);
		border-radius: 8px;
		cursor: pointer;
		font-size: 14px;
		color: var(--gray-700);
		transition: all 0.2s;
	}

	.refresh-btn:hover {
		background: var(--gray-50);
		border-color: var(--primary);
	}

	.loading {
		text-align: center;
		padding: 80px 20px;
		color: var(--gray-500);
		font-size: 16px;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 20px;
		margin-bottom: 24px;
	}

	.stat-card {
		background: white;
		border-radius: 12px;
		padding: 24px;
		display: flex;
		align-items: center;
		gap: 20px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border-left: 4px solid;
		transition: transform 0.2s;
	}

	.stat-card:hover {
		transform: translateY(-2px);
	}

	.stat-card.primary {
		border-left-color: var(--primary);
	}

	.stat-card.success {
		border-left-color: var(--success);
	}

	.stat-card.warning {
		border-left-color: var(--warning);
	}

	.stat-card.danger {
		border-left-color: var(--danger);
	}

	.stat-icon {
		font-size: 36px;
	}

	.stat-value {
		font-size: 32px;
		font-weight: 700;
		color: var(--gray-800);
		line-height: 1;
		margin-bottom: 4px;
	}

	.stat-label {
		font-size: 14px;
		color: var(--gray-500);
	}

	.section {
		background: white;
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 20px;
	}

	.section-header {
		margin-bottom: 24px;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--gray-100);
	}

	.section-header h2 {
		font-size: 20px;
		font-weight: 600;
		color: var(--gray-800);
		margin-bottom: 4px;
	}

	.section-desc {
		color: var(--gray-500);
		font-size: 14px;
	}

	.project-ranking {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.ranking-item {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 16px;
		background: var(--gray-50);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.ranking-item:hover {
		background: var(--gray-100);
	}

	.rank-number {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--gray-200);
		color: var(--gray-600);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 14px;
		flex-shrink: 0;
	}

	.rank-number.top-three {
		background: linear-gradient(135deg, #f59e0b, #d97706);
		color: white;
	}

	.project-info {
		flex: 1;
		min-width: 0;
	}

	.project-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}

	.project-no {
		font-size: 12px;
		color: var(--gray-500);
		background: white;
		padding: 2px 8px;
		border-radius: 4px;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.project-name {
		font-weight: 600;
		color: var(--gray-800);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.progress-bar-container {
		height: 6px;
		background: var(--gray-200);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		transition: width 0.3s;
	}

	.completeness-info {
		text-align: right;
		min-width: 100px;
	}

	.completeness-rate {
		font-size: 24px;
		font-weight: 700;
		line-height: 1;
	}

	.missing-count {
		font-size: 12px;
		color: var(--danger);
		margin-top: 4px;
	}

	.distribution-chart {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.dist-bar-wrapper {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.dist-bar {
		height: 40px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-right: 12px;
		color: white;
		font-weight: 600;
		font-size: 14px;
		min-width: 60px;
		transition: width 0.3s;
	}

	.dist-bar.danger {
		background: var(--danger);
	}

	.dist-bar.warning {
		background: var(--warning);
	}

	.dist-bar.success {
		background: var(--success);
	}

	.dist-label {
		min-width: 120px;
		font-size: 13px;
		color: var(--gray-600);
		line-height: 1.4;
	}
</style>
