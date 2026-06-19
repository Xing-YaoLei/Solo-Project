<script lang="ts">
	import { trpcClient } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import { DEPOSIT_STATUS_LABELS, type DepositStatusType } from '$lib/types';

	let deposits: any[] = [];
	let properties: any[] = [];
	let loading = true;
	let filterStatus = '' as DepositStatusType | '';
	let search = '';
	let showModal = false;
	let showRefundModal = false;
	let refundTarget: any = null;

	let form = {
		propertyId: '', orderId: undefined as string | undefined,
		guestName: '', amount: 0,
		paymentMethod: 'wechat' as any, transactionNo: ''
	};
	let refundForm = {
		refundedAmount: 0, deductedAmount: 0,
		refundMethod: 'wechat' as any, refundTransactionNo: '',
		deductionItems: [{ name: '', amount: 0, remark: '' }] as any[],
		remark: ''
	};

	async function loadData() {
		loading = true;
		try {
			const [d, p] = await Promise.all([
				trpcClient.deposit.list.query({ status: filterStatus || undefined, search: search || undefined }),
				trpcClient.property.list.query({ status: 'active' })
			]);
			deposits = d; properties = p;
			if (p.length > 0 && !form.propertyId) form.propertyId = p[0].id;
		} finally { loading = false; }
	}
	onMount(loadData);

	async function submitCreate() {
		await trpcClient.deposit.create.mutate({ ...form });
		showModal = false;
		Object.assign(form, { guestName: '', amount: 0, transactionNo: '', orderId: undefined });
		loadData();
	}
	function openRefund(d: any) {
		refundTarget = d;
		refundForm = {
			refundedAmount: d.amount, deductedAmount: 0,
			refundMethod: d.paymentMethod, refundTransactionNo: '',
			deductionItems: [{ name: '', amount: 0, remark: '' }],
			remark: ''
		};
		showRefundModal = true;
	}
	async function submitRefund() {
		const items = refundForm.deductionItems.filter((i) => i.name && i.amount > 0);
		await trpcClient.deposit.refund.mutate({
			id: refundTarget.id,
			refundedAmount: refundForm.refundedAmount,
			deductedAmount: refundForm.deductedAmount,
			deductionItems: items,
			refundMethod: refundForm.refundMethod,
			refundTransactionNo: refundForm.refundTransactionNo || undefined,
			remark: refundForm.remark || undefined
		});
		showRefundModal = false;
		refundTarget = null;
		loadData();
	}
	function addDeductionItem() {
		refundForm.deductionItems.push({ name: '', amount: 0, remark: '' });
	}
	function removeDeductionItem(idx: number) {
		refundForm.deductionItems.splice(idx, 1);
	}
	function recalcRefund() {
		const totalDeduct = refundForm.deductionItems.reduce((s, i) => s + Number(i.amount || 0), 0);
		refundForm.deductedAmount = totalDeduct;
		if (refundTarget) {
			refundForm.refundedAmount = Math.max(0, Number(refundTarget.amount) - totalDeduct);
		}
	}

	const statusBadge: Record<string, string> = {
		collected: 'bg-green-100 text-green-800',
		frozen: 'bg-blue-100 text-blue-800',
		refunded: 'bg-gray-100 text-gray-800',
		partial_refunded: 'bg-yellow-100 text-yellow-800',
		deducted: 'bg-red-100 text-red-800'
	};
	const paymentLabels: Record<string, string> = {
		cash: '现金', wechat: '微信', alipay: '支付宝',
		bank_transfer: '银行转账', card: '刷卡', platform: '平台'
	};
	const propMap = new Map(properties.map((p) => [p.id, p.name]));

	function formatDate(d: any) { if (!d) return '-'; return new Date(d).toLocaleDateString('zh-CN'); }

	function depositStatusLabel(s: any) { return (DEPOSIT_STATUS_LABELS as any)[s]; }
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-3">
			<input bind:value={search} placeholder="客人/单号/流水号" class="input w-64" on:change={loadData} />
			<select bind:value={filterStatus} class="select w-40" on:change={loadData}>
				<option value="">全部状态</option>
				{#each Object.entries(DEPOSIT_STATUS_LABELS) as [k, v]}<option value={k}>{v}</option>{/each}
			</select>
		</div>
		<button on:click={() => showModal = true} class="btn-primary">新增押金</button>
	</div>

	{#if loading}
		<div class="card card-body py-12 text-center text-gray-500">加载中...</div>
	{:else}
		<div class="card overflow-hidden">
			<table class="table">
				<thead class="bg-gray-50"><tr>
					<th class="table-th">押金单号</th>
					<th class="table-th">客人</th>
					<th class="table-th">房源</th>
					<th class="table-th">金额 / 支付方式</th>
					<th class="table-th">退还 / 扣除</th>
					<th class="table-th">收取时间</th>
					<th class="table-th">状态</th>
					<th class="table-th">操作</th>
				</tr></thead>
				<tbody class="divide-y">
					{#if deposits.length === 0}
						<tr><td colspan="8" class="py-16 text-center text-gray-400">暂无押金记录</td></tr>
					{/if}
					{#each deposits as d}
						<tr class="hover:bg-gray-50">
							<td class="table-td font-mono text-xs">{d.depositNo}</td>
							<td class="table-td font-medium">{d.guestName}</td>
							<td class="table-td text-sm">{propMap.get(d.propertyId) ?? '-'}</td>
							<td class="table-td">
								<div class="font-semibold text-gray-900">¥{d.amount?.toFixed(2)}</div>
								<div class="text-xs text-gray-500">{paymentLabels[d.paymentMethod]}</div>
							</td>
							<td class="table-td text-sm">
								<div class="text-green-600">退 ¥{d.refundedAmount?.toFixed(2) ?? '0.00'}</div>
								<div class="text-red-600">扣 ¥{d.deductedAmount?.toFixed(2) ?? '0.00'}</div>
							</td>
							<td class="table-td text-sm">{formatDate(d.collectedAt)}</td>
							<td class="table-td"><span class="badge {statusBadge[d.status]}">{depositStatusLabel(d.status)}</span></td>
							<td class="table-td">
								<div class="flex gap-1.5">
									{#if d.status === 'collected' || d.status === 'frozen'}
										<button on:click={() => openRefund(d)} class="btn-success text-xs py-1 px-2">处理</button>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if showModal}
	<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" on:click={(e) => { if (e.target === e.currentTarget) showModal = false; }}>
		<div class="bg-white rounded-xl shadow-2xl w-full max-w-lg">
			<div class="px-6 py-4 border-b flex justify-between">
				<h3 class="font-semibold text-lg">新增押金</h3>
				<button on:click={() => showModal = false} class="text-gray-400 hover:text-gray-600">✕</button>
			</div>
			<div class="p-6 space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="col-span-2"><label class="label">房源 *</label>
						<select bind:value={form.propertyId} class="select">
							{#each properties as p}<option value={p.id}>{p.name}</option>{/each}
						</select>
					</div>
					<div><label class="label">客人姓名 *</label><input bind:value={form.guestName} class="input" required /></div>
					<div><label class="label">押金金额 (¥) *</label><input type="number" min="0" bind:value={form.amount} class="input" required /></div>
					<div><label class="label">支付方式</label>
						<select bind:value={form.paymentMethod} class="select">
							{#each Object.entries(paymentLabels) as [k, v]}<option value={k}>{v}</option>{/each}
						</select>
					</div>
					<div><label class="label">交易流水号</label><input bind:value={form.transactionNo} class="input" /></div>
				</div>
				<div class="pt-2 flex justify-end gap-3">
					<button on:click={() => showModal = false} class="btn-secondary">取消</button>
					<button on:click={submitCreate} class="btn-primary">保存</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showRefundModal && refundTarget}
	<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" on:click={(e) => { if (e.target === e.currentTarget) showRefundModal = false; }}>
		<div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
			<div class="px-6 py-4 border-b flex justify-between sticky top-0 bg-white">
				<h3 class="font-semibold text-lg">押金处理 - {refundTarget.guestName}</h3>
				<button on:click={() => showRefundModal = false} class="text-gray-400 hover:text-gray-600">✕</button>
			</div>
			<div class="p-6 space-y-4">
				<div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
					<div class="text-sm"><span class="text-gray-500">原押金金额：</span><span class="font-semibold text-blue-900">¥{refundTarget.amount?.toFixed(2)}</span></div>
				</div>

				<div>
					<div class="font-semibold text-sm text-gray-700 mb-2">扣除明细（选填）</div>
					<div class="space-y-2">
						{#each refundForm.deductionItems as it, idx}
							<div class="flex gap-2">
								<input placeholder="扣费项目，如：玻璃破损" bind:value={it.name} class="input flex-1" on:change={recalcRefund} />
								<input type="number" min="0" placeholder="金额" bind:value={it.amount} class="input w-32" on:change={recalcRefund} />
								<button on:click={() => { removeDeductionItem(idx); recalcRefund(); }} class="btn-danger text-xs !text-xs px-3">×</button>
							</div>
						{/each}
						<button on:click={addDeductionItem} class="btn-secondary text-xs">+ 添加扣费项</button>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="bg-red-50 p-4 rounded-lg border border-red-100">
						<label class="label">扣除合计</label>
						<div class="text-2xl font-bold text-red-700">¥{refundForm.deductedAmount?.toFixed(2)}</div>
					</div>
					<div class="bg-green-50 p-4 rounded-lg border border-green-100">
						<label class="label">应退金额</label>
						<div class="text-2xl font-bold text-green-700">¥{refundForm.refundedAmount?.toFixed(2)}</div>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div><label class="label">退款方式</label>
						<select bind:value={refundForm.refundMethod} class="select">
							{#each Object.entries(paymentLabels) as [k, v]}<option value={k}>{v}</option>{/each}
						</select>
					</div>
					<div><label class="label">退款流水号</label><input bind:value={refundForm.refundTransactionNo} class="input" /></div>
				</div>
				<div><label class="label">备注</label><textarea bind:value={refundForm.remark} class="input min-h-[80px]" /></div>

				<div class="pt-2 flex justify-end gap-3">
					<button on:click={() => showRefundModal = false} class="btn-secondary">取消</button>
					<button on:click={submitRefund} class="btn-primary">确认处理</button>
				</div>
			</div>
		</div>
	</div>
{/if}
