<script lang="ts">
	import { onMount } from 'svelte';
	import { trpc } from '$trpc/client';
	import { goto } from '$app/navigation';
	import { riskColors, riskLabels } from '$types';

	export let data;

	$: user = data.user;

	let risks: any[] = [];
	let loading = true;
	let minRiskLevel: 'comment' | 'issue' | 'critical' = 'comment';

	async function loadRisks() {
		loading = true;
		try {
			risks = await trpc.review.getRiskList.query({
				minRiskLevel
			});
		} catch (e) {
			console.error('Load risks failed:', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadRisks();
	});

	$: if (minRiskLevel) {
		loadRisks();
	}

	function formatDate(dateStr: string) {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleString('zh-CN');
	}

	function getTargetTypeLabel(type: string) {
		const labels: Record<string, string> = {
			authorization: '授权范围',
			change: '变更记录',
			attachment: '附件资料',
			profile: '客户档案',
			project: '项目信息'
		};
		return labels[type] || type;
	}
</script>

<div class="page-header">
	<div>
		<h1>⚠️ 风险事项列表</h1>
		<p class="subtitle">跨项目查看所有资料缺失和复核意见，按风险等级优先处理</p>
	</div>
</div>

<div class="filter-bar">
	<div class="filter-group">
		<label>最低风险等级</label>
		<select bind:value={minRiskLevel}>
			<option value="comment">全部</option>
			<option value="issue">问题及以上</option>
			<option value="critical">仅严重</option>
		</select>
	</div>
	<div class="stats-info">
		共 {risks.length} 条风险事项
	</div>
</div>

{#if loading}
	<div class="loading">加载中...</div>
{:else}
	{#if risks.length > 0}
		<div class="risk-list">
			{#each risks as risk}
				<div class="risk-card" on:click={() => goto(`/projects/${risk.projectId}?tab=reviews`)}>
					<div class="risk-header">
						<div class="risk-title-section">
							<span
								class="risk-badge"
								style="background: {riskColors[risk.status as keyof typeof riskColors]}20; color: {riskColors[risk.status as keyof typeof riskColors]}"
							>
								{riskLabels[risk.status as keyof typeof riskLabels]}
							</span>
							<span class="target-type">{getTargetTypeLabel(risk.targetType)}</span>
						</div>
						<span class="risk-time">{formatDate(risk.createdAt)}</span>
					</div>
					<div class="risk-content">{risk.content}</div>
					<div class="risk-footer">
						<span class="project-link">
							📁 查看项目详情 →
						</span>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="success-section">
			<div class="success-icon">✅</div>
			<h3>暂无风险事项</h3>
			<p>所有项目资料完整，复核意见均已处理</p>
		</div>
	{/if}
{/if}

<style>
	.page-header {
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

	.filter-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
		gap: 16px;
		flex-wrap: wrap;
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.filter-group label {
		font-size: 14px;
		color: var(--gray-600);
	}

	.filter-group select {
		padding: 8px 16px;
		border: 1px solid var(--gray-200);
		border-radius: 8px;
		font-size: 14px;
		background: white;
		min-width: 150px;
	}

	.stats-info {
		font-size: 14px;
		color: var(--gray-600);
	}

	.loading {
		text-align: center;
		padding: 60px;
		color: var(--gray-500);
	}

	.risk-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.risk-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition: all 0.2s;
		border-left: 4px solid transparent;
	}

	.risk-card:hover {
		transform: translateX(4px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.risk-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		gap: 12px;
	}

	.risk-title-section {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.risk-badge {
		padding: 4px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
	}

	.target-type {
		background: var(--gray-100);
		color: var(--gray-600);
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 12px;
	}

	.risk-time {
		font-size: 12px;
		color: var(--gray-500);
	}

	.risk-content {
		color: var(--gray-700);
		line-height: 1.7;
		font-size: 14px;
		margin-bottom: 12px;
	}

	.risk-footer {
		display: flex;
		justify-content: flex-end;
	}

	.project-link {
		color: var(--primary);
		font-size: 13px;
		font-weight: 500;
	}

	.success-section {
		background: white;
		border-radius: 12px;
		padding: 60px 20px;
		text-align: center;
	}

	.success-icon {
		font-size: 64px;
		margin-bottom: 16px;
	}

	.success-section h3 {
		color: var(--success);
		font-size: 20px;
		margin-bottom: 8px;
	}

	.success-section p {
		color: var(--gray-500);
	}
</style>
