<script lang="ts">
	import { getTrpcClient } from '$lib/trpc';

	let startDate = $state('');
	let endDate = $state('');
	let region = $state('');
	let loading = $state(false);

	let closureStats = $state<any>(null);
	let overview = $state<any>(null);

	const regions = ['华东区', '华南区', '华北区', '西南区', '西北区', '东北区', '华中区'];

	const statusMap: Record<string, string> = {
		pending: '待处理',
		processing: '处理中',
		escalated: '已升级',
		closed: '已关闭'
	};

	async function loadStats() {
		loading = true;
		try {
			const [overviewData, closureData] = await Promise.all([
				getTrpcClient().stats.getOverview.query({
					startDate: startDate || undefined,
					endDate: endDate || undefined,
					region: region || undefined
				}),
				getTrpcClient().stats.getClosureStats.query({
					startDate: startDate || undefined,
					endDate: endDate || undefined,
					region: region || undefined
				})
			]);
			overview = overviewData;
			closureStats = closureData;
		} catch (e) {
			console.error('Failed to load stats:', e);
		} finally {
			loading = false;
		}
	}

	function formatDuration(hours: number) {
		if (hours < 1) {
			return `${Math.round(hours * 60)} 分钟`;
		} else if (hours < 24) {
			return `${(Math.round(hours * 10) / 10).toFixed(1)} 小时`;
		} else {
			const days = Math.floor(hours / 24);
			const remainingHours = Math.round(hours % 24);
			return `${days} 天 ${remainingHours} 小时`;
		}
	}

	function formatDate(date: Date | string) {
		const d = new Date(date);
		return d.toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
	}

	function formatAmount(amount: number) {
		return (amount / 100).toFixed(2);
	}

	function getDistributionPercent(count: number) {
		if (!closureStats || closureStats.total === 0) return 0;
		return Math.round((count / closureStats.total) * 100);
	}

	function handleSearch() {
		loadStats();
	}

	$effect(() => {
		const now = new Date();
		const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		startDate = monthAgo.toISOString().split('T')[0];
		endDate = now.toISOString().split('T')[0];
		loadStats();
	});
</script>

<div class="page-header">
	<h1 class="page-title">复盘统计</h1>
</div>

