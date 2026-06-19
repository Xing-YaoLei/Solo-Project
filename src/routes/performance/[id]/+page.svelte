<script lang="ts">
	let { data, form } = $props();

	let showAddZone = $state(false);
	let showAddCode = $state(false);
	let showBatchCode = $state(false);
	let showAddSponsor = $state(false);

	const statusOptions = [
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

	const checkinStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
		unused: { label: '未使用', color: '#2563eb', bg: '#dbeafe' },
		used: { label: '已核销', color: '#16a34a', bg: '#dcfce7' },
		expired: { label: '已过期', color: '#6b7280', bg: '#f3f4f6' }
	};

	const tierConfig: Record<string, { label: string; color: string; bg: string }> = {
		platinum: { label: '白金', color: '#7c3aed', bg: '#ede9fe' },
		gold: { label: '黄金', color: '#b45309', bg: '#fef3c7' },
		silver: { label: '白银', color: '#6b7280', bg: '#f3f4f6' },
		bronze: { label: '青铜', color: '#b45309', bg: '#fef3c7' }
	};

	const exceptionStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
		pending: { label: '待处理', color: '#dc2626', bg: '#fef2f2' },
		processing: { label: '处理中', color: '#d97706', bg: '#fef3c7' },
		resolved: { label: '已解决', color: '#16a34a', bg: '#dcfce7' }
	};

	const zoneTypeLabels: Record<string, string> = {
		vip: 'VIP',
		standard: '标准',
		economy: '经济'
	};

	function getBadge(config: Record<string, { label: string; color: string; bg: string }>, key: string | null) {
		const k = key ?? '';
		return config[k] ?? { label: k, color: '#6b7280', bg: '#f3f4f6' };
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

	function getAvailabilityColor(available: number, total: number): string {
		const ratio = total === 0 ? 1 : available / total;
		if (ratio < 0.2) return '#dc2626';
		if (ratio < 0.5) return '#d97706';
		return '#16a34a';
	}

	function generateCode(): string {
		return `TK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
	}

	let autoCode = $state(generateCode());

	function refreshCode() {
		autoCode = generateCode();
	}

	let totalCodes = $derived(data.checkinCodes.length);
	let usedCodes = $derived(data.checkinCodes.filter((c: any) => c.status === 'used').length);
	let unusedCodes = $derived(data.checkinCodes.filter((c: any) => c.status === 'unused').length);
	let expiredCodes = $derived(data.checkinCodes.filter((c: any) => c.status === 'expired').length);
</script>

<svelte:head>
	<title>{data.performance.title} - 演出排期协同台</title>
</svelte:head>

<div class="detail-page">
	<div class="page-header">
		<div class="header-info">
			<div class="header-top">
				<a href="/performances" class="back-link">← 返回列表</a>
			</div>
			<h2 class="page-title">{data.performance.title}</h2>
			<div class="header-meta">
				<span class="meta-item">📍 {data.performance.venue}</span>
				<span class="meta-item">🕐 {formatDate(data.performance.show_date)}</span>
				<span class="meta-item">⏱ {data.performance.duration_minutes}分钟</span>
				{#key data.performance.status}
				{@const sb = getBadge(statusConfig, data.performance.status)}
				<span class="status-badge" style="color: {sb.color}; background: {sb.bg};">{sb.label}</span>
			{/key}
				<span class="meta-item">👤 {data.performance.assignee_name ?? data.performance.assignee_username ?? '未指定'}</span>
			</div>
		</div>
		<div class="header-actions">
			<form method="POST" action="?/changeStatus" class="status-form">
				<input type="hidden" name="status" value="" />
				<select class="status-select" onchange={(e) => {
					const sel = e.currentTarget;
					const form = sel.closest('form')!;
					const input = form.querySelector('input[name="status"]') as HTMLInputElement;
					if (input) input.value = sel.value;
					form.requestSubmit();
				}}>
					<option value="" disabled selected>变更状态</option>
					{#each statusOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</form>
		</div>
	</div>

	{#if form?.message}
		<div class="error">{form.message}</div>
	{/if}

	<div class="three-columns">
		<div class="column-card">
			<div class="card-header">
				<h3 class="card-title">座位图</h3>
				<button class="btn-sm" onclick={() => showAddZone = !showAddZone}>
					{showAddZone ? '取消' : '添加区域'}
				</button>
			</div>
			<div class="card-body">
				{#if showAddZone}
					<form method="POST" action="?/addSeatZone" class="inline-form">
						<input type="text" name="zone_name" placeholder="区域名称" required class="form-input-sm" />
						<select name="zone_type" required class="form-input-sm">
							<option value="vip">VIP</option>
							<option value="standard">标准</option>
							<option value="economy">经济</option>
						</select>
						<input type="number" name="total_seats" placeholder="总座位" required min="1" class="form-input-sm" />
						<input type="number" name="available_seats" placeholder="可用座位" required min="0" class="form-input-sm" />
						<input type="number" name="price" placeholder="价格" required min="0" step="0.01" class="form-input-sm" />
						<button type="submit" class="btn-sm-primary">添加</button>
					</form>
				{/if}

				{#each data.seatZones as zone}
					<div class="zone-item">
						<div class="zone-header">
							<span class="zone-name">{zone.zone_name}</span>
							<span class="zone-type-badge" style="color: {zone.zone_type === 'vip' ? '#7c3aed' : zone.zone_type === 'standard' ? '#2563eb' : '#059669'}; background: {zone.zone_type === 'vip' ? '#ede9fe' : zone.zone_type === 'standard' ? '#dbeafe' : '#d1fae5'};">
								{zoneTypeLabels[zone.zone_type] ?? zone.zone_type}
							</span>
						</div>
						<div class="zone-price">¥{zone.price}</div>
						<div class="zone-progress">
							<div class="progress-bar">
								<div
									class="progress-fill"
									style="width: {zone.total_seats === 0 ? 0 : ((zone.total_seats - zone.available_seats) / zone.total_seats * 100)}%; background: {getAvailabilityColor(zone.available_seats, zone.total_seats)};"
								></div>
							</div>
							<span class="progress-text" style="color: {getAvailabilityColor(zone.available_seats, zone.total_seats)};">
								{zone.available_seats}/{zone.total_seats} 可用
							</span>
						</div>
						<div class="zone-actions">
							<form method="POST" action="?/deleteSeatZone">
								<input type="hidden" name="id" value={zone.id} />
								<button type="submit" class="btn-delete">删除</button>
							</form>
						</div>
					</div>
				{/each}

				{#if data.seatZones.length === 0}
					<div class="empty-state">暂无座位区域</div>
				{/if}
			</div>
		</div>

		<div class="column-card">
			<div class="card-header">
				<h3 class="card-title">签到码</h3>
				<div class="header-btns">
					<button class="btn-sm" onclick={() => { showAddCode = !showAddCode; showBatchCode = false; }}>
						{showAddCode ? '取消' : '生成签到码'}
					</button>
					<button class="btn-sm" onclick={() => { showBatchCode = !showBatchCode; showAddCode = false; }}>
						{showBatchCode ? '取消' : '批量生成'}
					</button>
				</div>
			</div>
			<div class="card-body">
				<div class="code-stats">
					<div class="stat-item">
						<span class="stat-value">{totalCodes}</span>
						<span class="stat-label">总计</span>
					</div>
					<div class="stat-item">
						<span class="stat-value" style="color: #16a34a;">{usedCodes}</span>
						<span class="stat-label">已核销</span>
					</div>
					<div class="stat-item">
						<span class="stat-value" style="color: #2563eb;">{unusedCodes}</span>
						<span class="stat-label">未使用</span>
					</div>
					<div class="stat-item">
						<span class="stat-value" style="color: #6b7280;">{expiredCodes}</span>
						<span class="stat-label">已过期</span>
					</div>
				</div>

				{#if showAddCode}
					<form method="POST" action="?/addCheckinCode" class="inline-form">
						<div class="form-row">
							<input type="text" name="code" value={autoCode} required class="form-input-sm code-input" />
							<button type="button" class="btn-sm" onclick={refreshCode}>刷新</button>
						</div>
						<select name="ticket_type" required class="form-input-sm">
							<option value="vip">VIP</option>
							<option value="standard">标准</option>
							<option value="economy">经济</option>
						</select>
						<select name="seat_zone_id" class="form-input-sm">
							<option value="">无关联区域</option>
							{#each data.seatZones as zone}
								<option value={zone.id}>{zone.zone_name}</option>
							{/each}
						</select>
						<button type="submit" class="btn-sm-primary">生成</button>
					</form>
				{/if}

				{#if showBatchCode}
					<form method="POST" action="?/batchCheckinCodes" class="inline-form">
						<input type="number" name="count" placeholder="生成数量" required min="1" max="100" class="form-input-sm" />
						<select name="ticket_type" required class="form-input-sm">
							<option value="vip">VIP</option>
							<option value="standard">标准</option>
							<option value="economy">经济</option>
						</select>
						<select name="seat_zone_id" class="form-input-sm">
							<option value="">无关联区域</option>
							{#each data.seatZones as zone}
								<option value={zone.id}>{zone.zone_name}</option>
							{/each}
						</select>
						<button type="submit" class="btn-sm-primary">批量生成</button>
					</form>
				{/if}

				{#each data.checkinCodes as code}
					<div class="code-item">
						<div class="code-main">
							<span class="code-text">{code.code}</span>
							<span class="code-type">{zoneTypeLabels[code.ticket_type] ?? code.ticket_type}</span>
							{#if code.zone_name}
								<span class="code-zone">{code.zone_name}</span>
							{/if}
							{#key code.status}
								{@const cb = getBadge(checkinStatusConfig, code.status)}
								<span class="status-badge-sm" style="color: {cb.color}; background: {cb.bg};">{cb.label}</span>
							{/key}
						</div>
						{#if code.status === 'unused'}
							<div class="code-actions">
								<form method="POST" action="?/markCheckinUsed">
									<input type="hidden" name="id" value={code.id} />
									<button type="submit" class="btn-action-green">核销</button>
								</form>
								<form method="POST" action="?/markCheckinExpired">
									<input type="hidden" name="id" value={code.id} />
									<button type="submit" class="btn-action-gray">过期</button>
								</form>
							</div>
						{/if}
					</div>
				{/each}

				{#if data.checkinCodes.length === 0}
					<div class="empty-state">暂无签到码</div>
				{/if}
			</div>
		</div>

		<div class="column-card">
			<div class="card-header">
				<h3 class="card-title">赞助清单</h3>
				<button class="btn-sm" onclick={() => showAddSponsor = !showAddSponsor}>
					{showAddSponsor ? '取消' : '添加赞助'}
				</button>
			</div>
			<div class="card-body">
				{#if showAddSponsor}
					<form method="POST" action="?/addSponsor" class="inline-form">
						<input type="text" name="name" placeholder="赞助商名称" required class="form-input-sm" />
						<input type="text" name="contact" placeholder="联系方式" class="form-input-sm" />
						<select name="tier" required class="form-input-sm">
							<option value="platinum">白金</option>
							<option value="gold">黄金</option>
							<option value="silver">白银</option>
							<option value="bronze">青铜</option>
						</select>
						<input type="number" name="amount" placeholder="金额" required min="0" step="0.01" class="form-input-sm" />
						<textarea name="notes" placeholder="备注" rows="2" class="form-input-sm"></textarea>
						<button type="submit" class="btn-sm-primary">添加</button>
					</form>
				{/if}

				{#each data.sponsors as sp}
					{#key sp.id}
						{@const tb = getBadge(tierConfig, sp.tier)}
						<div class="sponsor-item">
							<div class="sponsor-header">
								<span class="sponsor-name">{sp.name}</span>
								<span class="tier-badge" style="color: {tb.color}; background: {tb.bg};">{tb.label}</span>
							</div>
						<div class="sponsor-details">
							<span>¥{sp.amount}</span>
							{#if sp.contact}
								<span class="sponsor-contact">{sp.contact}</span>
							{/if}
						</div>
						{#if sp.notes}
							<div class="sponsor-notes">{sp.notes}</div>
						{/if}
						<div class="sponsor-actions">
							<form method="POST" action="?/deleteSponsor">
								<input type="hidden" name="id" value={sp.id} />
								<button type="submit" class="btn-delete">删除</button>
							</form>
						</div>
						</div>
					{/key}
				{/each}

				{#if data.sponsors.length === 0}
					<div class="empty-state">暂无赞助商</div>
				{/if}
			</div>
		</div>
	</div>

	<div class="exceptions-section">
		<div class="section-header">
			<h3 class="section-title">异常记录</h3>
			<a href="/exceptions/new?performanceId={data.performance.id}" class="btn-sm-primary link-btn">报告异常</a>
		</div>
		{#if data.exceptions.length > 0}
			<div class="exceptions-list">
				{#each data.exceptions as exc}
					{#key exc.id}
						{@const eb = getBadge(exceptionStatusConfig, exc.status)}
						<div class="exception-item">
							<span class="exc-type">{exc.type}</span>
							<span class="status-badge-sm" style="color: {eb.color}; background: {eb.bg};">{eb.label}</span>
							<span class="exc-desc">{exc.description}</span>
						</div>
					{/key}
				{/each}
			</div>
		{:else}
			<div class="empty-state">暂无异常记录</div>
		{/if}
	</div>
</div>

<style>
	.detail-page {
		max-width: 1400px;
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 20px;
		gap: 16px;
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

	.page-title {
		font-size: 22px;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 8px;
	}

	.header-meta {
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}

	.meta-item {
		font-size: 14px;
		color: #64748b;
	}

	.status-badge {
		display: inline-block;
		padding: 3px 10px;
		border-radius: 9999px;
		font-size: 12px;
		font-weight: 500;
		white-space: nowrap;
	}

	.header-actions {
		flex-shrink: 0;
	}

	.status-form {
		display: flex;
	}

	.status-select {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		color: #334155;
		background: #ffffff;
		outline: none;
		min-width: 130px;
	}

	.status-select:focus {
		border-color: #3b82f6;
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

	.three-columns {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 20px;
		margin-bottom: 20px;
	}

	.column-card {
		background: #ffffff;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		border: 1px solid #e2e8f0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 18px;
		border-bottom: 1px solid #e2e8f0;
		background: #f8fafc;
		flex-shrink: 0;
	}

	.card-title {
		font-size: 15px;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.header-btns {
		display: flex;
		gap: 6px;
	}

	.card-body {
		padding: 14px 18px;
		max-height: 600px;
		overflow-y: auto;
	}

	.btn-sm {
		padding: 5px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
		color: #64748b;
		background: #ffffff;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-sm:hover {
		background: #f1f5f9;
	}

	.btn-sm-primary {
		padding: 5px 12px;
		border: none;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
		color: #ffffff;
		background: #3b82f6;
		cursor: pointer;
		transition: background 0.15s;
		text-decoration: none;
		display: inline-block;
	}

	.btn-sm-primary:hover {
		background: #2563eb;
	}

	.link-btn {
		display: inline-block;
		line-height: 20px;
	}

	.inline-form {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 10px;
		background: #f8fafc;
		border-radius: 8px;
		margin-bottom: 12px;
		border: 1px solid #e2e8f0;
	}

	.form-input-sm {
		padding: 6px 10px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 13px;
		color: #334155;
		outline: none;
		background: #ffffff;
		min-width: 0;
		flex: 1;
		font-family: inherit;
		resize: vertical;
	}

	.form-input-sm:focus {
		border-color: #3b82f6;
	}

	.form-row {
		display: flex;
		gap: 6px;
		width: 100%;
	}

	.code-input {
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace;
		flex: 1;
	}

	.zone-item {
		padding: 10px 0;
		border-bottom: 1px solid #f1f5f9;
	}

	.zone-item:last-child {
		border-bottom: none;
	}

	.zone-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.zone-name {
		font-weight: 500;
		color: #1e293b;
		font-size: 14px;
	}

	.zone-type-badge {
		display: inline-block;
		padding: 1px 8px;
		border-radius: 9999px;
		font-size: 11px;
		font-weight: 500;
	}

	.zone-price {
		font-size: 13px;
		color: #64748b;
		margin-bottom: 6px;
	}

	.zone-progress {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.progress-bar {
		flex: 1;
		height: 6px;
		background: #e2e8f0;
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.2s;
	}

	.progress-text {
		font-size: 11px;
		font-weight: 500;
		white-space: nowrap;
	}

	.zone-actions {
		margin-top: 6px;
		display: flex;
		gap: 6px;
	}

	.btn-delete {
		padding: 2px 8px;
		border: none;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 500;
		color: #dc2626;
		background: #fef2f2;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-delete:hover {
		background: #fecaca;
	}

	.code-stats {
		display: flex;
		gap: 12px;
		padding: 8px 0 12px;
		border-bottom: 1px solid #e2e8f0;
		margin-bottom: 10px;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
	}

	.stat-value {
		font-size: 18px;
		font-weight: 600;
		color: #1e293b;
	}

	.stat-label {
		font-size: 11px;
		color: #94a3b8;
	}

	.code-item {
		padding: 8px 0;
		border-bottom: 1px solid #f1f5f9;
	}

	.code-item:last-child {
		border-bottom: none;
	}

	.code-main {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
		margin-bottom: 4px;
	}

	.code-text {
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', monospace;
		font-size: 12px;
		color: #334155;
		background: #f1f5f9;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.code-type {
		font-size: 11px;
		color: #64748b;
	}

	.code-zone {
		font-size: 11px;
		color: #94a3b8;
	}

	.status-badge-sm {
		display: inline-block;
		padding: 1px 8px;
		border-radius: 9999px;
		font-size: 10px;
		font-weight: 500;
	}

	.code-actions {
		display: flex;
		gap: 6px;
	}

	.btn-action-green {
		padding: 2px 8px;
		border: none;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 500;
		color: #16a34a;
		background: #dcfce7;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-action-green:hover {
		background: #bbf7d0;
	}

	.btn-action-gray {
		padding: 2px 8px;
		border: none;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 500;
		color: #6b7280;
		background: #f3f4f6;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-action-gray:hover {
		background: #e5e7eb;
	}

	.sponsor-item {
		padding: 10px 0;
		border-bottom: 1px solid #f1f5f9;
	}

	.sponsor-item:last-child {
		border-bottom: none;
	}

	.sponsor-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.sponsor-name {
		font-weight: 500;
		color: #1e293b;
		font-size: 14px;
	}

	.tier-badge {
		display: inline-block;
		padding: 1px 8px;
		border-radius: 9999px;
		font-size: 11px;
		font-weight: 500;
	}

	.sponsor-details {
		display: flex;
		gap: 12px;
		font-size: 13px;
		color: #64748b;
		margin-bottom: 4px;
	}

	.sponsor-contact {
		color: #94a3b8;
	}

	.sponsor-notes {
		font-size: 12px;
		color: #94a3b8;
		margin-bottom: 4px;
	}

	.sponsor-actions {
		display: flex;
		gap: 6px;
	}

	.exceptions-section {
		background: #ffffff;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		border: 1px solid #e2e8f0;
		padding: 18px;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}

	.section-title {
		font-size: 15px;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.exceptions-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.exception-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		background: #f8fafc;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
	}

	.exc-type {
		font-weight: 500;
		font-size: 13px;
		color: #1e293b;
	}

	.exc-desc {
		font-size: 13px;
		color: #64748b;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.empty-state {
		text-align: center;
		padding: 24px;
		color: #94a3b8;
		font-size: 13px;
	}
</style>
