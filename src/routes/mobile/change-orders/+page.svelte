<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import MobileCard from '$lib/components/MobileCard.svelte';
	import type { ChangeOrder } from '$lib/server/db/schema';

	let changeOrders = $state<ChangeOrder[]>([]);
	let isLoading = $state(true);
	let isRefreshing = $state(false);
	let isLoadingMore = $state(false);
	let pageNum = $state(1);
	let total = $state(0);
	let hasMore = $derived(() => changeOrders.length < total);

	let activeStatus = $state<string>('all');

	const statusTabs = [
		{ key: 'all', label: '全部' },
		{ key: 'pending', label: '待审批' },
		{ key: 'processing', label: '处理中' },
		{ key: 'completed', label: '已完成' }
	];

	$effect(() => {
		const urlParams = new URLSearchParams($page.url.search);
		const status = urlParams.get('status');
		if (status) {
			activeStatus = status;
		}
		loadData(true);
	});

	async function loadData(reset = false) {
		if (reset) {
			pageNum = 1;
			changeOrders = [];
		}
		isLoading = true;
		try {
			const status = activeStatus === 'all' ? undefined : activeStatus as any;
			const result = await trpc.changeOrders.list.query({
				page: pageNum,
				pageSize: 10,
				status
			});
			if (pageNum === 1) {
				changeOrders = result.data;
			} else {
				changeOrders = [...changeOrders, ...result.data];
			}
			total = result.total;
		} catch (e) {
			console.error('Failed to load change orders:', e);
		} finally {
			isLoading = false;
			isRefreshing = false;
			isLoadingMore = false;
		}
	}

	onMount(() => {
		loadData(true);
	});

	async function handleRefresh() {
		isRefreshing = true;
		pageNum = 1;
		await loadData(true);
	}

	async function loadMore() {
		if (isLoadingMore || !hasMore()) return;
		isLoadingMore = true;
		pageNum += 1;
		await loadData();
	}

	function handleScroll(e: Event) {
		const target = e.target as HTMLElement;
		const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
		if (bottom && !isLoading && hasMore()) {
			loadMore();
		}
	}

	function changeStatus(status: string) {
		activeStatus = status;
		loadData(true);
	}

	function formatDate(date: Date | null | undefined): string {
		if (!date) return '';
		const d = new Date(date);
		return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
	}

	function formatCurrency(amount: number | null | undefined): string {
		if (!amount) return '¥0';
		const sign = amount >= 0 ? '' : '-';
		return `${sign}¥${Math.abs(amount).toLocaleString()}`;
	}
</script>

<div onscroll={handleScroll}>
	<div class="sticky top-0 z-40 bg-gray-50 pt-2">
		<div class="px-4 mb-3">
			<div class="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
				{#each statusTabs as tab}
					<button
						class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors {activeStatus === tab.key
							? 'bg-primary-500 text-white'
							: 'bg-white text-gray-600 border border-gray-200'}"
						onclick={() => changeStatus(tab.key)}
					>
						{tab.label}
					</button>
				{/each}
			</div>
		</div>

		{#if isRefreshing}
			<div class="flex items-center justify-center py-3">
				<div class="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
				<span class="ml-2 text-sm text-gray-500">刷新中...</span>
			</div>
		{/if}
	</div>

	<div class="px-4 py-2">
		<button
			class="w-full py-3 mb-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl shadow-md active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
			onclick={() => goto('/mobile/change-orders/create')}
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			创建变更单
		</button>

		{#if isLoading && changeOrders.length === 0}
			<div class="flex items-center justify-center py-20">
				<div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
			</div>
		{:else if changeOrders.length === 0}
			<div class="flex flex-col items-center justify-center py-16">
				<div class="text-5xl mb-4">📋</div>
				<p class="text-gray-500">暂无变更单</p>
				<p class="text-gray-400 text-sm mt-1">点击上方按钮创建新变更单</p>
			</div>
		{:else}
			{#each changeOrders as order}
				<MobileCard
					title={order.title}
					subtitle={order.code}
					description={order.description}
					status={order.status}
					icon="change"
					rightContent={formatDate(order.createdAt)}
					onClick={() => goto(`/mobile/change-orders/${order.id}`)}
				>
					<div class="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
						{#if order.costChange !== undefined && order.costChange !== 0}
							<span class="text-sm font-medium {order.costChange > 0 ? 'text-red-500' : 'text-green-500'}">
								{formatCurrency(order.costChange)}
							</span>
						{/if}
						{#if order.timeChangeDays && order.timeChangeDays !== 0}
							<span class="text-sm text-gray-500">
								⏱️ {order.timeChangeDays > 0 ? '+' : ''}{order.timeChangeDays}天
							</span>
						{/if}
					</div>
				</MobileCard>
			{/each}

			{#if isLoadingMore}
				<div class="flex items-center justify-center py-6">
					<div class="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
					<span class="ml-2 text-sm text-gray-500">加载更多...</span>
				</div>
			{:else if !hasMore() && changeOrders.length > 0}
				<p class="text-center text-sm text-gray-400 py-4">— 已加载全部 —</p>
			{/if}
		{/if}
	</div>

	<button
		class="fixed right-4 bottom-24 w-12 h-12 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform"
		onclick={handleRefresh}
		title="刷新"
	>
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
		</svg>
	</button>
</div>
