<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { trpc } from '$trpc/client';
	import { statusColors, riskColors, riskLabels, scopeTypeOptions, changeTypeOptions } from '$types';

	export let data;

	$: user = data.user;
	$: projectId = $page.params.id;

	let project: any = null;
	let loading = true;
	let activeTab = 'authorization';
	let completenessData: any = null;
	let missingDocsWithRisk: any[] = [];

	const tabs = [
		{ id: 'authorization', label: '🔐 授权范围', icon: '🔐' },
		{ id: 'timeline', label: '📝 变更时间线', icon: '📝' },
		{ id: 'profile', label: '📋 基础档案', icon: '📋' },
		{ id: 'attachments', label: '📎 附件材料', icon: '📎' },
		{ id: 'risks', label: '⚠️ 资料缺失', icon: '⚠️' },
		{ id: 'reviews', label: '💬 复核意见', icon: '💬' },
		{ id: 'dashboard', label: '📊 完整率趋势', icon: '📊' }
	];

	async function loadProject() {
		loading = true;
		try {
			project = await trpc.project.get.query({ id: projectId });
			await calculateCompleteness();
		} catch (e) {
			console.error('Load project failed:', e);
		} finally {
			loading = false;
		}
	}

	async function calculateCompleteness() {
		try {
			completenessData = await trpc.project.calculateCompleteness.mutate({
				projectId
			});

			missingDocsWithRisk = completenessData.missingCategories.map((cat: any) => {
				const daysUntilDeadline = Math.ceil(
					(new Date(project.expectedEndDate || Date.now() + 30 * 24 * 3600 * 1000).getTime() -
						Date.now()) /
						(1000 * 60 * 60 * 24)
				);

				let riskLevel: 'critical' | 'issue' | 'comment' = 'comment';
				const highRiskCodes = ['contract', 'id_card', 'payment_proof', 'acceptance'];
				const mediumRiskCodes = ['design_draw', 'material_list', 'construction_photo'];

				if (highRiskCodes.includes(cat.code)) {
					riskLevel = daysUntilDeadline < 3 ? 'critical' : 'issue';
				} else if (mediumRiskCodes.includes(cat.code)) {
					riskLevel = daysUntilDeadline < 7 ? 'issue' : 'comment';
				}

				return {
					...cat,
					riskLevel,
					daysUntilDeadline
				};
			});

			missingDocsWithRisk.sort((a, b) => {
				const order = { critical: 3, issue: 2, comment: 1 };
				return order[b.riskLevel] - order[a.riskLevel];
			});
		} catch (e) {
			console.error('Calculate completeness failed:', e);
		}
	}

	onMount(() => {
		loadProject();
	});

	function formatDate(dateStr: string) {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleString('zh-CN');
	}

	function formatDateShort(dateStr: string) {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('zh-CN');
	}

	function getScopeTypeLabel(value: string) {
		return scopeTypeOptions.find((o) => o.value === value)?.label || value;
	}

	function getChangeTypeLabel(value: string) {
		return changeTypeOptions.find((o) => o.value === value)?.label || value;
	}

	function getStatusLabel(status: string) {
		const labels: Record<string, string> = {
			pending: '待审批',
			approved: '已通过',
			rejected: '已拒绝',
			returned: '已退回'
		};
		return labels[status] || status;
	}

	function getReviewStatusLabel(status: string) {
		const labels: Record<string, string> = {
			pending: '待复核',
			approved: '已通过',
			rejected: '已拒绝',
			returned: '需修改'
		};
		return labels[status] || status;
	}
</script>

