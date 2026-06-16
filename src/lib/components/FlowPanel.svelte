<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import EmptyState from './EmptyState.svelte';
	import {
		Paperclip,
		MessageSquare,
		Users,
		Send,
		Download,
		Trash2,
		FileText,
		Image as ImageIcon,
		File
	} from 'lucide-svelte';
	import type { FlowAttachment, FlowRemark, FlowHandler, EntityType } from '$shared/types';
	import { createEventDispatcher } from 'svelte';

	type TabType = 'remarks' | 'attachments' | 'handlers';

	export let entityType: EntityType;
	export let entityId: string;
	export let title = '';
	export let remarks: FlowRemark[] = [];
	export let attachments: FlowAttachment[] = [];
	export let handlers: FlowHandler[] = [];
	export let canAddRemark = true;
	export let canDeleteAttachment = false;
	export let loading = false;
	export let disabled = false;
	export let className = '';

	const dispatch = createEventDispatcher<{
		addRemark: { content: string };
		deleteAttachment: { id: string };
		downloadAttachment: { attachment: FlowAttachment };
	}>();

	let activeTab: TabType = 'remarks';
	let newRemark = '';
	let submittingRemark = false;

	const tabs: { key: TabType; label: string; icon: typeof Paperclip; count: number }[] = [
		{ key: 'remarks', label: '备注', icon: MessageSquare, count: remarks.length },
		{ key: 'attachments', label: '附件', icon: Paperclip, count: attachments.length },
		{ key: 'handlers', label: '经办人', icon: Users, count: handlers.length }
	];

	function formatDateTime(date: Date | string): string {
		const d = date instanceof Date ? date : new Date(date);
		return d.toLocaleString('zh-CN', {
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function getFileIcon(fileName: string): typeof File {
		const ext = fileName.split('.').pop()?.toLowerCase();
		if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
			return ImageIcon;
		}
		if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'].includes(ext || '')) {
			return FileText;
		}
		return File;
	}

	function getFileIconColor(fileName: string): string {
		const ext = fileName.split('.').pop()?.toLowerCase();
		if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
			return 'text-accent-500 bg-accent-50';
		}
		if (['pdf'].includes(ext || '')) {
			return 'text-danger-500 bg-danger-50';
		}
		if (['doc', 'docx'].includes(ext || '')) {
			return 'text-primary-500 bg-primary-50';
		}
		if (['xls', 'xlsx'].includes(ext || '')) {
			return 'text-mint-500 bg-mint-50';
		}
		return 'text-gray-500 bg-gray-100';
	}

	async function handleAddRemark() {
		const content = newRemark.trim();
		if (!content || submittingRemark) return;

		submittingRemark = true;
		try {
			dispatch('addRemark', { content });
			newRemark = '';
		} finally {
			submittingRemark = false;
		}
	}

	function handleDeleteAttachment(id: string) {
		dispatch('deleteAttachment', { id });
	}

	function handleDownloadAttachment(attachment: FlowAttachment) {
		dispatch('downloadAttachment', { attachment });
	}

	$: tabsWithCount = tabs.map((t) => ({ ...t, count: t.count }));
</script>

