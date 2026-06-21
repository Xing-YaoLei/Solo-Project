<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import MobileCard from '$lib/components/MobileCard.svelte';
	import type { MaterialDelay } from '$lib/server/db/schema';

	let delays = $state<MaterialDelay[]>([]);
	let isLoading = $state(true);
	let isRefreshing = $state(false);
	let showTransferModal = $state(false);
	let selectedDelay = $state<MaterialDelay | null>(null);
	let transferNote = $state('');

	async function loadData() {
		isLoading = true;
		try {
			const result = await trpc.materialDelays.list.query({ page: 1, pageSize: 50 });
			delays = result.data;
		} catch (e) {
			console.error('Failed to load material delays:', e);
		} finally {
			isLoading = false;
			isRefreshing = false;
		}
	}

	onMount(() => {
		loadData();
	});

	async function handleRefresh() {
		isRefreshing = true;
		await loadData();
	}

	function openTransferModal(delay: MaterialDelay) {
		selectedDelay = delay;
		transferNote = '';
		showTransferModal = true;
	}

	async function handleTransfer() {
		if (!selectedDelay) return;
		try {
			await trpc.materialDelays.transferResponsibility.mutate({
				id: selectedDelay.id,
				newResponsibleId: selectedDelay.responsibleId || selectedDelay.createdById,
				newResponsibleRole: selectedDelay.responsibleRole,
				transferNote: transferNote || undefined
			});
			showTransferModal = false;
			selectedDelay = null;
			transferNote = '';
			await loadData();
		} catch (e: any) {
			alert(e.message || '转移失败');
		}
	}

	function formatDate(date: Date | null | undefined): string {
		if (!date) return '';
		const d = new Date(date);
		return `${d.getMonth() + 1}/${d.getDate()}`;
	}

	const roleMap: Record<string, string> = {
		project_manager: '项目经理',
		designer: '设计师',
		foreman: '工头',
		worker: '工人',
		supplier: '供应商',
		client: '客户',
		admin: '管理员'
	};

	const reasonMap: Record<string, string> = {
		supplier_delay: '供应商延迟',
		production_issue: '生产问题',
		transport_issue: '运输问题',
		customs_clearance: '清关问题',
		other: '其他原因'
	};

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
		pending: '待处理',
		processing: '处理中',
		approved: '已确认',
		rejected: '已拒绝',
		completed: '已完成',
		cancelled: '已取消'
	};
</script>

<div>
	<div class="px-4 py-4">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-gray-900">材料延期</h2>
			<button
				class="p-2 -mr-2 text-gray-500 hover:text-gray-700"
				onclick={handleRefresh}
				title="刷新"
			>
				<svg class="w-5 h-5 {isRefreshing ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			</button>
		</div>

		<div class="flex gap-3 mb-4 overflow-x-auto -mx-1 px-1">
			<div class="flex-shrink-0 px-3 py-2 bg-red-50 rounded-lg">
				<p class="text-xs text-red-500 font-medium">延期超7天</p>
				<p class="text-lg font-bold text-red-600">
					{delays.filter((d) => (d.delayDays || 0) > 7).length}
				</p>
			</div>
			<div class="flex-shrink-0 px-3 py-2 bg-orange-50 rounded-lg">
				<p class="text-xs text-orange-500 font-medium">延期3-7天</p>
				<p class="text-lg font-bold text-orange-600">
					{delays.filter((d) => (d.delayDays || 0) >= 3 && (d.delayDays || 0) <= 7).length}
				</p>
			</div>
			<div class="flex-shrink-0 px-3 py-2 bg-yellow-50 rounded-lg">
				<p class="text-xs text-yellow-600 font-medium">延期1-2天</p>
				<p class="text-lg font-bold text-yellow-700">
					{delays.filter((d) => (d.delayDays || 0) >= 1 && (d.delayDays || 0) < 3).length}
				</p>
			</div>
			<div class="flex-shrink-0 px-3 py-2 bg-green-50 rounded-lg">
				<p class="text-xs text-green-500 font-medium">已解决</p>
				<p class="text-lg font-bold text-green-600">
					{delays.filter((d) => d.status === 'completed').length}
				</p>
			</div>
		</div>

		{#if isLoading}
			<div class="flex items-center justify-center py-20">
				<div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
			</div>
		{:else if delays.length === 0}
			<div class="flex flex-col items-center justify-center py-16">
				<div class="text-5xl mb-4">📦</div>
				<p class="text-gray-500">暂无材料延期记录</p>
				<p class="text-gray-400 text-sm mt-1">所有材料按时交付</p>
			</div>
		{:else}
			{#each delays as delay}
				<MobileCard
					title={delay.materialName}
					subtitle={delay.reason ? reasonMap[delay.reason] ?? delay.reason : ''}
					description={delay.description ?? undefined}
					status={delay.status}
					icon="material"
					rightContent={formatDate(delay.createdAt)}
					onClick={() => goto(`/mobile/material-delays/${delay.id}`)}
				>
					<div class="mt-3 pt-3 border-t border-gray-100">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-4">
								<span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(delay.delayDays || 0) > 7
									? 'bg-red-100 text-red-700'
									: (delay.delayDays || 0) >= 3
										? 'bg-orange-100 text-orange-700'
										: 'bg-yellow-100 text-yellow-700'}`}>
									延期 {delay.delayDays || 0} 天
								</span>
								<span class="text-sm text-gray-500">
									🎯 {roleMap[delay.responsibleRole] || delay.responsibleRole}
								</span>
							</div>
							{#if delay.status !== 'completed'}
								<button
									class="px-3 py-1.5 bg-primary-100 text-primary-700 text-sm font-medium rounded-lg hover:bg-primary-200 active:bg-primary-300"
									onclick={(e) => {
										e.stopPropagation();
										openTransferModal(delay);
									}}
								>
									转移责任
								</button>
							{/if}
						</div>
						{#if delay.materialType}
							<p class="text-sm text-gray-500 mt-2">类型：{delay.materialType}</p>
						{/if}
						{#if delay.quantity}
							<p class="text-sm text-gray-500">数量：{delay.quantity}</p>
						{/if}
						<div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
							<span>原交付：{formatDate(delay.originalDeliveryDate)}</span>
							<span>预计交付：{formatDate(delay.expectedDeliveryDate)}</span>
						</div>
					</div>
				</MobileCard>
			{/each}
		{/if}
	</div>

	{#if showTransferModal && selectedDelay}
		<div class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onclick={() => (showTransferModal = false)}>
			<div class="bg-white w-full max-w-md rounded-t-2xl p-5" onclick={(e) => e.stopPropagation()}>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">转移责任</h3>
				<p class="text-sm text-gray-500 mb-4">
					材料：{selectedDelay.materialName}
				</p>
				<p class="text-sm text-gray-600 mb-4">
					当前责任方：{roleMap[selectedDelay.responsibleRole] || selectedDelay.responsibleRole}
				</p>
				<label class="block text-sm font-medium text-gray-700 mb-2">转移说明</label>
				<textarea
					class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-gray-900"
					rows={3}
					placeholder="请输入转移说明..."
					bind:value={transferNote}
				/>
				<div class="flex gap-3 mt-4">
					<button
						class="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl"
						onclick={() => (showTransferModal = false)}
					>
						取消
					</button>
					<button
						class="flex-1 py-3 bg-primary-500 text-white font-medium rounded-xl"
						onclick={handleTransfer}
					>
						确认转移
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
