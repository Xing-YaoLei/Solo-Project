<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		Search, FileText, CreditCard, CheckCircle, Clock, Ban,
		ChevronRight, Plus, Grid3X3, Rows3, Car, User, Calendar,
		Download, Send, Eye, XCircle, AlertCircle
	} from 'lucide-svelte';
	import {
		mockQuotes, delay,
		type MockQuote, type QuoteStatus
	} from '$lib/mock/data';

	// TODO: tRPC 调用 - 替换为真实数据
	// import { trpc } from '$lib/trpc/client';
	// const result = await trpc.quote.list.query({ status, page, pageSize });

	let loading = true;
	let quotes: MockQuote[] = [];
	let filtered: MockQuote[] = [];

	let searchQuery = '';
	let statusFilter: QuoteStatus | 'ALL' = 'ALL';
	let viewMode: 'card' | 'table' = 'card';

	$: {
		let list = quotes;
		if (statusFilter !== 'ALL') list = list.filter(q => q.status === statusFilter);
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			list = list.filter(qt =>
				qt.quoteNo.toLowerCase().includes(q)
				|| (qt.workOrder?.orderNo.toLowerCase().includes(q) || false)
				|| (qt.workOrder?.customer.name.toLowerCase().includes(q) || false)
				|| (qt.workOrder?.vehicle.plateNumber.toLowerCase().includes(q) || false)
			);
		}
		filtered = list;
	}

	function gotoQuoteWorkOrderFn(q: MockQuote) {
		if (q.workOrder) goto(`/work-orders/${q.workOrder.id}`);
	}

	onMount(async () => {
		await delay(null, 300);
		quotes = mockQuotes;
		loading = false;
	});

	function statusClass(s: QuoteStatus) {
		switch (s) {
			case 'DRAFT': return 'bg-slate-100 text-slate-700';
			case 'PENDING_CONFIRM': return 'bg-amber-100 text-amber-700';
			case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700';
			case 'VOID': return 'bg-red-100 text-red-700';
			default: return 'bg-slate-100 text-slate-700';
		}
	}
	function statusIcon(s: QuoteStatus) {
		switch (s) {
			case 'DRAFT': return FileText;
			case 'PENDING_CONFIRM': return Clock;
			case 'CONFIRMED': return CheckCircle;
			case 'VOID': return Ban;
			default: return FileText;
		}
	}
	function statusName(s: QuoteStatus) {
		switch (s) {
			case 'DRAFT': return '草稿';
			case 'PENDING_CONFIRM': return '待客户确认';
			case 'CONFIRMED': return '已确认';
			case 'VOID': return '已作废';
			default: return s;
		}
	}
	function statusBadgeClass(s: QuoteStatus) {
		switch (s) {
			case 'DRAFT': return 'border-slate-400 bg-slate-50';
			case 'PENDING_CONFIRM': return 'border-amber-400 bg-amber-50';
			case 'CONFIRMED': return 'border-emerald-400 bg-emerald-50';
			case 'VOID': return 'border-red-400 bg-red-50';
			default: return 'border-slate-400 bg-slate-50';
		}
	}
	function statusTextClass(s: QuoteStatus) {
		switch (s) {
			case 'DRAFT': return 'text-slate-700';
			case 'PENDING_CONFIRM': return 'text-amber-700';
			case 'CONFIRMED': return 'text-emerald-700';
			case 'VOID': return 'text-red-700';
			default: return 'text-slate-700';
		}
	}

	const statusOptions: { value: QuoteStatus | 'ALL'; label: string; count: number }[] = [
		{ value: 'ALL', label: '全部', count: quotes.length },
		{ value: 'DRAFT', label: '草稿', count: quotes.filter(q => q.status === 'DRAFT').length },
		{ value: 'PENDING_CONFIRM', label: '待确认', count: quotes.filter(q => q.status === 'PENDING_CONFIRM').length },
		{ value: 'CONFIRMED', label: '已确认', count: quotes.filter(q => q.status === 'CONFIRMED').length },
		{ value: 'VOID', label: '已作废', count: quotes.filter(q => q.status === 'VOID').length }
	];

	async function sendToCustomer(quote: MockQuote) {
		// TODO: tRPC 调用
		// await trpc.quote.sendToCustomer.mutate({ id: quote.id });
		alert(`报价单 ${quote.quoteNo} 已发送给客户`);
	}
	async function confirmQuote(quote: MockQuote) {
		if (!confirm(`确认 ${quote.quoteNo} 报价？`)) return;
		// TODO: tRPC 调用
		// await trpc.quote.confirm.mutate({ id: quote.id });
		await delay(null, 300);
		quotes = quotes.map(q => q.id === quote.id ? { ...q, status: 'CONFIRMED', confirmedAt: new Date() } : q);
	}
	async function voidQuote(quote: MockQuote) {
		if (!confirm(`确定作废 ${quote.quoteNo}？此操作不可撤销。`)) return;
		// TODO: tRPC 调用
		// await trpc.quote.void.mutate({ id: quote.id });
		await delay(null, 300);
		quotes = quotes.map(q => q.id === quote.id ? { ...q, status: 'VOID' } : q);
	}
