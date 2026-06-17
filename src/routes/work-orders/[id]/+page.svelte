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
		Clock,
		AlertTriangle,
		RefreshCw,
		Loader2,
		Flag,
		Send,
		X,
		MessageSquare,
		CheckCircle2,
		XCircle,
		Wrench,
		CheckSquare
	} from 'lucide-svelte';

	let orderId = $derived(get(page).params.id);
	let loading = $state(true);
	let saving = $state(false);
	let detail = $state<any>(null);
	let user = $state<any>(null);
	let newMessage = $state('');
	let showReviewDialog = $state(false);
	let reviewAction = $state<'confirm' | 'return'>('confirm');
	let reviewOpinion = $state('');

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

			detail = await trpc.workOrder.getById.query({ id: orderId });
		} catch (e) {
			console.error('Failed to load work order detail:', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (orderId) loadData();
	});

	async function sendMessage() {
		if (!newMessage.trim() || saving) return;
		saving = true;
		try {
			await trpc.workOrder.addCommunication.mutate({
				workOrderId: orderId,
				content: newMessage.trim()
			});
			newMessage = '';
			await loadData();
		} catch (e: any) {
			alert(e?.message || '发送失败');
		} finally {
			saving = false;
		}
	}

	function openReviewDialog(action: 'confirm' | 'return') {
		reviewAction = action;
		reviewOpinion = '';
		showReviewDialog = true;
	}

	function closeReviewDialog() {
		showReviewDialog = false;
		reviewOpinion = '';
	}

	async function submitReview() {
		if (!reviewOpinion.trim()) return;
		saving = true;
		try {
			await trpc.workOrder.submitReview.mutate({
				workOrderId: orderId,
				opinion: reviewOpinion,
				action: reviewAction
			});
			closeReviewDialog();
			await loadData();
		} catch (e: any) {
			alert(e?.message || '提交失败');
		} finally {
			saving = false;
		}
	}

	async function updateStatus(status: string) {
		try {
			await trpc.workOrder.updateStatus.mutate({
				workOrderId: orderId,
				status
			});
			await loadData();
		} catch (e: any) {
			alert(e?.message || '操作失败');
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

	function getOverdueText(dueAt: any) {
		if (!dueAt) return '';
		const now = new Date().getTime();
		const due = new Date(dueAt).getTime();
		const diff = due - now;
		const hours = Math.abs(diff) / (1000 * 60 * 60);
		if (diff < 0) {
			if (hours < 1) return `已超时 ${Math.round(Math.abs(diff) / (1000 * 60))} 分钟`;
			return `已超时 ${hours.toFixed(1)} 小时`;
		}
		return '';
	}
</script>

<div class="p-6 space-y-6 animate-fade-in">
	<div class="flex items-center justify-between">
		<button
			class="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
			onclick={() => goto('/work-orders')}
		>
			<ArrowLeft class="w-4 h-4" />
			返回工单列表
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
			<p class="text-lg">工单不存在</p>
		</div>
	{:else}
		{#if detail.isOverdue}
			<div class="animate-pulse-border flex items-center gap-2 rounded-xl border-2 border-danger bg-danger-bg px-5 py-3 text-sm font-medium text-danger">
				<AlertTriangle class="w-5 h-5 flex-shrink-0" />
				<span>⚠ 此工单 {getOverdueText(detail.dueAt)}，请尽快处理！</span>
			</div>
		{/if}

		<div class="bg-surface rounded-xl shadow-sm border border-border p-6">
			<div class="flex items-start justify-between mb-6 flex-wrap gap-4">
				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-3 mb-2 flex-wrap">
						<h1 class="text-xl font-bold text-text">{detail.title}</h1>
						<span
							class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {priorityClasses[detail.priority] || priorityClasses.medium}"
						>
							<Flag class="w-3 h-3 mr-1" />
							{priorityLabels[detail.priority] || '中'}
						</span>
					</div>
					<p class="text-sm text-text-muted">工单号：{detail.id}</p>
				</div>
				<div class="flex items-center gap-2">
					<span
						class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium {statusClasses[detail.status] || statusClasses.submitted}"
					>
						{statusLabels[detail.status] || '待受理'}
					</span>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				<div class="space-y-4">
					<h3 class="text-sm font-semibold text-text border-b border-border pb-2">基本信息</h3>
					<div class="space-y-3 text-sm">
						<div class="flex items-start gap-2">
							<Wrench class="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
							<span class="text-text-secondary w-20 flex-shrink-0">问题描述：</span>
							<span class="text-text whitespace-pre-wrap">{detail.description || '-'}</span>
						</div>
						<div class="flex items-center gap-2">
							<Building2 class="w-4 h-4 text-text-muted" />
							<span class="text-text-secondary w-20 flex-shrink-0">报修位置：</span>
							<span class="text-text font-medium">
								{detail.buildingName || '-'} {detail.room?.roomNumber || ''}
							</span>
						</div>
						<div class="flex items-center gap-2">
							<Clock class="w-4 h-4 text-text-muted" />
							<span class="text-text-secondary w-20 flex-shrink-0">创建时间：</span>
							<span class="text-text">{formatDateTime(detail.createdAt)}</span>
						</div>
						{#if detail.dueAt}
							<div class="flex items-center gap-2">
								<Clock class="w-4 h-4 text-text-muted" />
								<span class="text-text-secondary w-20 flex-shrink-0">截止时间：</span>
								<span
									class="font-medium"
									class:text-danger={detail.isOverdue}
								>
									{formatDateTime(detail.dueAt)}
									{#if detail.isOverdue}
										<span class="ml-2">(已超时)</span>
									{/if}
								</span>
							</div>
						{/if}
						{#if detail.assignedAt}
							<div class="flex items-center gap-2">
								<Clock class="w-4 h-4 text-text-muted" />
								<span class="text-text-secondary w-20 flex-shrink-0">派单时间：</span>
								<span class="text-text">{formatDateTime(detail.assignedAt)}</span>
							</div>
						{/if}
						{#if detail.completedAt}
							<div class="flex items-center gap-2">
								<CheckCircle2 class="w-4 h-4 text-success" />
								<span class="text-text-secondary w-20 flex-shrink-0">完成时间：</span>
								<span class="text-text text-success">{formatDateTime(detail.completedAt)}</span>
							</div>
						{/if}
					</div>
				</div>

				<div class="space-y-4">
					<h3 class="text-sm font-semibold text-text border-b border-border pb-2">相关人员</h3>
					<div class="space-y-3 text-sm">
						<div class="flex items-center gap-2">
							<User class="w-4 h-4 text-text-muted" />
							<span class="text-text-secondary w-20 flex-shrink-0">报修租户：</span>
							<div>
								<div class="text-text font-medium">{detail.tenant?.companyName || '-'}</div>
								{#if detail.tenant?.contactName}
									<div class="text-xs text-text-muted">
										{detail.tenant.contactName} · {detail.tenant.contactPhone || ''}
									</div>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-2">
							<User class="w-4 h-4 text-text-muted" />
							<span class="text-text-secondary w-20 flex-shrink-0">处理人员：</span>
							{#if detail.assignee?.displayName}
								<span class="text-text font-medium">{detail.assignee.displayName}</span>
							{:else}
								<span class="text-text-muted">未指派</span>
							{/if}
						</div>
					</div>

					{#if user?.role === 'maintenance' && detail.assigneeId === user.id}
						<div class="pt-4 space-y-2">
							{#if detail.status === 'assigned'}
								<button
									onclick={() => updateStatus('in_progress')}
									class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
								>
									<Wrench class="w-4 h-4" />
									开始处理
								</button>
							{/if}
							{#if detail.status === 'in_progress'}
								<button
									onclick={() => updateStatus('completed')}
									class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-success rounded-lg hover:opacity-90 transition-colors"
								>
									<CheckCircle2 class="w-4 h-4" />
									提交完工
								</button>
							{/if}
						</div>
					{/if}

					{#if (user?.role === 'admin' || user?.role === 'maintenance') && detail.status === 'completed'}
						<div class="pt-4 flex items-center gap-2">
							<button
								onclick={() => openReviewDialog('return')}
								class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-danger border border-danger rounded-lg hover:bg-danger-bg transition-colors"
							>
								<XCircle class="w-4 h-4" />
								退回重处理
							</button>
							<button
								onclick={() => openReviewDialog('confirm')}
								class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-success rounded-lg hover:opacity-90 transition-colors"
							>
								<CheckSquare class="w-4 h-4" />
								确认验收
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
			<div class="border-b border-border px-6 py-4">
				<h3 class="text-base font-semibold text-text flex items-center gap-2">
					<MessageSquare class="w-5 h-5 text-primary" />
					沟通记录
					<span class="text-xs font-normal text-text-muted">({detail.communications?.length || 0} 条)</span>
				</h3>
			</div>

			<div class="max-h-80 overflow-y-auto bg-surface-alt/30 px-6 py-4 space-y-4">
				{#if !detail.communications || detail.communications.length === 0}
					<div class="text-center py-8 text-text-muted text-sm">
						<MessageSquare class="w-8 h-8 mx-auto mb-2 opacity-30" />
						暂无沟通记录
					</div>
				{:else}
					{#each detail.communications as msg (msg.id)}
						<div class="flex gap-3">
							<div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
								{msg.senderName?.[0] || '?'}
							</div>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-1 flex-wrap">
									<span class="text-sm font-medium text-text">{msg.senderName || '-'}</span>
									<span class="text-xs px-1.5 py-0.5 rounded bg-surface text-text-muted">
										{msg.senderRole || '用户'}
									</span>
									<span class="text-xs text-text-muted">{formatDateTime(msg.createdAt)}</span>
								</div>
								<div class="text-sm text-text bg-surface rounded-lg p-3 border border-border">
									{msg.content}
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<div class="border-t border-border p-4">
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={newMessage}
						onkeydown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
						placeholder="输入沟通消息，按回车发送..."
						class="flex-1 px-4 py-2.5 border border-border rounded-lg bg-surface-alt text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
						disabled={saving}
					/>
					<button
						onclick={sendMessage}
						disabled={!newMessage.trim() || saving}
						class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if saving}
							<Loader2 class="w-4 h-4 animate-spin" />
						{:else}
							<Send class="w-4 h-4" />
						{/if}
						发送
					</button>
				</div>
			</div>
		</div>

		{#if detail.reviews && detail.reviews.length > 0}
			<div class="bg-surface rounded-xl shadow-sm border border-border p-6">
				<h3 class="text-base font-semibold text-text mb-4 flex items-center gap-2">
					<CheckSquare class="w-5 h-5 text-success" />
					复核意见记录
				</h3>
				<div class="space-y-4">
					{#each detail.reviews as review (review.id)}
						<div
							class="relative pl-10 pb-4"
						>
							<div
								class="absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 {review.action === 'confirm'
									? 'bg-success/10 text-success'
									: 'bg-danger/10 text-danger'}"
							>
								{#if review.action === 'confirm'}
									<CheckCircle2 class="w-4 h-4" />
								{:else}
									<XCircle class="w-4 h-4" />
								{/if}
							</div>
							<div>
								<div class="flex items-center justify-between mb-2 flex-wrap gap-2">
									<div class="flex items-center gap-2">
										<span class="font-medium text-text">{review.reviewerName || '-'}</span>
										<span
											class="text-xs px-2 py-0.5 rounded font-medium"
											class:bg-success/10={review.action === 'confirm'}
											class:text-success={review.action === 'confirm'}
											class:bg-danger/10={review.action !== 'confirm'}
											class:text-danger={review.action !== 'confirm'}
										>
											{review.action === 'confirm' ? '验收通过' : '退回重处理'}
										</span>
									</div>
									<span class="text-xs text-text-muted">{formatDateTime(review.createdAt)}</span>
								</div>
								<p class="text-sm text-text-secondary bg-surface-alt rounded-lg p-3 border border-border">
									{review.opinion}
								</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

{#if showReviewDialog}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
		onclick={closeReviewDialog}
		role="presentation"
	>
		<div
			class="bg-surface rounded-2xl shadow-xl w-full max-w-md mx-4 animate-fade-in"
			onclick|stopPropagation={() => {}}
		>
			<div class="flex items-center justify-between p-5 border-b border-border">
				<h3 class="text-lg font-semibold text-text">
					{reviewAction === 'confirm' ? '确认验收' : '退回重处理'}
				</h3>
				<button
					class="p-1 text-text-muted hover:text-text transition-colors rounded-lg hover:bg-surface-alt"
					onclick={closeReviewDialog}
					disabled={saving}
				>
					<X class="w-5 h-5" />
				</button>
			</div>
			<div class="p-5">
				<label class="block text-sm font-medium text-text mb-2">复核意见</label>
				<textarea
					bind:value={reviewOpinion}
					rows="4"
					placeholder={reviewAction === 'confirm' ? '请填写验收合格意见...' : '请说明退回原因及需要整改的内容...'}
					class="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
					disabled={saving}
				></textarea>
			</div>
			<div class="flex items-center justify-end gap-3 p-5 border-t border-border">
				<button
					class="px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text bg-surface-alt rounded-lg hover:bg-surface-hover transition-colors"
					onclick={closeReviewDialog}
					disabled={saving}
				>
					取消
				</button>
				<button
					class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					class:bg-success={reviewAction === 'confirm'}
					class:bg-danger={reviewAction !== 'confirm'}
					onclick={submitReview}
					disabled={!reviewOpinion.trim() || saving}
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
