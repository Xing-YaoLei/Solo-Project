<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc';
	import {
		Wrench,
		Plus,
		Filter,
		ChevronRight,
		Building2,
		User,
		Clock,
		AlertTriangle,
		RefreshCw,
		Loader2,
		Flag
	} from 'lucide-svelte';

	let statusFilter = $state<string>('all');
	let priorityFilter = $state<string>('all');
	let overdueFilter = $state<boolean>(false);
	let loading = $state(true);
	let orders = $state<any[]>([]);
	let user = $state<any>(null);
	let overdueCount = $state(0);

	const statusLabels: Record<string, string> = {
		submitted: '待受理',
		assigned: '已派单',
		in_progress: '处理中',
		completed: '待复核',
		reviewing: '复核中',
		closed: '已关闭'
	};

	const statusClasses: Record<string, string> = {
		submitted: 'bg-yellow-100 text-yellow-700',
		assigned: 'bg-blue-100 text-blue-700',
		in_progress: 'bg-indigo-100 text-indigo-700',
		completed: 'bg-purple-100 text-purple-700',
		reviewing: 'bg-pink-100 text-pink-700',
		closed: 'bg-green-100 text-green-700'
	};

	const priorityLabels: Record<string, string> = {
		low: '低',
		medium: '中',
		high: '高',
		urgent: '紧急'
	};

	const priorityClasses: Record<string, string> = {
		low: 'bg-gray-100 text-gray-600',
		medium: 'bg-blue-100 text-blue-600',
		high: 'bg-orange-100 text-orange-600',
		urgent: 'bg-red-100 text-red-600'
	};

	async function loadData() {
		loading = true;
		try {
			const session = await trpc.auth.getSession.query();
			user = session.user;

			const input: any = {};
			if (statusFilter !== 'all') input.status = statusFilter;
			if (priorityFilter !== 'all') input.priority = priorityFilter;
			if (overdueFilter) input.overdue = true;

			const data = await trpc.workOrder.list.query(input);
			orders = data;
			overdueCount = data.filter((o: any) => o.isOverdue).length;
		} catch (e) {
			console.error('Failed to load work orders:', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadData();
	});

	function navigateToDetail(id: string) {
		goto(`/work-orders/${id}`);
	}

	function formatDate(d: any) {
		if (!d) return '-';
		const date = new Date(d);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
	}

	function getOverdueText(dueAt: any) {
		if (!dueAt) return '';
		const now = new Date().getTime();
		const due = new Date(dueAt).getTime();
		const diff = due - now;
		const hours = Math.abs(diff) / (1000 * 60 * 60);
		if (diff < 0) {
			if (hours < 1) return `超时${Math.round(Math.abs(diff) / (1000 * 60))}分钟`;
			return `超时${hours.toFixed(1)}小时`;
		}
		if (hours < 1) return `剩余${Math.round(diff / (1000 * 60))}分钟`;
		return `剩余${hours.toFixed(1)}小时`;
	}
</script>

<div class="p-6 space-y-6 animate-fade-in">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div class="flex items-center gap-3">
			<Wrench class="w-7 h-7 text-danger" />
			<div>
				<h1 class="text-2xl font-bold text-text">工单中心</h1>
			</div>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			<button
				onclick={loadData}
				disabled={loading}
				class="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
			>
				<RefreshCw class="w-4 h-4" class:animate-spin={loading} />
				刷新
			</button>
			<button
				onclick={() => { overdueFilter = !overdueFilter; loadData(); }}
				class="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors"
				class:bg-danger-bg={overdueFilter}
				class:border-danger={overdueFilter}
				class:text-danger={overdueFilter}
				class:border-border={!overdueFilter}
				class:hover:bg-surface-hover={!overdueFilter}
			>
				<AlertTriangle class="w-4 h-4" />
				超时工单 {overdueCount > 0 && `(${overdueCount})`}
			</button>
			{#if user?.role === 'tenant' || user?.role === 'admin'}
				<button
					class="flex items-center gap-2 px-4 py-2 bg-danger text-white rounded-lg hover:opacity-90 transition-colors font-medium"
				>
					<Plus class="w-4 h-4" />
					提交工单
				</button>
			{/if}
		</div>
	</div>

	{#if overdueCount > 0}
		<div class="animate-pulse-border flex items-center gap-2 rounded-xl border-2 border-danger bg-danger-bg px-5 py-3 text-sm font-medium text-danger">
			<AlertTriangle class="w-5 h-5 flex-shrink-0" />
			<span>⚠ 当前有 <strong class="text-lg mx-1">{overdueCount}</strong> 个工单已超时，请优先处理！</span>
		</div>
	{/if}

	<div class="bg-surface rounded-xl shadow-sm border border-border p-4">
		<div class="flex flex-col sm:flex-row gap-3 flex-wrap">
			<div class="relative">
				<Filter class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
				<select
					bind:value={statusFilter}
					onchange={loadData}
					class="pl-9 pr-8 py-2.5 border border-border rounded-lg bg-surface-alt text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer min-w-[140px]"
				>
					<option value="all">全部状态</option>
					<option value="submitted">待受理</option>
					<option value="assigned">已派单</option>
					<option value="in_progress">处理中</option>
					<option value="completed">待复核</option>
					<option value="closed">已关闭</option>
				</select>
			</div>
			<div class="relative">
				<Flag class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
				<select
					bind:value={priorityFilter}
					onchange={loadData}
					class="pl-9 pr-8 py-2.5 border border-border rounded-lg bg-surface-alt text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer min-w-[140px]"
				>
					<option value="all">全部优先级</option>
					<option value="urgent">紧急</option>
					<option value="high">高</option>
					<option value="medium">中</option>
					<option value="low">低</option>
				</select>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex flex-col items-center justify-center py-16 text-text-muted">
			<Loader2 class="w-8 h-8 animate-spin mb-3" />
			<p>加载中...</p>
		</div>
	{:else if orders.length === 0}
		<div class="text-center py-16 text-text-muted">
			<Wrench class="w-12 h-12 mx-auto mb-3 opacity-40" />
			<p class="text-lg">暂无工单数据</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each orders as order (order.id)}
				<div
					class="bg-surface rounded-xl shadow-sm border p-5 hover:shadow-md transition-all cursor-pointer group"
					class:border-danger={order.isOverdue}
					class:animate-pulse-border={order.isOverdue}
					class:border-border={!order.isOverdue}
					class:bg-danger-bg/30={order.isOverdue}
					onclick={() => navigateToDetail(order.id)}
				>
					<div class="flex items-start justify-between mb-3">
						<div class="flex items-start gap-3 flex-1 min-w-0">
							<div class="mt-0.5 flex-shrink-0">
								<div
									class="w-8 h-8 rounded-full flex items-center justify-center"
									class:bg-danger/15={order.isOverdue}
									class:bg-primary/10={!order.isOverdue}
								>
									{#if order.isOverdue}
										<AlertTriangle class="w-4 h-4 text-danger" />
									{:else}
										<Wrench class="w-4 h-4 text-primary" />
									{/if}
								</div>
							</div>
							<div class="min-w-0 flex-1">
								<h3 class="text-base font-semibold text-text group-hover:text-primary transition-colors truncate">
									{order.title}
								</h3>
							</div>
						</div>
						<div class="flex items-center gap-2 ml-3 flex-shrink-0">
							<span
								class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {priorityClasses[order.priority] || priorityClasses.medium}"
							>
								<Flag class="w-3 h-3 mr-1" />
								{priorityLabels[order.priority] || '中'}
							</span>
							<span
								class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {statusClasses[order.status] || statusClasses.submitted}"
							>
								{statusLabels[order.status] || '待受理'}
							</span>
						</div>
					</div>

					<div class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary mb-3">
						<span class="flex items-center gap-1.5">
							<Building2 class="w-3.5 h-3.5" />
							{order.buildingName || '-'} {order.roomNumber || ''}
						</span>
						{#if order.assigneeName}
							<span class="flex items-center gap-1.5">
								<User class="w-3.5 h-3.5" />
								处理人：{order.assigneeName}
							</span>
						{/if}
						<span class="flex items-center gap-1.5">
							<Clock class="w-3.5 h-3.5" />
							创建：{formatDate(order.createdAt)}
						</span>
						{#if order.dueAt && ['submitted', 'assigned', 'in_progress'].includes(order.status)}
							<span
								class="flex items-center gap-1.5 font-medium"
								class:text-danger={order.isOverdue}
								class:text-warning={!order.isOverdue}
							>
								{#if order.isOverdue}
									<AlertTriangle class="w-3.5 h-3.5" />
								{:else}
									<Clock class="w-3.5 h-3.5" />
								{/if}
								{getOverdueText(order.dueAt)}
							</span>
						{/if}
					</div>

					<div class="flex items-center justify-end">
						<span class="inline-flex items-center gap-1 text-xs text-primary font-medium">
							查看详情
							<ChevronRight class="w-3.5 h-3.5" />
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
