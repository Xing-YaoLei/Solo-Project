<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/client/trpc';
	import { STATUS_LABELS, STATUS_COLORS } from '$lib/utils/permissions';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	let checking = $state(false);

	function formatDate(date: string | Date | null): string {
		if (!date) return '-';
		return new Date(date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
	}

	function getOverdueHours(deadline: string | Date | null): number {
		if (!deadline) return 0;
		const now = new Date();
		const dl = new Date(deadline);
		return Math.max(0, (now.getTime() - dl.getTime()) / (1000 * 60 * 60));
	}

	async function handleCheckOverdue() {
		checking = true;
		try {
			await trpc.complaint.checkOverdue.mutate();
			await invalidateAll();
		} finally {
			checking = false;
		}
	}

	async function handleQuickReassign(complaintId: string, toAssigneeId: string) {
		if (!confirm('确认重新分派该超时投诉？')) return;
		try {
			await trpc.complaint.reassign.mutate({
				complaintId,
				toAssigneeId,
				reason: '超时未处理，重新分派'
			});
			await invalidateAll();
		} catch (e) {
			alert('操作失败');
		}
	}

	const totalPages = $derived(Math.ceil(data.overdueComplaints.total / data.overdueComplaints.pageSize));
</script>

<svelte:head>
	<title>超时待办 - 景区投诉协同台</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<h1 class="text-2xl font-bold text-slate-800">超时待办池</h1>
			<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
				<span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
				{data.overdueComplaints.total} 件待处理
			</span>
		</div>
		<button
			onclick={handleCheckOverdue}
			disabled={checking}
			class="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
			{checking ? '检查中...' : '刷新超时状态'}
		</button>
	</div>

	<div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
		<div class="flex items-start gap-3">
			<div class="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
			</div>
			<div>
				<h3 class="text-sm font-semibold text-amber-800">超时处理说明</h3>
				<p class="text-sm text-amber-700 mt-1">
					超过处理时限的投诉会自动进入待办池。请及时处理，可重新分派给相关人员或升级处理。
				</p>
			</div>
		</div>
	</div>

	<div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
		{#if data.overdueComplaints.items.length === 0}
			<div class="text-center py-16">
				<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<p class="text-slate-500">暂无超时投诉，继续保持！</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="bg-slate-50 border-b border-slate-200">
							<th class="text-left px-4 py-3 text-slate-600 font-semibold">编号</th>
							<th class="text-left px-4 py-3 text-slate-600 font-semibold">描述</th>
							<th class="text-left px-4 py-3 text-slate-600 font-semibold">状态</th>
							<th class="text-left px-4 py-3 text-slate-600 font-semibold">当前处理人</th>
							<th class="text-left px-4 py-3 text-slate-600 font-semibold">截止时间</th>
							<th class="text-left px-4 py-3 text-slate-600 font-semibold">超时时长</th>
							<th class="text-right px-4 py-3 text-slate-600 font-semibold">操作</th>
						</tr>
					</thead>
					<tbody>
						{#each data.overdueComplaints.items as item}
							<tr class="border-b border-slate-100 hover:bg-red-50/50 transition">
								<td class="px-4 py-3 font-mono text-xs text-slate-500">{item.id.slice(0, 8)}</td>
								<td class="px-4 py-3 text-slate-700 max-w-xs">
									<a href="/complaints/{item.id}" class="hover:text-primary-600 transition">
										{item.description.length > 30 ? item.description.slice(0, 30) + '…' : item.description}
									</a>
								</td>
								<td class="px-4 py-3">
									<span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium {STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-700'}">
										{STATUS_LABELS[item.status] ?? item.status}
									</span>
								</td>
								<td class="px-4 py-3">
									<div class="flex items-center gap-2">
										<div class="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
											<span class="text-xs text-slate-600">{item.assigneeName?.[0] ?? '-'}</span>
										</div>
										<span class="text-slate-600">{item.assigneeName ?? '未分配'}</span>
									</div>
								</td>
								<td class="px-4 py-3 text-red-600 font-medium">{formatDate(item.deadline)}</td>
								<td class="px-4 py-3">
									<span class="text-red-600 font-medium">
										{getOverdueHours(item.deadline).toFixed(1)} 小时
									</span>
								</td>
								<td class="px-4 py-3 text-right">
									<div class="flex items-center justify-end gap-2">
										<a
											href="/complaints/{item.id}"
											class="px-2 py-1 text-xs text-primary-600 hover:text-primary-700 transition"
										>
											查看
										</a>
										<select
											onchange={(e) => {
												const val = (e.target as HTMLSelectElement).value;
												if (val) handleQuickReassign(item.id, val);
											}}
											class="text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
										>
											<option value="">快速重派</option>
											{#each data.staff as s}
												<option value={s.id}>{s.displayName}</option>
											{/each}
										</select>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if totalPages > 1}
				<div class="flex items-center justify-between px-4 py-3 border-t border-slate-200">
					<span class="text-sm text-slate-500">共 {data.overdueComplaints.total} 条</span>
					<div class="flex items-center gap-1">
						<button
							onclick={() => goto(`/complaints/overdue?page=${data.filters.page - 1}`)}
							disabled={data.filters.page <= 1}
							class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
						>
							上一页
						</button>
						{#each Array.from({ length: totalPages }, (_, i) => i + 1) as p}
							{#if p === data.filters.page}
								<span class="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white font-medium">{p}</span>
							{:else}
								<button
									onclick={() => goto(`/complaints/overdue?page=${p}`)}
									class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
								>
									{p}
								</button>
							{/if}
						{/each}
						<button
							onclick={() => goto(`/complaints/overdue?page=${data.filters.page + 1}`)}
							disabled={data.filters.page >= totalPages}
							class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
						>
							下一页
						</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
