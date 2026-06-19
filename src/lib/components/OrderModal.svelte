<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { trpcClient } from '$lib/trpc/client';
	import { ORDER_STATUS_LABELS, CHANNEL_LABELS, type OrderStatusType, type ChannelTypeType } from '$lib/types';
	import { differenceInCalendarDays } from 'date-fns';

	export let order: any = null;
	export let properties: any[] = [];

	const dispatch = createEventDispatcher();

	function toDateStr(d: any) {
		if (!d) return '';
		const dt = new Date(d);
		return dt.toISOString().split('T')[0];
	}
	function fromDateStr(s: string) {
		return s ? new Date(s + 'T00:00:00') : new Date();
	}
	const tomorrow = new Date(Date.now() + 86400000);
	const dayAfter = new Date(Date.now() + 2 * 86400000);

	let form = {
		propertyId: order?.propertyId ?? (properties[0]?.id ?? ''),
		channel: (order?.channel ?? 'direct') as ChannelTypeType,
		channelOrderNo: order?.channelOrderNo ?? '',
		guestName: order?.guestName ?? '',
		guestPhone: order?.guestPhone ?? '',
		guestEmail: order?.guestEmail ?? '',
		guestCount: order?.guestCount ?? 1,
		checkInDateStr: toDateStr(order?.checkInDate ?? tomorrow),
		checkOutDateStr: toDateStr(order?.checkOutDate ?? dayAfter),
		totalPrice: order?.totalPrice ?? 0,
		cleaningFee: order?.cleaningFee ?? 0,
		depositAmount: order?.depositAmount ?? 0,
		channelFee: order?.channelFee ?? 0,
		status: (order?.status ?? 'pending') as OrderStatusType,
		paymentStatus: order?.paymentStatus ?? 'unpaid',
		paidAmount: order?.paidAmount ?? 0,
		source: order?.source ?? 'online',
		contactPerson: order?.contactPerson ?? '',
		contactPhone: order?.contactPhone ?? '',
		remark: order?.remark ?? '',
		internalNote: order?.internalNote ?? ''
	};
	let submitting = false;
	let error = '';
	let conflictInfo: any = null;

	$: {
		const p = properties.find((x) => x.id === form.propertyId);
		if (p && !order && (form.totalPrice === 0 || form.cleaningFee === 0 || form.depositAmount === 0)) {
			const nights = Math.max(differenceInCalendarDays(fromDateStr(form.checkOutDateStr), fromDateStr(form.checkInDateStr)), 1);
			form.totalPrice = p.basePrice * nights;
			form.cleaningFee = p.cleaningFee;
			form.depositAmount = p.depositAmount;
		}
	}

	async function handleSubmit() {
		submitting = true;
		error = '';
		conflictInfo = null;
		try {
			const checkInDate = fromDateStr(form.checkInDateStr);
			const checkOutDate = fromDateStr(form.checkOutDateStr);
			const payload: any = {
				...form,
				checkInDate,
				checkOutDate
			};
			delete payload.checkInDateStr;
			delete payload.checkOutDateStr;

			let result;
			if (order) {
				result = await trpcClient.order.update.mutate({ id: order.id, ...payload });
			} else {
				result = await trpcClient.order.create.mutate(payload);
				if (result?.conflict?.hasConflict) {
					conflictInfo = result.conflict;
					if (!confirm('检测到房态冲突，已生成异常单。是否继续保存？')) {
						submitting = false;
						return;
					}
				}
			}
			dispatch('saved');
		} catch (e: any) {
			error = e?.message ?? '保存失败';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" on:click={(e) => { if (e.target === e.currentTarget) dispatch('cancel'); }}>
	<div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-auto">
		<div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
			<h3 class="font-semibold text-lg text-gray-900">{order ? '编辑订单' : '新建订单'}</h3>
			<button on:click={() => dispatch('cancel')} class="text-gray-400 hover:text-gray-600">
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
			</button>
		</div>

		<form on:submit|preventDefault={handleSubmit} class="p-6 space-y-5">
			{#if conflictInfo}
				<div class="rounded-md bg-yellow-50 border border-yellow-200 p-4">
					<div class="font-medium text-yellow-800 mb-1">⚠️ 检测到房态冲突</div>
					<div class="text-sm text-yellow-700">共 {conflictInfo.conflicts.length} 处冲突，已自动生成异常单，请前往异常单模块处理</div>
				</div>
			{/if}

			<div>
				<div class="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">基础信息</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="label">房源 *</label>
						<select bind:value={form.propertyId} class="select" required>
							{#each properties as p}
								<option value={p.id}>{p.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="label">状态</label>
						<select bind:value={form.status} class="select">
							{#each Object.entries(ORDER_STATUS_LABELS) as [k, v]}
								<option value={k}>{v}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="label">渠道 *</label>
						<select bind:value={form.channel} class="select">
							{#each Object.entries(CHANNEL_LABELS) as [k, v]}
								<option value={k}>{v}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="label">渠道订单号</label>
						<input bind:value={form.channelOrderNo} class="input" placeholder="选填，外部平台订单号" />
					</div>
				</div>
			</div>

			<div>
				<div class="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">客人信息</div>
				<div class="grid grid-cols-2 gap-4">
					<div><label class="label">客人姓名 *</label><input bind:value={form.guestName} class="input" required /></div>
					<div><label class="label">手机号 *</label><input bind:value={form.guestPhone} class="input" required /></div>
					<div><label class="label">邮箱</label><input type="email" bind:value={form.guestEmail} class="input" /></div>
					<div><label class="label">入住人数</label><input type="number" min="1" bind:value={form.guestCount} class="input" /></div>
				</div>
			</div>

			<div>
				<div class="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">时间与费用</div>
				<div class="grid grid-cols-2 gap-4">
					<div><label class="label">入住日期 *</label><input type="date" bind:value={form.checkInDateStr} class="input" required /></div>
					<div><label class="label">退房日期 *</label><input type="date" bind:value={form.checkOutDateStr} class="input" required /></div>
					<div><label class="label">房费总价 (¥)</label><input type="number" min="0" step="0.01" bind:value={form.totalPrice} class="input" /></div>
					<div><label class="label">清洁费 (¥)</label><input type="number" min="0" step="0.01" bind:value={form.cleaningFee} class="input" /></div>
					<div><label class="label">押金 (¥)</label><input type="number" min="0" step="0.01" bind:value={form.depositAmount} class="input" /></div>
					<div><label class="label">渠道佣金 (¥)</label><input type="number" min="0" step="0.01" bind:value={form.channelFee} class="input" /></div>
					<div>
						<label class="label">付款状态</label>
						<select bind:value={form.paymentStatus} class="select">
							<option value="unpaid">未付</option>
							<option value="partial">部分</option>
							<option value="paid">已付</option>
							<option value="refunded">已退款</option>
						</select>
					</div>
					<div><label class="label">已付金额 (¥)</label><input type="number" min="0" step="0.01" bind:value={form.paidAmount} class="input" /></div>
				</div>
			</div>

			<div>
				<div class="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">备注</div>
				<div class="grid grid-cols-2 gap-4">
					<div><label class="label">备注（客人可见）</label><textarea bind:value={form.remark} class="input min-h-[80px]" /></div>
					<div><label class="label">内部备注（仅内部可见）</label><textarea bind:value={form.internalNote} class="input min-h-[80px]" /></div>
				</div>
			</div>

			{#if error}
				<div class="rounded-md bg-red-50 p-3 border border-red-200"><div class="text-sm text-red-700">{error}</div></div>
			{/if}

			<div class="border-t border-gray-100 pt-4 flex justify-end gap-3">
				<button type="button" on:click={() => dispatch('cancel')} class="btn-secondary">取消</button>
				<button type="submit" class="btn-primary" disabled={submitting}>{submitting ? '保存中...' : '保 存'}</button>
			</div>
		</form>
	</div>
</div>
