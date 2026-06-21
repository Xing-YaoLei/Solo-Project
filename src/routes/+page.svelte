<script lang="ts">
	import { onMount } from 'svelte';
	import { trpc } from '$trpc/client';
	import { goto } from '$app/navigation';
	import { statusColors } from '$types';

	export let data;

	let projects: any[] = [];
	let total = 0;
	let loading = true;
	let page = 1;
	let pageSize = 20;
	let keyword = '';
	let statusFilter = '';
	let showCreateModal = false;

	$: user = data.user;

	async function loadProjects() {
		loading = true;
		try {
			const result = await trpc.project.list.query({
				page,
				pageSize,
				status: statusFilter || undefined,
				keyword: keyword || undefined
			});
			projects = result.projects;
			total = result.total;
		} catch (e) {
			console.error('Load projects failed:', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadProjects();
	});

	function search() {
		page = 1;
		loadProjects();
	}

	function formatDate(dateStr: string) {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('zh-CN');
	}

	function getStatusLabel(status: string) {
		const labels: Record<string, string> = {
			ongoing: '进行中',
			completed: '已完成',
			cancelled: '已取消',
			pending: '待开始'
		};
		return labels[status] || status;
	}

	function getTotalPages() {
		return Math.ceil(total / pageSize);
	}
</script>

<div class="page-header">
	<div>
		<h1>📋 项目总览</h1>
		<p class="subtitle">管理所有家装工地项目，跟踪客户确认和资料完整度</p>
	</div>
	{#if user?.role === 'manager' || user?.role === 'admin'}
		<button class="primary-btn" on:click={() => (showCreateModal = true)}>
			+ 新建项目
		</button>
	{/if}
</div>

<div class="filter-bar">
	<div class="search-box">
		<input
			type="text"
			bind:value={keyword}
			placeholder="搜索项目名称、客户、编号..."
			on:keydown={(e) => e.key === 'Enter' && search()}
		/>
		<button class="search-btn" on:click={search}>搜索</button>
	</div>
	<div class="filter-select">
		<select bind:value={statusFilter} on:change={loadProjects}>
			<option value="">全部状态</option>
			<option value="ongoing">进行中</option>
			<option value="completed">已完成</option>
			<option value="cancelled">已取消</option>
			<option value="pending">待开始</option>
		</select>
	</div>
</div>

{#if loading}
	<div class="loading">加载中...</div>
{:else}
	<div class="project-grid">
		{#each projects as project}
			<div class="project-card" on:click={() => goto(`/projects/${project.id}`)}>
				<div class="card-header">
					<span class="project-no">{project.projectNo}</span>
					<span
						class="status-badge"
						style="background: {statusColors[project.status]}20; color: {statusColors[project.status]}"
					>
						{getStatusLabel(project.status)}
					</span>
				</div>
				<h3 class="project-name">{project.name}</h3>
				<div class="project-info">
					<div class="info-row">
						<span class="info-label">👤 客户</span>
						<span class="info-value">{project.customerName}</span>
					</div>
					<div class="info-row">
						<span class="info-label">📞 电话</span>
						<span class="info-value">{project.customerPhone || '-'}</span>
					</div>
					<div class="info-row">
						<span class="info-label">📍 地址</span>
						<span class="info-value text-truncate">{project.address || '-'}</span>
					</div>
					<div class="info-row">
						<span class="info-label">👷 负责人</span>
						<span class="info-value">{project.managerName || '-'}</span>
					</div>
				</div>
				<div class="card-footer">
					<span class="date-text">更新于 {formatDate(project.updatedAt)}</span>
					<span class="arrow">→</span>
				</div>
			</div>
		{:else}
			<div class="empty-state">
				<div class="empty-icon">📭</div>
				<p>暂无项目</p>
			</div>
		{/each}
	</div>

	{#if total > pageSize}
		<div class="pagination">
			<button disabled={page <= 1} on:click={() => (page--, loadProjects())}>
				上一页
			</button>
			<span>第 {page} / {getTotalPages()} 页，共 {total} 条</span>
			<button disabled={page >= getTotalPages()} on:click={() => (page++, loadProjects())}>
				下一页
			</button>
		</div>
	{/if}
{/if}

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
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

	.primary-btn {
		padding: 10px 20px;
		background: linear-gradient(135deg, var(--primary), var(--primary-dark));
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.primary-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
	}

	.filter-bar {
		display: flex;
		gap: 16px;
		margin-bottom: 24px;
		flex-wrap: wrap;
	}

	.search-box {
		display: flex;
		flex: 1;
		min-width: 300px;
		gap: 8px;
	}

	.search-box input {
		flex: 1;
		padding: 10px 16px;
		border: 1px solid var(--gray-200);
		border-radius: 8px;
		font-size: 14px;
		transition: all 0.2s;
	}

	.search-box input:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.search-btn {
		padding: 10px 20px;
		background: var(--primary);
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 14px;
	}

	.filter-select select {
		padding: 10px 16px;
		border: 1px solid var(--gray-200);
		border-radius: 8px;
		font-size: 14px;
		background: white;
		min-width: 150px;
	}

	.loading {
		text-align: center;
		padding: 60px;
		color: var(--gray-500);
	}

	.project-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: 20px;
	}

	.project-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition: all 0.2s;
		border: 1px solid var(--gray-100);
	}

	.project-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
		border-color: var(--primary);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.project-no {
		font-size: 12px;
		color: var(--gray-500);
		background: var(--gray-100);
		padding: 4px 10px;
		border-radius: 4px;
		font-weight: 500;
	}

	.status-badge {
		font-size: 12px;
		padding: 4px 10px;
		border-radius: 4px;
		font-weight: 500;
	}

	.project-name {
		font-size: 18px;
		font-weight: 600;
		color: var(--gray-800);
		margin-bottom: 16px;
	}

	.project-info {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 16px;
	}

	.info-row {
		display: flex;
		gap: 8px;
		font-size: 13px;
	}

	.info-label {
		color: var(--gray-500);
		min-width: 60px;
		flex-shrink: 0;
	}

	.info-value {
		color: var(--gray-700);
		flex: 1;
	}

	.text-truncate {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 16px;
		border-top: 1px solid var(--gray-100);
	}

	.date-text {
		font-size: 12px;
		color: var(--gray-400);
	}

	.arrow {
		color: var(--primary);
		font-size: 18px;
	}

	.empty-state {
		grid-column: 1 / -1;
		text-align: center;
		padding: 80px 20px;
		color: var(--gray-500);
	}

	.empty-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 16px;
		margin-top: 32px;
	}

	.pagination button {
		padding: 8px 16px;
		border: 1px solid var(--gray-200);
		background: white;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}

	.pagination button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pagination span {
		color: var(--gray-600);
		font-size: 14px;
	}
</style>
