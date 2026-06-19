<script lang="ts">
	import { trpc } from '$lib/trpc';
	import { onMount } from 'svelte';
	import {
		formatDate,
		getPropertyTypeLabel,
		getPropertyStatusLabel,
		getPropertyStatusBadge
	} from '$lib/utils';

	type Property = {
		id: string;
		name: string;
		address: string;
		type: string;
		bedrooms: number;
		bathrooms: number;
		area: number | null;
		phone: string | null;
		ownerName: string | null;
		ownerPhone: string | null;
		description: string | null;
		images: string[] | null;
		status: string;
		createdAt: number | Date;
		updatedAt: number | Date;
	};

	let properties: Property[] = [];
	let loading = true;
	let search = '';
	let filterStatus = '';
	let filterType = '';
	let page = 1;
	let pageSize = 12;
	let total = 0;
	let totalPages = 0;

	let showModal = false;
	let isEditing = false;
	let editingId: string | null = null;

	let form = {
		name: '',
		address: '',
		type: 'apartment' as 'apartment' | 'house' | 'villa' | 'room',
		bedrooms: 1,
		bathrooms: 1,
		area: null as number | null,
		phone: '',
		ownerName: '',
		ownerPhone: '',
		description: '',
		status: 'active' as 'active' | 'maintenance' | 'inactive'
	};

	let submitting = false;
	let errorMsg = '';

	async function loadData() {
		loading = true;
		try {
			const res = await trpc().property.list.query({
				search: search || undefined,
				status: filterStatus || undefined,
				type: filterType || undefined,
				page,
				pageSize
			});
			properties = res.items as Property[];
			total = res.total;
			totalPages = res.totalPages;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();
	});

	function handleSearch() {
		page = 1;
		loadData();
	}

	function handleFilterChange() {
		page = 1;
		loadData();
	}

	function openCreateModal() {
		isEditing = false;
		editingId = null;
		form = {
			name: '',
			address: '',
			type: 'apartment',
			bedrooms: 1,
			bathrooms: 1,
			area: null,
			phone: '',
			ownerName: '',
			ownerPhone: '',
			description: '',
			status: 'active'
		};
		errorMsg = '';
		showModal = true;
	}

	function openEditModal(p: Property) {
		isEditing = true;
		editingId = p.id;
		form = {
			name: p.name,
			address: p.address,
			type: p.type as any,
			bedrooms: p.bedrooms,
			bathrooms: p.bathrooms,
			area: p.area,
			phone: p.phone || '',
			ownerName: p.ownerName || '',
			ownerPhone: p.ownerPhone || '',
			description: p.description || '',
			status: p.status as any
		};
		errorMsg = '';
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}

	async function handleSubmit() {
		if (!form.name.trim()) {
			errorMsg = '请输入房源名称';
			return;
		}
		if (!form.address.trim()) {
			errorMsg = '请输入房源地址';
			return;
		}
		submitting = true;
		errorMsg = '';
		try {
			const payload = {
				name: form.name.trim(),
				address: form.address.trim(),
				type: form.type,
				bedrooms: Number(form.bedrooms) || 1,
				bathrooms: Number(form.bathrooms) || 1,
				area: form.area ? Number(form.area) : undefined,
				phone: form.phone.trim() || undefined,
				ownerName: form.ownerName.trim() || undefined,
				ownerPhone: form.ownerPhone.trim() || undefined,
				description: form.description.trim() || undefined
			};
			if (isEditing && editingId) {
				await trpc().property.update.mutate({
					id: editingId,
					...payload,
					status: form.status
				});
			} else {
				await trpc().property.create.mutate(payload as any);
			}
			showModal = false;
			loadData();
		} catch (e: any) {
			errorMsg = e.message || '操作失败';
		} finally {
			submitting = false;
		}
	}

	async function handleDeactivate(id: string) {
		if (!confirm('确定要停用该房源吗？')) return;
		try {
			await trpc().property.remove.mutate({ id });
			loadData();
		} catch (e: any) {
			alert(e.message || '操作失败');
		}
	}

	function prevPage() {
		if (page > 1) {
			page--;
			loadData();
		}
	}

	function nextPage() {
		if (page < totalPages) {
			page++;
			loadData();
		}
	}

	function getTypeIcon(type: string): string {
		switch (type) {
			case 'apartment':
				return '🏢';
			case 'house':
				return '🏠';
			case 'villa':
				return '🏡';
			case 'room':
				return '🛏️';
			default:
				return '🏠';
		}
	}