<div class={cn('card overflow-hidden', className)}>
	{#if title}
		<div class="px-6 py-4 border-b border-gray-100">
			<h3 class="text-lg font-semibold text-gray-800">{title}</h3>
		</div>
	{/if}
	<div class="flex border-b border-gray-100">
		{#each tabsWithCount as tab}
			<button
				type="button"
				on:click={() => (activeTab = tab.key)}
				class={cn(
					'tab-btn flex items-center gap-2',
					activeTab === tab.key && 'active'
				)}
			>
				<svelte:component this={tab.icon} class="w-4 h-4" />
				<span>{tab.label}</span>
				{#if tab.count > 0}
					<span
						class={cn(
							'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium',
							activeTab === tab.key
								? 'bg-primary-100 text-primary-700'
								: 'bg-gray-100 text-gray-600'
						)}
					>
						{tab.count}
					</span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="p-4">
		{#if activeTab === 'remarks'}
			<div class="space-y-4">
				{#if canAddRemark && !disabled}
					<div class="flex gap-3">
						<div class="flex-1">
							<textarea
								bind:value={newRemark}
								placeholder="添加备注..."
								class="input resize-none min-h-[80px]"
								disabled={disabled || submittingRemark}
								on:keydown={(e) => {
									if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !disabled) {
										handleAddRemark();
									}
								}}
							/>
							<div class="flex justify-between items-center mt-2">
								<p class="text-xs text-gray-400">Ctrl + Enter 发送</p>
								<button
									type="button"
									on:click={handleAddRemark}
									disabled={!newRemark.trim() || submittingRemark || disabled}
									class="btn-primary py-2 px-4 text-sm"
								>
									<Send class="w-4 h-4" />
									发送
								</button>
							</div>
						</div>
					</div>
				{/if}

				{#if loading}
					<div class="py-8">
						<EmptyState title="加载中..." description="正在获取备注列表" />
					</div>
				{:else if remarks.length === 0}
					<div class="py-8">
						<EmptyState
							title="暂无备注"
							description={canAddRemark ? '添加第一条备注开始协作' : '还没有任何备注记录'}
						/>
					</div>
				{:else}
					<div class="space-y-4 max-h-96 overflow-y-auto scrollbar-thin pr-2">
						{#each remarks as remark}
							<div class="flex gap-3">
								<div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
									<span class="text-xs font-medium text-primary-700">
										{(remark.createdBy ?? '系').charAt(0)}
									</span>
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1">
										<span class="text-sm font-medium text-gray-800">{remark.createdBy ?? '系统'}</span>
										<span class="text-xs text-gray-400">{formatDateTime(remark.createdAt)}</span>
									</div>
									<p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
										{remark.content}
									</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

		{:else if activeTab === 'attachments'}
			<div>
				{#if loading}
					<div class="py-8">
						<EmptyState title="加载中..." description="正在获取附件列表" />
					</div>
				{:else if attachments.length === 0}
					<div class="py-8">
						<EmptyState title="暂无附件" description="还没有上传任何附件" />
					</div>
				{:else}
					<div class="space-y-2 max-h-96 overflow-y-auto scrollbar-thin pr-2">
						{#each attachments as attachment}
							<div
								class="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group"
							>
								<div
									class={cn(
										'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
										getFileIconColor(attachment.fileName)
									)}
								>
									<svelte:component this={getFileIcon(attachment.fileName)} class="w-5 h-5" />
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-gray-800 truncate" title={attachment.fileName}>
										{attachment.fileName}
									</p>
									<p class="text-xs text-gray-400">
										{attachment.fileSize > 0 && formatFileSize(attachment.fileSize)}
										{attachment.fileSize > 0 && ' · '}
										{attachment.uploadedBy ?? '系统'} · {formatDateTime(attachment.uploadedAt)}
									</p>
								</div>
								<div class="flex items-center gap-1">
									<button
										type="button"
										on:click={() => handleDownloadAttachment(attachment)}
										class="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
										aria-label="下载"
									>
										<Download class="w-4 h-4" />
									</button>
									{#if canDeleteAttachment}
										<button
											type="button"
											on:click={() => handleDeleteAttachment(attachment.id)}
											class="p-2 rounded-lg text-gray-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
											aria-label="删除"
										>
											<Trash2 class="w-4 h-4" />
										</button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

		{:else if activeTab === 'handlers'}
			<div>
				{#if loading}
					<div class="py-8">
						<EmptyState title="加载中..." description="正在获取经办人列表" />
					</div>
				{:else if handlers.length === 0}
					<div class="py-8">
						<EmptyState title="暂无经办人" description="还没有分配经办人" />
					</div>
				{:else}
					<div class="space-y-3 max-h-96 overflow-y-auto scrollbar-thin pr-2">
						{#each handlers as handler}
							<div class="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
								<div class="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
									<span class="text-sm font-medium text-white">
										{handler.userName.charAt(0)}
									</span>
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-gray-800">{handler.userName}</p>
									<p class="text-xs text-gray-500">{handler.stepName}</p>
								</div>
								<div class="text-right">
									{#if handler.handledAt}
										<span class="badge border bg-mint-50 text-mint-700 border-mint-200">
											<span class="status-dot bg-mint-500 mr-1.5" />
											已处理
										</span>
										<p class="text-xs text-gray-400 mt-1">{formatDateTime(handler.handledAt)}</p>
									{:else}
										<span class="badge border bg-amber-50 text-amber-700 border-amber-200">
											<span class="status-dot bg-amber-500 mr-1.5" />
											待处理
										</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
