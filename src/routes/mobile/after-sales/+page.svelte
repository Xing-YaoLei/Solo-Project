<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import MobileCard from '$lib/components/MobileCard.svelte';
	import type { AfterSalesOrder } from '$lib/server/db/schema';

	let orders = $state<AfterSalesOrder[]>([]);
	let isLoading = $state(true);
	let isRefreshing = $state(false);

	async function loadData() {
		isLoading = true;
		try {
			const result = await trpc.afterSalesOrders.list.query({ page: 1, pageSize: 50 });
			orders = result.data.sort((a, b) => {
				const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
				const aPriority = priorityOrder[a.priority || 'normal'] ?? 2;
				const bPriority = priorityOrder[b.priority || 'normal'] ?? 2;
				if (aPriority !== bPriority) return aPriority - bPriority;
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			});
		} catch (e) {
			console.error('Failed to load after sales orders:', e);
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

	async function handleQuickProcess(order: AfterSalesOrder) {
		try {
			await trpc.afterSalesOrders.updateStatus.mutate({
				id: order.id,
				status: 'processing',
				comments: '移动端开始处理'
			});
			await loadData();
		} catch (e: any) {
			alert(e.message || '操作失败');
		}
	}

	function formatDate(date: Date | null | undefined): string {
		if (!date) return '';
		const d = new Date(date);
		return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
	}

	const priorityConfig: Record<string, { label: string; type: string }> = {
		urgent: { label: '紧急', type: 'error' },
		high: { label: '高', type: 'warning' },
		normal: { label: '普通', type: 'default' },
		low: { label: '低', type: 'info' }
	};
</script>

<div>
	<div class="px-4 py-4">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-gray-900">售后工单</h2>
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
				<p class="text-xs text-red-500 font-medium">紧急</p>
				<p class="text-lg font-bold text-red-600">
					{orders.filter((o) => o.priority === 'urgent').length}
				</p>
			</div>
			<div class="flex-shrink-0 px-3 py-2 bg-orange-50 rounded-lg">
				<p class="text-xs text-orange-500 font-medium">高优</p>
				<p class="text-lg font-bold text-orange-600">
					{orders.filter((o) => o.priority === 'high').length}
				</p>
			</div>
			<div class="flex-shrink-0 px-3 py-2 bg-blue-50 rounded-lg">
				<p class="text-xs text-blue-500 font-medium">处理中</p>
				<p class="text-lg font-bold text-blue-600">
					{orders.filter((o) => o.status === 'processing').length}
				</p>
			</div>
			<div class="flex-shrink-0 px-3 py-2 bg-green-50 rounded-lg">
				<p class="text-xs text-green-500 font-medium">已完成</p>
				<p class="text-lg font-bold text-green-600">
					{orders.filter((o) => o.status === 'completed').length}
				</p>
			</div>
		</div>

		{#if isLoading}
			<div class="flex items-center justify-center py-20">
				<div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
			</div>
		{:else if orders.length === 0}
			<div class="flex flex-col items-center justify-center py-16">
				<div class="text-5xl mb-4">🔧</div>
				<p class="text-gray-500">暂无售后工单</p>
				<p class="text-gray-400 text-sm mt-1">所有工单已处理完毕</p>
			</div>
		{:else}
			{#each orders as order}
				<MobileCard
					title={order.title}
					subtitle={order.code}
					description={order.description}
					status={order.status}
					icon="aftersales"
					badge={order.priority ? priorityConfig[order.priority]?.label : undefined}
					badgeType={order.priority ? priorityConfig[order.priority]?.type as any : 'default'}
					rightContent={formatDate(order.createdAt)}
					onClick={() => goto(`/mobile/after-sales/${order.id}`)}
				>
					{#if order.status === 'pending'}
						<div class="mt-3 pt-3 border-t border-gray-100">
							<button
								class="w-full py-2.5 bg-primary-500 text-white font-medium rounded-lg text-sm active:bg-primary-600"
								onclick={(e) => {
									e.stopPropagation();
									handleQuickProcess(order);
								}}
							>
								⚡ 快速处理
							</button>
						</div>
					{/if}
					{#if order.reportedByName}
						<div class="flex items-center gap-2 mt-2 text-sm text-gray-500">
							<span>👤 {order.reportedByName}</span>
							{#if order.reportedByPhone}
								<span>📞 {order.reportedByPhone}</span>
							{/if}
						</div>
					{/if}
				</MobileCard>
			{/each}
		{/if}
	</div>
</div>
