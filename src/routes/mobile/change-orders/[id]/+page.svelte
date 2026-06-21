<script lang="ts">
	import { page } from '$app/stores';
import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import type { ChangeOrder, Attachment, Note, FlowRecord } from '$lib/server/db/schema';

	let changeOrder = $state<(ChangeOrder & { attachments: Attachment[]; notes: Note[]; flowRecords: FlowRecord[] }) | null>(null);
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let showActionSheet = $state(false);
	let showNoteModal = $state(false);
	let showAttachmentModal = $state(false);
	let noteContent = $state('');
	let newPhotos = $state<string[]>([]);
	let selectedImage = $state<string | null>(null);

	const id = $derived(() => $page.params.id);

	async function loadData() {
		const orderId = id();
		if (!orderId) return;
		isLoading = true;
		try {
			changeOrder = await trpc.changeOrders.get.query({ id: orderId });
		} catch (e) {
			console.error('Failed to load change order:', e);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadData();
	});

	async function updateStatus(status: string, action: string, comments?: string) {
		if (!changeOrder) return;
		isSubmitting = true;
		try {
			await trpc.changeOrders.updateStatus.mutate({
				id: changeOrder.id,
				status: status as any,
				action,
				comments
			});
			showActionSheet = false;
			await loadData();
		} catch (e: any) {
			alert(e.message || '操作失败');
		} finally {
			isSubmitting = false;
		}
	}

	async function handleApprove() {
		if (confirm('确定要批准此变更单吗？')) {
			await updateStatus('approved', 'approve', '批准通过');
		}
	}

	async function handleReject() {
		const reason = prompt('请输入驳回原因：');
		if (reason !== null) {
			await updateStatus('rejected', 'reject', reason || '驳回');
		}
	}

	async function handleAddNote() {
		if (!changeOrder || !noteContent.trim()) return;
		isSubmitting = true;
		try {
			await trpc.changeOrders.updateStatus.mutate({
				id: changeOrder.id,
				status: changeOrder.status,
				action: 'add_note',
				comments: noteContent
			});
			noteContent = '';
			showNoteModal = false;
			await loadData();
		} catch (e: any) {
			alert(e.message || '添加备注失败');
		} finally {
			isSubmitting = false;
		}
	}

	function handlePhotoUpload() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.multiple = true;
		input.onchange = (e) => {
			const files = (e.target as HTMLInputElement).files;
			if (files) {
				Array.from(files).forEach((file) => {
					const reader = new FileReader();
					reader.onload = (ev) => {
						if (ev.target?.result) {
							newPhotos = [...newPhotos, ev.target.result as string];
						}
					};
					reader.readAsDataURL(file);
				});
			}
		};
		input.click();
	}

	async function handleUploadAttachment() {
		if (!changeOrder || newPhotos.length === 0) return;
		isSubmitting = true;
		try {
			await trpc.changeOrders.updateStatus.mutate({
				id: changeOrder.id,
				status: changeOrder.status,
				action: 'upload_attachment',
				comments: `上传了 ${newPhotos.length} 个附件`
			});
			newPhotos = [];
			showAttachmentModal = false;
			await loadData();
		} catch (e: any) {
			alert(e.message || '上传失败');
		} finally {
			isSubmitting = false;
		}
	}

	function removeNewPhoto(index: number) {
		newPhotos = newPhotos.filter((_, i) => i !== index);
	}

	function formatDate(date: Date | null | undefined): string {
		if (!date) return '';
		const d = new Date(date);
		return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
	}

	function formatCurrency(amount: number | null | undefined): string {
		if (!amount) return '¥0';
		const sign = amount >= 0 ? '' : '-';
		return `${sign}¥${Math.abs(amount).toLocaleString()}`;
	}

	const statusColors: Record<string, string> = {
		draft: 'bg-gray-100 text-gray-600',
		pending: 'bg-yellow-100 text-yellow-700',
		processing: 'bg-blue-100 text-blue-700',
		approved: 'bg-green-100 text-green-700',
		rejected: 'bg-red-100 text-red-700',
		completed: 'bg-green-100 text-green-700',
		cancelled: 'bg-gray-100 text-gray-500'
	};

	const statusMap: Record<string, string> = {
		draft: '草稿',
		pending: '待审批',
		processing: '处理中',
		approved: '已批准',
		rejected: '已驳回',
		completed: '已完成',
		cancelled: '已取消'
	};
