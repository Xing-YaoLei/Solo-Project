<script lang="ts">
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import { formatDateTime } from '$lib/utils';

	let page = 1, pageSize = 50;
	let total = 0, totalPages = 0;
	let items: any[] = [];
	let events: any[] = [];
	let loading = false;

	let filterEventId = '';
	let filterEntityType = '';
	let filterTransitionType = '';
	let startDate = '';
	let endDate = '';

	let entityId = '';
	let entityType = '';
	let timeline: any = null;
	let timelineLoading = false;

	async function loadEvents() {
		try {
			const res = await trpc.event.list.query({ pageSize: 200 });
			events = res.items;
		} catch {}
	}

	async function load() {
		loading = true;
		try {
			const res = await trpc.transition.list.query({
				page, pageSize,
				eventId: filterEventId || undefined,
				entityType: filterEntityType || undefined,
				transitionType: filterTransitionType || undefined,
				dateRange: (startDate || endDate) ? { startDate: startDate || undefined, endDate: endDate || undefined } : undefined
			});
			items = res.items;
			total = res.total;
			totalPages = res.totalPages;
		} finally {
			loading = false;
		}
	}

	async function loadTimeline() {
		if (!entityId || !entityType) return;
		timelineLoading = true;
		try {
			timeline = await trpc.transition.getEntityTimeline.query({
				entityType, entityId
			});
		} finally {
			timelineLoading = false;
		}
	}

	onMount(async () => {
		await loadEvents();
		await load();
	});

	$effect(() => {
		load();
	});
</script>

