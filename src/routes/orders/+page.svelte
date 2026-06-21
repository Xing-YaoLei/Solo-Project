<script lang="ts">
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import { formatDateTime, formatMoney, statusBadge } from '$lib/utils';

	let page = 1, pageSize = 20;
	let total = 0, totalPages = 0;
	let items: any[] = [];
	let events: any[] = [];
	let ticketTypes: any[] = [];
	let stats: any = null;
	let loading = false;

	let filterEventId = '';
	let filterChannel = '';
	let filterStatus = '';
	let filterPayStatus = '';
	let keyword = '';
	let startDate = '';
	let endDate = '';

	let showCreateModal = false;
	let form: any = { items: [{ ticketTypeId: '', quantity: 1, unitPrice: '0' }] };

	async function loadEvents() {
		try {
			const ev = await trpc.event.list.query({ pageSize: 200 });
			events = ev.items;
		} catch {}
	}

	async function loadTicketTypes(eid?: string) {
		if (!eid) return;
		try {
			ticketTypes = await trpc.ticketType.summary.query({ eventId: eid });
		} catch {
			ticketTypes = [];
		}
	}

	async function load() {
		loading = true;
		try {
			const [res, st] = await Promise.all([
				trpc.order.list.query({
					page, pageSize,
					eventId: filterEventId || undefined,
					channel: filterChannel || undefined,
					status: filterStatus || undefined,
					paymentStatus: filterPayStatus || undefined,
					orderNo: keyword || undefined,
					dateRange: (startDate || endDate) ? { startDate: startDate || undefined, endDate: endDate || undefined } : undefined
				}),
				trpc.order.statistics.query({
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

	async function submit() {
		try {
			const res = await trpc.order.create.mutate({
				eventId: form.eventId,
				channel: form.channel || 'offline',
				buyerName: form.buyerName,
				buyerPhone: form.buyerPhone,
				buyerEmail: form.buyerEmail,
				paymentMethod: form.paymentMethod,
				paymentStatus: form.paymentStatus || 'unpaid',
				notes: form.notes,
				items: form.items.map((i: any) => ({
					ticketTypeId: i.ticketTypeId,
					quantity: Number(i.quantity) || 1,
					unitPrice: i.unitPrice || '0',
					holderName: i.holderName,
					holderPhone: i.holderPhone
				})).filter((i: any) => i.ticketTypeId)
			});
			alert('订单创建成功：' + res.order.orderNo);
			showCreateModal = false;
			form = { items: [{ ticketTypeId: '', quantity: 1, unitPrice: '0' }] };
			await load();
		} catch (e: any) {
			alert(e?.message ?? '创建失败');
		}
	}

	function addItem() {
		form.items.push({ ticketTypeId: ticketTypes[0]?.id ?? '', quantity: 1, unitPrice: ticketTypes[0]?.price ?? '0' });
	}
	function removeItem(idx: number) {
		form.items.splice(idx, 1);
	}

	onMount(async () => {
		await loadEvents();
		await load();
	});

	$effect(() => {
		load();
	});

	$effect(() => {
		if (form.eventId) loadTicketTypes(form.eventId);
	});
</script>

<div class="p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1>购票订单</h1>
			<p class="text-sm text-slate-500 mt-1">订单从创建、支付、出票、核销到退款的完整状态管理</p>
		</div>
		<button class="btn-primary" on:click={() => (showCreateModal = true)}>🧾 新建订单</button>
	</div>

	{#if stats?.overview}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div class="stat-card"><div class="stat-label">订单数</div><div class="stat-value">{stats.overview.orderCount}</div><div class="text-xs text-green-600 mt-1">支付 {stats.overview.paidOrderCount} 笔</div></div>
			<div class="stat-card"><div class="stat-label">总票数</div><div class="stat-value">{stats.overview.ticketCount ?? 0}</div></div>
			<div class="stat-card"><div class="stat-label">票面总额</div><div class="stat-value">¥{formatMoney(stats.overview.totalAmount)}</div></div>
			<div class="stat-card"><div class="stat-label">实收金额</div><div class="stat-value text-green-600">¥{formatMoney(stats.overview.paidAmount)}</div></div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="card card-body">
				<h3 class="mb-3">按订单状态</h3>
				<div class="space-y-2">
					{#each stats.byStatus ?? [] as s}
						<div class="flex items-center gap-3 text-sm">
							{@const b = statusBadge(s.status)}
							<span class="w-28 {b.cls}">{b.label}</span>
							<span class="font-mono font-semibold">{s.count}</span>
							<span class="text-slate-500 ml-auto">¥{formatMoney(s.amount)}</span>
						</div>
					{/each}
				</div>
			</div>
			<div class="card card-body">
				<h3 class="mb-3">按渠道</h3>
				<div class="space-y-2">
					{#each stats.byChannel ?? [] as c}
						<div class="flex items-center gap-3 text-sm">
							<span class="w-28 tag">{c.channel}</span>
							<span class="font-mono font-semibold">{c.count}</span>
							<span class="text-slate-500 ml-auto">¥{formatMoney(c.amount)}</span>
						</div>
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
				<select class="select-input w-32" bind:value={filterChannel}>
					<option value="">全部渠道</option>
					<option value="official_web">官网</option>
					<option value="official_mini">小程序</option>
					<option value="official_app">APP</option>
					<option value="third_party">第三方</option>
					<option value="offline">线下</option>
					<option value="sponsor">赞助</option>
				</select>
				<select class="select-input w-32" bind:value={filterStatus}>
					<option value="">全部状态</option>
					<option value="created">待支付</option>
					<option value="paid">已支付</option>
					<option value="issued">已出票</option>
					<option value="partial_refund">部分退款</option>
					<option value="refunded">全部退款</option>
					<option value="cancelled">已取消</option>
				</select>
				<select class="select-input w-32" bind:value={filterPayStatus}>
					<option value="">支付状态</option>
					<option value="unpaid">未支付</option>
					<option value="pending">待确认</option>
					<option value="paid">已支付</option>
					<option value="refunded">已退款</option>
				</select>
				<input class="input w-48" placeholder="订单号/姓名/手机" bind:value={keyword} />
				<input class="input w-36" type="date" bind:value={startDate} />
				<input class="input w-36" type="date" bind:value={endDate} />
			</div>
		</div>
		<div class="table-wrap">
			<table class="data-table">
				<thead>
					<tr>
						<th>订单号</th>
						<th>渠道</th>
						<th>购票人</th>
						<th class="text-center">票数</th>
						<th class="text-right">票面</th>
						<th class="text-right">实付</th>
						<th>订单状态</th>
						<th>支付状态</th>
						<th>创建时间</th>
						<th class="text-right">操作</th>
					</tr>
				</thead>
				<tbody>
					{#if loading}
						<tr><td colspan="10" class="py-12 text-center text-slate-400">加载中...</td></tr>
					{:else if items.length === 0}
						<tr><td colspan="10" class="empty-state">暂无订单</td></tr>
					{:else}
						{#each items as o}
							<tr class="hover:bg-slate-50">
								<td class="font-mono text-xs text-slate-700">{o.orderNo}</td>
								<td><span class="tag">{o.channel}</span></td>
								<td>{o.buyerName ?? '-'}<div class="text-xs text-slate-500">{o.buyerPhone ?? ''}</div></td>
								<td class="text-center font-semibold">{o.totalQuantity}</td>
								<td class="text-right font-mono">¥{formatMoney(o.totalAmount)}</td>
								<td class="text-right font-mono font-semibold text-green-600">¥{formatMoney(o.paidAmount)}</td>
								<td>{@const b = statusBadge(o.status)}<span class={b.cls}>{b.label}</span></td>
								<td><span class="badge-{o.paymentStatus === 'paid' ? 'green' : o.paymentStatus === 'unpaid' ? 'gray' : o.paymentStatus === 'refunded' ? 'purple' : 'yellow'}">{o.paymentStatus}</span></td>
								<td class="text-xs text-slate-500">{formatDateTime(o.createdAt)}</td>
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

{#if showCreateModal}
	<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
		<div class="card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
			<div class="card-header"><h3>新建订单</h3><button class="btn-ghost !p-1" on:click={() => (showCreateModal = false)}>✕</button></div>
			<div class="card-body space-y-5">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="label">活动 *</label>
						<select class="select-input" bind:value={form.eventId} required>
							<option value="">请选择</option>
							{#each events as e}<option value={e.event?.id ?? e.id}>{e.event?.name ?? e.name}</option>{/each}
						</select>
					</div>
					<div>
						<label class="label">渠道</label>
						<select class="select-input" bind:value={form.channel}>
							<option value="offline">线下</option>
							<option value="official_web">官网</option>
							<option value="official_mini">小程序</option>
							<option value="official_app">APP</option>
							<option value="third_party">第三方</option>
							<option value="sponsor">赞助</option>
						</select>
					</div>
				</div>
				<div class="grid grid-cols-3 gap-4">
					<div><label class="label">购票人姓名</label><input class="input" bind:value={form.buyerName} /></div>
					<div><label class="label">手机</label><input class="input" bind:value={form.buyerPhone} /></div>
					<div><label class="label">邮箱</label><input class="input" bind:value={form.buyerEmail} /></div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="label">支付方式</label>
						<select class="select-input" bind:value={form.paymentMethod}>
							<option value="">未支付</option>
							<option value="wechat">微信</option>
							<option value="alipay">支付宝</option>
							<option value="cash">现金</option>
							<option value="bank">银行转账</option>
						</select>
					</div>
					<div>
						<label class="label">支付状态</label>
						<select class="select-input" bind:value={form.paymentStatus}>
							<option value="unpaid">未支付</option>
							<option value="paid">已支付</option>
						</select>
					</div>
				</div>

				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="label !mb-0">购票明细</label>
						<button type="button" class="btn-secondary !py-1" on:click={addItem} disabled={!form.eventId}>➕ 加一行</button>
					</div>
					<div class="border border-slate-200 rounded-lg overflow-hidden">
						<table class="w-full text-sm">
							<thead><tr class="bg-slate-50">
								<th class="text-left px-3 py-2 font-medium text-slate-600">票种</th>
								<th class="w-24 text-left px-3 py-2 font-medium text-slate-600">数量</th>
								<th class="w-32 text-left px-3 py-2 font-medium text-slate-600">单价</th>
								<th class="w-36 text-left px-3 py-2 font-medium text-slate-600">持票人</th>
								<th class="w-32 text-left px-3 py-2 font-medium text-slate-600">手机</th>
								<th class="w-10"></th>
							</tr></thead>
							<tbody>
								{#each form.items as it, idx}
									<tr class="border-t border-slate-100">
										<td class="p-2">
											<select class="select-input !py-1" bind:value={it.ticketTypeId} on:change={() => {
												const tt = ticketTypes.find(t => t.id === it.ticketTypeId);
												if (tt) it.unitPrice = tt.price;
											}}>
												<option value="">选择票种</option>
												{#each ticketTypes as t}<option value={t.id}>{t.name} ({t.code}) ¥{t.price}</option>{/each}
											</select>
										</td>
										<td class="p-2"><input class="input !py-1" type="number" min="1" bind:value={it.quantity} /></td>
										<td class="p-2"><input class="input !py-1 font-mono" bind:value={it.unitPrice} /></td>
										<td class="p-2"><input class="input !py-1" bind:value={it.holderName} placeholder="可选" /></td>
										<td class="p-2"><input class="input !py-1" bind:value={it.holderPhone} placeholder="可选" /></td>
										<td class="p-2"><button type="button" class="btn-ghost !p-1 text-red-500" disabled={form.items.length <= 1} on:click={() => removeItem(idx)}>✕</button></td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<div><label class="label">备注</label><textarea class="input min-h-[60px]" bind:value={form.notes} /></div>

				<div class="flex justify-end gap-2 pt-2">
					<button class="btn-secondary" on:click={() => (showCreateModal = false)}>取消</button>
					<button class="btn-primary" on:click={submit}>提交订单</button>
				</div>
			</div>
		</div>
	</div>
{/if}
