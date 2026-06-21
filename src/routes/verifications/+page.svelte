<script lang="ts">
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import { formatDateTime, statusBadge } from '$lib/utils';

	let page = 1, pageSize = 20;
	let total = 0, totalPages = 0;
	let items: any[] = [];
	let events: any[] = [];
	let stats: any = null;
	let loading = false;

	let filterEventId = '';
	let filterSource = '';
	let filterStatus = '';
	let filterChannel = '';
	let keyword = '';
	let startDate = '';
	let endDate = '';

	let showVerifyModal = false;
	let verifySerial = '';
	let verifyResult: any = null;
	let verifying = false;

	let showBatchModal = false;
	let batchSerials = '';
	let batchResult: any = null;
	let batchProcessing = false;

	async function loadEvents() {
		try {
			const res = await trpc.event.list.query({ pageSize: 200 });
			events = res.items;
		} catch {}
	}

	async function load() {
		loading = true;
		try {
			const [res, st] = await Promise.all([
				trpc.verification.list.query({
					page, pageSize,
					eventId: filterEventId || undefined,
					sourceType: filterSource || undefined,
					status: filterStatus || undefined,
					channel: filterChannel || undefined,
					serialNumber: keyword || undefined,
					dateRange: (startDate || endDate) ? { startDate: startDate || undefined, endDate: endDate || undefined } : undefined
				}),
				trpc.verification.statistics.query({
					eventId: filterEventId || undefined,
					dateRange: (startDate || endDate) ? { startDate, endDate } : undefined
				})
			]);
			items = res.items;
			total = res.total;
			totalPages = res.totalPages;
			stats = st;
		} finally {
			loading = false;
		}
	}

	async function doVerify() {
		verifying = true;
		verifyResult = null;
		try {
			verifyResult = await trpc.verification.verify.mutate({
				serialNumber: verifySerial.trim(),
				channel: 'manual'
			});
			verifySerial = '';
			await load();
		} catch (e: any) {
			verifyResult = { error: e?.message ?? '核销失败' };
		} finally {
			verifying = false;
		}
	}

	async function doBatchVerify() {
		batchProcessing = true;
		batchResult = null;
		try {
			const list = batchSerials.split(/[\s,，\n]+/).map(s => s.trim()).filter(Boolean);
			batchResult = await trpc.verification.batchVerify.mutate({
				serialNumbers: list,
				channel: 'manual'
			});
			await load();
		} catch (e: any) {
			batchResult = { error: e?.message ?? '批量处理失败' };
		} finally {
			batchProcessing = false;
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
	<div class="flex items-center justify-between">
		<div>
			<h1>核销记录</h1>
			<p class="text-sm text-slate-500 mt-1">统一追踪赞助票、线上票、线下票等各渠道核销状态与进度</p>
		</div>
		<div class="flex gap-2">
			<button class="btn-secondary" on:click={() => (showBatchModal = true)}>📋 批量核销</button>
			<button class="btn-primary" on:click={() => (showVerifyModal = true)}>🎟️ 快速核销</button>
		</div>
	</div>

	{#if stats?.overview}
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
			<div class="stat-card"><div class="stat-label">总发放</div><div class="stat-value text-slate-900">{stats.overview.total}</div></div>
			<div class="stat-card"><div class="stat-label">已核销</div><div class="stat-value text-green-600">{stats.overview.verified}</div></div>
			<div class="stat-card"><div class="stat-label">已发放</div><div class="stat-value text-blue-600">{stats.overview.issued}</div></div>
			<div class="stat-card"><div class="stat-label">待激活</div><div class="stat-value text-yellow-600">{stats.overview.pending}</div></div>
			<div class="stat-card"><div class="stat-label">已退款</div><div class="stat-value text-purple-600">{stats.overview.refunded}</div></div>
			<div class="stat-card"><div class="stat-label">已作废</div><div class="stat-value text-red-600">{stats.overview.cancelled}</div></div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div class="card card-body">
				<h3 class="mb-3">来源分布</h3>
				<div class="space-y-2">
					{#each stats.bySource ?? [] as s}
						<div class="flex items-center gap-3 text-sm">
							<span class="w-28 tag">{s.sourceType}</span>
							<div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
								<div class="h-full bg-gradient-to-r from-brand-500 to-purple-500" style="width: {s.total ? (s.verified ?? 0) / s.total * 100 : 0}%"/>
							</div>
							<span class="w-24 text-right text-slate-600">{s.verified ?? 0} / {s.total}</span>
						</div>
					{/each}
				</div>
			</div>
			<div class="card card-body">
				<h3 class="mb-3">按小时核销趋势</h3>
				{#if stats.byVerifyHour?.length > 0}
					<div class="flex items-end gap-1 h-32">
						{#each stats.byVerifyHour.slice(-24) as h}
							<div class="flex-1 flex flex-col items-center gap-1">
								<div class="w-full bg-gradient-to-t from-brand-500 to-green-400 rounded-t transition-all hover:opacity-75"
									style="height: {Math.max(8, (h.count ?? 0) / Math.max(1, ...stats.byVerifyHour.map((x: any) => x.count ?? 0)) * 100)}%"
									title={`${h.hour} - ${h.count} 张`}
								/>
								<div class="text-[10px] text-slate-500 rotate-45 origin-left">{h.hour?.slice(-5)}</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="empty-state text-sm">暂无核销趋势数据</div>
				{/if}
			</div>
		</div>
	{/if}

	<div class="card">
		<div class="card-header">
			<div class="flex flex-wrap gap-3 items-center">
				<select class="select-input w-48" bind:value={filterEventId}>
					<option value="">全部活动</option>
					{#each events as e}<option value={e.event?.id ?? e.id}>{e.event?.name ?? e.name}</option>{/each}
				</select>
				<select class="select-input w-32" bind:value={filterSource}>
					<option value="">全部来源</option>
					<option value="sponsor">赞助</option>
					<option value="online_order">线上订单</option>
					<option value="offline_order">线下</option>
					<option value="member">会员</option>
					<option value="comp">赠票</option>
				</select>
				<select class="select-input w-32" bind:value={filterStatus}>
					<option value="">全部状态</option>
					<option value="issued">已发放</option>
					<option value="pending">待激活</option>
					<option value="verified">已核销</option>
					<option value="refunded">已退款</option>
					<option value="cancelled">已作废</option>
				</select>
				<select class="select-input w-32" bind:value={filterChannel}>
					<option value="">全部渠道</option>
					<option value="gate">闸机</option>
					<option value="manual">人工</option>
					<option value="online">在线</option>
					<option value="self">自助</option>
				</select>
				<input class="input w-48" placeholder="核销序列号/姓名/手机号" bind:value={keyword} />
				<input class="input w-36" type="date" bind:value={startDate} />
				<input class="input w-36" type="date" bind:value={endDate} />
			</div>
		</div>
		<div class="table-wrap">
			<table class="data-table">
				<thead>
					<tr>
						<th>核销序列号</th>
						<th>来源</th>
						<th>持票人</th>
						<th>状态</th>
						<th>核销时间</th>
						<th>渠道/核验人</th>
						<th>发放时间</th>
						<th class="text-right">操作</th>
					</tr>
				</thead>
				<tbody>
					{#if loading}
						<tr><td colspan="8" class="py-12 text-center text-slate-400">加载中...</td></tr>
					{:else if items.length === 0}
						<tr><td colspan="8" class="empty-state">暂无数据</td></tr>
					{:else}
						{#each items as v}
							<tr class="hover:bg-slate-50">
								<td class="font-mono text-xs text-slate-700">{v.serialNumber}</td>
								<td><span class="tag">{v.sourceType}</span></td>
								<td>{v.holderName ?? '-'}<div class="text-xs text-slate-500">{v.holderPhone ?? ''}</div></td>
								<td>{@const b = statusBadge(v.status)}<span class={b.cls}>{b.label}</span></td>
								<td class="text-xs">{formatDateTime(v.verifyTime)}</td>
								<td class="text-xs">{v.verifyChannel ?? '-'} {v.checkinCount ? `·${v.checkinCount}次` : ''}</td>
								<td class="text-xs text-slate-500">{formatDateTime(v.createdAt)}</td>
								<td class="text-right">
									<button class="btn-ghost !py-1 !px-2 text-xs">详情</button>
								</td>
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
</div>

{#if showVerifyModal}
	<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
		<div class="card w-full max-w-md">
			<div class="card-header"><h3>🎟️ 快速核销</h3><button class="btn-ghost !p-1" on:click={() => { showVerifyModal = false; verifyResult = null; }}>✕</button></div>
			<div class="card-body space-y-4">
				<div>
					<label class="label">核销序列号</label>
					<input class="input text-lg font-mono" bind:value={verifySerial} placeholder="输入 SP-XXXX-XXXX 或 TK-XXXX-XXXX" on:keydown={(e) => e.key === 'Enter' && doVerify()} />
				</div>
				<button class="btn-primary w-full py-3" disabled={!verifySerial || verifying} on:click={doVerify}>
					{verifying ? '核验中...' : '确认核销'}
				</button>
				{#if verifyResult}
					<div class="rounded-lg p-4 {verifyResult.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}">
						{#if verifyResult.error}
							<div class="font-semibold text-red-700">❌ 核销失败</div>
							<div class="text-sm text-red-600 mt-1">{verifyResult.error}</div>
						{:else}
							<div class="font-semibold text-green-700">✅ 核销成功</div>
							<div class="text-xs text-green-600 mt-1 font-mono">{verifyResult.serialNumber}</div>
							<div class="text-xs text-green-600">{verifyResult.holderName ?? ''} {verifyResult.holderPhone ?? ''}</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if showBatchModal}
	<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
		<div class="card w-full max-w-lg">
			<div class="card-header"><h3>📋 批量核销</h3><button class="btn-ghost !p-1" on:click={() => { showBatchModal = false; batchResult = null; }}>✕</button></div>
			<div class="card-body space-y-4">
				<div>
					<label class="label">核销序列号（空格、逗号、换行分隔，最多100条）</label>
					<textarea class="input min-h-[140px] font-mono text-sm" bind:value={batchSerials} placeholder="SP-XXXX-0001,SP-XXXX-0002&#10;TK-XXXX-0003" />
				</div>
				<button class="btn-primary w-full" disabled={!batchSerials || batchProcessing} on:click={doBatchVerify}>
					{batchProcessing ? '处理中...' : `批量核销 ${batchSerials.split(/[\s,，\n]+/).filter(Boolean).length} 条`}
				</button>
				{#if batchResult}
					<div class="rounded-lg p-4 bg-slate-50 border border-slate-200 space-y-2">
						<div class="flex gap-4">
							<span class="badge-green">成功 {batchResult.successCount ?? 0}</span>
							<span class="badge-red">失败 {batchResult.failCount ?? 0}</span>
						</div>
						{#if batchResult.results?.length > 0}
							<div class="max-h-40 overflow-y-auto space-y-1 text-xs">
								{#each batchResult.results as r}
									<div class="flex items-center justify-between font-mono px-2 py-1 rounded {r.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}">
										<span>{r.serialNumber}</span>
										<span>{r.success ? '✓' : `✗ ${r.error}`}</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
