<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let statusFilter = $state(data.filters.status);
	let searchFilter = $state(data.filters.search);
	let assigneeFilter = $state(data.filters.assignee);

	const statusOptions: { value: string; label: string }[] = [
		{ value: '', label: '全部' },
		{ value: 'draft', label: '草稿' },
		{ value: 'submitted', label: '已提交' },
		{ value: 'confirmed', label: '已确认' },
		{ value: 'in_progress', label: '进行中' },
		{ value: 'completed', label: '已完成' },
		{ value: 'closed', label: '已关闭' }
	];

	const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
		draft: { label: '草稿', color: '#6b7280', bg: '#f3f4f6' },
		submitted: { label: '已提交', color: '#2563eb', bg: '#dbeafe' },
		confirmed: { label: '已确认', color: '#16a34a', bg: '#dcfce7' },
		in_progress: { label: '进行中', color: '#d97706', bg: '#fef3c7' },
		completed: { label: '已完成', color: '#059669', bg: '#d1fae5' },
		closed: { label: '已关闭', color: '#475569', bg: '#f1f5f9' }
	};

	function getStatusBadge(status: string | null) {
		const key = status ?? 'draft';
		return statusConfig[key] ?? { label: key, color: '#6b7280', bg: '#f3f4f6' };
	}

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
		if (statusFilter) params.set('status', statusFilter);
		if (searchFilter) params.set('search', searchFilter);
		if (assigneeFilter) params.set('assignee', assigneeFilter);
		const qs = params.toString();
		goto(`/performances${qs ? `?${qs}` : ''}`, { replaceState: true });
	}

	$effect(() => {
		statusFilter;
		searchFilter;
		assigneeFilter;
	});

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
	<title>排期管理 - 演出排期协同台</title>
</svelte:head>

<div class="performances-page">
	<div class="page-header">
		<h2 class="page-title">排期管理</h2>
		<a href="/performances/new" class="btn-primary">新建排期</a>
	</div>

	<div class="filter-bar">
		<select class="filter-select" bind:value={statusFilter} onchange={onFilterChange}>
			{#each statusOptions as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>

		<input
			type="text"
			class="filter-input"
			placeholder="搜索演出名称..."
			bind:value={searchFilter}
			oninput={onSearchInput}
		/>

		<select class="filter-select" bind:value={assigneeFilter} onchange={onFilterChange}>
			<option value="">全部负责人</option>
			{#each data.users as u}
				<option value={u.id}>{u.display_name ?? u.username}</option>
			{/each}
		</select>
	</div>

	<div class="table-section">
		<div class="table-wrapper">
			<table class="data-table">
				<thead>
					<tr>
						<th>演出名称</th>
						<th>场馆</th>
						<th>演出时间</th>
						<th>时长(分钟)</th>
						<th>状态</th>
						<th>负责人</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#each data.performances as perf}
						{@const badge = getStatusBadge(perf.status)}
						<tr>
							<td>
								<a href="/performance/{perf.id}" class="perf-link">{perf.title}</a>
							</td>
							<td>{perf.venue}</td>
							<td>{formatDate(perf.show_date)}</td>
							<td>{perf.duration_minutes}</td>
							<td>
								<span class="status-badge" style="color: {badge.color}; background: {badge.bg};">
									{badge.label}
								</span>
							</td>
							<td>{perf.assignee_name ?? '—'}</td>
							<td>
								<a href="/performance/{perf.id}" class="action-link">查看</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<style>
	.performances-page {
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

	.btn-primary {
		display: inline-flex;
		align-items: center;
		padding: 8px 20px;
		background: #3b82f6;
		color: #ffffff;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-primary:hover {
		background: #2563eb;
	}

	.filter-bar {
		display: flex;
		gap: 12px;
		margin-bottom: 20px;
	}

	.filter-select {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		color: #334155;
		background: #ffffff;
		outline: none;
		min-width: 140px;
		transition: border-color 0.15s;
	}

	.filter-select:focus {
		border-color: #3b82f6;
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

	.perf-link {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
	}

	.perf-link:hover {
		text-decoration: underline;
	}

	.status-badge {
		display: inline-block;
		padding: 3px 10px;
		border-radius: 9999px;
		font-size: 12px;
		font-weight: 500;
		white-space: nowrap;
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