</script>

<div class="pb-24">
	{#if isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
		</div>
	{:else if changeOrder}
		<div class="px-4 py-4">
			<section class="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
				<div class="flex items-start justify-between mb-4">
					<div>
						<span class="text-sm text-gray-500">{changeOrder.code}</span>
						<h1 class="text-xl font-bold text-gray-900 mt-1">{changeOrder.title}</h1>
					</div>
					<span class="px-3 py-1 rounded-full text-sm font-medium {statusColors[changeOrder.status]}">
						{statusMap[changeOrder.status]}
					</span>
				</div>
				{#if changeOrder.description}
					<p class="text-gray-600 text-sm leading-relaxed">{changeOrder.description}</p>
				{/if}
				<div class="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
					<div>
						<p class="text-xs text-gray-500">费用变更</p>
						<p class="text-sm font-semibold mt-0.5 {changeOrder.costChange && changeOrder.costChange > 0 ? 'text-red-500' : changeOrder.costChange && changeOrder.costChange < 0 ? 'text-green-500' : 'text-gray-900'}">
							{formatCurrency(changeOrder.costChange)}
						</p>
					</div>
					<div>
						<p class="text-xs text-gray-500">工期变更</p>
						<p class="text-sm font-semibold mt-0.5 text-gray-900">
							{(changeOrder.timeChangeDays ?? 0) > 0 ? '+' : ''}{changeOrder.timeChangeDays ?? 0} 天
						</p>
					</div>
					<div>
						<p class="text-xs text-gray-500">创建时间</p>
						<p class="text-sm font-medium mt-0.5 text-gray-900">
							{formatDate(changeOrder.createdAt)}
						</p>
					</div>
				</div>
			</section>

			{#if changeOrder.reason || changeOrder.impact || changeOrder.originalPlan || changeOrder.newPlan}
				<section class="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
					<h3 class="font-semibold text-gray-900 mb-4">变更详情</h3>
					{#if changeOrder.reason}
						<div class="mb-4">
							<p class="text-sm text-gray-500 mb-1">变更原因</p>
							<p class="text-sm text-gray-700">{changeOrder.reason}</p>
						</div>
					{/if}
					{#if changeOrder.impact}
						<div class="mb-4">
							<p class="text-sm text-gray-500 mb-1">影响分析</p>
							<p class="text-sm text-gray-700">{changeOrder.impact}</p>
						</div>
					{/if}
					{#if changeOrder.originalPlan}
						<div class="mb-4">
							<p class="text-sm text-gray-500 mb-1">原方案</p>
							<p class="text-sm text-gray-700">{changeOrder.originalPlan}</p>
						</div>
					{/if}
					{#if changeOrder.newPlan}
						<div>
							<p class="text-sm text-gray-500 mb-1">新方案</p>
							<p class="text-sm text-gray-700">{changeOrder.newPlan}</p>
						</div>
					{/if}
				</section>
			{/if}

			{#if changeOrder.attachments.length > 0}
				<section class="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
					<h3 class="font-semibold text-gray-900 mb-4">
						附件 ({changeOrder.attachments.length})
					</h3>
					<div class="grid grid-cols-3 gap-2">
						{#each changeOrder.attachments as attachment}
							<div
								class="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
								onclick={() => (selectedImage = attachment.url)}
							>
								<img src={attachment.url} alt={attachment.name} class="w-full h-full object-cover" />
							</div>
						{/each}
					</div>
				</section>
			{/if}

			{#if changeOrder.notes.length > 0}
				<section class="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
					<h3 class="font-semibold text-gray-900 mb-4">
						备注 ({changeOrder.notes.length})
					</h3>
					<div class="space-y-4">
						{#each changeOrder.notes as note}
							<div class="bg-gray-50 rounded-xl p-4">
								<p class="text-sm text-gray-700">{note.content}</p>
								<p class="text-xs text-gray-400 mt-2">{formatDate(note.createdAt)}</p>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<section class="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
				<h3 class="font-semibold text-gray-900 mb-4">流转记录</h3>
				<div class="relative">
					{#each changeOrder.flowRecords as record, i}
						<div class="flex gap-4 relative pb-6 {i === changeOrder.flowRecords.length - 1 ? 'pb-0' : ''}">
							{#if i < changeOrder.flowRecords.length - 1}
								<div class="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200" />
							{/if}
							<div class="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 relative z-10">
								<div class="w-2 h-2 bg-white rounded-full" />
							</div>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium text-gray-900">{record.action}</span>
									<span class="px-2 py-0.5 rounded text-xs font-medium {statusColors[record.toStatus]}">
										{statusMap[record.toStatus]}
									</span>
								</div>
								{#if record.comments}
									<p class="text-sm text-gray-600 mt-1">{record.comments}</p>
								{/if}
								<p class="text-xs text-gray-400 mt-2">{formatDate(record.createdAt)}</p>
							</div>
						</div>
					{/each}
				</div>
			</section>
		</div>

		<div class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-4 py-3 z-40">
			<div class="flex gap-3">
				{#if changeOrder.status === 'pending'}
					<button
						class="flex-1 py-3 bg-red-500 text-white font-medium rounded-xl active:bg-red-600 disabled:opacity-50"
						onclick={handleReject}
						disabled={isSubmitting}
					>
						驳回
					</button>
					<button
						class="flex-1 py-3 bg-green-500 text-white font-medium rounded-xl active:bg-green-600 disabled:opacity-50"
						onclick={handleApprove}
						disabled={isSubmitting}
					>
						批准
					</button>
				{/if}
				<button
					class="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl active:bg-gray-200"
					onclick={() => (showNoteModal = true)}
				>
					备注
				</button>
				<button
					class="flex-1 py-3 bg-primary-500 text-white font-medium rounded-xl active:bg-primary-600"
					onclick={() => (showAttachmentModal = true)}
				>
					附件
				</button>
			</div>
		</div>

		{#if showNoteModal}
			<div class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onclick={() => (showNoteModal = false)}>
				<div class="bg-white w-full max-w-md rounded-t-2xl p-5" onclick={(e) => e.stopPropagation()}>
					<h3 class="text-lg font-semibold text-gray-900 mb-4">添加备注</h3>
					<textarea
						class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-gray-900"
						rows={4}
						placeholder="请输入备注内容..."
						bind:value={noteContent}
					/>
					<div class="flex gap-3 mt-4">
						<button
							class="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl"
							onclick={() => (showNoteModal = false)}
						>
							取消
						</button>
						<button
							class="flex-1 py-3 bg-primary-500 text-white font-medium rounded-xl disabled:opacity-50"
							onclick={handleAddNote}
							disabled={isSubmitting || !noteContent.trim()}
						>
							提交
						</button>
					</div>
				</div>
			</div>
		{/if}

		{#if showAttachmentModal}
			<div class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onclick={() => (showAttachmentModal = false)}>
				<div class="bg-white w-full max-w-md rounded-t-2xl p-5" onclick={(e) => e.stopPropagation()}>
					<h3 class="text-lg font-semibold text-gray-900 mb-4">上传附件</h3>
					<button
						class="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors mb-4"
						onclick={handlePhotoUpload}
					>
						<svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						点击添加照片
					</button>
					{#if newPhotos.length > 0}
						<div class="grid grid-cols-4 gap-2 mb-4">
							{#each newPhotos as photo, i}
								<div class="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
									<img src={photo} alt="预览" class="w-full h-full object-cover" />
									<button
										class="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white text-xs"
										onclick={() => removeNewPhoto(i)}
									>
										×
									</button>
								</div>
							{/each}
						</div>
					{/if}
					<div class="flex gap-3">
						<button
							class="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl"
							onclick={() => { showAttachmentModal = false; newPhotos = []; }}
						>
							取消
						</button>
						<button
							class="flex-1 py-3 bg-primary-500 text-white font-medium rounded-xl disabled:opacity-50"
							onclick={handleUploadAttachment}
							disabled={isSubmitting || newPhotos.length === 0}
						>
							上传
						</button>
					</div>
				</div>
			</div>
		{/if}

		{#if selectedImage}
			<div
				class="fixed inset-0 bg-black z-50 flex items-center justify-center"
				onclick={() => (selectedImage = null)}
			>
				<img src={selectedImage} alt="大图" class="max-w-full max-h-full object-contain" />
				<button
					class="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl"
					onclick={() => (selectedImage = null)}
				>
					×
				</button>
			</div>
		{/if}
	{/if}
</div>
