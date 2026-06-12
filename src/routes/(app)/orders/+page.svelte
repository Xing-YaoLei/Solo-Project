<script lang="ts">
	import { goto } from '$app/navigation';
	import { getTrpcClient } from '$lib/trpc';

	let orders = $state<any[]>([]);
	let users = $state<any[]>([]);
	let loading = $state(true);
	let page = $state(1);
	let pageSize = $state(20);
	let total = $state(0);

	let statusFilter = $state('');
	let regionFilter = $state('');
	let handlerFilter = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let keyword = $state('');

	const statusMap: Record<string, string> = {
		pending: '待处理',
		processing: '处理中',
		escalated: '已升级',
		closed: '已关闭'
	};

	const statusColorMap: Record<string, string> = {
		pending: 'badge-pending',
		processing: 'badge-processing',
		escalated: 'badge-escalated',
		closed: 'badge-closed'
	};

	const regions = ['华东区', '华南区', '华北区', '西南区', '西北区', '东北区', '华中区'];

	async function loadUsers() {
		try {
			users = await getTrpcClient().auth.getUserList.query();
		} catch (e) {
			console.error('Failed to load users:', e);
		}
	}

	async function loadOrders() {
		loading = true;
		try {
			const result = await getTrpcClient().refund.getOrderList.query({
				page,
				pageSize,
				status: statusFilter || undefined,
				region: regionFilter || undefined,
				handlerId: handlerFilter || undefined,
				startDate: startDate || undefined,
				endDate: endDate || undefined,
				keyword: keyword || undefined
			});
			orders = result.items;
			total = result.total;
		} catch (e) {
			console.error('Failed to load orders:', e);
		} finally {
			loading = false;
		}
	}

	function formatDate(date: Date | string) {
		const d = new Date(date);
		return d.toLocaleString('zh-CN', {
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatAmount(amount: number) {
		return (amount / 100).toFixed(2);
	}

	function goToDetail(id: string) {
		goto(`/orders/${id}`);
	}

	function changePage(p: number) {
		page = p;
		loadOrders();
	}

	function handleSearch() {
		page = 1;
		loadOrders();
	}

	function resetFilters() {
		statusFilter = '';
		regionFilter = '';
		handlerFilter = '';
		startDate = '';
		endDate = '';
		keyword = '';
		page = 1;
		loadOrders();
	}

	$effect(() => {
		loadUsers();
		loadOrders();
	});
</script>

<div class="page-header">
	<h1 class="page-title">售后单列表</h1>
	<div>
		<button class="btn btn-primary" onclick={() => goto('/create')}>
			➕ 新建售后单
		</button>
	</div>
</div>

<div class="filter-bar">
	<div class="filter-item">
		<label class="filter-label">关键词</label>
		<input
			type="text"
			class="form-input"
			placeholder="单号/客户名"
			bind:value={keyword}
			onkeypress={(e) => e.key === 'Enter' && handleSearch()}
		/>
	</div>
	<div class="filter-item">
		<label class="filter-label">状态</label>
		<select class="form-select" bind:value={statusFilter}>
			<option value="">全部</option>
			<option value="pending">待处理</option>
			<option value="processing">处理中</option>
			<option value="escalated">已升级</option>
			<option value="closed">已关闭</option>
		</select>
	</div>
	<div class="filter-item">
		<label class="filter-label">区域</label>
		<select class="form-select" bind:value={regionFilter}>
			<option value="">全部</option>
			{#each regions as r}
				<option value={r}>{r}</option>
			{/each}
		</select>
	</div>
	<div class="filter-item">
		<label class="filter-label">负责人</label>
		<select class="form-select" bind:value={handlerFilter}>
			<option value="">全部</option>
			{#each users as u}
				<option value={u.id}>{u.realName || u.username}</option>
			{/each}
		</select>
	</div>
	<div class="filter-item">
		<label class="filter-label">开始日期</label>
		<input type="date" class="form-input" bind:value={startDate} />
	</div>
	<div class="filter-item">
		<label class="filter-label">结束日期</label>
		<input type="date" class="form-input" bind:value={endDate} />
	</div>
	<div class="filter-item" style="justify-content: flex-end;">
		<label class="filter-label">&nbsp;</label>
		<div style="display: flex; gap: 8px;">
			<button class="btn btn-primary" onclick={handleSearch}>查询</button>
			<button class="btn" onclick={resetFilters}>重置</button>
		</div>
	</div>
</div>

<div class="card">
	<div class="card-body" style="padding: 0;">
		{#if loading}
			<div class="empty-state">加载中...</div>
		{:else if orders.length === 0}
			<div class="empty-state">暂无数据</div>
		{:else}
			<table>
				<thead>
					<tr>
						<th>售后单号</th>
						<th>小区</th>
						<th>区域</th>
						<th>客户</th>
						<th>商品</th>
						<th>退款金额</th>
						<th>状态</th>
						<th>当前处理人</th>
						<th>问题标签</th>
						<th>创建时间</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#each orders as order (order.id)}
						<tr>
							<td style="font-weight: 500;">{order.orderNo}</td>
							<td>{order.communityName}</td>
							<td>{order.region}</td>
							<td>{order.customerName}</td>
							<td>{order.productName}</td>
							<td style="color: var(--danger-color); font-weight: 500;">
								¥{formatAmount(order.refundAmount)}
							</td>
							<td>
								<span class="badge {statusColorMap[order.status] || 'badge-default'}">
									{statusMap[order.status] || order.status}
								</span>
							</td>
							<td>{order.currentHandlerName || '-'}</td>
							<td>{order.issueTag || '-'}</td>
							<td>{formatDate(order.createdAt)}</td>
							<td>
								<button class="btn btn-sm btn-primary" onclick={() => goToDetail(order.id)}>
									查看
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<div class="pagination">
				<span class="pagination-info">共 {total} 条，第 {page} 页</span>
				<button class="btn btn-sm" disabled={page <= 1} onclick={() => changePage(page - 1)}>
					上一页
				</button>
				<button class="btn btn-sm" disabled={page * pageSize >= total} onclick={() => changePage(page + 1)}>
					下一页
				</button>
			</div>
		{/if}
	</div>
</div>
