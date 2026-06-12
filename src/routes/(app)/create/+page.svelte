<script lang="ts">
	import { goto } from '$app/navigation';
	import { getTrpcClient } from '$lib/trpc';

	let orderNo = $state('');
	let communityName = $state('');
	let region = $state('华东区');
	let customerName = $state('');
	let customerPhone = $state('');
	let productName = $state('');
	let refundAmount = $state('');
	let refundReason = $state('');
	let loading = $state(false);

	const regions = ['华东区', '华南区', '华北区', '西南区', '西北区', '东北区', '华中区'];

	function generateOrderNo() {
		const now = new Date();
		const dateStr = now.getFullYear().toString() +
			(now.getMonth() + 1).toString().padStart(2, '0') +
			now.getDate().toString().padStart(2, '0');
		const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
		orderNo = `RT${dateStr}${random}`;
	}

	async function handleSubmit() {
		if (!orderNo || !communityName || !customerName || !customerPhone || !productName || !refundAmount || !refundReason) {
			alert('请填写所有必填项');
			return;
		}

		const amount = Math.round(parseFloat(refundAmount) * 100);
		if (isNaN(amount) || amount <= 0) {
			alert('请输入正确的退款金额');
			return;
		}

		loading = true;
		try {
			const result = await getTrpcClient().refund.createOrder.mutate({
				orderNo,
				communityName,
				region,
				customerName,
				customerPhone,
				productName,
				refundAmount: amount,
				refundReason
			});
			goto(`/orders/${result.id}`);
		} catch (e: any) {
			alert(e.message || '创建失败');
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		generateOrderNo();
	});
</script>

<div class="page-header">
	<h1 class="page-title">新建售后单</h1>
	<div>
		<button class="btn" onclick={() => goto(-1)}>取消</button>
	</div>
</div>

<div class="card" style="max-width: 700px;">
	<div class="card-body">
		<div class="form-group">
			<label class="form-label">售后单号 <span style="color: var(--danger-color)">*</span></label>
			<div style="display: flex; gap: 8px;">
				<input type="text" class="form-input" bind:value={orderNo} placeholder="自动生成，可修改" />
				<button class="btn" onclick={generateOrderNo} type="button">
					🔄 生成
				</button>
			</div>
		</div>

		<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
			<div class="form-group">
				<label class="form-label">小区名称 <span style="color: var(--danger-color)">*</span></label>
				<input type="text" class="form-input" bind:value={communityName} placeholder="请输入小区名称" />
			</div>
			<div class="form-group">
				<label class="form-label">所属区域 <span style="color: var(--danger-color)">*</span></label>
				<select class="form-select" bind:value={region}>
					{#each regions as r}
						<option value={r}>{r}</option>
					{/each}
				</select>
			</div>
		</div>

		<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
			<div class="form-group">
				<label class="form-label">客户姓名 <span style="color: var(--danger-color)">*</span></label>
				<input type="text" class="form-input" bind:value={customerName} placeholder="请输入客户姓名" />
			</div>
			<div class="form-group">
				<label class="form-label">联系电话 <span style="color: var(--danger-color)">*</span></label>
				<input type="text" class="form-input" bind:value={customerPhone} placeholder="请输入联系电话" />
			</div>
		</div>

		<div class="form-group">
			<label class="form-label">商品名称 <span style="color: var(--danger-color)">*</span></label>
			<input type="text" class="form-input" bind:value={productName} placeholder="请输入商品名称" />
		</div>

		<div class="form-group">
			<label class="form-label">退款金额（元） <span style="color: var(--danger-color)">*</span></label>
			<input type="number" step="0.01" class="form-input" bind:value={refundAmount} placeholder="请输入退款金额" />
		</div>

		<div class="form-group">
			<label class="form-label">退款原因 <span style="color: var(--danger-color)">*</span></label>
			<textarea class="form-textarea" bind:value={refundReason} placeholder="请详细描述退款原因" rows="4"></textarea>
		</div>

		<div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
			<button class="btn" onclick={() => goto(-1)} disabled={loading}>取消</button>
			<button class="btn btn-primary" onclick={handleSubmit} disabled={loading}>
				{loading ? '提交中...' : '提交'}
			</button>
		</div>
	</div>
</div>
