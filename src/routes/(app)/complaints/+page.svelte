<script lang="ts">
	import { goto } from '$app/navigation';
	import { STATUS_LABELS, STATUS_COLORS } from '$lib/utils/permissions';
	import type { PageData } from './$types';

	interface ComplaintItem {
		id: string;
		description: string;
		status: string;
		deadline: Date | string | null;
		createdAt: Date | string;
		tags?: { id: string; code: string; label: string; category: string }[];
		assigneeName?: string | null;
		visitorName?: string | null;
		visitorPhone?: string | null;
		assigneePhone?: string | null;
		isOverdue: boolean;
		[key: string]: any;
	}

	let { data }: { data: PageData & { complaints: { items: ComplaintItem[]; total: number; page: number; pageSize: number } } } = $props();

	const statusOptions = [
		{ value: '', label: '全部' },
		{ value: 'pending', label: '待处理' },
		{ value: 'assigned', label: '已分配' },
		{ value: 'in_progress', label: '处理中' },
		{ value: 'escalated', label: '已升级' },
		{ value: 'resolved', label: '已解决' },
		{ value: 'closed', label: '已关闭' },
		{ value: 'rejected', label: '已驳回' },
		{ value: 'resubmitted', label: '已重提' }
	];

	function updateFilter(key: string, value: string) {
		const params = new URLSearchParams();
		if (key === 'status' && value) params.set('status', value);
		else if (data.filters.status) params.set('status', data.filters.status);

		if (key === 'tagCode' && value) params.set('tagCode', value);
		else if (data.filters.tagCode && key !== 'tagCode') params.set('tagCode', data.filters.tagCode);

		if (key === 'assigneeId' && value) params.set('assigneeId', value);
		else if (data.filters.assigneeId && key !== 'assigneeId') params.set('assigneeId', data.filters.assigneeId);

		const currentPage = key === 'page' ? parseInt(value) : 1;
		if (currentPage > 1) params.set('page', String(currentPage));

		goto(`/complaints?${params.toString()}`);
	}

	function clearFilters() {
		goto('/complaints');
	}

	function truncate(str: string, len: number): string {
		if (!str) return '';
		if (str.length <= len) return str;
		return str.slice(0, len) + '…';
	}

	function formatDate(date: string | Date | null): string {
		if (!date) return '-';
		return new Date(date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
	}

	const totalPages = $derived(Math.ceil(data.complaints.total / data.complaints.pageSize));
	const hasFilters = $derived(!!(data.filters.status || data.filters.tagCode || data.filters.assigneeId));
</script>

<svelte:head>
	<title>投诉列表 - 景区投诉协同台</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-slate-800">投诉列表</h1>
		<a
			href="/complaints/new"
			class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
			</svg>
			创建投诉
		</a>
	</div>

	<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
		<div class="flex flex-wrap items-center gap-3">
			<select
				class="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
				value={data.filters.status ?? ''}
				onchange={(e) => updateFilter('status', (e.target as HTMLSelectElement).value)}
			>
				{#each statusOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>

			<select
				class="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
				value={data.filters.tagCode ?? ''}
				onchange={(e) => updateFilter('tagCode', (e.target as HTMLSelectElement).value)}
			>
				<option value="">全部标签</option>
				{#each data.tags as tag}
					<option value={tag.code}>{tag.label}</option>
				{/each}
			</select>

			<select
				class="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
				value={data.filters.assigneeId ?? ''}
				onchange={(e) => updateFilter('assigneeId', (e.target as HTMLSelectElement).value)}
			>
				<option value="">全部处理人</option>
				{#each data.staff as s}
					<option value={s.id}>{s.displayName}</option>
				{/each}
			</select>

			{#if hasFilters}
				<button
					onclick={clearFilters}
					class="text-sm text-slate-500 hover:text-slate-700 underline transition"
				>
					清除筛选
				</button>
			{/if}

			<span class="ml-auto text-sm text-slate-500">共 {data.complaints.total} 条</span>
		</div>
	</div>

	<div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
		{#if data.complaints.items.length === 0}
			<div class="text-center py-12 text-slate-400 text-sm">暂无投诉记录</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="bg-slate-50 border-b border-slate-200">
							<th class="text-left px-4 py-3 text-slate-600 font-semibold">编号</th>
							<th class="text-left px-4 py-3 text-slate-600 font-semibold">描述</th>
							<th class="text-left px-4 py-3 text-slate-600 font-semibold">状态</th>
							<th class="text-left px-4 py-3 text-slate-600 font-semibold">标签</th>
							<th class="text-left px-4 py-3 text-slate-600 font-semibold">处理人</th>
							<th class="text-left px-4 py-3 text-slate-600 font-semibold">截止时间</th>
							<th class="text-left px-4 py-3 text-slate-600 font-semibold">创建时间</th>
						</tr>
					</thead>
					<tbody>
						{#each data.complaints.items as item}
							<tr
								class="border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer"
								onclick={() => goto(`/complaints/${item.id}`)}
							>
								<td class="px-4 py-3 font-mono text-xs text-slate-500">{item.id.slice(0, 8)}</td>
								<td class="px-4 py-3 text-slate-700 max-w-xs">
									<a href="/complaints/{item.id}" class="hover:text-primary-600 transition">{truncate(item.description, 40)}</a>
								</td>
								<td class="px-4 py-3">
									<span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium {STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-700'}">
										{STATUS_LABELS[item.status] ?? item.status}
									</span>
								</td>
								<td class="px-4 py-3">
									<div class="flex flex-wrap gap-1">
										{#each (item.tags ?? []) as tag}
											<span class="inline-block px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600">{tag.label}</span>
										{/each}
									</div>
								</td>
								<td class="px-4 py-3 text-slate-600">{item.assigneeName ?? '-'}</td>
								<td class="px-4 py-3 text-slate-600">{formatDate(item.deadline)}</td>
								<td class="px-4 py-3 text-slate-500">{formatDate(item.createdAt)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if totalPages > 1}
				<div class="flex items-center justify-between px-4 py-3 border-t border-slate-200">
					<button
						onclick={() => updateFilter('page', String(data.complaints.page - 1))}
						disabled={data.complaints.page <= 1}
						class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
					>
						上一页
					</button>
					<div class="flex items-center gap-1">
						{#each Array.from({ length: totalPages }, (_, i) => i + 1) as p}
							{#if p === data.complaints.page}
								<span class="px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white font-medium">{p}</span>
							{:else}
								<button
									onclick={() => updateFilter('page', String(p))}
									class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
								>
									{p}
								</button>
							{/if}
						{/each}
					</div>
					<button
						onclick={() => updateFilter('page', String(data.complaints.page + 1))}
						disabled={data.complaints.page >= totalPages}
						class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
					>
						下一页
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
