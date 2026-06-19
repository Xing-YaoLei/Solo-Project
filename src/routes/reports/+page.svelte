<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	let dateFrom = $state(data.dateFrom);
	let dateTo = $state(data.dateTo);

	const sourceLabels: Record<string, string> = {
		onsite: '现场',
		phone: '电话',
		online: '线上'
	};

	const conclusionLabels: Record<string, string> = {
		resolved: '已解决',
		closed: '已关闭',
		escalated: '已升级',
		missing_docs: '缺资料'
	};

	function rateColor(rate: number): string {
		if (rate < 70) return '#ef4444';
		if (rate < 90) return '#f59e0b';
		return '#22c55e';
	}

	function rateBg(rate: number): string {
		if (rate < 70) return '#fef2f2';
		if (rate < 90) return '#fffbeb';
		return '#f0fdf4';
	}

	function sourceTotal(): number {
		return data.sourceSummary.reduce((sum, s) => sum + s.count, 0);
	}

	function handlerTotal(): number {
		return data.handlerSummary.reduce((sum, h) => sum + h.count, 0);
	}

	function conclusionTotal(): number {
		return data.conclusionSummary.reduce((sum, c) => sum + c.count, 0);
	}

	function onSubmit(e: Event) {
		e.preventDefault();
		const params = new URLSearchParams();
		if (dateFrom) params.set('dateFrom', dateFrom);
		if (dateTo) params.set('dateTo', dateTo);
		const qs = params.toString();
		goto(`/reports${qs ? `?${qs}` : ''}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>统计报表 - 演出排期协同台</title>
</svelte:head>

<div class="reports-page">
	<div class="page-header">
		<h2 class="page-title">统计报表</h2>
	</div>

	<form class="filter-bar" onsubmit={onSubmit}>
		<label class="filter-label">
			起始日期
			<input type="date" class="filter-date" bind:value={dateFrom} />
		</label>
		<label class="filter-label">
			结束日期
			<input type="date" class="filter-date" bind:value={dateTo} />
		</label>
		<button type="submit" class="btn-query">查询</button>
	</form>

	<div class="cards-grid">
		<div class="card">
			<div class="card-header">
				<h3 class="card-title">核销效率</h3>
			</div>
			<div class="card-body">
				{#if data.verificationSummary.length === 0}
					<p class="empty-text">暂无数据</p>
				{:else}
					<table class="report-table">
						<thead>
							<tr>
								<th>演出名称</th>
								<th>总码数</th>
								<th>已核销</th>
								<th>未核销</th>
								<th>已过期</th>
								<th>核销率</th>
							</tr>
						</thead>
						<tbody>
							{#each data.verificationSummary as row}
								<tr>
									<td>{row.performance_title}</td>
									<td>{row.total}</td>
									<td>{row.used}</td>
									<td>{row.unused}</td>
									<td>{row.expired}</td>
									<td>
										<span
											class="rate-badge"
											style="color: {rateColor(row.verification_rate)}; background: {rateBg(row.verification_rate)};"
										>
											{row.verification_rate.toFixed(1)}%
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		</div>

		<div class="card">
			<div class="card-header">
				<h3 class="card-title">来源分布</h3>
			</div>
			<div class="card-body">
				{#if data.sourceSummary.length === 0}
					<p class="empty-text">暂无数据</p>
				{:else}
					<div class="bar-list">
						{#each data.sourceSummary as item}
							{@const pct = sourceTotal() > 0 ? (item.count / sourceTotal()) * 100 : 0}
							<div class="bar-item">
								<div class="bar-label">
									<span class="bar-name">{sourceLabels[item.source ?? ''] ?? item.source ?? '未知'}</span>
									<span class="bar-count">{item.count} ({pct.toFixed(1)}%)</span>
								</div>
								<div class="bar-track">
									<div class="bar-fill" style="width: {pct}%"></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="card">
			<div class="card-header">
				<h3 class="card-title">负责人处理量</h3>
			</div>
			<div class="card-body">
				{#if data.handlerSummary.length === 0}
					<p class="empty-text">暂无数据</p>
				{:else}
					<table class="report-table">
						<thead>
							<tr>
								<th>负责人</th>
								<th>处理数量</th>
								<th>占比</th>
							</tr>
						</thead>
						<tbody>
							{#each data.handlerSummary as item}
								{@const pct = handlerTotal() > 0 ? (item.count / handlerTotal()) * 100 : 0}
								<tr>
									<td>{item.handler_name ?? '—'}</td>
									<td>{item.count}</td>
									<td>
										<div class="inline-bar">
											<div class="inline-bar-fill" style="width: {pct}%"></div>
											<span class="inline-bar-text">{pct.toFixed(1)}%</span>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		</div>

		<div class="card">
			<div class="card-header">
				<h3 class="card-title">处理结论汇总</h3>
			</div>
			<div class="card-body">
				{#if data.conclusionSummary.length === 0}
					<p class="empty-text">暂无数据</p>
				{:else}
					<table class="report-table">
						<thead>
							<tr>
								<th>状态/结论</th>
								<th>数量</th>
								<th>占比</th>
							</tr>
						</thead>
						<tbody>
							{#each data.conclusionSummary as item}
								{@const pct = conclusionTotal() > 0 ? (item.count / conclusionTotal()) * 100 : 0}
								<tr>
									<td>{conclusionLabels[item.status ?? ''] ?? item.status}</td>
									<td>{item.count}</td>
									<td>
										<div class="inline-bar">
											<div class="inline-bar-fill" style="width: {pct}%"></div>
											<span class="inline-bar-text">{pct.toFixed(1)}%</span>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.reports-page {
		max-width: 1200px;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24px;
	}

	.page-title {
		font-size: 22px;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.filter-bar {
		display: flex;
		align-items: flex-end;
		gap: 16px;
		margin-bottom: 24px;
	}

	.filter-label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 13px;
		color: #64748b;
		font-weight: 500;
	}

	.filter-date {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		color: #334155;
		outline: none;
		transition: border-color 0.15s;
	}

	.filter-date:focus {
		border-color: #3b82f6;
	}

	.btn-query {
		padding: 8px 24px;
		background: #3b82f6;
		color: #ffffff;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-query:hover {
		background: #2563eb;
	}

	.cards-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
	}

	.card {
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
		border: 1px solid #e2e8f0;
		overflow: hidden;
	}

	.card-header {
		padding: 16px 20px;
		border-bottom: 1px solid #f1f5f9;
		background: #f8fafc;
	}

	.card-title {
		font-size: 16px;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.card-body {
		padding: 16px 20px;
	}

	.empty-text {
		color: #94a3b8;
		font-size: 14px;
		text-align: center;
		padding: 24px 0;
		margin: 0;
	}

	.report-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}

	.report-table th {
		text-align: left;
		padding: 8px 12px;
		font-weight: 500;
		color: #64748b;
		border-bottom: 1px solid #e2e8f0;
		white-space: nowrap;
	}

	.report-table td {
		padding: 8px 12px;
		color: #334155;
		border-bottom: 1px solid #f1f5f9;
	}

	.report-table tr:last-child td {
		border-bottom: none;
	}

	.rate-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 9999px;
		font-size: 12px;
		font-weight: 600;
		white-space: nowrap;
	}

	.bar-list {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.bar-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.bar-label {
		display: flex;
		justify-content: space-between;
		font-size: 13px;
		color: #334155;
	}

	.bar-name {
		font-weight: 500;
	}

	.bar-count {
		color: #64748b;
	}

	.bar-track {
		height: 8px;
		background: #f1f5f9;
		border-radius: 4px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background: #3b82f6;
		border-radius: 4px;
		transition: width 0.3s;
	}

	.inline-bar {
		position: relative;
		height: 20px;
		background: #f1f5f9;
		border-radius: 4px;
		overflow: hidden;
		min-width: 80px;
	}

	.inline-bar-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: #93c5fd;
		border-radius: 4px;
		transition: width 0.3s;
	}

	.inline-bar-text {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		height: 100%;
		padding-left: 8px;
		font-size: 12px;
		font-weight: 500;
		color: #334155;
	}

	@media (max-width: 768px) {
		.cards-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
