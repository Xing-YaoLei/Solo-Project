<script lang="ts">
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import { formatDateTime, formatMoney, statusBadge } from '$lib/utils';

	let page = 1, pageSize = 20;
	let total = 0, totalPages = 0;
	let items: any[] = [];
	let events: any[] = [];
	let stats: any = null;
	let loading = false;

	let filterEventId = '';
	let filterLevel = '';
	let filterStatus = '';
	let keyword = '';

	let showCreateModal = false;
	let form: any = {};

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
				trpc.sponsor.list.query({
					page, pageSize,
					eventId: filterEventId || undefined,
					level: filterLevel || undefined,
					status: filterStatus || undefined,
					keyword: keyword || undefined
				}),
				trpc.sponsor.statistics.query({ eventId: filterEventId || undefined })
			]);
			items = res.items;
			total = res.total;
			totalPages = res.totalPages;
			stats = st;
		} finally {
			loading = false;
		}
	}

	async function submit() {
		try {
			await trpc.sponsor.create.mutate({
				eventId: form.eventId,
				name: form.name,
				contactPerson: form.contactPerson,
				contactPhone: form.contactPhone,
				contactEmail: form.contactEmail,
				sponsorLevel: form.level,
				totalTickets: Number(form.totalTickets) || 0,
				totalAmount: form.totalAmount,
				contractNo: form.contractNo,
				notes: form.notes
			});
			showCreateModal = false;
			form = {};
			await load();
		} catch (e: any) {
			alert(e?.message ?? '创建失败');
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
			<h1>赞助清单</h1>
			<p class="text-sm text-slate-500 mt-1">记录赞助方、合同、票量交接与核销进度</p>
		</div>
		<button class="btn-primary" on:click={() => (showCreateModal = true)}>
			➕ 新增赞助
		</button>
	</div>

	{#if stats}
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<div class="stat-card">
				<div class="stat-label">赞助方数</div>
				<div class="stat-value">{stats.aggregated?.totalSponsors ?? 0}</div>
			</div>
			<div class="stat-card">
				<div class="stat-label">赞助总票数</div>
				<div class="stat-value">{stats.aggregated?.totalTickets ?? 0}</div>
			</div>
			<div class="stat-card">
				<div class="stat-label">合同总金额</div>
				<div class="stat-value">¥{formatMoney(stats.aggregated?.totalAmount)}</div>
			</div>
			<div class="stat-card">
				<div class="stat-label">等级分布</div>
				<div class="flex flex-wrap gap-1 mt-1">
					{#each stats.byLevel ?? [] as l}
						<span class="tag">{l.level} {l.count}</span>
					{/each}
				</div>
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
				<select class="select-input w-32" bind:value={filterLevel}>
					<option value="">全部等级</option>
					<option value="title">冠名</option>
					<option value="gold">金牌</option>
					<option value="silver">银牌</option>
					<option value="bronze">铜牌</option>
					<option value="other">其他</option>
				</select>
				<select class="select-input w-32" bind:value={filterStatus}>
					<option value="">全部状态</option>
					<option value="pending">待确认</option>
					<option value="confirmed">已确认</option>
					<option value="partial">部分完成</option>
					<option value="completed">全部完成</option>
				</select>
				<input class="input w-48" placeholder="搜索赞助方/联系人/合同" bind:value={keyword} />
			</div>
		</div>
		<div class="table-wrap">
			<table class="data-table">
				<thead>
					<tr>
						<th>赞助方</th>
						<th>等级</th>
						<th>联系人</th>
						<th>合同编号</th>
						<th class="text-right">票数</th>
						<th class="text-right">金额(¥)</th>
						<th>状态</th>
						<th>创建时间</th>
						<th class="text-right">操作</th>
					</tr>
				</thead>
				<tbody>
					{#if loading}
						<tr><td colspan="9" class="py-12 text-center text-slate-400">加载中...</td></tr>
					{:else if items.length === 0}
						<tr><td colspan="9" class="empty-state">暂无数据</td></tr>
					{:else}
						{#each items as s}
							<tr class="hover:bg-slate-50">
								<td class="font-medium text-slate-900">{s.name}</td>
								<td><span class="badge-purple">{s.sponsorLevel}</span></td>
								<td>{s.contactPerson ?? '-'}<div class="text-xs text-slate-500">{s.contactPhone ?? ''}</div></td>
								<td class="font-mono text-xs">{s.contractNo ?? '-'}</td>
								<td class="text-right font-semibold">{s.totalTickets}</td>
								<td class="text-right font-mono">{formatMoney(s.totalAmount)}</td>
								<td>{@const b = statusBadge(s.status)}<span class={b.cls}>{b.label}</span></td>
								<td class="text-xs text-slate-500">{formatDateTime(s.createdAt)}</td>
								<td class="text-right">
									<button class="btn-ghost !py-1 !px-2 text-xs">查看</button>
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

{#if showCreateModal}
	<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
		<div class="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="card-header">
				<h3>新增赞助</h3>
				<button class="btn-ghost !p-1" on:click={() => (showCreateModal = false)}>✕</button>
			</div>
			<div class="card-body space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="label">所属活动 *</label>
						<select class="select-input" bind:value={form.eventId} required>
							<option value="">请选择</option>
							{#each events as e}<option value={e.event?.id ?? e.id}>{e.event?.name ?? e.name}</option>{/each}
						</select>
					</div>
					<div>
						<label class="label">赞助等级 *</label>
						<select class="select-input" bind:value={form.level} required>
							<option value="">请选择</option>
							<option value="title">冠名</option>
							<option value="gold">金牌</option>
							<option value="silver">银牌</option>
							<option value="bronze">铜牌</option>
							<option value="other">其他</option>
						</select>
					</div>
				</div>
				<div>
					<label class="label">赞助方名称 *</label>
					<input class="input" bind:value={form.name} required placeholder="公司/机构名称" />
				</div>
				<div class="grid grid-cols-3 gap-4">
					<div>
						<label class="label">联系人</label>
						<input class="input" bind:value={form.contactPerson} placeholder="姓名" />
					</div>
					<div>
						<label class="label">电话</label>
						<input class="input" bind:value={form.contactPhone} placeholder="手机号" />
					</div>
					<div>
						<label class="label">邮箱</label>
						<input class="input" bind:value={form.contactEmail} placeholder="email" />
					</div>
				</div>
				<div class="grid grid-cols-3 gap-4">
					<div>
						<label class="label">赞助票数</label>
						<input class="input" type="number" bind:value={form.totalTickets} placeholder="0" />
					</div>
					<div>
						<label class="label">合同金额(¥)</label>
						<input class="input" bind:value={form.totalAmount} placeholder="0.00" />
					</div>
					<div>
						<label class="label">合同编号</label>
						<input class="input" bind:value={form.contractNo} placeholder="合同编号" />
					</div>
				</div>
				<div>
					<label class="label">备注</label>
					<textarea class="input min-h-[80px]" bind:value={form.notes} placeholder="补充说明..." />
				</div>
				<div class="flex justify-end gap-2 pt-2">
					<button class="btn-secondary" on:click={() => (showCreateModal = false)}>取消</button>
					<button class="btn-primary" disabled={!form.eventId || !form.level || !form.name} on:click={submit}>保存</button>
				</div>
			</div>
		</div>
	</div>
{/if}
