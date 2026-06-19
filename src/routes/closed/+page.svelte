<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	let activeTab = $state<'performances' | 'exceptions'>('performances');
	let searchFilter = $state(data.filters.search);
	let dateFromFilter = $state(data.filters.dateFrom);
	let dateToFilter = $state(data.filters.dateTo);

	const typeLabels: Record<string, string> = {
		refund_dispute: '退票争议',
		seat_issue: '座位问题',
		checkin_error: '签到异常',
		other: '其他'
	};

	const resolutionLabels: Record<string, string> = {
		resolved: '已解决',
		compensated: '已补偿',
		rejected: '已驳回',
		escalated: '已升级',
		missing_docs: '缺资料'
	};

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function updateUrl() {
		const params = new URLSearchParams();
		if (searchFilter) params.set('search', searchFilter);
		if (dateFromFilter) params.set('dateFrom', dateFromFilter);
		if (dateToFilter) params.set('dateTo', dateToFilter);
		const qs = params.toString();
		goto(`/closed${qs ? `?${qs}` : ''}`, { replaceState: true });
	}

	let debounceTimer: ReturnType<typeof setTimeout>;
	function onSearchInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(updateUrl, 300);
	}

	function onFilterChange() {
		updateUrl();
	}
</script>

<svelte:head>
	<title>已关闭记录 - 演出排期协同台</title>
</svelte:head>

<div class="closed-page">
	<div class="page-header">
		<h2 class="page-title">已关闭记录</h2>
	</div>

	<div class="filter-bar">
		<input
			type="text"
			class="filter-input"
			placeholder="搜索演出名称..."
			bind:value={searchFilter}
			oninput={onSearchInput}
		/>
		<input
			type="date"
			class="filter-date"
			bind:value={dateFromFilter}
			onchange={onFilterChange}
		/>
		<span class="filter-sep">至</span>
		<input
			type="date"
			class="filter-date"
			bind:value={dateToFilter}
			onchange={onFilterChange}
		/>
	</div>

	<div class="tabs">
		<button
			class="tab-btn"
			class:active={activeTab === 'performances'}
			onclick={() => (activeTab = 'performances')}
		>
			已关闭排期
		</button>
		<button
			class="tab-btn"
			class:active={activeTab === 'exceptions'}
			onclick={() => (activeTab = 'exceptions')}
		>
			已关闭异常
		</button>
	</div>

	{#if activeTab === 'performances'}
		<div class="table-section">
			<div class="table-wrapper">
				<table class="data-table">
					<thead>
						<tr>
							<th>演出名称</th>
							<th>场馆</th>
							<th>演出时间</th>
							<th>负责人</th>
							<th>关闭时间</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each data.performances as perf}
							<tr>
								<td>
									<a href="/performance/{perf.id}" class="perf-link">{perf.title}</a>
								</td>
								<td>{perf.venue}</td>
								<td>{formatDate(perf.show_date)}</td>
								<td>{perf.assignee_name ?? '—'}</td>
								<td>{perf.updated_at ? formatDate(perf.updated_at) : '—'}</td>
								<td>
									<a href="/performance/{perf.id}" class="action-link">查看</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else}
		<div class="table-section">
			<div class="table-wrapper">
				<table class="data-table">
					<thead>
						<tr>
							<th>ID</th>
							<th>类型</th>
							<th>关联演出</th>
							<th>处理人</th>
							<th>处理结论</th>
							<th>关闭时间</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each data.exceptions as exc}
							<tr>
								<td class="id-cell">{exc.id.slice(0, 8)}</td>
								<td>{typeLabels[exc.type] ?? exc.type}</td>
								<td>
									{#if exc.performance_title}
										<a href="/performance/{exc.performance_id}" class="perf-link">{exc.performance_title}</a>
									{:else}
										—
									{/if}
								</td>
								<td>{exc.handler_name ?? '—'}</td>
								<td>{resolutionLabels[exc.resolution ?? ''] ?? exc.resolution ?? '—'}</td>
								<td>{exc.updated_at ? formatDate(exc.updated_at) : '—'}</td>
								<td>
									<a href="/exception/{exc.id}" class="action-link">查看</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<style>
	.closed-page {
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
		align-items: center;
		gap: 12px;
		margin-bottom: 20px;
	}

	.filter-input {
		flex: 1;
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		color: #334155;
		outline: none;
		transition: border-color 0.15s;
	}

	.filter-input:focus {
		border-color: #3b82f6;
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

	.filter-sep {
		color: #64748b;
		font-size: 14px;
	}

	.tabs {
		display: flex;
		gap: 0;
		margin-bottom: 20px;
		border-bottom: 2px solid #e2e8f0;
	}

	.tab-btn {
		padding: 10px 24px;
		border: none;
		background: none;
		font-size: 15px;
		font-weight: 500;
		color: #64748b;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		transition: color 0.15s, border-color 0.15s;
	}

	.tab-btn:hover {
		color: #3b82f6;
	}

	.tab-btn.active {
		color: #3b82f6;
		border-bottom-color: #3b82f6;
	}

	.table-section {
		background: #ffffff;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		border: 1px solid #e2e8f0;
		overflow: hidden;
	}

	.table-wrapper {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
	}

	.data-table th {
		text-align: left;
		padding: 12px 20px;
		font-weight: 500;
		color: #64748b;
		background: #f8fafc;
		border-bottom: 1px solid #e2e8f0;
	}

	.data-table td {
		padding: 12px 20px;
		color: #334155;
		border-bottom: 1px solid #f1f5f9;
	}

	.data-table tr:last-child td {
		border-bottom: none;
	}

	.data-table tr:hover {
		background: #f8fafc;
	}

	.id-cell {
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace;
		font-size: 12px;
		color: #94a3b8;
	}

	.perf-link {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
	}

	.perf-link:hover {
		text-decoration: underline;
	}

	.action-link {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
		font-size: 13px;
	}

	.action-link:hover {
		text-decoration: underline;
	}
</style>