{#if loading}
	<div class="loading">加载中...</div>
{:else if project}
	<div class="project-header">
		<div>
			<div class="project-breadcrumb">
				<a href="/">项目总览</a> / {project.projectNo}
			</div>
			<h1>{project.name}</h1>
			<div class="project-meta">
				<span
					class="status-badge"
					style="background: {statusColors[project.status]}20; color: {statusColors[project.status]}"
				>
					{project.status === 'ongoing'
						? '进行中'
						: project.status === 'completed'
							? '已完成'
							: project.status}
				</span>
				<span class="meta-item">👤 {project.customerName}</span>
				<span class="meta-item">📞 {project.customerPhone}</span>
				{#if project.manager?.fullName}
					<span class="meta-item">👷 {project.manager.fullName}</span>
				{/if}
			</div>
		</div>
		{#if completenessData}
			<div class="completeness-card">
				<div class="completeness-value">
					{completenessData.completenessRate}%
				</div>
				<div class="completeness-label">资料完整率</div>
				<div class="completeness-bar">
					<div
						class="completeness-fill"
						style="width: {completenessData.completenessRate}%; background: {completenessData.completenessRate >= 80 ? 'var(--success)' : completenessData.completenessRate >= 50 ? 'var(--warning)' : 'var(--danger)'}"
					/>
				</div>
				<div class="completeness-detail">
					{completenessData.completedCount}/{completenessData.totalRequired} 项已完成
				</div>
			</div>
		{/if}
	</div>

	<div class="tab-nav">
		{#each tabs as tab}
			<button
				class="tab-btn"
				class:active={activeTab === tab.id}
				on:click={() => (activeTab = tab.id)}
			>
				{tab.label}
				{#if tab.id === 'risks' && missingDocsWithRisk.length > 0}
					<span class="tab-badge" style="background: var(--danger)">
						{missingDocsWithRisk.length}
					</span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="tab-content">
		{#if activeTab === 'authorization'}
			<div class="section">
				<div class="section-header">
					<h2>🔐 授权范围</h2>
					<p class="section-desc">管理施工、材料、验收等各环节的客户授权记录</p>
				</div>
				<div class="auth-list">
					{#each project.authorizations as auth}
						<div class="auth-item">
							<div class="auth-main">
								<div class="auth-type">{getScopeTypeLabel(auth.scopeType)}</div>
								<div class="auth-desc">{auth.description || '暂无详细描述'}</div>
								<div class="auth-meta">
									<span>申请时间: {formatDate(auth.createdAt)}</span>
									{#if auth.authorizedAt}
										<span>授权时间: {formatDate(auth.authorizedAt)}</span>
									{/if}
									{#if auth.expiresAt}
										<span>有效期至: {formatDateShort(auth.expiresAt)}</span>
									{/if}
								</div>
							</div>
							<div
								class="status-badge"
								style="background: {statusColors[auth.status]}20; color: {statusColors[auth.status]}"
							>
								{getStatusLabel(auth.status)}
							</div>
						</div>
					{:else}
						<div class="empty-section">
							<p>暂无授权记录</p>
						</div>
					{/each}
				</div>
			</div>
		{:else if activeTab === 'timeline'}
			<div class="section">
				<div class="section-header">
					<h2>📝 变更时间线</h2>
					<p class="section-desc">跟踪所有设计、材料、工艺等变更记录，确保客户确认</p>
				</div>
				<div class="timeline">
					{#each project.changeRecords as change}
						<div class="timeline-item">
							<div class="timeline-dot" />
							<div class="timeline-content">
								<div class="timeline-header">
									<span class="change-type">{getChangeTypeLabel(change.changeType)}</span>
									<span
										class="status-badge"
										style="background: {statusColors[change.reviewStatus]}20; color: {statusColors[change.reviewStatus]}"
									>
										{getReviewStatusLabel(change.reviewStatus)}
									</span>
									{#if change.customerConfirmed}
										<span class="customer-confirmed">✓ 客户已确认</span>
									{/if}
								</div>
								<div class="change-content">{change.changeContent}</div>
								{#if change.reason}
									<div class="change-reason">📌 变更原因: {change.reason}</div>
								{/if}
								<div class="timeline-footer">
									<span>申请人: {change.creator?.fullName}</span>
									<span>{formatDate(change.createdAt)}</span>
								</div>
								{#if change.reviewComment}
									<div class="review-comment">
										<strong>复核意见:</strong> {change.reviewComment}
									</div>
								{/if}
								{#if change.attachments?.length > 0}
									<div class="change-attachments">
										{#each change.attachments as att}
											<span class="attachment-tag">📎 {att.fileName}</span>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					{:else}
						<div class="empty-section">
							<p>暂无变更记录</p>
						</div>
					{/each}
				</div>
			</div>
		{:else if activeTab === 'profile'}
			<div class="section">
				<div class="section-header">
					<h2>📋 基础档案</h2>
					<p class="section-desc">核对客户基础信息、房屋信息、装修需求等档案资料</p>
				</div>
				{#if project.customerProfile}
					<div class="profile-grid">
						<div class="profile-card">
							<h3>👤 客户信息</h3>
							<div class="profile-field">
								<label>姓名</label>
								<span>{project.customerName}</span>
							</div>
							<div class="profile-field">
								<label>电话</label>
								<span>{project.customerPhone}</span>
							</div>
							<div class="profile-field">
								<label>身份证号</label>
								<span>{project.customerProfile.idCardNo || '-'}</span>
							</div>
							<div class="profile-field">
								<label>联系地址</label>
								<span>{project.customerProfile.address || '-'}</span>
							</div>
							<div class="profile-field">
								<label>邮箱</label>
								<span>{project.customerProfile.email || '-'}</span>
							</div>
						</div>
						<div class="profile-card">
							<h3>🏠 房屋信息</h3>
							<div class="profile-field">
								<label>房屋面积</label>
								<span>{project.customerProfile.houseArea ? project.customerProfile.houseArea + ' ㎡' : '-'}</span>
							</div>
							<div class="profile-field">
								<label>房屋类型</label>
								<span>{project.customerProfile.houseType || '-'}</span>
							</div>
							<div class="profile-field">
								<label>装修风格</label>
								<span>{project.customerProfile.decorationStyle || '-'}</span>
							</div>
							<div class="profile-field">
								<label>装修预算</label>
								<span>{project.customerProfile.budget ? '¥' + project.customerProfile.budget.toLocaleString() : '-'}</span>
							</div>
						</div>
						<div class="profile-card">
							<h3>📞 紧急联系人</h3>
							<div class="profile-field">
								<label>姓名</label>
								<span>{project.customerProfile.emergencyContact || '-'}</span>
							</div>
							<div class="profile-field">
								<label>电话</label>
								<span>{project.customerProfile.emergencyPhone || '-'}</span>
							</div>
						</div>
						{#if project.customerProfile.notes}
							<div class="profile-card full-width">
								<h3>📝 备注信息</h3>
								<p class="notes-text">{project.customerProfile.notes}</p>
							</div>
						{/if}
					</div>
				{:else}
					<div class="empty-section">
						<p>暂无客户档案信息</p>
					</div>
				{/if}
			</div>
		{:else if activeTab === 'attachments'}
			<div class="section">
				<div class="section-header">
					<h2>📎 附件材料</h2>
					<p class="section-desc">管理合同、图纸、照片等所有项目相关附件</p>
				</div>
				<div class="attachment-list">
					{#each project.attachments as att}
						<div class="attachment-item">
							<div class="attachment-icon">
								{att.fileType?.includes('image')
									? '🖼️'
									: att.fileType?.includes('pdf')
										? '📕'
										: att.fileType?.includes('excel') || att.fileType?.includes('spreadsheet')
											? '📊'
											: att.fileType?.includes('word') || att.fileType?.includes('document')
												? '📄'
												: '📁'}
							</div>
							<div class="attachment-info">
								<div class="attachment-name">{att.fileName}</div>
								<div class="attachment-meta">
									<span>{att.category?.name || '未分类'}</span>
									<span>版本 {att.version}</span>
									<span>上传者: {att.uploader?.fullName}</span>
									<span>{formatDate(att.createdAt)}</span>
								</div>
								{#if att.description}
									<div class="attachment-desc">{att.description}</div>
								{/if}
							</div>
						</div>
					{:else}
						<div class="empty-section">
							<p>暂无附件材料</p>
						</div>
					{/each}
				</div>
			</div>
		{:else if activeTab === 'risks'}
			<div class="section">
				<div class="section-header">
					<h2>⚠️ 资料缺失风险</h2>
					<p class="section-desc">按风险等级排序，优先处理严重缺失的资料</p>
				</div>
				{#if missingDocsWithRisk.length > 0}
					<div class="risk-list">
						{#each missingDocsWithRisk as doc}
							<div class="risk-item">
								<div
									class="risk-indicator"
									style="background: {riskColors[doc.riskLevel]}"
								/>
								<div class="risk-content">
									<div class="risk-header">
										<span class="risk-name">{doc.name}</span>
										<span
											class="risk-badge"
											style="background: {riskColors[doc.riskLevel]}20; color: {riskColors[doc.riskLevel]}"
										>
											{riskLabels[doc.riskLevel]}
										</span>
									</div>
									<div class="risk-code">资料编码: {doc.code}</div>
									{#if doc.description}
										<div class="risk-desc">{doc.description}</div>
									{/if}
									<div class="risk-action">
										<span class="urgency-text">
											距截止日期还有 {doc.daysUntilDeadline} 天
										</span>
										<button class="upload-btn">📤 上传资料</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="success-section">
						<div class="success-icon">✅</div>
						<h3>资料完整！</h3>
						<p>所有必需资料均已上传，无缺失项</p>
					</div>
				{/if}
			</div>
		{:else if activeTab === 'reviews'}
			<div class="section">
				<div class="section-header">
					<h2>💬 复核意见与沟通</h2>
					<p class="section-desc">复核意见与沟通备注集中管理，便于追溯</p>
				</div>
				<div class="review-list">
					{#each project.reviewOpinions as review}
						<div class="review-card">
							<div class="review-header">
								<div class="reviewer-info">
									<div class="reviewer-avatar">{review.reviewer?.fullName?.[0] || '?'}</div>
									<div>
										<div class="reviewer-name">{review.reviewer?.fullName}</div>
										<div class="reviewer-role">
											{review.reviewer?.role === 'manager' ? '项目经理' : review.reviewer?.role}
										</div>
									</div>
								</div>
								<div class="review-meta">
									<span
										class="risk-badge"
										style="background: {riskColors[review.status as keyof typeof riskColors]}20; color: {riskColors[review.status as keyof typeof riskColors]}"
									>
										{riskLabels[review.status as keyof typeof riskLabels]}
									</span>
									<span class="review-time">{formatDate(review.createdAt)}</span>
								</div>
							</div>
							<div class="review-content">{review.content}</div>
							{#if review.communicationNotes?.length > 0}
								<div class="communication-section">
									<div class="communication-title">💬 沟通记录</div>
									{#each review.communicationNotes as note}
										<div class="communication-item">
											<div class="comm-avatar">{note.communicator?.fullName?.[0] || '?'}</div>
											<div class="comm-content">
												<div class="comm-header">
													<span class="comm-name">{note.communicator?.fullName}</span>
													{#if note.customerInvolved}
														<span class="customer-tag">客户在场</span>
													{/if}
													<span class="comm-time">{formatDate(note.createdAt)}</span>
												</div>
												<div class="comm-text">{note.content}</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{:else}
						<div class="empty-section">
							<p>暂无复核意见</p>
						</div>
					{/each}
				</div>
			</div>
		{:else if activeTab === 'dashboard'}
			<div class="section">
				<div class="section-header">
					<h2>📊 资料完整率趋势</h2>
					<p class="section-desc">追踪资料完整率的历史变化，供管理层参考</p>
				</div>
				{#if project.completenessLogs?.length > 0}
					<div class="trend-chart">
						<div class="chart-container">
							{#each project.completenessLogs as log}
								<div class="chart-bar-wrapper">
									<div class="chart-bar" style="height: {log.completenessRate}%">
										<span class="bar-value">{log.completenessRate}%</span>
									</div>
									<div class="bar-label">{formatDateShort(log.calculatedAt)}</div>
								</div>
							{/each}
						</div>
						<div class="chart-legend">
							<div class="legend-item">
								<span class="legend-dot" style="background: var(--success)" />
								≥80% 优秀
							</div>
							<div class="legend-item">
								<span class="legend-dot" style="background: var(--warning)" />
								50-80% 需关注
							</div>
							<div class="legend-item">
								<span class="legend-dot" style="background: var(--danger)" />
								<50% 严重
							</div>
						</div>
					</div>
					<div class="stats-grid">
						<div class="stat-card">
							<div class="stat-value">
								{completenessData?.completenessRate || 0}%
							</div>
							<div class="stat-label">当前完整率</div>
						</div>
						<div class="stat-card">
							<div class="stat-value">
								{completenessData?.completedCount || 0}
							</div>
							<div class="stat-label">已完成项</div>
						</div>
						<div class="stat-card">
							<div class="stat-value">
								{missingDocsWithRisk.length}
							</div>
							<div class="stat-label">缺失项</div>
						</div>
						<div class="stat-card">
							<div class="stat-value">
								{project.completenessLogs?.length || 0}
							</div>
							<div class="stat-label">追踪记录数</div>
						</div>
					</div>
				{:else}
					<div class="empty-section">
						<p>暂无趋势数据，请先计算资料完整率</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.loading {
		text-align: center;
		padding: 60px;
		color: var(--gray-500);
	}

	.project-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 24px;
		gap: 24px;
		flex-wrap: wrap;
	}

	.project-breadcrumb {
		font-size: 14px;
		color: var(--gray-500);
		margin-bottom: 8px;
	}

	.project-breadcrumb a {
		color: var(--primary);
		text-decoration: none;
	}

	.project-breadcrumb a:hover {
		text-decoration: underline;
	}

	.project-header h1 {
		font-size: 28px;
		font-weight: 700;
		color: var(--gray-800);
		margin-bottom: 12px;
	}

	.project-meta {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
		align-items: center;
	}

	.meta-item {
		color: var(--gray-600);
		font-size: 14px;
	}

	.status-badge {
		padding: 4px 12px;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 500;
	}

	.completeness-card {
		background: white;
		padding: 20px 24px;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		min-width: 200px;
		text-align: center;
	}

	.completeness-value {
		font-size: 36px;
		font-weight: 700;
		color: var(--primary);
		line-height: 1;
	}

	.completeness-label {
		font-size: 13px;
		color: var(--gray-500);
		margin-top: 4px;
		margin-bottom: 12px;
	}

	.completeness-bar {
		height: 8px;
		background: var(--gray-100);
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 8px;
	}

	.completeness-fill {
		height: 100%;
		transition: width 0.3s;
	}

	.completeness-detail {
		font-size: 12px;
		color: var(--gray-500);
	}

	.tab-nav {
		display: flex;
		gap: 4px;
		border-bottom: 2px solid var(--gray-100);
		margin-bottom: 24px;
		flex-wrap: wrap;
	}

	.tab-btn {
		position: relative;
		padding: 12px 20px;
		background: none;
		border: none;
		color: var(--gray-600);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.tab-btn:hover {
		color: var(--primary);
	}

	.tab-btn.active {
		color: var(--primary);
	}

	.tab-btn.active::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--primary);
	}

	.tab-badge {
		padding: 2px 8px;
		border-radius: 10px;
		font-size: 11px;
		color: white;
		font-weight: 600;
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

	.auth-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.auth-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 16px;
		background: var(--gray-50);
		border-radius: 8px;
		gap: 16px;
	}

	.auth-main {
		flex: 1;
	}

	.auth-type {
		font-size: 15px;
		font-weight: 600;
		color: var(--gray-800);
		margin-bottom: 4px;
	}

	.auth-desc {
		color: var(--gray-600);
		font-size: 14px;
		margin-bottom: 8px;
	}

	.auth-meta {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
		font-size: 12px;
		color: var(--gray-500);
	}

	.timeline {
		position: relative;
		padding-left: 24px;
	}

	.timeline-item {
		position: relative;
		padding-bottom: 24px;
	}

	.timeline-item:not(:last-child)::before {
		content: '';
		position: absolute;
		left: -18px;
		top: 10px;
		bottom: -10px;
		width: 2px;
		background: var(--gray-200);
	}

	.timeline-dot {
		position: absolute;
		left: -24px;
		top: 6px;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--primary);
		border: 3px solid white;
		box-shadow: 0 0 0 2px var(--primary);
	}

	.timeline-content {
		background: var(--gray-50);
		padding: 16px;
		border-radius: 8px;
	}

	.timeline-header {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-bottom: 8px;
		flex-wrap: wrap;
	}

	.change-type {
		font-weight: 600;
		color: var(--gray-800);
	}

	.customer-confirmed {
		background: rgba(16, 185, 129, 0.1);
		color: var(--success);
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
	}

	.change-content {
		color: var(--gray-700);
		margin-bottom: 8px;
		font-size: 14px;
	}

	.change-reason {
		background: rgba(245, 158, 11, 0.1);
		color: var(--warning);
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 13px;
		margin-bottom: 8px;
	}

	.timeline-footer {
		display: flex;
		gap: 16px;
		font-size: 12px;
		color: var(--gray-500);
		margin-top: 8px;
	}

	.review-comment {
		background: rgba(59, 130, 246, 0.1);
		padding: 12px;
		border-radius: 6px;
		margin-top: 12px;
		font-size: 13px;
		color: var(--gray-700);
	}

	.change-attachments {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		margin-top: 12px;
	}

	.attachment-tag {
		background: white;
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 12px;
		color: var(--gray-600);
		border: 1px solid var(--gray-200);
	}

	.profile-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 20px;
	}

	.profile-card {
		background: var(--gray-50);
		padding: 20px;
		border-radius: 8px;
	}

	.profile-card.full-width {
		grid-column: 1 / -1;
	}

	.profile-card h3 {
		font-size: 16px;
		font-weight: 600;
		color: var(--gray-800);
		margin-bottom: 16px;
	}

	.profile-field {
		display: flex;
		justify-content: space-between;
		padding: 10px 0;
		border-bottom: 1px solid var(--gray-200);
		font-size: 14px;
	}

	.profile-field:last-child {
		border-bottom: none;
	}

	.profile-field label {
		color: var(--gray-500);
	}

	.profile-field span {
		color: var(--gray-800);
		font-weight: 500;
	}

	.notes-text {
		color: var(--gray-700);
		line-height: 1.8;
		font-size: 14px;
	}

	.attachment-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.attachment-item {
		display: flex;
		gap: 16px;
		padding: 16px;
		background: var(--gray-50);
		border-radius: 8px;
		align-items: center;
	}

	.attachment-icon {
		font-size: 32px;
	}

	.attachment-info {
		flex: 1;
	}

	.attachment-name {
		font-weight: 600;
		color: var(--gray-800);
		margin-bottom: 4px;
	}

	.attachment-meta {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
		font-size: 12px;
		color: var(--gray-500);
		margin-bottom: 4px;
	}

	.attachment-desc {
		color: var(--gray-600);
		font-size: 13px;
	}

	.risk-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.risk-item {
		display: flex;
		gap: 16px;
		padding: 20px;
		background: var(--gray-50);
		border-radius: 10px;
		border-left: 4px solid transparent;
	}

	.risk-indicator {
		width: 4px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.risk-content {
		flex: 1;
	}

	.risk-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
		gap: 12px;
	}

	.risk-name {
		font-size: 16px;
		font-weight: 600;
		color: var(--gray-800);
	}

	.risk-badge {
		padding: 4px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		flex-shrink: 0;
	}

	.risk-code {
		font-size: 12px;
		color: var(--gray-500);
		margin-bottom: 4px;
	}

	.risk-desc {
		color: var(--gray-600);
		font-size: 14px;
		margin-bottom: 12px;
	}

	.risk-action {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.urgency-text {
		font-size: 13px;
		color: var(--warning);
		font-weight: 500;
	}

	.upload-btn {
		padding: 8px 16px;
		background: var(--primary);
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 13px;
		font-weight: 500;
	}

	.success-section {
		text-align: center;
		padding: 60px 20px;
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

	.review-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.review-card {
		background: var(--gray-50);
		border-radius: 10px;
		padding: 20px;
	}

	.review-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;
		gap: 12px;
	}

	.reviewer-info {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.reviewer-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea, #764ba2);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
	}

	.reviewer-name {
		font-weight: 600;
		color: var(--gray-800);
	}

	.reviewer-role {
		font-size: 12px;
		color: var(--gray-500);
	}

	.review-meta {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.review-time {
		font-size: 12px;
		color: var(--gray-500);
	}

	.review-content {
		color: var(--gray-700);
		line-height: 1.7;
		font-size: 14px;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--gray-200);
	}

	.communication-section {
		margin-top: 16px;
	}

	.communication-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--gray-600);
		margin-bottom: 12px;
	}

	.communication-item {
		display: flex;
		gap: 12px;
		padding: 12px;
		background: white;
		border-radius: 8px;
		margin-bottom: 8px;
	}

	.comm-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--primary);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: 600;
		flex-shrink: 0;
	}

	.comm-content {
		flex: 1;
	}

	.comm-header {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-bottom: 4px;
		flex-wrap: wrap;
	}

	.comm-name {
		font-size: 13px;
		font-weight: 600;
		color: var(--gray-700);
	}

	.customer-tag {
		background: rgba(16, 185, 129, 0.1);
		color: var(--success);
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 500;
	}

	.comm-time {
		font-size: 11px;
		color: var(--gray-500);
	}

	.comm-text {
		font-size: 13px;
		color: var(--gray-600);
		line-height: 1.6;
	}

	.trend-chart {
		background: var(--gray-50);
		padding: 24px;
		border-radius: 8px;
		margin-bottom: 24px;
	}

	.chart-container {
		display: flex;
		align-items: flex-end;
		gap: 8px;
		height: 250px;
		padding: 0 8px;
		overflow-x: auto;
	}

	.chart-bar-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		min-width: 40px;
		flex: 1;
	}

	.chart-bar {
		width: 100%;
		background: linear-gradient(180deg, var(--primary), var(--primary-dark));
		border-radius: 4px 4px 0 0;
		position: relative;
		min-height: 4px;
		transition: height 0.3s;
	}

	.bar-value {
		position: absolute;
		top: -20px;
		left: 50%;
		transform: translateX(-50%);
		font-size: 11px;
		font-weight: 600;
		color: var(--gray-700);
		white-space: nowrap;
	}

	.bar-label {
		font-size: 10px;
		color: var(--gray-500);
		white-space: nowrap;
	}

	.chart-legend {
		display: flex;
		justify-content: center;
		gap: 24px;
		margin-top: 20px;
		flex-wrap: wrap;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		color: var(--gray-600);
	}

	.legend-dot {
		width: 12px;
		height: 12px;
		border-radius: 3px;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 16px;
	}

	.stat-card {
		background: var(--gray-50);
		padding: 24px;
		border-radius: 8px;
		text-align: center;
	}

	.stat-value {
		font-size: 32px;
		font-weight: 700;
		color: var(--primary);
		line-height: 1;
		margin-bottom: 8px;
	}

	.stat-label {
		font-size: 13px;
		color: var(--gray-500);
	}

	.empty-section {
		text-align: center;
		padding: 60px 20px;
		color: var(--gray-500);
	}
</style>
