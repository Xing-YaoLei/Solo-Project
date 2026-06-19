<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	let statusFilter = $state(data.filters.status);
	let typeFilter = $state(data.filters.type);
	let handlerFilter = $state(data.filters.handlerId);

	const statusOptions: { value: string; label: string }[] = [
		{ value: '', label: '全部' },
		{ value: 'pending', label: '待处理' },
		{ value: 'processing', label: '处理中' },
		{ value: 'missing_docs', label: '缺资料' },
		{ value: 'escalated', label: '升级复核' },
		{ value: 'resolved', label: '已解决' },
		{ value: 'closed', label: '已关闭' }
	];

	const typeOptions: { value: string; label: string }[] = [
		{ value: '', label: '全部' },
		{ value: 'refund_dispute', label: '退票争议' },
		{ value: 'seat_issue', label: '座位问题' },
		{ value: 'checkin_error', label: '签到异常' },
		{ value: 'other', label: '其他' }
	];

	const typeLabels: Record<string, string> = {
		refund_dispute: '退票争议',
		seat_issue: '座位问题',
		checkin_error: '签到异常',
		other: '其他'
	};

	const sourceLabels: Record<string, string> = {
		onsite: '现场',
		phone: '电话',
		online: '线上'
	};

	const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
		pending: { label: '待处理', color: '#ca8a04', bg: '#fef9c3' },
		processing: { label: '处理中', color: '#2563eb', bg: '#dbeafe' },
		missing_docs: { label: '缺资料', color: '#ea580c', bg: '#fff7ed' },
		escalated: { label: '升级复核', color: '#dc2626', bg: '#fef2f2' },
		resolved: { label: '已解决', color: '#16a34a', bg: '#dcfce7' },
		closed: { label: '已关闭', color: '#6b7280', bg: '#f3f4f6' }
	};

	function getStatusBadge(status: string | null) {
		const key = status ?? '';
		return statusConfig[key] ?? { label: key, color: '#6b7280', bg: '#f3f4f6' };
	}

	function formatDate(date: string | Date | null): string {
		if (!date) return '—';
		return new Date(date).toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function truncate(text: string, max: number = 30): string {
		return text.length > max ? text.slice(0, max) + '...' : text;
	}

	function updateUrl() {
		const params = new URLSearchParams();
		if (statusFilter) params.set('status', statusFilter);
		if (typeFilter) params.set('type', typeFilter);
		if (handlerFilter) params.set('handlerId', handlerFilter);
		const qs = params.toString();
		goto(`/exceptions${qs ? `?${qs}` : ''}`, { replaceState: true });
	}

	function onFilterChange() {
		updateUrl();
	}
</script>

<svelte:head>
	<title>异常处理 - 演出排期协同台</title>
</svelte:head>

<div class="exceptions-page">
	<div class="page-header">
		<h2 class="page-title">异常处理</h2>
		<a href="/exceptions/new" class="btn-primary">新建异常</a>
	</div>

	<div class="filter-bar">
		<select class="filter-select" bind:value={statusFilter} onchange={onFilterChange}>
			{#each statusOptions as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>

		<select class="filter-select" bind:value={typeFilter} onchange={onFilterChange}>
			{#each typeOptions as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>

		<select class="filter-select" bind:value={handlerFilter} onchange={onFilterChange}>
			<option value="">全部处理人</option>
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
						<th>ID</th>
						<th>类型</th>
						<th>关联演出</th>
						<th>状态</th>
						<th>描述摘要</th>
						<th>处理人</th>
						<th>来源</th>
						<th>更新时间</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#each data.exceptions as exc}
						{@const badge = getStatusBadge(exc.status)}
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
							<td>
								<span class="status-badge" style="color: {badge.color}; background: {badge.bg};">
									{badge.label}
								</span>
							</td>
							<td class="desc-cell">{truncate(exc.description)}</td>
							<td>{exc.handler_name ?? '—'}</td>
							<td>{sourceLabels[exc.source ?? ''] ?? exc.source ?? '—'}</td>
							<td>{formatDate(exc.updated_at)}</td>
							<td>
								<a href="/exception/{exc.id}" class="action-link">处理</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<style>
	.exceptions-page {
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
		padding: 12px 16px;
		font-weight: 500;
		color: #64748b;
		background: #f8fafc;
		border-bottom: 1px solid #e2e8f0;
		white-space: nowrap;
	}

	.data-table td {
		padding: 12px 16px;
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

	.desc-cell {
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
