<script lang="ts">
	let { data, form } = $props();

	let activeAction = $state<string | null>(null);
	let commentText = $state('');

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

	const actionTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
		comment: { label: '备注', color: '#2563eb', bg: '#dbeafe' },
		status_change: { label: '状态变更', color: '#6b7280', bg: '#f3f4f6' },
		escalate: { label: '升级复核', color: '#dc2626', bg: '#fef2f2' },
		request_docs: { label: '缺资料', color: '#ea580c', bg: '#fff7ed' },
		resolve: { label: '完成处理', color: '#16a34a', bg: '#dcfce7' }
	};

	function getStatusBadge(status: string | null) {
		const key = status ?? '';
		return statusConfig[key] ?? { label: key, color: '#6b7280', bg: '#f3f4f6' };
	}

	function getActionBadge(type: string) {
		return actionTypeConfig[type] ?? { label: type, color: '#6b7280', bg: '#f3f4f6' };
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

	function toggleAction(action: string) {
		activeAction = activeAction === action ? null : action;
	}

	let exc = $derived(data.exception);
	let status = $derived(exc.status);
	let statusBadge = $derived(getStatusBadge(exc.status));
</script>

<svelte:head>
	<title>异常详情 - 演出排期协同台</title>
</svelte:head>

<div class="detail-page">
	<div class="page-header">
		<div class="header-info">
			<div class="header-top">
				<a href="/exceptions" class="back-link">← 返回列表</a>
			</div>
			<div class="header-main">
				<h2 class="page-title">异常 {exc.id.slice(0, 8)}</h2>
				<span class="type-badge">{typeLabels[exc.type] ?? exc.type}</span>
				<span class="status-badge-lg" style="color: {statusBadge.color}; background: {statusBadge.bg};">{statusBadge.label}</span>
				{#if exc.source}
					<span class="meta-badge">{sourceLabels[exc.source] ?? exc.source}</span>
				{/if}
				<span class="meta-text">创建于 {formatDate(exc.created_at)}</span>
			</div>
		</div>
	</div>

	{#if form?.message}
		<div class="error">{form.message}</div>
	{/if}

	<div class="info-panel">
		<div class="info-item">
			<span class="info-label">关联演出</span>
			{#if data.performance}
				<a href="/performance/{data.performance.id}" class="perf-link">{data.performance.title}</a>
			{:else}
				<span class="info-value">—</span>
			{/if}
		</div>
		<div class="info-item">
			<span class="info-label">处理人</span>
			<span class="info-value">{data.handler?.display_name ?? data.handler?.username ?? '未分配'}</span>
		</div>
	</div>

	<div class="action-buttons">
		{#if status === 'pending'}
			<button class="btn-action" onclick={() => toggleAction('assign')}>分配处理人</button>
		{/if}

		{#if status === 'processing'}
			<button class="btn-action btn-green" onclick={() => toggleAction('resolve')}>完成处理</button>
			<button class="btn-action btn-orange" onclick={() => toggleAction('requestDocs')}>缺资料</button>
			<button class="btn-action btn-red" onclick={() => toggleAction('escalate')}>升级复核</button>
		{/if}

		{#if status === 'missing_docs'}
			<button class="btn-action btn-green" onclick={() => toggleAction('resolve')}>补充资料完成</button>
			<button class="btn-action btn-red" onclick={() => toggleAction('escalate')}>升级复核</button>
		{/if}

		{#if status === 'escalated'}
			<button class="btn-action btn-green" onclick={() => toggleAction('resolve')}>复核完成</button>
		{/if}

		{#if status === 'resolved'}
			<form method="POST" action="?/close">
				<button type="submit" class="btn-action btn-gray">关闭记录</button>
			</form>
		{/if}

		<button class="btn-action btn-blue" onclick={() => toggleAction('comment')}>添加备注</button>
	</div>

	{#if activeAction === 'assign'}
		<div class="action-form">
			<form method="POST" action="?/assign">
				<div class="form-group">
					<label class="form-label">选择处理人</label>
					<select name="handler_id" required class="form-input">
						<option value="">— 选择处理人 —</option>
						{#each data.users as u}
							<option value={u.id}>{u.display_name ?? u.username}</option>
						{/each}
					</select>
				</div>
				<button type="submit" class="btn-submit">确认分配</button>
				<button type="button" class="btn-cancel-sm" onclick={() => activeAction = null}>取消</button>
			</form>
		</div>
	{/if}

	{#if activeAction === 'resolve'}
		<div class="action-form">
			<form method="POST" action="?/resolve">
				<div class="form-group">
					<label class="form-label">处理结果</label>
					<textarea name="resolution" rows="3" required class="form-input form-textarea" placeholder="请填写处理结果..."></textarea>
				</div>
				<button type="submit" class="btn-submit">确认完成</button>
				<button type="button" class="btn-cancel-sm" onclick={() => activeAction = null}>取消</button>
			</form>
		</div>
	{/if}

	{#if activeAction === 'requestDocs'}
		<div class="action-form">
			<form method="POST" action="?/requestDocs">
				<div class="form-group">
					<label class="form-label">所需资料说明</label>
					<textarea name="content" rows="3" required class="form-input form-textarea" placeholder="请说明需要补充哪些资料..."></textarea>
				</div>
				<button type="submit" class="btn-submit">确认缺资料</button>
				<button type="button" class="btn-cancel-sm" onclick={() => activeAction = null}>取消</button>
			</form>
		</div>
	{/if}

	{#if activeAction === 'escalate'}
		<div class="action-form">
			<form method="POST" action="?/escalate">
				<div class="form-group">
					<label class="form-label">升级原因</label>
					<textarea name="content" rows="3" required class="form-input form-textarea" placeholder="请说明升级复核的原因..."></textarea>
				</div>
				<button type="submit" class="btn-submit">确认升级</button>
				<button type="button" class="btn-cancel-sm" onclick={() => activeAction = null}>取消</button>
			</form>
		</div>
	{/if}

	{#if activeAction === 'comment'}
		<div class="action-form">
			<form method="POST" action="?/addComment">
				<div class="form-group">
					<label class="form-label">备注内容</label>
					<textarea name="content" rows="3" required class="form-input form-textarea" bind:value={commentText} placeholder="请输入备注..."></textarea>
				</div>
				<button type="submit" class="btn-submit">提交备注</button>
				<button type="button" class="btn-cancel-sm" onclick={() => { activeAction = null; commentText = ''; }}>取消</button>
			</form>
		</div>
	{/if}

	<div class="two-columns">
		<div class="timeline-column">
			<h3 class="column-title">操作记录</h3>
			<div class="timeline">
				{#each data.actions as action}
					{#key action.id}
						{@const ab = getActionBadge(action.action_type)}
						<div class="timeline-item">
							<div class="timeline-dot"></div>
							<div class="timeline-content">
								<div class="timeline-header">
									<span class="action-badge" style="color: {ab.color}; background: {ab.bg};">{ab.label}</span>
									<span class="timeline-operator">{action.operator_name ?? action.operator_username ?? '系统'}</span>
									<span class="timeline-time">{formatDate(action.created_at)}</span>
								</div>
								<div class="timeline-body">{action.content}</div>
							</div>
						</div>
					{/key}
				{/each}
				{#if data.actions.length === 0}
					<div class="empty-state">暂无操作记录</div>
				{/if}
			</div>
		</div>

		<div class="detail-column">
			<h3 class="column-title">异常详情</h3>
			<div class="detail-card">
				<div class="detail-section">
					<div class="detail-label">描述</div>
					<div class="detail-text">{exc.description}</div>
				</div>
				{#if exc.resolution}
					<div class="detail-section">
						<div class="detail-label">处理结果</div>
						<div class="detail-text detail-resolution">{exc.resolution}</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.detail-page {
		max-width: 1200px;
	}

	.page-header {
		margin-bottom: 20px;
	}

	.header-info {
		flex: 1;
	}

	.header-top {
		margin-bottom: 6px;
	}

	.back-link {
		color: #3b82f6;
		text-decoration: none;
		font-size: 13px;
		font-weight: 500;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.header-main {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.page-title {
		font-size: 22px;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.type-badge {
		display: inline-block;
		padding: 3px 10px;
		border-radius: 9999px;
		font-size: 12px;
		font-weight: 500;
		color: #7c3aed;
		background: #ede9fe;
	}

	.status-badge-lg {
		display: inline-block;
		padding: 4px 14px;
		border-radius: 9999px;
		font-size: 13px;
		font-weight: 600;
		white-space: nowrap;
	}

	.meta-badge {
		display: inline-block;
		padding: 3px 10px;
		border-radius: 9999px;
		font-size: 12px;
		font-weight: 500;
		color: #475569;
		background: #f1f5f9;
	}

	.meta-text {
		font-size: 13px;
		color: #94a3b8;
	}

	.error {
		background: #fef2f2;
		color: #dc2626;
		padding: 10px 14px;
		border-radius: 8px;
		font-size: 14px;
		margin-bottom: 16px;
		border: 1px solid #fecaca;
	}

	.info-panel {
		display: flex;
		gap: 32px;
		padding: 16px 20px;
		background: #ffffff;
		border-radius: 10px;
		border: 1px solid #e2e8f0;
		margin-bottom: 16px;
	}

	.info-item {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.info-label {
		font-size: 13px;
		color: #94a3b8;
		font-weight: 500;
	}

	.info-value {
		font-size: 14px;
		color: #334155;
		font-weight: 500;
	}

	.perf-link {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
		font-size: 14px;
	}

	.perf-link:hover {
		text-decoration: underline;
	}

	.action-buttons {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		margin-bottom: 16px;
	}

	.btn-action {
		padding: 8px 18px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 600;
		color: #334155;
		background: #ffffff;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-action:hover {
		background: #f8fafc;
	}

	.btn-green {
		color: #16a34a;
		border-color: #bbf7d0;
		background: #f0fdf4;
	}

	.btn-green:hover {
		background: #dcfce7;
	}

	.btn-orange {
		color: #ea580c;
		border-color: #fed7aa;
		background: #fff7ed;
	}

	.btn-orange:hover {
		background: #fff7ed;
	}

	.btn-red {
		color: #dc2626;
		border-color: #fecaca;
		background: #fef2f2;
	}

	.btn-red:hover {
		background: #fef2f2;
	}

	.btn-gray {
		color: #6b7280;
		border-color: #d1d5db;
		background: #f9fafb;
	}

	.btn-gray:hover {
		background: #f3f4f6;
	}

	.btn-blue {
		color: #2563eb;
		border-color: #bfdbfe;
		background: #eff6ff;
	}

	.btn-blue:hover {
		background: #dbeafe;
	}

	.action-form {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 18px;
		margin-bottom: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 12px;
	}

	.form-label {
		font-size: 14px;
		font-weight: 500;
		color: #334155;
	}

	.form-input {
		padding: 10px 14px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		color: #334155;
		outline: none;
		transition: border-color 0.15s;
		background: #ffffff;
	}

	.form-input:focus {
		border-color: #3b82f6;
	}

	.form-textarea {
		resize: vertical;
		font-family: inherit;
	}

	.btn-submit {
		display: inline-flex;
		align-items: center;
		padding: 8px 18px;
		background: #3b82f6;
		color: #ffffff;
		border: none;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
		margin-right: 8px;
	}

	.btn-submit:hover {
		background: #2563eb;
	}

	.btn-cancel-sm {
		display: inline-flex;
		align-items: center;
		padding: 8px 18px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		color: #64748b;
		background: #ffffff;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-cancel-sm:hover {
		background: #f8fafc;
	}

	.two-columns {
		display: grid;
		grid-template-columns: 60% 40%;
		gap: 20px;
	}

	.column-title {
		font-size: 15px;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 12px;
	}

	.timeline-column {
		background: #ffffff;
		border-radius: 10px;
		border: 1px solid #e2e8f0;
		padding: 18px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
	}

	.timeline {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.timeline-item {
		display: flex;
		gap: 12px;
		padding: 12px 0;
		border-bottom: 1px solid #f1f5f9;
		position: relative;
	}

	.timeline-item:last-child {
		border-bottom: none;
	}

	.timeline-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #cbd5e1;
		flex-shrink: 0;
		margin-top: 5px;
	}

	.timeline-content {
		flex: 1;
		min-width: 0;
	}

	.timeline-header {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		margin-bottom: 4px;
	}

	.action-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 9999px;
		font-size: 11px;
		font-weight: 500;
		white-space: nowrap;
	}

	.timeline-operator {
		font-size: 13px;
		font-weight: 500;
		color: #334155;
	}

	.timeline-time {
		font-size: 12px;
		color: #94a3b8;
	}

	.timeline-body {
		font-size: 13px;
		color: #64748b;
		line-height: 1.5;
		word-break: break-word;
	}

	.detail-column {
		background: #ffffff;
		border-radius: 10px;
		border: 1px solid #e2e8f0;
		padding: 18px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		align-self: start;
	}

	.detail-card {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.detail-section {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.detail-label {
		font-size: 12px;
		font-weight: 500;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.detail-text {
		font-size: 14px;
		color: #334155;
		line-height: 1.6;
		word-break: break-word;
	}

	.detail-resolution {
		background: #f0fdf4;
		padding: 12px;
		border-radius: 8px;
		border: 1px solid #bbf7d0;
		color: #16a34a;
	}

	.empty-state {
		text-align: center;
		padding: 24px;
		color: #94a3b8;
		font-size: 13px;
	}
</style>