</script>

<div class="p-8">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">房源管理</h1>
			<p class="text-gray-500 mt-1">管理所有民宿房源信息</p>
		</div>
		<button class="btn-primary" on:click={openCreateModal}>
			<span class="mr-2">+</span>新增房源
		</button>
	</div>

	<div class="card mb-6">
		<div class="card-body">
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div>
					<label class="label">搜索</label>
					<input
						type="text"
						class="input"
						placeholder="搜索房源名称或地址..."
						bind:value={search}
						on:keydown={(e) => e.key === 'Enter' && handleSearch()}
					/>
				</div>
				<div>
					<label class="label">状态</label>
					<select class="input" bind:value={filterStatus} on:change={handleFilterChange}>
						<option value="">全部状态</option>
						<option value="active">营业中</option>
						<option value="maintenance">维修中</option>
						<option value="inactive">已停用</option>
					</select>
				</div>
				<div>
					<label class="label">类型</label>
					<select class="input" bind:value={filterType} on:change={handleFilterChange}>
						<option value="">全部类型</option>
						<option value="apartment">公寓</option>
						<option value="house">住宅</option>
						<option value="villa">别墅</option>
						<option value="room">房间</option>
					</select>
				</div>
				<div class="flex items-end">
					<button class="btn-secondary w-full" on:click={handleSearch}>搜索</button>
				</div>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="text-gray-500">加载数据中...</div>
		</div>
	{:else}
		{#if properties.length === 0}
			<div class="card">
				<div class="card-body text-center py-16">
					<div class="text-5xl mb-4">🏠</div>
					<p class="text-gray-500 mb-4">暂无房源数据</p>
					<button class="btn-primary" on:click={openCreateModal}>添加第一个房源</button>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
				{#each properties as p}
					<div class="card overflow-hidden hover:shadow-md transition-shadow">
						<div class="h-40 bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center relative">
							{#if p.images && p.images.length > 0}
								<img src={p.images[0]} alt={p.name} class="w-full h-full object-cover" />
							{:else}
								<div class="text-6xl">{getTypeIcon(p.type)}</div>
							{/if}
							<span
								class="absolute top-3 right-3 badge badge-{getPropertyStatusBadge(p.status)}"
							>
								{getPropertyStatusLabel(p.status)}
							</span>
						</div>
						<div class="card-body">
							<div class="flex items-start justify-between mb-2">
								<h3 class="font-semibold text-gray-900 text-lg truncate pr-2">{p.name}</h3>
								<span class="badge badge-info whitespace-nowrap">{getPropertyTypeLabel(p.type)}</span>
							</div>
							<p class="text-sm text-gray-500 mb-3 truncate">📍 {p.address}</p>
							<div class="flex items-center gap-4 text-sm text-gray-600 mb-3">
								<span>🛏️ {p.bedrooms}卧</span>
								<span>🛁 {p.bathrooms}卫</span>
								{#if p.area}<span>📐 {p.area}㎡</span>{/if}
							</div>
							<div class="text-xs text-gray-500 mb-4 space-y-1">
								{#if p.ownerName}<p>👤 业主：{p.ownerName}{p.ownerPhone ? ` · ${p.ownerPhone}` : ''}</p>{/if}
								{#if p.phone}<p>📞 联系电话：{p.phone}</p>{/if}
								<p>🕐 创建于：{formatDate(p.createdAt)}</p>
							</div>
							<div class="flex gap-2 pt-3 border-t border-gray-100">
								<button class="btn-secondary flex-1 text-sm" on:click={() => openEditModal(p)}>
									编辑
								</button>
								<button
									class="btn-danger flex-1 text-sm"
									on:click={() => handleDeactivate(p.id)}
									disabled={p.status === 'inactive'}
								>
									停用
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>

			{#if totalPages > 1}
				<div class="card">
					<div class="card-body flex items-center justify-between">
						<p class="text-sm text-gray-500">
							共 {total} 条记录，第 {page} / {totalPages} 页
						</p>
						<div class="flex gap-2">
							<button class="btn-secondary text-sm" on:click={prevPage} disabled={page <= 1}>
								上一页
							</button>
							<button class="btn-secondary text-sm" on:click={nextPage} disabled={page >= totalPages}>
								下一页
							</button>
						</div>
					</div>
				</div>
			{/if}
		{/if}
	{/if}
</div>

{#if showModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
			<div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">
					{isEditing ? '编辑房源' : '新增房源'}
				</h2>
				<button
					class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
					on:click={closeModal}
				>
					×
				</button>
			</div>
			<div class="flex-1 overflow-y-auto p-6">
				{#if errorMsg}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
						{errorMsg}
					</div>
				{/if}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="md:col-span-2">
						<label class="label">房源名称 <span class="text-red-500">*</span></label>
						<input type="text" class="input" placeholder="例如：阳光公寓A座1201" bind:value={form.name} />
					</div>
					<div class="md:col-span-2">
						<label class="label">房源地址 <span class="text-red-500">*</span></label>
						<input type="text" class="input" placeholder="详细地址" bind:value={form.address} />
					</div>
					<div>
						<label class="label">房源类型</label>
						<select class="input" bind:value={form.type}>
							<option value="apartment">公寓</option>
							<option value="house">住宅</option>
							<option value="villa">别墅</option>
							<option value="room">房间</option>
						</select>
					</div>
					{#if isEditing}
						<div>
							<label class="label">状态</label>
							<select class="input" bind:value={form.status}>
								<option value="active">营业中</option>
								<option value="maintenance">维修中</option>
								<option value="inactive">已停用</option>
							</select>
						</div>
					{/if}
					<div>
						<label class="label">卧室数量</label>
						<input type="number" class="input" min="0" bind:value={form.bedrooms} />
					</div>
					<div>
						<label class="label">卫生间数量</label>
						<input type="number" class="input" min="0" bind:value={form.bathrooms} />
					</div>
					<div>
						<label class="label">面积（㎡）</label>
						<input
							type="number"
							class="input"
							min="0"
							bind:value={form.area}
							placeholder="可选"
						/>
					</div>
					<div>
						<label class="label">联系电话</label>
						<input type="text" class="input" placeholder="可选" bind:value={form.phone} />
					</div>
					<div>
						<label class="label">业主姓名</label>
						<input type="text" class="input" placeholder="可选" bind:value={form.ownerName} />
					</div>
					<div>
						<label class="label">业主电话</label>
						<input type="text" class="input" placeholder="可选" bind:value={form.ownerPhone} />
					</div>
					<div class="md:col-span-2">
						<label class="label">房源描述</label>
						<textarea
							class="input"
							rows="3"
							placeholder="可选，补充房源信息、周边配套等"
							bind:value={form.description}
						></textarea>
					</div>
				</div>
			</div>
			<div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
				<button class="btn-secondary" on:click={closeModal} disabled={submitting}>取消</button>
				<button class="btn-primary" on:click={handleSubmit} disabled={submitting}>
					{submitting ? '提交中...' : isEditing ? '保存修改' : '创建房源'}
				</button>
			</div>
		</div>
	</div>
{/if}

<script lang="ts" context="module">
	export const ssr = false;
</script>