<div class="p-6 space-y-6">
	<div>
		<h1>状态流转追溯</h1>
		<p class="text-sm text-slate-500 mt-1">全程审计订单、核销、赞助、异常单、座位等每一次状态变化</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
		<div class="lg:col-span-3 card">
			<div class="card-header">
				<div class="flex flex-wrap gap-2 items-center">
					<select class="select-input w-40" bind:value={filterEventId}>
						<option value="">全部活动</option>
						{#each events as e}<option value={e.event?.id ?? e.id}>{e.event?.name ?? e.name}</option>{/each}
					</select>
					<select class="select-input w-40" bind:value={filterEntityType}>
						<option value="">全部实体</option>
						<option value="order">订单</option>
						<option value="verification">核销码</option>
						<option value="ticket_type">票种</option>
						<option value="seat">座位</option>
						<option value="dispute">异常单</option>
					</select>
					<input class="input w-40" placeholder="变更类型搜索" bind:value={filterTransitionType} />
					<input class="input w-32" type="date" bind:value={startDate} />
					<input class="input w-32" type="date" bind:value={endDate} />
				</div>
			</div>
			<div class="table-wrap">
				<table class="data-table">
					<thead><tr>
						<th>时间</th>
						<th>类型</th>
						<th>变更</th>
						<th>状态流转</th>
						<th>操作人</th>
						<th>渠道/来源</th>
						<th>说明</th>
					</tr></thead>
					<tbody>
						{#if loading}
							<tr><td colspan="7" class="py-12 text-center text-slate-400">加载中...</td></tr>
						{:else if items.length === 0}
							<tr><td colspan="7" class="empty-state">暂无记录，调整筛选条件或继续执行操作</td></tr>
						{:else}
							{#each items as it}
								<tr class="hover:bg-slate-50 cursor-pointer"
									on:click={() => { entityType = it.transition.entityType; entityId = it.transition.entityId; loadTimeline(); }}
								>
									<td class="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(it.transition.createdAt)}</td>
									<td><span class="tag">{it.transition.entityType}</span></td>
									<td class="text-xs font-medium">{it.transition.transitionType}</td>
									<td class="text-xs">
										<span class="badge-gray">{it.transition.fromStatus ?? '—'}</span>
										<span class="mx-1 text-slate-400">→</span>
										<span class="badge-blue">{it.transition.toStatus}</span>
									</td>
									<td class="text-xs text-slate-600">{it.operatorName ?? '系统'}</td>
									<td class="text-xs">{it.transition.channel ?? it.transition.triggerSource ?? '-'}</td>
									<td class="text-xs text-slate-600 max-w-[200px] truncate" title={it.transition.remark ?? ''}>{it.transition.remark ?? '-'}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
			<div class="pagination">
				<div class="text-sm text-slate-500">共 {total} 条 · 第 {page}/{totalPages || 1} 页</div>
				<div class="flex gap-2">
					<button class="btn-secondary !py-1" disabled={page <= 1} on:click={() => page--}>上一页</button>
					<button class="btn-secondary !py-1" disabled={page >= totalPages} on:click={() => page++}>下一页</button>
				</div>
			</div>
		</div>

		<div class="lg:col-span-2 space-y-6">
			<div class="card">
				<div class="card-header"><h3>🔍 单实体完整回看</h3></div>
				<div class="card-body space-y-4">
					<div>
						<label class="label !mb-1 text-xs">实体类型</label>
						<select class="select-input" bind:value={entityType}>
							<option value="">选择...</option>
							<option value="order">订单 (order)</option>
							<option value="verification">核销码 (verification)</option>
							<option value="dispute">异常单 (dispute)</option>
							<option value="ticket_type">票种 (ticket_type)</option>
							<option value="seat">座位 (seat)</option>
						</select>
					</div>
					<div>
						<label class="label !mb-1 text-xs">实体 ID</label>
						<input class="input font-mono text-xs" placeholder="uuid 或 点击左侧记录" bind:value={entityId} />
					</div>
					<button class="btn-primary w-full" disabled={!entityType || !entityId} on:click={loadTimeline}>查看完整流转</button>
				</div>
			</div>

			<div class="card sticky top-6">
				<div class="card-header"><h3>时间线</h3></div>
				<div class="card-body max-h-[60vh] overflow-y-auto">
					{#if timelineLoading}
						<div class="py-12 text-center text-slate-400">加载中...</div>
					{:else if !timeline}
						<div class="empty-state text-sm">输入或点击选择实体以查看完整状态流转</div>
					{:else if timeline.transitions?.length === 0}
						<div class="empty-state text-sm">该实体暂无状态变更记录</div>
					{:else}
						{#if timeline.entityInfo}
							<div class="rounded-lg bg-brand-50 border border-brand-200 p-3 mb-4 text-xs space-y-1">
								<div><span class="text-slate-500">类型：</span><span class="font-medium">{entityType}</span></div>
								<div><span class="text-slate-500">ID：</span><span class="font-mono">{timeline.entityInfo.id}</span></div>
								{#if timeline.entityInfo.orderNo}<div><span class="text-slate-500">订单号：</span><span class="font-mono">{timeline.entityInfo.orderNo}</span></div>{/if}
								{#if timeline.entityInfo.caseNo}<div><span class="text-slate-500">案件号：</span><span class="font-mono">{timeline.entityInfo.caseNo}</span></div>{/if}
								{#if timeline.entityInfo.serialNumber}<div><span class="text-slate-500">核销号：</span><span class="font-mono">{timeline.entityInfo.serialNumber}</span></div>{/if}
								{#if timeline.entityInfo.current_status || timeline.entityInfo.status}
								<div><span class="text-slate-500">当前状态：</span><span class="badge-blue">{timeline.entityInfo.status ?? timeline.entityInfo.current_status}</span></div>
								{/if}
							</div>
						{/if}
						<div class="space-y-0">
							{#each timeline.transitions as t}
								<div class="timeline-item">
									<div class="timeline-dot" />
									<div class="space-y-0.5">
										<div class="flex items-center justify-between">
											<span class="font-semibold text-sm">{t.transition.transitionType}</span>
										</div>
										<div class="text-xs text-slate-500">{formatDateTime(t.transition.createdAt)} · {t.operatorName ?? t.operatorUsername ?? '系统'}</div>
										<div class="text-xs">
											<span class="badge-gray">{t.transition.fromStatus ?? '初始'}</span>
											<span class="mx-1 text-slate-400">→</span>
											<span class="badge-green">{t.transition.toStatus}</span>
										</div>
										{#if t.transition.remark}
											<div class="text-xs text-slate-600 mt-1 bg-slate-50 rounded p-2">{t.transition.remark}</div>
										{/if}
										{#if t.transition.metadata && Object.keys(t.transition.metadata).length > 0}
											<div class="text-[10px] text-slate-500 font-mono bg-slate-50 rounded p-2 mt-1 whitespace-pre-wrap">
												{JSON.stringify(t.transition.metadata, null, 1)}
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
