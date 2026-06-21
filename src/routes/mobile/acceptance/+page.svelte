<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import type { AcceptancePhoto } from '$lib/server/db/schema';

	let photos = $state<AcceptancePhoto[]>([]);
	let isLoading = $state(true);
	let isRefreshing = $state(false);
	let selectedImage = $state<string | null>(null);

	async function loadData() {
		isLoading = true;
		try {
			const result = await trpc.acceptancePhotos.list.query({ page: 1, pageSize: 50 });
			photos = result.data;
		} catch (e) {
			console.error('Failed to load acceptance photos:', e);
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

	async function handleQuickAccept(photo: AcceptancePhoto) {
		if (!confirm('确定要快速验收通过吗？')) return;
		try {
			await trpc.acceptancePhotos.verify.mutate({
				id: photo.id,
				accepted: true,
				comments: '移动端快速验收通过'
			});
			await loadData();
		} catch (e: any) {
			alert(e.message || '验收失败');
		}
	}

	function formatDate(date: Date | null | undefined): string {
		if (!date) return '';
		const d = new Date(date);
		return `${d.getMonth() + 1}/${d.getDate()}`;
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
		pending: '待验收',
		processing: '验收中',
		approved: '已通过',
		rejected: '已驳回',
		completed: '已完成',
		cancelled: '已取消'
	};

	function getPhotoUrls(photo: AcceptancePhoto): string[] {
		const urls = photo.photoUrls as string[] | undefined;
		return urls || [];
	}
</script>

<div>
	<div class="px-4 py-4">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-gray-900">验收照片</h2>
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

		<button
			class="w-full py-3 mb-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-xl shadow-md active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
			onclick={() => goto('/mobile/acceptance/create')}
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			上传验收照片
		</button>

		{#if isLoading}
			<div class="flex items-center justify-center py-20">
				<div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
			</div>
		{:else if photos.length === 0}
			<div class="flex flex-col items-center justify-center py-16">
				<div class="text-5xl mb-4">📷</div>
				<p class="text-gray-500">暂无验收照片</p>
				<p class="text-gray-400 text-sm mt-1">点击上方按钮上传照片</p>
			</div>
		{:else}
			{#each photos as photo}
				<div
					class="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
					onclick={() => goto(`/mobile/acceptance/${photo.id}`)}
					role="button"
					tabindex={0}
				>
					<div class="flex items-start justify-between mb-3">
						<div>
							<p class="font-medium text-gray-900">{photo.title}</p>
							<p class="text-sm text-gray-500 mt-0.5">{photo.code}</p>
						</div>
						<div class="flex items-center gap-2">
							<span class="px-2 py-0.5 rounded-full text-xs font-medium {statusColors[photo.status]}">
								{statusMap[photo.status]}
							</span>
							<span class="text-xs text-gray-400">{formatDate(photo.createdAt)}</span>
						</div>
					</div>

					{#if photo.stage}
						<p class="text-sm text-gray-600 mb-3">阶段：{photo.stage}</p>
					{/if}

					{#if getPhotoUrls(photo).length > 0}
						<div class="grid grid-cols-3 gap-2 mb-3">
							{#each getPhotoUrls(photo).slice(0, 3) as url, i}
								<div
									class="aspect-square rounded-lg overflow-hidden bg-gray-100 relative"
									onclick={(e) => {
										e.stopPropagation();
										selectedImage = url;
									}}
									role="button"
								>
									<img src={url} alt="验收照片" class="w-full h-full object-cover" />
									{#if i === 2 && getPhotoUrls(photo).length > 3}
										<div class="absolute inset-0 bg-black/50 flex items-center justify-center">
											<span class="text-white font-bold">+{getPhotoUrls(photo).length - 3}</span>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}

					{#if photo.status === 'pending'}
						<button
							class="w-full py-2.5 bg-green-500 text-white font-medium rounded-lg text-sm active:bg-green-600"
							onclick={(e) => {
								e.stopPropagation();
								handleQuickAccept(photo);
							}}
						>
							✅ 快速验收
						</button>
					{/if}
				</div>
			{/each}
		{/if}
	</div>

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
</div>
