<script lang="ts">
	let { data } = $props();

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

	function formatRate(rate: number): string {
		return `${(rate * 100).toFixed(1)}%`;
	}
</script>

<div class="dashboard">
	<h2 class="page-title">排期概览</h2>

	<div class="stats-grid">
		<div class="stat-card">
			<span class="stat-value">{data.stats.total}</span>
			<span class="stat-label">总排期数</span>
		</div>
		<div class="stat-card">
			<span class="stat-value" style="color: #d97706;">{data.stats.inProgress}</span>
			<span class="stat-label">进行中</span>
		</div>
		<div class="stat-card">
			<span class="stat-value" style="color: #dc2626;">{data.stats.pendingExceptions}</span>
			<span class="stat-label">待处理异常</span>
		</div>
		<div class="stat-card">
			<span class="stat-value" style="color: #059669;">{formatRate(data.stats.verificationRate)}</span>
			<span class="stat-label">本周核销率</span>
		</div>
	</div>

	<div class="table-section">
		<h3 class="section-title">近期排期</h3>
		<div class="table-wrapper">
			<table class="data-table">
				<thead>
					<tr>
						<th>演出名称</th>
						<th>场馆</th>
						<th>演出时间</th>
						<th>状态</th>
						<th>负责人</th>
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
							<td>
								<span class="status-badge" style="color: {badge.color}; background: {badge.bg};">
									{badge.label}
								</span>
							</td>
							<td>{perf.assignee_name ?? '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<style>
	.dashboard {
		max-width: 1200px;
	}

	.page-title {
		font-size: 22px;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 24px;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
		margin-bottom: 32px;
	}

	.stat-card {
		background: #ffffff;
		border-radius: 10px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		border: 1px solid #e2e8f0;
	}

	.stat-value {
		font-size: 28px;
		font-weight: 700;
		color: #1e293b;
	}

	.stat-label {
		font-size: 13px;
		color: #64748b;
	}

	.table-section {
		background: #ffffff;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		border: 1px solid #e2e8f0;
		overflow: hidden;
	}

	.section-title {
		font-size: 16px;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
		padding: 16px 20px;
		border-bottom: 1px solid #e2e8f0;
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
</style>
