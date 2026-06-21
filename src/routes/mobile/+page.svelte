<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import MobileCard from '$lib/components/MobileCard.svelte';
	import type { ChangeOrder, AcceptancePhoto, AfterSalesOrder } from '$lib/server/db/schema';

	let pendingChangeOrders = $state<ChangeOrder[]>([]);
	let pendingAcceptance = $state<AcceptancePhoto[]>([]);
	let pendingAfterSales = $state<AfterSalesOrder[]>([]);
	let isLoading = $state(true);

	async function loadData() {
		isLoading = true;
		try {
			const [coResult, apResult, asResult] = await Promise.all([
				trpc.changeOrders.list.query({ page: 1, pageSize: 5, status: 'pending' }),
				trpc.acceptancePhotos.list.query({ page: 1, pageSize: 5, status: 'pending' }),
				trpc.afterSalesOrders.list.query({ page: 1, pageSize: 5, status: 'pending' })
			]);
			pendingChangeOrders = coResult.data;
			pendingAcceptance = apResult.data;
			pendingAfterSales = asResult.data;
		} catch (e) {
			console.error('Failed to load data:', e);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadData();
	});

	async function handleRefresh(e: Event) {
		const target = e.target as HTMLElement;
		if (target.scrollTop === 0) {
			await loadData();
		}
	}

	const quickActions = [
		{ icon: '⏰', label: '签到', action: () => goto('/mobile/checkin'), color: 'bg-green-50 text-green-600' },
		{ icon: '📋', label: '创建变更', action: () => goto('/mobile/change-orders/create'), color: 'bg-blue-50 text-blue-600' },
		{ icon: '📷', label: '验收拍照', action: () => goto('/mobile/acceptance/create'), color: 'bg-purple-50 text-purple-600' },
		{ icon: '🔧', label: '售后处理', action: () => goto('/mobile/after-sales'), color: 'bg-orange-50 text-orange-600' }
	];

	let currentSlide = $state(0);

	const banners = [
		{ title: '待审批变更单', count: pendingChangeOrders.length, color: 'from-blue-500 to-blue-600' },
		{ title: '待验收', count: pendingAcceptance.length, color: 'from-purple-500 to-purple-600' },
		{ title: '待处理售后', count: pendingAfterSales.length, color: 'from-orange-500 to-orange-600' }
	];

	$effect(() => {
		const interval = setInterval(() => {
			currentSlide = (currentSlide + 1) % banners.length;
		}, 4000);
		return () => clearInterval(interval);
	});

	function formatDate(date: Date | null | undefined): string {
		if (!date) return '';
		const d = new Date(date);
		return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
	}
</script>

<div onscroll={handleRefresh}>
	{#if isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
		</div>
	{:else}
		<section class="px-4 py-4">
			<div class="relative overflow-hidden rounded-2xl h-32">
				<div
					class="flex transition-transform duration-500 h-full"
					style="transform: translateX(-{currentSlide * 100}%)"
				>
					{#each banners as banner}
						<div class="min-w-full h-full">
							<div class="bg-gradient-to-r {banner.color} h-full p-5 text-white">
								<p class="text-white/80 text-sm">{banner.title}</p>
								<p class="text-3xl font-bold mt-2">{banner.count} 条</p>
								<p class="text-white/60 text-xs mt-1">点击查看全部 →</p>
							</div>
						</div>
					{/each}
				</div>
				<div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
					{#each banners as _, i}
						<button
							class="w-2 h-2 rounded-full transition-colors {i === currentSlide ? 'bg-white' : 'bg-white/40'}"
							onclick={() => (currentSlide = i)}
						/>
					{/each}
				</div>
			</div>
		</section>

		<section class="px-4 py-2">
			<div class="grid grid-cols-4 gap-3">
				{#each quickActions as action}
					<button
						class="flex flex-col items-center p-3 rounded-xl bg-white shadow-sm border border-gray-100 active:bg-gray-50"
						onclick={action.action}
					>
						<div class="w-12 h-12 rounded-xl {action.color} flex items-center justify-center text-2xl mb-2">
							{action.icon}
						</div>
						<span class="text-xs font-medium text-gray-700">{action.label}</span>
					</button>
				{/each}
			</div>
		</section>

		{#if pendingChangeOrders.length > 0}
			<section class="px-4 py-4">
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-base font-semibold text-gray-900">待审批变更单</h2>
					<a href="/mobile/change-orders?status=pending" class="text-sm text-primary-600">查看全部 →</a>
				</div>
				{#each pendingChangeOrders as order}
					<MobileCard
						title={order.title}
						subtitle={order.code}
						description={order.description}
						status={order.status}
						icon="change"
						rightContent={formatDate(order.createdAt)}
						onClick={() => goto(`/mobile/change-orders/${order.id}`)}
					/>
				{/each}
			</section>
		{/if}

		{#if pendingAcceptance.length > 0}
			<section class="px-4 py-4">
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-base font-semibold text-gray-900">待验收</h2>
					<a href="/mobile/acceptance?status=pending" class="text-sm text-primary-600">查看全部 →</a>
				</div>
				{#each pendingAcceptance as photo}
					<MobileCard
						title={photo.title}
						subtitle={photo.code}
						description={photo.stage}
						status={photo.status}
						icon="acceptance"
						rightContent={formatDate(photo.createdAt)}
						onClick={() => goto(`/mobile/acceptance/${photo.id}`)}
					/>
				{/each}
			</section>
		{/if}

		{#if pendingAfterSales.length > 0}
			<section class="px-4 py-4">
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-base font-semibold text-gray-900">待处理售后</h2>
					<a href="/mobile/after-sales?status=pending" class="text-sm text-primary-600">查看全部 →</a>
				</div>
				{#each pendingAfterSales as order}
					<MobileCard
						title={order.title}
						subtitle={order.code}
						description={order.description}
						status={order.status}
						icon="aftersales"
						badge={order.priority === 'urgent' ? '紧急' : order.priority === 'high' ? '高' : undefined}
						badgeType={order.priority === 'urgent' ? 'error' : order.priority === 'high' ? 'warning' : 'default'}
						rightContent={formatDate(order.createdAt)}
						onClick={() => goto(`/mobile/after-sales/${order.id}`)}
					/>
				{/each}
			</section>
		{/if}

		{#if pendingChangeOrders.length === 0 && pendingAcceptance.length === 0 && pendingAfterSales.length === 0}
			<div class="flex flex-col items-center justify-center py-16 px-4">
				<div class="text-6xl mb-4">🎉</div>
				<p class="text-gray-500 text-center">暂无待处理事项</p>
				<p class="text-gray-400 text-sm text-center mt-1">所有事项都已处理完成</p>
			</div>
		{/if}
	{/if}
</div>
