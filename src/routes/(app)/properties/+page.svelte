<script lang="ts">
	import { trpcClient } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import PropertyModal from '$lib/components/PropertyModal.svelte';

	let properties: any[] = [];
	let loading = true;
	let showModal = false;
	let editingProperty: any = null;
	let filterStatus: 'active' | 'inactive' | '' = '';

	async function loadData() {
		loading = true;
		try {
			properties = filterStatus
				? await trpcClient.property.list.query({ status: filterStatus as any })
				: await trpcClient.property.list.query();
		} finally {
			loading = false;
		}
	}

	function onCreate() {
		editingProperty = null;
		showModal = true;
	}

	function onEdit(p: any) {
		editingProperty = p;
		showModal = true;
	}

	async function onDelete(id: string) {
		if (!confirm('确认删除该房源？')) return;
		await trpcClient.property.delete.mutate(id);
		await loadData();
	}

	function onSaved() {
		showModal = false;
		editingProperty = null;
		loadData();
	}

	function onCancel() {
		showModal = false;
		editingProperty = null;
	}

	$: if (filterStatus !== undefined) loadData();

	const typeLabels: Record<string, string> = {
		apartment: '公寓', house: '独栋', villa: '别墅', loft: 'Loft', other: '其他'
	};
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<select bind:value={filterStatus} class="select w-40" on:change={loadData}>
				<option value="">全部状态</option>
				<option value="active">运营中</option>
				<option value="inactive">未运营</option>
			</select>
			<div class="text-sm text-gray-500">共 {properties.length} 套房源</div>
		</div>
		<button on:click={onCreate} class="btn-primary">
			<svg class="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
			新增房源
		</button>
	</div>

	{#if loading}
		<div class="card card-body py-12 text-center text-gray-500">加载中...</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each properties as p}
				<div class="card overflow-hidden hover:shadow-md transition-shadow">
					<div class="h-36 bg-gradient-to-br from-primary-400 to-primary-600 relative flex items-center justify-center">
						<svg class="h-16 w-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
						{#if p.status === 'active'}
							<span class="absolute top-3 right-3 badge bg-green-500/90 text-white">运营中</span>
						{:else}
							<span class="absolute top-3 right-3 badge bg-gray-500/90 text-white">未运营</span>
						{/if}
					</div>
					<div class="card-body">
						<div class="flex items-start justify-between gap-2">
							<h3 class="font-semibold text-gray-900 truncate">{p.name}</h3>
							<span class="badge bg-blue-100 text-blue-800 shrink-0">{typeLabels[p.type] ?? p.type}</span>
						</div>
						<div class="mt-2 text-sm text-gray-500 truncate">
							<svg class="h-4 w-4 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
							{p.city} · {p.address}
						</div>
						<div class="mt-3 grid grid-cols-3 gap-2 text-xs">
							<div class="rounded-lg bg-gray-50 px-3 py-2 text-center">
								<div class="text-gray-400">卧室</div>
								<div class="font-semibold text-gray-700 mt-0.5">{p.bedrooms}室</div>
							</div>
							<div class="rounded-lg bg-gray-50 px-3 py-2 text-center">
								<div class="text-gray-400">卫浴</div>
								<div class="font-semibold text-gray-700 mt-0.5">{p.bathrooms}卫</div>
							</div>
							<div class="rounded-lg bg-gray-50 px-3 py-2 text-center">
								<div class="text-gray-400">可住</div>
								<div class="font-semibold text-gray-700 mt-0.5">{p.maxGuests}人</div>
							</div>
						</div>
						<div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
							<div>
								<span class="text-xl font-bold text-primary-600">¥{p.basePrice}</span>
								<span class="text-xs text-gray-400 ml-1">/晚起</span>
							</div>
							<div class="flex gap-2">
								<a href="/calendar" class="btn-secondary text-xs py-1.5 px-3">日历</a>
								<button on:click={() => onEdit(p)} class="btn-secondary text-xs py-1.5 px-3">编辑</button>
								<button on:click={() => onDelete(p.id)} class="btn-danger text-xs py-1.5 px-3">删除</button>
							</div>
						</div>
					</div>
				</div>
			{/each}

			{#if properties.length === 0}
				<div class="col-span-full card card-body py-16 text-center">
					<div class="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
						<svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
					</div>
					<div class="text-gray-500 mb-4">暂无房源，先创建第一套吧</div>
					<button on:click={onCreate} class="btn-primary">立即创建</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if showModal}
	<PropertyModal property={editingProperty} on:saved={onSaved} on:cancel={onCancel} />
{/if}
