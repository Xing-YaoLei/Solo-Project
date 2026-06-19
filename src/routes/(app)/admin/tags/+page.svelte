<script lang="ts">
	import { trpc } from '$lib/client/trpc';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let editingTag = $state<{ id: string; code: string; label: string; category: string } | null>(null);

	let newCode = $state('');
	let newLabel = $state('');
	let newCategory = $state('type');
	let submitting = $state(false);
	let editLabel = $state('');

	const categories = [
		{ value: 'type', label: '问题类型' },
		{ value: 'area', label: '区域' },
		{ value: 'priority', label: '优先级' }
	];

	const categoryLabels: Record<string, string> = {
		type: '问题类型',
		area: '区域',
		priority: '优先级'
	};

	async function handleCreate() {
		if (!newCode || !newLabel) return;
		submitting = true;
		try {
			await trpc.tag.create.mutate({
				code: newCode,
				label: newLabel,
				category: newCategory
			});
			showCreateModal = false;
			newCode = '';
			newLabel = '';
			newCategory = 'type';
			await invalidateAll();
		} catch (e: any) {
			alert(e?.message || '创建失败');
		} finally {
			submitting = false;
		}
	}

	function openEditModal(tag: any) {
		editingTag = tag;
		editLabel = tag.label;
		showEditModal = true;
	}

	async function handleEdit() {
		if (!editingTag || !editLabel) return;
		submitting = true;
		try {
			await trpc.tag.update.mutate({
				id: editingTag.id,
				label: editLabel
			});
			showEditModal = false;
			editingTag = null;
			await invalidateAll();
		} catch (e: any) {
			alert(e?.message || '更新失败');
		} finally {
			submitting = false;
		}
	}

	async function handleDelete(tagId: string) {
		if (!confirm('确认删除该标签？')) return;
		try {
			await trpc.tag.delete.mutate({ id: tagId });
			await invalidateAll();
		} catch (e: any) {
			alert(e?.message || '删除失败');
		}
	}

	const groupedTags = $derived(() => {
		const groups: Record<string, typeof data.tags> = {};
		for (const tag of data.tags) {
			const cat = tag.category;
			if (!groups[cat]) groups[cat] = [];
			groups[cat].push(tag);
		}
		return groups;
	});
</script>

<svelte:head>
	<title>标签管理 - 景区投诉协同台</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-slate-800">标签管理</h1>
		<button
			onclick={() => showCreateModal = true}
			class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
			</svg>
			添加标签
		</button>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		{#each categories as cat}
			<div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
				<div class="px-4 py-3 border-b border-slate-200 bg-slate-50">
					<h3 class="text-sm font-semibold text-slate-800">{cat.label}</h3>
					<p class="text-xs text-slate-400 mt-0.5">
						{(groupedTags()[cat.value] ?? []).length} 个标签
					</p>
				</div>
				<div class="p-3">
					{#if (groupedTags()[cat.value] ?? []).length === 0}
						<p class="text-sm text-slate-400 text-center py-4">暂无标签</p>
					{:else}
						<div class="space-y-2">
							{#each groupedTags()[cat.value] ?? [] as tag}
								<div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition">
									<div>
										<span class="text-sm text-slate-800 font-medium">{tag.label}</span>
										<span class="text-xs text-slate-400 ml-2 font-mono">{tag.code}</span>
									</div>
									<div class="flex items-center gap-1">
										<button
											onclick={() => openEditModal(tag)}
											class="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-white rounded transition"
											title="编辑"
										>
											<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
										</button>
										<button
											onclick={() => handleDelete(tag.id)}
											class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-white rounded transition"
											title="删除"
										>
											<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

{#if showCreateModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showCreateModal = false}>
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-slate-800 mb-4">添加标签</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">标签编码</label>
					<input
						type="text"
						bind:value={newCode}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						placeholder="例如：noise"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">标签名称</label>
					<input
						type="text"
						bind:value={newLabel}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						placeholder="例如：噪音扰民"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">分类</label>
					<select
						bind:value={newCategory}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					>
						{#each categories as cat}
							<option value={cat.value}>{cat.label}</option>
						{/each}
					</select>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button onclick={() => showCreateModal = false} class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition">
						取消
					</button>
					<button
						onclick={handleCreate}
						disabled={submitting || !newCode || !newLabel}
						class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
					>
						创建
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showEditModal && editingTag}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showEditModal = false}>
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-slate-800 mb-4">编辑标签</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">标签编码</label>
					<input
						type="text"
						value={editingTag.code}
						disabled
						class="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-400"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">标签名称</label>
					<input
						type="text"
						bind:value={editLabel}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">分类</label>
					<input
						type="text"
						value={categoryLabels[editingTag.category] ?? editingTag.category}
						disabled
						class="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-400"
					/>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button onclick={() => showEditModal = false} class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition">
						取消
					</button>
					<button
						onclick={handleEdit}
						disabled={submitting || !editLabel}
						class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
					>
						保存
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
