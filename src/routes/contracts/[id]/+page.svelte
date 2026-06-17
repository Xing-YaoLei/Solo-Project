<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { trpc } from '$lib/trpc';
	import {
		ArrowLeft,
		Building2,
		User,
		Phone,
		CalendarDays,
		DollarSign,
		RefreshCw,
		Loader2,
		CheckCircle2,
		XCircle,
		CheckSquare,
		Send,
		X
	} from 'lucide-svelte';

	let contractId = $derived(get(page).params.id);
	let loading = $state(true);
	let saving = $state(false);
	let detail = $state<any>(null);
	let showApprovalDialog = $state(false);
	let approvalAction = $state<'approve' | 'reject'>('approve');
	let approvalOpinion = $state('');
	let user = $state<any>(null);

	const statusLabels: Record<string, string> = {
		pending: '待审批',
		active: '已生效',
		expired: '已到期',
		terminated: '已终止'
	};

	const statusClasses: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-700',
		active: 'bg-green-100 text-green-700',
		expired: 'bg-gray-100 text-gray-600',
		terminated: 'bg-red-100 text-red-600'
	};

	async function loadData() {
		loading = true;
		try {
			const session = await trpc.auth.getSession.query();
			user = session.user;

			detail = await trpc.contract.getById.query({ id: contractId });
		} catch (e) {
			console.error('Failed to load contract detail:', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (contractId) loadData();
	});

	function openApprovalDialog(action: 'approve' | 'reject') {
		approvalAction = action;
		approvalOpinion = '';
		showApprovalDialog = true;
	}

	function closeApprovalDialog() {
		showApprovalDialog = false;
		approvalOpinion = '';
	}

	async function submitApproval() {
		if (!approvalOpinion.trim()) return;
		saving = true;
		try {
			await trpc.contract.submitApproval.mutate({
				contractId,
				opinion: approvalOpinion
			});
			closeApprovalDialog();
			await loadData();
		} catch (e: any) {
			alert(e?.message || '提交失败');
		} finally {
			saving = false;
		}
	}

	function formatDate(d: any) {
		if (!d) return '-';
		const date = new Date(d);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	}

	function formatDateTime(d: any) {
		if (!d) return '-';
		const date = new Date(d);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
	}

	function formatMoney(v: any) {
		if (v == null) return '-';
		return '¥' + Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}
</script>

<div class="p-6 space-y-6 animate-fade-in">
	<div class="flex items-center justify-between">
		<button
			class="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
			onclick={() => goto('/contracts')}
		>
			<ArrowLeft class="w-4 h-4" />
			返回合同列表
		</button>
		<button
			onclick={loadData}
			disabled={loading}
			class="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
		>
			<RefreshCw class="w-4 h-4" class:animate-spin={loading} />
			刷新
		</button>
	</div>

	{#if loading}
		<div class="flex flex-col items-center justify-center py-16 text-text-muted">
			<Loader2 class="w-8 h-8 animate-spin mb-3" />
			<p>加载中...</p>
		</div>
	{:else if !detail}
		<div class="text-center py-16 text-text-muted">
			<XCircle class="w-12 h-12 mx-auto mb-3 opacity-40" />
			<p class="text-lg">合同不存在</p>
		</div>
	{:else}
		<div class="bg-surface rounded-xl shadow-sm border border-border p-6">
			<div class="flex items-start justify-between mb-6">
				<div>
					<h1 class="text-2xl font-bold text-text mb-1">合同详情</h1>
					<p class="text-sm text-text-secondary">合同编号：{detail.id}</p>
				</div>
				<span
					class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium {statusClasses[detail.status] || statusClasses.pending}"
				>
					{statusLabels[detail.status] || '待审批'}
				</span>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div class="space-y-5">
					<h3 class="text-sm font-semibold text-text border-b border-border pb-2">租户信息</h3>
					<div class="space-y-3 text-sm">
						<div class="flex items-center gap-2">
							<User class="w-4 h-4 text-text-muted" />
							<span class="text-text-secondary w-20 flex-shrink-0">公司名称：</span>
							<span class="text-text font-medium">{detail.tenant?.companyName || '-'}</span>
						</div>
						<div class="flex items-center gap-2">
							<User class="w-4 h-4 text-text-muted" />
							<span class="text-text-secondary w-20 flex-shrink-0">联系人：</span>
							<span class="text-text">{detail.tenant?.contactName || '-'}</span>
						</div>
						<div class="flex items-center gap-2">
							<Phone class="w-4 h-4 text-text-muted" />
							<span class="text-text-secondary w-20 flex-shrink-0">联系电话：</span>
							<span class="text-text">{detail.tenant?.contactPhone || '-'}</span>
						</div>
					</div>
				</div>

				<div class="space-y-5">
					<h3 class="text-sm font-semibold text-text border-b border-border pb-2">房屋信息</h3>
					<div class="space-y-3 text-sm">
						<div class="flex items-center gap-2">
							<Building2 class="w-4 h-4 text-text-muted" />
							<span class="text-text-secondary w-20 flex-shrink-0">位置：</span>
							<span class="text-text font-medium">{detail.room?.roomNumber || '-'}</span>
						</div>
						<div class="flex items-center gap-2">
							<Building2 class="w-4 h-4 text-text-muted" />
							<span class="text-text-secondary w-20 flex-shrink-0">楼层：</span>
							<span class="text-text">{detail.room?.floor || '-'} / {detail.room?.unit || '-'}</span>
						</div>
						<div class="flex items-center gap-2">
							<DollarSign class="w-4 h-4 text-text-muted" />
							<span class="text-text-secondary w-20 flex-shrink-0">面积：</span>
							<span class="text-text">{detail.room?.area || 0} ㎡</span>
						</div>
					</div>
				</div>

				<div class="space-y-5">
					<h3 class="text-sm font-semibold text-text border-b border-border pb-2">合同信息</h3>
					<div class="space-y-3 text-sm">
						<div class="flex items-center gap-2">
							<CalendarDays class="w-4 h-4 text-text-muted" />
							<span class="text-text-secondary w-20 flex-shrink-0">开始日期：</span>
							<span class="text-text">{formatDate(detail.startDate)}</span>
						</div>
						<div class="flex items-center gap-2">
							<CalendarDays class="w-4 h-4 text-text-muted" />
							<span class="text-text-secondary w-20 flex-shrink-0">结束日期：</span>
							<span class="text-text">{formatDate(detail.endDate)}</span>
						</div>
						<div class="flex items-center gap-2">
							<DollarSign class="w-4 h-4 text-success" />
							<span class="text-text-secondary w-20 flex-shrink-0">月租金：</span>
							<span class="text-text font-semibold text-success text-lg">{formatMoney(detail.monthlyRent)}</span>
						</div>
					</div>
				</div>
			</div>

			{#if detail.status === 'pending' && (user?.role === 'admin' || user?.role === 'finance')}
				<div class="mt-6 pt-6 border-t border-border flex items-center justify-end gap-3">
					<button
						onclick={() => openApprovalDialog('reject')}
						class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-danger border border-danger rounded-lg hover:bg-danger-bg transition-colors"
					>
						<XCircle class="w-4 h-4" />
						驳回
					</button>
					<button
						onclick={() => openApprovalDialog('approve')}
						class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-success rounded-lg hover:opacity-90 transition-colors"
					>
						<CheckSquare class="w-4 h-4" />
						审批通过
					</button>
				</div>
			{/if}
		</div>

		{#if detail.approvals && detail.approvals.length > 0}
			<div class="bg-surface rounded-xl shadow-sm border border-border p-6">
				<h3 class="text-lg font-semibold text-text mb-4">审批记录</h3>
				<div class="space-y-4">
					{#each detail.approvals as approval (approval.id)}
						<div
							class="relative pl-8 pb-4 {approval !== detail.approvals[detail.approvals.length - 1] ? 'border-l-2 border-border ml-3' : 'ml-3'}"
						>
							<div
								class="absolute left-0 top-0 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 {approval.action === 'approve'
									? 'bg-success/10 text-success'
									: 'bg-danger/10 text-danger'}"
							>
								{#if approval.action === 'approve'}
									<CheckCircle2 class="w-4 h-4" />
								{:else}
									<XCircle class="w-4 h-4" />
								{/if}
							</div>
							<div class="pt-0.5">
								<div class="flex items-center justify-between mb-1.5">
									<span class="font-medium text-text">
										{approval.approverName || '-'}
										<span class="ml-2 text-xs px-2 py-0.5 rounded {approval.action === 'approve' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}">
											{approval.action === 'approve' ? '通过' : '驳回'}
										</span>
									</span>
									<span class="text-xs text-text-muted">{formatDateTime(approval.createdAt)}</span>
								</div>
								<p class="text-sm text-text-secondary bg-surface-alt rounded-lg p-3">
									{approval.opinion}
								</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

{#if showApprovalDialog}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
		onclick={closeApprovalDialog}
		role="presentation"
	>
		<div
			class="bg-surface rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-in"
			onclick|stopPropagation={() => {}}
		>
			<div class="flex items-center justify-between p-5 border-b border-border">
				<h3 class="text-lg font-semibold text-text">
					{approvalAction === 'approve' ? '审批通过' : '驳回申请'}
				</h3>
				<button
					class="p-1 text-text-muted hover:text-text transition-colors rounded-lg hover:bg-surface-alt"
					onclick={closeApprovalDialog}
					disabled={saving}
				>
					<X class="w-5 h-5" />
				</button>
			</div>
			<div class="p-5">
				<label class="block text-sm font-medium text-text mb-2">审批意见</label>
				<textarea
					bind:value={approvalOpinion}
					rows="4"
					placeholder={approvalAction === 'approve' ? '请输入审批意见...' : '请说明驳回原因...'}
					class="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
					disabled={saving}
				></textarea>
			</div>
			<div class="flex items-center justify-end gap-3 p-5 border-t border-border">
				<button
					class="px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text bg-surface-alt rounded-lg hover:bg-surface-hover transition-colors"
					onclick={closeApprovalDialog}
					disabled={saving}
				>
					取消
				</button>
				<button
					class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					class:bg-success={approvalAction === 'approve'}
					class:bg-danger={approvalAction === 'reject'}
					onclick={submitApproval}
					disabled={!approvalOpinion.trim() || saving}
				>
					{#if saving}
						<Loader2 class="w-3.5 h-3.5 animate-spin" />
						提交中...
					{:else}
						<Send class="w-3.5 h-3.5" />
						确认提交
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