<div class="filter-bar">
	<div class="filter-item">
		<label class="filter-label">开始日期</label>
		<input type="date" class="form-input" bind:value={startDate} />
	</div>
	<div class="filter-item">
		<label class="filter-label">结束日期</label>
		<input type="date" class="form-input" bind:value={endDate} />
	</div>
	<div class="filter-item">
		<label class="filter-label">区域</label>
		<select class="form-select" bind:value={region}>
			<option value="">全部</option>
			{#each regions as r}
				<option value={r}>{r}</option>
			{/each}
		</select>
	</div>
	<div class="filter-item" style="justify-content: flex-end;">
		<label class="filter-label">&nbsp;</label>
		<button class="btn btn-primary" onclick={handleSearch}>查询</button>
	</div>
</div>

{#if loading}
	<div class="card">
		<div class="card-body">
			<div class="empty-state">加载中...</div>
		</div>
	</div>
{:else}
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon" style="background: #dbeafe; color: #2563eb;">📦</div>
			<div class="stat-value">{overview?.statusStats?.reduce((a: number, b: any) => a + b.count, 0) || 0}</div>
			<div class="stat-label">总工单量</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon" style="background: #d1fae5; color: #059669;">✅</div>
			<div class="stat-value">{closureStats?.total || 0}</div>
			<div class="stat-label">已关闭工单</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon" style="background: #fef3c7; color: #d97706;">⏱️</div>
			<div class="stat-value">{closureStats ? formatDuration(closureStats.avgDuration) : '-'}</div>
			<div class="stat-label">平均关闭时长</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon" style="background: #fce7f3; color: #db2777;">📊</div>
			<div class="stat-value">{closureStats ? formatDuration(closureStats.maxDuration) : '-'}</div>
			<div class="stat-label">最长关闭时长</div>
		</div>
	</div>

	<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
		<div class="card">
			<div class="card-header">工单状态分布</div>
			<div class="card-body">
				{#if overview?.statusStats && overview.statusStats.length > 0}
					{#each overview.statusStats as stat}
						<div style="margin-bottom: 12px;">
							<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
								<span style="font-size: 13px;">{statusMap[stat.status] || stat.status}</span>
								<span style="font-weight: 600;">{stat.count}</span>
							</div>
							<div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
								<div
									style="height: 100%; background: var(--primary-color); width: {stat.count * 100 / (overview.statusStats.reduce((a: number, b: any) => a + b.count, 0) || 1)}%"
								></div>
							</div>
						</div>
					{/each}
				{:else}
					<div class="empty-state" style="padding: 20px;">暂无数据</div>
				{/if}
			</div>
		</div>

		<div class="card">
			<div class="card-header">关闭时长分布</div>
			<div class="card-body">
				{#if closureStats?.distribution}
					<div style="margin-bottom: 12px;">
						<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
							<span style="font-size: 13px;">1小时内</span>
							<span style="font-weight: 600;">{closureStats.distribution.lessThan1h} ({getDistributionPercent(closureStats.distribution.lessThan1h)}%)</span>
						</div>
						<div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
							<div style="height: 100%; background: #10b981; width: {getDistributionPercent(closureStats.distribution.lessThan1h)}%"></div>
						</div>
					</div>
					<div style="margin-bottom: 12px;">
						<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
							<span style="font-size: 13px;">1-4小时</span>
							<span style="font-weight: 600;">{closureStats.distribution.oneToFourHours} ({getDistributionPercent(closureStats.distribution.oneToFourHours)}%)</span>
						</div>
						<div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
							<div style="height: 100%; background: #3b82f6; width: {getDistributionPercent(closureStats.distribution.oneToFourHours)}%"></div>
						</div>
					</div>
					<div style="margin-bottom: 12px;">
						<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
							<span style="font-size: 13px;">4-24小时</span>
							<span style="font-weight: 600;">{closureStats.distribution.fourTo24Hours} ({getDistributionPercent(closureStats.distribution.fourTo24Hours)}%)</span>
						</div>
						<div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
							<div style="height: 100%; background: #f59e0b; width: {getDistributionPercent(closureStats.distribution.fourTo24Hours)}%"></div>
						</div>
					</div>
					<div style="margin-bottom: 12px;">
						<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
							<span style="font-size: 13px;">1-3天</span>
							<span style="font-weight: 600;">{closureStats.distribution.oneToThreeDays} ({getDistributionPercent(closureStats.distribution.oneToThreeDays)}%)</span>
						</div>
						<div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
							<div style="height: 100%; background: #ef4444; width: {getDistributionPercent(closureStats.distribution.oneToThreeDays)}%"></div>
						</div>
					</div>
					<div>
						<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
							<span style="font-size: 13px;">3天以上</span>
							<span style="font-weight: 600;">{closureStats.distribution.moreThanThreeDays} ({getDistributionPercent(closureStats.distribution.moreThanThreeDays)}%)</span>
						</div>
						<div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
							<div style="height: 100%; background: #7c3aed; width: {getDistributionPercent(closureStats.distribution.moreThanThreeDays)}%"></div>
						</div>
					</div>
				{:else}
					<div class="empty-state" style="padding: 20px;">暂无数据</div>
				{/if}
			</div>
		</div>
	</div>

	<div class="card" style="margin-top: 20px;">
		<div class="card-header">已关闭工单明细（按关闭时间排序）</div>
		<div class="card-body" style="padding: 0;">
			{#if closureStats?.orders && closureStats.orders.length > 0}
				<table>
					<thead>
						<tr>
							<th>售后单号</th>
							<th>小区</th>
							<th>商品</th>
							<th>金额</th>
							<th>责任归属</th>
							<th>问题标签</th>
							<th>最终结果</th>
							<th>创建时间</th>
							<th>关闭时间</th>
							<th>处理时长</th>
						</tr>
					</thead>
					<tbody>
						{#each closureStats.orders as order (order.id)}
							<tr>
								<td style="font-weight: 500;">{order.orderNo}</td>
								<td>{order.communityName}</td>
								<td>{order.productName}</td>
								<td>¥{formatAmount(order.refundAmount)}</td>
								<td>{order.responsibility || '-'}</td>
								<td>{order.issueTag || '-'}</td>
								<td>{order.followupResult || '-'}</td>
								<td>{formatDate(order.createdAt)}</td>
								<td>{formatDate(order.closedAt)}</td>
								<td>
									<span class="badge badge-default">{formatDuration(order.durationHours)}</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<div class="empty-state">暂无已关闭工单</div>
			{/if}
		</div>
	</div>
{/if}
