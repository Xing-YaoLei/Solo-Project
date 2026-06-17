<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc';
	import {
		CheckSquare,
		Filter,
		RefreshCw,
		Loader2,
		CheckCircle2,
		XCircle,
		Building2,
		User,
		ChevronRight,
		Eye
	} from 'lucide-svelte';

	let actionFilter = $state<string>('all');
	let loading = $state(true);
	let approvals = $state<any[]>([]);

	const actionLabels: Record<string, string> = {
		approve: '通过',
		reject: '驳回'
	};

	const actionClasses: Record<string, string> = {
		approve: 'bg-success/10 text-success',
		reject: 'bg-danger/10 text-danger'
	};

	const contractStatusLabels: Record<string, string> = {
		pending: '待审批',
		active: '已生效',
		expired: '已到期',
		terminated: '已终止'
	};

	async function loadData() {
		loading = true;
		try {
			const input: any = {};
			if (actionFilter !== 'all') input.action = actionFilter;
			approvals = await trpc.approval.list.query(input);
		} catch (e) {
			console.error('Failed to load approvals:', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadData();
	});

	function formatDate(d: any) {
		if (!d) return '-';
		const date = new Date(d);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
	}
</script>

<div class="p-6 space-y-6 animate-fade-in">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div class="flex items-center gap-3">
			<CheckSquare class="w-7 h-7 text-success" />
			<div>
				<h1 class="text-2xl font-bold text-text">审批中心</h1>
			</div>
		</div>
		<button
			onclick={loadData}
			disabled={loading}
			class="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
		>
			<RefreshCw class="w-4 h-4" class:animate-spin={loading} />
			刷新
		</button>
	</div>

	<div class="bg-surface rounded-xl shadow-sm border border-border p-4">
		<div class="flex flex-col sm:flex-row gap-3 flex-wrap">
			<div class="relative">
				<Filter class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
				<select
					bind:value={actionFilter}
					onchange={loadData}
					class="pl-9 pr-8 py-2.5 border border-border rounded-lg bg-surface-alt text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer min-w-[140px]"
				>
					<option value="all">全部审批</option>
					<option value="approve">已通过</option>
					<option value="reject">已驳回</option>
				</select>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex flex-col items-center justify-center py-16 text-text-muted">
			<Loader2 class="w-8 h-8 animate-spin mb-3" />
			<p>加载中...</p>
		</div>
	{:else if approvals.length === 0}
		<div class="text-center py-16 text-text-muted">
			<CheckSquare class="w-12 h-12 mx-auto mb-3 opacity-40" />
			<p class="text-lg">暂无审批记录</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each approvals as approval (approval.id)}
				<div
					class="bg-surface rounded-xl shadow-sm border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
					onclick={() => goto(`/contracts/${approval.contractId}`)}
				>
					<div class="flex items-start justify-between mb-3">
						<div class="flex items-start gap-3 flex-1 min-w-0">
							<div
								class="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 {actionClasses[approval.action] || actionClasses.approve}"
							>
								{#if approval.action === 'approve'}
									<CheckCircle2 class="w-4 h-4" />
								{:else}
									<XCircle class="w-4 h-4" />
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<h3 class="text-base font-semibold text-text truncate group-hover:text-primary transition-colors">
									{approval.tenantName || '租户'} - {approval.roomNumber || ''}
								</h3>
								<p class="text-sm text-text-secondary mt-0.5 line-clamp-1">
									审批意见：{approval.opinion}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2 ml-3 flex-shrink-0">
							<span
								class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {actionClasses[approval.action] || actionClasses.approve}"
							>
								{actionLabels[approval.action] || '通过'}
							</span>
						</div>
					</div>

					<div class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary mb-2">
						<span class="flex items-center gap-1.5">
							<Building2 class="w-3.5 h-3.5" />
							位置：{approval.buildingName || '-'} {approval.roomNumber || ''}
						</span>
						<span class="flex items-center gap-1.5">
							<User class="w-3.5 h-3.5" />
							审批人：{approval.approverName || '-'}
						</span>
						<span class="flex items-center gap-1.5">
							合同状态：
							<span
								class="text-xs px-2 py-0.5 rounded font-medium"
								class:bg-yellow-100={approval.contractStatus === 'pending'}
								class:text-yellow-700={approval.contractStatus === 'pending'}
								class:bg-green-100={approval.contractStatus === 'active'}
								class:text-green-700={approval.contractStatus === 'active'}
								class:bg-gray-100={approval.contractStatus !== 'pending' && approval.contractStatus !== 'active'}
								class:text-gray-600={approval.contractStatus !== 'pending' && approval.contractStatus !== 'active'}
							>
								{contractStatusLabels[approval.contractStatus] || approval.contractStatus}
							</span>
						</span>
					</div>

					<div class="flex items-center justify-between">
						<span class="text-xs text-text-muted">{formatDate(approval.createdAt)}</span>
						<span class="inline-flex items-center gap-1 text-xs text-primary font-medium">
							<Eye class="w-3.5 h-3.5" />
							查看合同
							<ChevronRight class="w-3.5 h-3.5" />
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