</script>

<div class="min-h-screen bg-slate-50 p-6 lg:p-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl lg:text-3xl font-bold text-slate-900 font-display">报价单管理</h1>
			<p class="text-slate-500 mt-1">共 {filtered.length} 条报价单记录</p>
		</div>
		<button
			on:click={() => alert('新建报价单功能开发中')}
			class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-700 hover:to-accent-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
		>
			<Plus class="w-5 h-5" />
			新建报价单
		</button>
	</div>

	<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
		<div class="p-5 border-b border-slate-100 space-y-4">
			<div class="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
				<div class="relative flex-1 w-full lg:max-w-md">
					<Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="搜索报价单号 / 工单号 / 客户 / 车牌..."
						class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
					/>
				</div>
				<div class="flex-1" />
				<div class="flex items-center gap-2 p-1 rounded-xl bg-slate-100">
					<button
						on:click={() => viewMode = 'card'}
						class={'p-2 rounded-lg transition-all ' + (viewMode === 'card' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
						title="卡片视图"
					>
						<Grid3X3 class="w-4.5 h-4.5" />
					</button>
					<button
						on:click={() => viewMode = 'table'}
						class={'p-2 rounded-lg transition-all ' + (viewMode === 'table' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
						title="表格视图"
					>
						<Rows3 class="w-4.5 h-4.5" />
					</button>
				</div>
			</div>

			<div class="flex flex-wrap gap-2">
				{#each statusOptions as opt}
					<button
						on:click={() => statusFilter = opt.value}
						class={'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ' + (statusFilter === opt.value ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200')}
					>
						{opt.label}
						<span class={'px-2 py-0.5 rounded-full text-xs font-semibold ' + (statusFilter === opt.value ? 'bg-white/20 text-white' : 'bg-white text-slate-600 border border-slate-200')}>
							{opt.count}
						</span>
					</button>
				{/each}
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-24">
			<div class="inline-flex items-center gap-2 text-slate-500">
				<svg class="animate-spin h-5 w-5 text-primary-500" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
				</svg>
				加载中...
			</div>
		</div>
	{:else if filtered.length === 0}
		<div class="bg-white rounded-2xl border border-slate-200 shadow-sm py-24 text-center">
			<FileText class="w-16 h-16 mx-auto mb-4 text-slate-300" />
			<p class="text-slate-500">暂无符合条件的报价单</p>
		</div>
	{:else if viewMode === 'card'}
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
			{#each filtered as quote}
				<div class="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
					<div class={'h-1.5 w-full ' + (quote.status === 'CONFIRMED' ? 'bg-emerald-500' : quote.status === 'PENDING_CONFIRM' ? 'bg-amber-500' : quote.status === 'VOID' ? 'bg-red-500' : 'bg-slate-400')} />
					<div class="p-5">
						<div class="flex items-start justify-between mb-4">
							<div>
								<div class="font-mono text-xs text-slate-500 mb-1">报价单号</div>
								<div class="text-lg font-bold text-slate-900">{quote.quoteNo}</div>
							</div>
							<div class={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ' + statusClass(quote.status)}>
								<svelte:component this={statusIcon(quote.status)} class="w-3.5 h-3.5" />
								{statusName(quote.status)}
							</div>
						</div>

						{#if quote.workOrder}
							<div class="space-y-3 mb-5 p-4 rounded-xl bg-slate-50 border border-slate-100">
								<div class="flex items-center gap-3">
									<div class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
										<Car class="w-5 h-5" />
									</div>
									<div class="min-w-0 flex-1">
										<div class="font-semibold text-slate-800 truncate">{quote.workOrder.vehicle.plateNumber}</div>
										<div class="text-xs text-slate-500 truncate">{quote.workOrder.vehicle.brand} {quote.workOrder.vehicle.model}</div>
									</div>
								</div>
								<div class="flex items-center gap-3">
									<div class="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
										<User class="w-5 h-5" />
									</div>
									<div class="min-w-0 flex-1">
										<div class="font-semibold text-slate-800 truncate">{quote.workOrder.customer.name}</div>
										<div class="text-xs text-slate-500 truncate">{quote.workOrder.customer.phone}</div>
									</div>
								</div>
								<div class="flex items-center gap-3">
									<div class="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
										<FileText class="w-5 h-5" />
									</div>
									<div class="min-w-0 flex-1">
										<div class="text-xs text-slate-500 mb-0.5">关联工单</div>
										<div class="font-mono text-sm font-semibold text-primary-700 truncate">{quote.workOrder.orderNo}</div>
									</div>
								</div>
							</div>
						{:else}
							<div class="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-100 border-dashed text-center text-slate-400 text-sm">
								未关联工单
							</div>
						{/if}

						<div class="space-y-2.5 mb-5">
							<div class="flex items-center justify-between text-sm">
								<span class="text-slate-500 flex items-center gap-1.5"><CreditCard class="w-4 h-4" /> 总金额</span>
								<span class="text-xl font-bold text-accent-600">¥{Number(quote.totalAmount).toLocaleString()}</span>
							</div>
							{#if Number(quote.discount) > 0}
								<div class="flex items-center justify-between text-sm">
									<span class="text-slate-500">优惠折扣</span>
									<span class="font-medium text-red-600">-¥{Number(quote.discount).toLocaleString()}</span>
								</div>
							{/if}
							{#if quote.confirmedAt}
								<div class="flex items-center justify-between text-sm">
									<span class="text-slate-500 flex items-center gap-1.5"><Calendar class="w-4 h-4" /> 确认时间</span>
									<span class="font-medium text-emerald-700">{quote.confirmedAt.getMonth() + 1}/{quote.confirmedAt.getDate()}</span>
								</div>
							{/if}
						</div>

						<div class="pt-4 border-t border-slate-100 flex items-center gap-2">
							{#if quote.status === 'DRAFT'}
								<button
									on:click={() => sendToCustomer(quote)}
									class="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5"
								>
									<Send class="w-4 h-4" />
									发送客户
								</button>
							{:else if quote.status === 'PENDING_CONFIRM'}
								<button
									on:click={() => confirmQuote(quote)}
									class="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5"
								>
									<CheckCircle class="w-4 h-4" />
									确认报价
								</button>
							{:else if quote.status === 'CONFIRMED'}
								{#if quote.workOrder}
									<button
										on:click={() => gotoQuoteWorkOrderFn(quote)}
										class="flex-1 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5"
									>
										<FileText class="w-4 h-4" />
										查看工单
									</button>
								{/if}
							{/if}
							{#if quote.status !== 'VOID'}
								<button
									on:click={() => voidQuote(quote)}
									class="py-2 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
									title="作废"
								>
									<XCircle class="w-4 h-4" />
								</button>
							{/if}
							<button
								on:click={() => alert('导出PDF功能开发中')}
								class="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
								title="导出"
							>
								<Download class="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full min-w-[950px]">
					<thead class="bg-slate-50 border-b border-slate-100">
						<tr>
							<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-5">报价单号</th>
							<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-5">关联工单</th>
							<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-5">车辆/客户</th>
							<th class="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-5">总金额</th>
							<th class="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-5">优惠</th>
							<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-5">状态</th>
							<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-5">确认时间</th>
							<th class="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-5">操作</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each filtered as quote}
							<tr class="hover:bg-slate-50/80 transition-colors">
								<td class="py-4 px-5">
									<div class="flex items-center gap-2.5">
										<div class={'w-9 h-9 rounded-lg border-l-4 ' + statusBadgeClass(quote.status) + ' flex items-center justify-center'}>
											<svelte:component this={statusIcon(quote.status)} class={'w-4 h-4 ' + statusTextClass(quote.status)} />
										</div>
										<span class="font-mono text-sm font-semibold text-slate-800">{quote.quoteNo}</span>
									</div>
								</td>
								<td class="py-4 px-5">
									{#if quote.workOrder}
										<button
											on:click={() => gotoQuoteWorkOrderFn(quote)}
											class="font-mono text-sm text-primary-600 hover:text-primary-700 font-medium"
										>
											{quote.workOrder.orderNo}
										</button>
									{:else}
										<span class="text-sm text-slate-400">-</span>
									{/if}
								</td>
								<td class="py-4 px-5">
									{#if quote.workOrder}
										<div class="space-y-0.5">
											<div class="text-sm">
												<span class="font-semibold text-slate-800">{quote.workOrder.vehicle.plateNumber}</span>
												<span class="text-xs text-slate-400 mx-1">·</span>
												<span class="text-xs text-slate-500">{quote.workOrder.vehicle.brand} {quote.workOrder.vehicle.model}</span>
											</div>
											<div class="text-xs text-slate-500">
												{quote.workOrder.customer.name} · {quote.workOrder.customer.phone}
											</div>
										</div>
									{:else}
										<span class="text-sm text-slate-400">-</span>
									{/if}
								</td>
								<td class="py-4 px-5 text-right">
									<span class="text-lg font-bold text-accent-600">¥{Number(quote.totalAmount).toLocaleString()}</span>
								</td>
								<td class="py-4 px-5 text-right">
									{#if Number(quote.discount) > 0}
										<span class="text-sm font-medium text-red-600">-¥{Number(quote.discount).toLocaleString()}</span>
									{:else}
										<span class="text-sm text-slate-400">-</span>
									{/if}
								</td>
								<td class="py-4 px-5">
									<span class={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ' + statusClass(quote.status)}>
										<svelte:component this={statusIcon(quote.status)} class="w-3.5 h-3.5" />
										{statusName(quote.status)}
									</span>
								</td>
								<td class="py-4 px-5">
									{#if quote.confirmedAt}
										<span class="text-sm text-slate-600">
											{quote.confirmedAt.getFullYear()}-{String(quote.confirmedAt.getMonth() + 1).padStart(2, '0')}-{String(quote.confirmedAt.getDate()).padStart(2, '0')}
										</span>
									{:else}
										<span class="text-sm text-slate-400">-</span>
									{/if}
								</td>
								<td class="py-4 px-5">
									<div class="flex items-center justify-center gap-1">
										<button
											on:click={() => alert('查看报价单详情功能开发中')}
											class="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
											title="查看"
										>
											<Eye class="w-4 h-4" />
										</button>
										<button
											on:click={() => alert('导出PDF功能开发中')}
											class="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
											title="导出"
										>
											<Download class="w-4 h-4" />
										</button>
										{#if quote.status === 'PENDING_CONFIRM'}
											<button
												on:click={() => confirmQuote(quote)}
												class="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
												title="确认"
											>
												<CheckCircle class="w-4 h-4" />
											</button>
										{/if}
										{#if quote.status !== 'VOID'}
											<button
												on:click={() => voidQuote(quote)}
												class="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
												title="作废"
											>
												<XCircle class="w-4 h-4" />
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
