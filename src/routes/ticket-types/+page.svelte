<script lang="ts">
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import { formatDateTime, formatMoney, statusBadge } from '$lib/utils';

	let page = 1, pageSize = 20;
	let total = 0, totalPages = 0;
	let items: any[] = [];
	let events: any[] = [];
	let loading = false;

	let filterEventId = '';
	let filterCategory = '';
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
			const res = await trpc.ticketType.list.query({
				page, pageSize,
				eventId: filterEventId || undefined,
				category: filterCategory || undefined,
				status: filterStatus || undefined,
				keyword: keyword || undefined
			});
			items = res.items;
			total = res.total;
			totalPages = res.totalPages;
		} finally {
			loading = false;
		}
	}

	async function submit() {
		try {
			await trpc.ticketType.create.mutate({
				eventId: form.eventId,
				code: form.code,
				name: form.name,
				description: form.description,
				category: form.category,
				price: form.price || '0',
				costPrice: form.costPrice || '0',
				totalQuota: Number(form.totalQuota) || 0,
				refundPolicy: form.refundPolicy || 'non_refundable',
				transferAllowed: !!form.transferAllowed,
				requiresSeat: !!form.requiresSeat
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
			<h1>票种规则</h1>
			<p class="text-sm text-slate-500 mt-1">定义票类分级、价格、库存、退票政策、转赠和核验规则</p>
		</div>
		<button class="btn-primary" on:click={() => (showCreateModal = true)}>➕ 新增票种</button>
	</div>

	<div class="card">
		<div class="card-header">
			<div class="flex flex-wrap gap-3 items-center">
				<select class="select-input w-48" bind:value={filterEventId}>
					<option value="">全部活动</option>
					{#each events as e}<option value={e.event?.id ?? e.id}>{e.event?.name ?? e.name}</option>{/each}
				</select>
				<select class="select-input w-32" bind:value={filterCategory}>
					<option value="">全部类别</option>
					<option value="vip">VIP</option>
					<option value="premium">高级</option>
					<option value="standard">标准</option>
					<option value="economy">经济</option>
					<option value="standing">站票</option>
				</select>
				<select class="select-input w-32" bind:value={filterStatus}>
					<option value="">全部状态</option>
					<option value="active">启用</option>
					<option value="inactive">停用</option>
					<option value="sold_out">售罄</option>
				</select>
				<input class="input w-48" placeholder="搜索票种名/编码" bind:value={keyword} />
			</div>
		</div>
		<div class="table-wrap">
			<table class="data-table">
				<thead>
					<tr>
						<th>票种编码</th>
						<th>名称</th>
						<th>类别</th>
						<th class="text-right">售价</th>
						<th class="text-center">配额</th>
						<th class="text-center">已售</th>
						<th class="text-center">预占</th>
						<th>退票</th>
						<th>状态</th>
						<th>更新时间</th>
						<th class="text-right">操作</th>
					</tr>
				</thead>
				<tbody>
					{#if loading}
						<tr><td colspan="11" class="py-12 text-center text-slate-400">加载中...</td></tr>
					{:else if items.length === 0}
						<tr><td colspan="11" class="empty-state">暂无数据，点击右上角新增票种</td></tr>
					{:else}
						{#each items as t}
							{@const available = Math.max(0, (t.totalQuota ?? 0) - (t.soldQuota ?? 0) - (t.heldQuota ?? 0))}
							<tr class="hover:bg-slate-50">
								<td class="font-mono text-xs">{t.code}</td>
								<td class="font-medium">{t.name}</td>
								<td><span class="badge-{t.category === 'vip' ? 'yellow' : t.category === 'premium' ? 'purple' : 'blue'}">{t.category}</span></td>
								<td class="text-right font-mono font-semibold">¥{formatMoney(t.price)}</td>
								<td class="text-center font-semibold">{t.totalQuota}</td>
								<td class="text-center text-blue-600">{t.soldQuota ?? 0}</td>
								<td class="text-center text-yellow-600">{t.heldQuota ?? 0}</td>
								<td><span class="tag text-xs">{t.refundPolicy}</span></td>
								<td>{@const b = statusBadge(t.status)}<span class={b.cls}>{b.label}</span></td>
								<td class="text-xs text-slate-500">{formatDateTime(t.updatedAt)}</td>
								<td class="text-right"><button class="btn-ghost !py-1 !px-2 text-xs">编辑</button></td>
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
		<div class="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
			<div class="card-header"><h3>新增票种</h3><button class="btn-ghost !p-1" on:click={() => (showCreateModal = false)}>✕</button></div>
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
						<label class="label">类别 *</label>
						<select class="select-input" bind:value={form.category} required>
							<option value="">请选择</option>
							<option value="vip">VIP</option>
							<option value="premium">高级</option>
							<option value="standard">标准</option>
							<option value="economy">经济</option>
							<option value="standing">站票</option>
							<option value="other">其他</option>
						</select>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="label">票种编码 *</label>
						<input class="input font-mono" bind:value={form.code} required placeholder="如 STANDARD-001" />
					</div>
					<div>
						<label class="label">票种名称 *</label>
						<input class="input" bind:value={form.name} required placeholder="内场 VIP 票" />
					</div>
				</div>
				<div class="grid grid-cols-3 gap-4">
					<div>
						<label class="label">售价(¥) *</label>
						<input class="input" bind:value={form.price} required placeholder="99.00" />
					</div>
					<div>
						<label class="label">成本价(¥)</label>
						<input class="input" bind:value={form.costPrice} placeholder="0.00" />
					</div>
					<div>
						<label class="label">总配额 *</label>
						<input class="input" type="number" bind:value={form.totalQuota} required placeholder="500" />
					</div>
				</div>
				<div>
					<label class="label">描述</label>
					<textarea class="input min-h-[60px]" bind:value={form.description} placeholder="权限、区域、服务说明..." />
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="label">退票政策</label>
						<select class="select-input" bind:value={form.refundPolicy}>
							<option value="non_refundable">不可退</option>
							<option value="partial_refund">部分退</option>
							<option value="full_refund_before_date">时限前全退</option>
						</select>
					</div>
				</div>
				<div class="flex gap-6 pt-2">
					<label class="flex items-center gap-2"><input type="checkbox" bind:checked={form.transferAllowed} class="w-4 h-4" /><span class="text-sm">允许转赠</span></label>
					<label class="flex items-center gap-2"><input type="checkbox" bind:checked={form.requiresSeat} class="w-4 h-4" checked /><span class="text-sm">需要选座</span></label>
				</div>
				<div class="flex justify-end gap-2 pt-2">
					<button class="btn-secondary" on:click={() => (showCreateModal = false)}>取消</button>
					<button class="btn-primary" disabled={!form.eventId || !form.code || !form.name} on:click={submit}>保存</button>
				</div>
			</div>
		</div>
	</div>
{/if}
