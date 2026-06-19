<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/client/trpc';
	import { STATUS_LABELS, STATUS_COLORS, canExport, canProcess } from '$lib/utils/permissions';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let activeTab = $state('detail');
	let showAssignModal = $state(false);
	let showEscalateModal = $state(false);
	let showRejectModal = $state(false);
	let showResubmitModal = $state(false);
	let showReassignModal = $state(false);
	let showSupplementModal = $state(false);
	let showCallbackModal = $state(false);
	let selectedAssigneeId = $state('');
	let selectedToUserId = $state('');
	let rejectReason = $state('');
	let resubmitInfo = $state('');
	let reassignReason = $state('');
	let reassignToId = $state('');
	let supplementNote = $state('');
	let escalationReason = $state('');
	let callbackSatisfied = $state(true);
	let callbackComment = $state('');
	let submitting = $state(false);

	const tabs = [
		{ key: 'detail', label: '详情' },
		{ key: 'escalation', label: '升级记录' },
		{ key: 'callback', label: '回访结果' },
		{ key: 'logs', label: '处理日志' }
	];

	function formatDate(date: string | Date | null): string {
		if (!date) return '-';
		return new Date(date).toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getOverdueStatus(): { isOverdue: boolean; text: string; color: string } {
		const c = data.complaint;
		if (!c.deadline) return { isOverdue: false, text: '未设置', color: 'text-slate-400' };
		const now = new Date();
		const deadline = new Date(c.deadline);
		const diff = deadline.getTime() - now.getTime();
		const hours = diff / (1000 * 60 * 60);

		if (c.isOverdue || hours < 0) {
			return { isOverdue: true, text: '已超时', color: 'text-red-600 font-medium' };
		} else if (hours < 24) {
			return { isOverdue: false, text: `剩余 ${hours.toFixed(1)} 小时`, color: 'text-amber-600 font-medium' };
		}
		return { isOverdue: false, text: formatDate(c.deadline), color: 'text-slate-600' };
	}

	async function handleAssign() {
		if (!selectedAssigneeId) return;
		submitting = true;
		try {
			await trpc.complaint.assign.mutate({
				complaintId: data.complaint.id,
				assigneeId: selectedAssigneeId
			});
			showAssignModal = false;
			await goto(`/complaints/${data.complaint.id}`, { invalidateAll: true });
		} finally {
			submitting = false;
		}
	}

	async function handleStartProgress() {
		submitting = true;
		try {
			await trpc.complaint.startProgress.mutate({ complaintId: data.complaint.id });
			await goto(`/complaints/${data.complaint.id}`, { invalidateAll: true });
		} finally {
			submitting = false;
		}
	}

	async function handleResolve() {
		if (!confirm('确认已解决该投诉？')) return;
		submitting = true;
		try {
			await trpc.complaint.resolve.mutate({ complaintId: data.complaint.id });
			await goto(`/complaints/${data.complaint.id}`, { invalidateAll: true });
		} finally {
			submitting = false;
		}
	}

	async function handleClose() {
		if (!confirm('确认关闭该投诉？关闭后不可重新打开。')) return;
		submitting = true;
		try {
			await trpc.complaint.close.mutate({ complaintId: data.complaint.id });
			await goto(`/complaints/${data.complaint.id}`, { invalidateAll: true });
		} finally {
			submitting = false;
		}
	}

	async function handleEscalate() {
		if (!selectedToUserId || !escalationReason) return;
		submitting = true;
		try {
			await trpc.complaint.escalate.mutate({
				complaintId: data.complaint.id,
				toUserId: selectedToUserId,
				reason: escalationReason
			});
			showEscalateModal = false;
			escalationReason = '';
			selectedToUserId = '';
			await goto(`/complaints/${data.complaint.id}`, { invalidateAll: true });
		} finally {
			submitting = false;
		}
	}

	async function handleReject() {
		if (!rejectReason) return;
		submitting = true;
		try {
			await trpc.complaint.reject.mutate({
				complaintId: data.complaint.id,
				reason: rejectReason
			});
			showRejectModal = false;
			rejectReason = '';
			await goto(`/complaints/${data.complaint.id}`, { invalidateAll: true });
		} finally {
			submitting = false;
		}
	}

	async function handleResubmit() {
		if (!resubmitInfo) return;
		submitting = true;
		try {
			await trpc.complaint.resubmit.mutate({
				complaintId: data.complaint.id,
				supplementInfo: resubmitInfo
			});
			showResubmitModal = false;
			resubmitInfo = '';
			await goto(`/complaints/${data.complaint.id}`, { invalidateAll: true });
		} finally {
			submitting = false;
		}
	}

	async function handleReassign() {
		if (!reassignToId || !reassignReason) return;
		submitting = true;
		try {
			await trpc.complaint.reassign.mutate({
				complaintId: data.complaint.id,
				toAssigneeId: reassignToId,
				reason: reassignReason
			});
			showReassignModal = false;
			reassignToId = '';
			reassignReason = '';
			await goto(`/complaints/${data.complaint.id}`, { invalidateAll: true });
		} finally {
			submitting = false;
		}
	}

	async function handleSupplement() {
		if (!supplementNote) return;
		submitting = true;
		try {
			await trpc.complaint.supplement.mutate({
				complaintId: data.complaint.id,
				note: supplementNote
			});
			showSupplementModal = false;
			supplementNote = '';
			await goto(`/complaints/${data.complaint.id}`, { invalidateAll: true });
		} finally {
			submitting = false;
		}
	}

	async function handleCallback() {
		submitting = true;
		try {
			await trpc.callback.create.mutate({
				complaintId: data.complaint.id,
				visitorSatisfied: callbackSatisfied,
				comment: callbackComment || undefined
			});
			showCallbackModal = false;
			callbackComment = '';
			callbackSatisfied = true;
			await goto(`/complaints/${data.complaint.id}`, { invalidateAll: true });
		} finally {
			submitting = false;
		}
	}

	const overdue = $derived(getOverdueStatus());
	const isVisitor = $derived(false);
	const canProcessComplaint = $derived(true);
	const userPermissions = $derived<string[]>([]);
</script>

<svelte:head>
	<title>投诉详情 - 景区投诉协同台</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center gap-4">
		<button onclick={() => goto('/complaints')} class="text-slate-500 hover:text-slate-700 transition">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
		<h1 class="text-2xl font-bold text-slate-800">投诉详情</h1>
		<span class="inline-block px-3 py-1 rounded-full text-xs font-medium {STATUS_COLORS[data.complaint.status] ?? 'bg-gray-100 text-gray-700'}">
			{STATUS_LABELS[data.complaint.status] ?? data.complaint.status}
		</span>
		{#if data.complaint.isOverdue}
			<span class="inline-block px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
				已超时
			</span>
		{/if}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
		<div class="lg:col-span-3 space-y-4">
			<div class="bg-white rounded-xl shadow-sm border border-slate-200">
				<div class="border-b border-slate-200 px-5">
					<div class="flex gap-6">
						{#each tabs as tab}
							<button
								onclick={() => activeTab = tab.key}
								class="py-3 text-sm font-medium border-b-2 transition {activeTab === tab.key
									? 'border-primary-600 text-primary-600'
									: 'border-transparent text-slate-500 hover:text-slate-700'}"
							>
								{tab.label}
							</button>
						{/each}
					</div>
				</div>

				<div class="p-5">
					{#if activeTab === 'detail'}
						<div class="space-y-5">
							<div>
								<h3 class="text-sm font-medium text-slate-500 mb-2">投诉描述</h3>
								<p class="text-slate-800 leading-relaxed">{data.complaint.description}</p>
							</div>

							<div class="grid grid-cols-2 gap-6">
								<div>
									<h3 class="text-sm font-medium text-slate-500 mb-2">投诉编号</h3>
									<p class="text-slate-800 font-mono text-sm">{data.complaint.id.slice(0, 12)}...</p>
								</div>
								<div>
									<h3 class="text-sm font-medium text-slate-500 mb-2">创建时间</h3>
									<p class="text-slate-800">{formatDate(data.complaint.createdAt)}</p>
								</div>
								<div>
									<h3 class="text-sm font-medium text-slate-500 mb-2">游客</h3>
									<p class="text-slate-800">{data.complaint.visitorName ?? '-'}</p>
								</div>
								<div>
									<h3 class="text-sm font-medium text-slate-500 mb-2">处理人</h3>
									<p class="text-slate-800">{data.complaint.assigneeName ?? '未分配'}</p>
								</div>
							</div>

							<div>
								<h3 class="text-sm font-medium text-slate-500 mb-2">问题标签</h3>
								<div class="flex flex-wrap gap-2">
									{#each data.complaint.tags ?? [] as tag}
										<span class="inline-block px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
											{tag.label}
										</span>
									{:else}
										<span class="text-sm text-slate-400">暂无标签</span>
									{/each}
								</div>
							</div>

							<div>
								<h3 class="text-sm font-medium text-slate-500 mb-2">证据附件</h3>
								{#if data.complaint.attachmentList?.length > 0}
									<div class="space-y-2">
										{#each data.complaint.attachmentList as att}
											<div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
												<div class="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
													<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
														<path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
													</svg>
												</div>
												<div class="flex-1 min-w-0">
													<p class="text-sm text-slate-700 truncate">{att.fileName}</p>
													<p class="text-xs text-slate-400">{att.fileType}</p>
												</div>
												<a href={att.fileUrl} target="_blank" class="text-primary-600 text-sm hover:text-primary-700 transition">
													查看
												</a>
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-sm text-slate-400">暂无附件</p>
								{/if}
							</div>

							<div class="pt-4 border-t border-slate-100">
								<div class="flex items-center justify-between">
									<div>
										<h3 class="text-sm font-medium text-slate-500 mb-1">处理时限</h3>
										<p class="{overdue.color}">{overdue.text}</p>
									</div>
									<div class="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
										<div class="h-full {overdue.isOverdue ? 'bg-red-500' : 'bg-primary-500'}" style="width: 60%"></div>
									</div>
								</div>
							</div>
						</div>
					{:else if activeTab === 'escalation'}
						<div class="space-y-4">
							{#if data.complaint.escalationRecords?.length > 0}
								<div class="relative pl-8">
									<div class="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200"></div>
									{#each data.complaint.escalationRecords as record}
										<div class="relative pb-6 last:pb-0">
											<div class="absolute -left-5 top-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow"></div>
											<div class="bg-slate-50 rounded-lg p-4">
												<div class="flex items-center justify-between mb-2">
													<span class="text-sm font-medium text-slate-800">升级记录</span>
													<span class="text-xs text-slate-400">{formatDate(record.createdAt)}</span>
												</div>
												<p class="text-sm text-slate-600 mb-2">{record.reason}</p>
												<div class="flex items-center gap-4 text-xs text-slate-500">
													<span>级别: Lv.{record.level}</span>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-sm text-slate-400 text-center py-8">暂无升级记录</p>
							{/if}
						</div>
					{:else if activeTab === 'callback'}
						<div class="space-y-4">
							{#if data.complaint.callbackResults?.length > 0}
								{#each data.complaint.callbackResults as result}
									<div class="border border-slate-200 rounded-lg p-4">
										<div class="flex items-center justify-between mb-3">
											<div class="flex items-center gap-2">
												<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {result.visitorSatisfied
													? 'bg-green-100 text-green-700'
													: 'bg-red-100 text-red-700'}">
													{result.visitorSatisfied ? '满意' : '不满意'}
												</span>
											</div>
											<span class="text-xs text-slate-400">{formatDate(result.createdAt)}</span>
										</div>
										{#if result.comment}
											<p class="text-sm text-slate-600">{result.comment}</p>
										{/if}
									</div>
								{/each}
							{:else}
								<p class="text-sm text-slate-400 text-center py-8">暂无回访记录</p>
							{/if}
						</div>
					{:else if activeTab === 'logs'}
						<div class="space-y-4">
							{#if data.complaint.processingLogs?.length > 0}
								<div class="relative pl-8">
									<div class="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200"></div>
									{#each data.complaint.processingLogs as log}
										<div class="relative pb-5 last:pb-0">
											<div class="absolute -left-5 top-1 w-4 h-4 rounded-full bg-primary-500 border-2 border-white shadow"></div>
											<div>
												<div class="flex items-center gap-2 mb-1">
													<span class="text-sm font-medium text-slate-800">{log.action}</span>
													<span class="text-xs text-slate-400">{formatDate(log.createdAt)}</span>
												</div>
												{#if log.detail && typeof log.detail === 'object' && 'note' in log.detail}
													<p class="text-sm text-slate-600">{(log.detail as { note: string }).note}</p>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-sm text-slate-400 text-center py-8">暂无处理日志</p>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="space-y-4">
			<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
				<h3 class="text-sm font-semibold text-slate-800 mb-4">处理操作</h3>
				<div class="space-y-2">
					{#if data.complaint.status === 'pending'}
						<button
							onclick={() => showAssignModal = true}
							class="w-full py-2 px-4 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition"
						>
							分配处理
						</button>
					{/if}

					{#if data.complaint.status === 'assigned'}
						<button
							onclick={handleStartProgress}
							disabled={submitting}
							class="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
						>
							开始处理
						</button>
					{/if}

					{#if data.complaint.status === 'in_progress'}
						<button
							onclick={handleResolve}
							disabled={submitting}
							class="w-full py-2 px-4 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
						>
							标记已解决
						</button>
					{/if}

					{#if data.complaint.status === 'resolved'}
						<button
							onclick={handleClose}
							disabled={submitting}
							class="w-full py-2 px-4 bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
						>
							关闭投诉
						</button>
					{/if}

					{#if data.complaint.status !== 'closed' && data.complaint.status !== 'rejected'}
						<button
							onclick={() => showEscalateModal = true}
							class="w-full py-2 px-4 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition"
						>
							升级处理
						</button>
					{/if}

					{#if data.complaint.status !== 'closed' && data.complaint.status !== 'rejected'}
						<button
							onclick={() => showSupplementModal = true}
							class="w-full py-2 px-4 border border-slate-300 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
						>
							补充材料
						</button>
					{/if}

					{#if data.complaint.status !== 'closed' && data.complaint.status !== 'rejected'}
						<button
							onclick={() => showRejectModal = true}
							class="w-full py-2 px-4 border border-orange-300 text-orange-600 text-sm font-medium rounded-lg hover:bg-orange-50 transition"
						>
							驳回投诉
						</button>
					{/if}

					{#if data.complaint.status === 'rejected'}
						<button
							onclick={() => showResubmitModal = true}
							class="w-full py-2 px-4 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition"
						>
							重新提交
						</button>
					{/if}

					{#if data.complaint.assigneeId && data.complaint.status !== 'closed'}
						<button
							onclick={() => showReassignModal = true}
							class="w-full py-2 px-4 border border-amber-300 text-amber-600 text-sm font-medium rounded-lg hover:bg-amber-50 transition"
						>
							重新分派
						</button>
					{/if}

					{#if data.complaint.status === 'resolved' || data.complaint.status === 'closed'}
						<button
							onclick={() => showCallbackModal = true}
							class="w-full py-2 px-4 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition"
						>
							回访记录
						</button>
					{/if}
				</div>
			</div>

			<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
				<h3 class="text-sm font-semibold text-slate-800 mb-3">常用筛选</h3>
				<div class="space-y-2">
					<a href="/complaints?status=pending" class="block text-sm text-slate-600 hover:text-primary-600 transition">
						→ 待处理投诉
					</a>
					<a href="/complaints?status=in_progress" class="block text-sm text-slate-600 hover:text-primary-600 transition">
						→ 处理中投诉
					</a>
					<a href="/complaints/overdue" class="block text-sm text-slate-600 hover:text-primary-600 transition">
						→ 超时待办
					</a>
					<a href="/complaints?status=escalated" class="block text-sm text-slate-600 hover:text-primary-600 transition">
						→ 已升级投诉
					</a>
				</div>
			</div>
		</div>
	</div>
</div>

{#if showAssignModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showAssignModal = false}>
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-slate-800 mb-4">分配处理</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">选择处理人</label>
					<select
						bind:value={selectedAssigneeId}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					>
						<option value="">请选择</option>
						{#each data.staff as s}
							<option value={s.id}>{s.displayName} ({s.roleLabel})</option>
						{/each}
					</select>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button onclick={() => showAssignModal = false} class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition">
						取消
					</button>
					<button
						onclick={handleAssign}
						disabled={submitting || !selectedAssigneeId}
						class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
					>
						确认分配
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showEscalateModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showEscalateModal = false}>
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-slate-800 mb-4">升级处理</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">升级给</label>
					<select
						bind:value={selectedToUserId}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					>
						<option value="">请选择</option>
						{#each data.staff as s}
							<option value={s.id}>{s.displayName} ({s.roleLabel})</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">升级原因</label>
					<textarea
						bind:value={escalationReason}
						rows={3}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
						placeholder="请说明升级原因..."
					></textarea>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button onclick={() => showEscalateModal = false} class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition">
						取消
					</button>
					<button
						onclick={handleEscalate}
						disabled={submitting || !selectedToUserId || !escalationReason}
						class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50"
					>
						确认升级
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showRejectModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showRejectModal = false}>
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-slate-800 mb-4">驳回投诉</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">驳回原因</label>
					<textarea
						bind:value={rejectReason}
						rows={4}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
						placeholder="请说明驳回原因..."
					></textarea>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button onclick={() => showRejectModal = false} class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition">
						取消
					</button>
					<button
						onclick={handleReject}
						disabled={submitting || !rejectReason}
						class="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
					>
						确认驳回
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showResubmitModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showResubmitModal = false}>
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-slate-800 mb-4">重新提交</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">补充说明</label>
					<textarea
						bind:value={resubmitInfo}
						rows={4}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
						placeholder="请补充相关信息..."
					></textarea>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button onclick={() => showResubmitModal = false} class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition">
						取消
					</button>
					<button
						onclick={handleResubmit}
						disabled={submitting || !resubmitInfo}
						class="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
					>
						重新提交
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showReassignModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showReassignModal = false}>
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-slate-800 mb-4">重新分派</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">新处理人</label>
					<select
						bind:value={reassignToId}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					>
						<option value="">请选择</option>
						{#each data.staff as s}
							<option value={s.id}>{s.displayName} ({s.roleLabel})</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">重派原因</label>
					<textarea
						bind:value={reassignReason}
						rows={3}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
						placeholder="请说明重新分派原因..."
					></textarea>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button onclick={() => showReassignModal = false} class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition">
						取消
					</button>
					<button
						onclick={handleReassign}
						disabled={submitting || !reassignToId || !reassignReason}
						class="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
					>
						确认重派
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showSupplementModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showSupplementModal = false}>
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-slate-800 mb-4">补充材料</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">补充说明</label>
					<textarea
						bind:value={supplementNote}
						rows={4}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
						placeholder="请输入补充材料说明..."
					></textarea>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button onclick={() => showSupplementModal = false} class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition">
						取消
					</button>
					<button
						onclick={handleSupplement}
						disabled={submitting || !supplementNote}
						class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
					>
						确认补充
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showCallbackModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showCallbackModal = false}>
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-slate-800 mb-4">回访记录</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-2">游客满意度</label>
					<div class="flex gap-4">
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="radio" bind:group={callbackSatisfied} value={true} class="w-4 h-4 text-green-600" />
							<span class="text-sm text-slate-700">满意</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="radio" bind:group={callbackSatisfied} value={false} class="w-4 h-4 text-red-600" />
							<span class="text-sm text-slate-700">不满意</span>
						</label>
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">回访备注</label>
					<textarea
						bind:value={callbackComment}
						rows={3}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
						placeholder="请输入回访备注..."
					></textarea>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button onclick={() => showCallbackModal = false} class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition">
						取消
					</button>
					<button
						onclick={handleCallback}
						disabled={submitting}
						class="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
					>
						保存记录
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
