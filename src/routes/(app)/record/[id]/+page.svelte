<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	export let data: { data: any };

	$: recordId = $page.params.id;

	let record: any = null;
	let logs: any[] = [];
	let loading = true;
	let editingTags = false;
	let editingRemark = false;
	let tempRemark = '';
	let tempTags: string[] = [];
	let newTag = '';
	let showStatusModal = false;
	let selectedStatus = '';
	let selectedAbnormalType = '';
	let statusRemark = '';
	let responsiblePerson = '';
	let closeReason = '';

	const statusOptions = [
		{ value: 'pending', label: '待处理' },
		{ value: 'processing', label: '处理中' },
		{ value: 'abnormal', label: '异常' },
		{ value: 'reviewing', label: '复核中' },
		{ value: 'completed', label: '已完成' },
		{ value: 'closed', label: '已关闭' }
	];

	const abnormalOptions = [
		{ value: 'none', label: '无异常' },
		{ value: 'damaged', label: '物品损坏' },
		{ value: 'lost', label: '物品丢失' },
		{ value: 'wrong_item', label: '物品错误' },
		{ value: 'quantity_mismatch', label: '数量不符' },
		{ value: 'other', label: '其他异常' }
	];

	const allTags = [
		'包装完好',
		'包装破损',
		'物品完好',
		'物品损坏',
		'数量正确',
		'数量不符',
		'配送及时',
		'配送延迟',
		'服务好',
		'服务差',
		'需跟进',
		'已解决'
	];

	function getStatusLabel(status: string) {
		const opt = statusOptions.find((o: any) => o.value === status);
		return opt?.label || status;
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'processing':
				return 'bg-blue-100 text-blue-800';
			case 'abnormal':
				return 'bg-red-100 text-red-800';
			case 'reviewing':
				return 'bg-purple-100 text-purple-800';
			case 'completed':
				return 'bg-green-100 text-green-800';
			case 'closed':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getAbnormalLabel(type: string) {
		const opt = abnormalOptions.find((o: any) => o.value === type);
		return opt?.label || type;
	}

	function formatDate(date: string | Date) {
		if (!date) return '-';
		const d = new Date(date);
		return d.toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function loadRecord() {
		loading = true;
		try {
			const res = await fetch(`/api/trpc/verification.get?batch=1`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					'0': { json: recordId }
				})
			});
			const data = await res.json();
			if (data[0]?.result?.data?.json) {
				record = data[0].result.data.json.record;
				logs = data[0].result.data.json.logs;
				tempRemark = record?.remark || '';
				tempTags = [...(record?.evaluationTags || [])];
			}
		} catch (e) {
			console.error('Failed to load record:', e);
		} finally {
			loading = false;
		}
	}

	async function saveRemark() {
		try {
			await fetch(`/api/trpc/verification.updateDetails?batch=1`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					'0': {
						json: {
							id: recordId,
							remark: tempRemark
						}
					}
				})
			});
			editingRemark = false;
			await loadRecord();
		} catch (e) {
			console.error('Failed to save remark:', e);
		}
	}

	function startEditTags() {
		tempTags = [...(record?.evaluationTags || [])];
		editingTags = true;
	}

	function toggleTag(tag: string) {
		if (tempTags.includes(tag)) {
			tempTags = tempTags.filter((t) => t !== tag);
		} else {
			tempTags = [...tempTags, tag];
		}
	}

	async function saveTags() {
		try {
			await fetch(`/api/trpc/verification.updateDetails?batch=1`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					'0': {
						json: {
							id: recordId,
							evaluationTags: tempTags
						}
					}
				})
			});
			editingTags = false;
			await loadRecord();
		} catch (e) {
			console.error('Failed to save tags:', e);
		}
	}

	function openStatusModal() {
		selectedStatus = record.status;
		selectedAbnormalType = record.abnormalType;
		responsiblePerson = record.responsiblePerson || '';
		closeReason = record.closeReason || '';
		statusRemark = '';
		showStatusModal = true;
	}

	async function updateStatus() {
		try {
			await fetch(`/api/trpc/verification.updateStatus?batch=1`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					'0': {
						json: {
							id: recordId,
							status: selectedStatus as any,
							abnormalType: selectedAbnormalType as any,
							responsiblePerson: responsiblePerson || undefined,
							closeReason: closeReason || undefined,
							remark: statusRemark || undefined
						}
					}
				})
			});
			showStatusModal = false;
			await loadRecord();
		} catch (e) {
			console.error('Failed to update status:', e);
		}
	}

	function goBack() {
		goto('/');
	}

	onMount(() => {
		loadRecord();
	});
</script>

{#if loading}
	<div class="flex items-center justify-center h-64">
		<div class="text-gray-500">加载中...</div>
	</div>
{:else if !record}
	<div class="flex items-center justify-center h-64">
		<div class="text-gray-500">记录不存在</div>
	</div>
{:else}
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-4">
				<button class="btn-secondary" on:click={goBack}>
					← 返回
				</button>
				<div>
					<h1 class="text-2xl font-bold text-gray-900">
						订单 {record.orderNo}
					</h1>
					<p class="text-sm text-gray-500">
						创建于 {formatDate(record.createdAt)}
					</p>
				</div>
			</div>
			<div class="flex items-center space-x-3">
				<span class="badge {getStatusColor(record.status)} px-3 py-1 text-sm">
					{getStatusLabel(record.status)}
				</span>
				<button class="btn-primary" on:click={openStatusModal}>
					更新状态
				</button>
			</div>
		</div>

		<!-- Main content grid: 3 columns -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Left column: Photos -->
			<div class="lg:col-span-1 space-y-6">
				<!-- Photos card -->
				<div class="card p-4">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">核验照片</h2>
					{#if record.photos && record.photos.length > 0}
						<div class="grid grid-cols-2 gap-3">
							{#each record.photos as photo, i}
								<div class="aspect-square rounded-lg bg-gray-100 overflow-hidden">
									<img src={photo} alt="核验照片 {i + 1}" class="w-full h-full object-cover" />
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-8 text-gray-500">
							<svg class="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<p>暂无照片</p>
						</div>
					{/if}
				</div>

				<!-- Evaluation tags card -->
				<div class="card p-4">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-lg font-semibold text-gray-900">评价标签</h2>
						<button class="text-sm text-indigo-600 hover:text-indigo-800" on:click={startEditTags}>
							{editingTags ? '取消' : '编辑'}
						</button>
					</div>

					{#if editingTags}
						<div class="space-y-3">
							<div class="flex flex-wrap gap-2">
								{#each allTags as tag}
									<button
										class="px-3 py-1 rounded-full text-sm border transition-colors
											{tempTags.includes(tag)
												? 'bg-indigo-100 text-indigo-800 border-indigo-300'
												: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}"
										on:click={() => toggleTag(tag)}
									>
										{tempTags.includes(tag) ? '✓ ' : ''}{tag}
									</button>
								{/each}
							</div>
							<button class="btn-primary w-full" on:click={saveTags}>
								保存标签
							</button>
						</div>
					{:else}
						{#if record.evaluationTags && record.evaluationTags.length > 0}
							<div class="flex flex-wrap gap-2">
								{#each record.evaluationTags as tag}
									<span class="badge bg-indigo-100 text-indigo-800 px-3 py-1">
										{tag}
									</span>
								{/each}
							</div>
						{:else}
							<p class="text-gray-500 text-sm">暂无标签</p>
						{/if}
					{/if}
				</div>
			</div>

			<!-- Middle column: Order info & address -->
			<div class="lg:col-span-1 space-y-6">
				<!-- Item info -->
				<div class="card p-4">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">物品信息</h2>
					<dl class="space-y-3">
						<div>
							<dt class="text-sm text-gray-500">物品名称</dt>
							<dd class="text-sm font-medium text-gray-900">{record.itemName}</dd>
						</div>
						<div>
							<dt class="text-sm text-gray-500">数量</dt>
							<dd class="text-sm font-medium text-gray-900">{record.itemQuantity} 件</dd>
						</div>
						<div>
							<dt class="text-sm text-gray-500">物品描述</dt>
							<dd class="text-sm text-gray-900">{record.itemDescription || '-'}</dd>
						</div>
						{#if record.abnormalType && record.abnormalType !== 'none'}
						<div class="pt-3 border-t border-gray-100">
							<dt class="text-sm text-gray-500">异常类型</dt>
							<dd>
								<span class="badge bg-red-100 text-red-800 mt-1">
									{getAbnormalLabel(record.abnormalType)}
								</span>
							</dd>
						</div>
						{/if}
					</dl>
				</div>

				<!-- Address info -->
				<div class="card p-4">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">订单地址</h2>
					<dl class="space-y-4">
						<div>
							<dt class="text-sm text-gray-500 mb-1 flex items-center">
							<span class="w-2 h-2 rounded-full bg-green-500 mr-2" />
								取货地址
							</dt>
							<dd class="text-sm text-gray-900 pl-4 border-l-2 border-green-200 ml-1">
								{record.pickupAddress || '未填写'}
							</dd>
						</div>
						<div>
							<dt class="text-sm text-gray-500 mb-1 flex items-center">
								<span class="w-2 h-2 rounded-full bg-red-500 mr-2" />
								送货地址
							</dt>
							<dd class="text-sm text-gray-900 pl-4 border-l-2 border-red-200 ml-1">
								{record.deliveryAddress || '-'}
							</dd>
						</div>
					</dl>
				</div>

				<!-- Rider info -->
				<div class="card p-4">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">骑手信息</h2>
					{#if record.rider}
						<dl class="space-y-3">
							<div>
								<dt class="text-sm text-gray-500">姓名</dt>
								<dd class="text-sm font-medium text-gray-900">{record.rider.name}</dd>
							</div>
							<div>
								<dt class="text-sm text-gray-500">手机号</dt>
								<dd class="text-sm text-gray-900">{record.rider.phone}</dd>
							</div>
							<div>
								<dt class="text-sm text-gray-500">来源渠道</dt>
								<dd class="text-sm text-gray-900">{record.channel?.name || '-'}</dd>
							</div>
						</dl>
					{:else}
						<p class="text-sm text-gray-500">未分配骑手</p>
					{/if}
				</div>
			</div>

			<!-- Right column: Remark & Logs -->
			<div class="lg:col-span-1 space-y-6">
				<!-- Responsible person -->
				<div class="card p-4">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">责任人信息</h2>
					<dl class="space-y-3">
						<div>
							<dt class="text-sm text-gray-500">责任人</dt>
							<dd class="text-sm font-medium text-gray-900">
								{record.responsiblePerson || '未指定'}
							</dd>
						</div>
						<div>
							<dt class="text-sm text-gray-500">处理人</dt>
							<dd class="text-sm text-gray-900">{record.handler?.username || '-'}</dd>
						</div>
						<div>
							<dt class="text-sm text-gray-500">复核人</dt>
							<dd class="text-sm text-gray-900">{record.reviewer?.username || '-'}</dd>
						</div>
						{#if record.closeReason}
						<div class="pt-3 border-t border-gray-100">
							<dt class="text-sm text-gray-500">关闭原因</dt>
							<dd class="text-sm text-gray-900">{record.closeReason}</dd>
						</div>
						{/if}
					</dl>
				</div>

				<!-- Remark -->
				<div class="card p-4">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-lg font-semibold text-gray-900">备注</h2>
						<button
							class="text-sm text-indigo-600 hover:text-indigo-800"
							on:click={() => (editingRemark = !editingRemark)}
						>
							{editingRemark ? '取消' : '编辑'}
						</button>
					</div>

					{#if editingRemark}
						<div class="space-y-3">
							<textarea
								class="input h-24 resize-none"
								bind:value={tempRemark}
								placeholder="输入备注信息..."
							/>
							<button class="btn-primary w-full" on:click={saveRemark}>
								保存备注
							</button>
						</div>
					{:else}
						<p class="text-sm text-gray-700 whitespace-pre-wrap">
							{record.remark || '暂无备注'}
						</p>
					{/if}
				</div>

				<!-- Operation logs -->
				<div class="card p-4">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">操作记录</h2>
					<div class="space-y-3 max-h-64 overflow-y-auto">
						{#if logs.length === 0}
							<p class="text-sm text-gray-500">暂无操作记录</p>
						{:else}
							{#each logs as log}
								<div class="flex start space-x-3">
									<div class="flex flex-col items-center">
										<div class="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
										{#if log !== logs[logs.length - 1]}
											<div class="w-px flex-1 bg-gray-200" />
										{/if}
									</div>
									<div class="flex-1 pb-3">
										<div class="flex items-center justify-between">
											<span class="text-sm font-medium text-gray-900">
												{log.operator?.username || '系统'}
											</span>
											<span class="text-xs text-gray-500">
												{formatDate(log.createdAt)}
											</span>
										</div>
										<p class="text-sm text-gray-600 mt-0.5">
											{log.remark || log.action}
										</p>
										{#if log.previousStatus && log.newStatus && log.previousStatus !== log.newStatus}
											<p class="text-xs text-gray-500 mt-1">
												{getStatusLabel(log.previousStatus)} → {getStatusLabel(log.newStatus)}
											</p>
										{/if}
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Status update modal -->
{#if showStatusModal}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:p-0">
			<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" on:click={() => (showStatusModal = false)} />

			<div class="relative inline-block w-full max-w-md transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all">
				<div class="px-6 py-4 border-b border-gray-200">
					<h3 class="text-lg font-medium text-gray-900">更新状态</h3>
				</div>

				<div class="px-6 py-4 space-y-4">
					<div>
						<label class="label">状态</label>
						<select class="select" bind:value={selectedStatus}>
							{#each statusOptions as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="label">异常类型</label>
						<select class="select" bind:value={selectedAbnormalType}>
							{#each abnormalOptions as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="label">责任人</label>
						<input type="text" class="input" bind:value={responsiblePerson} placeholder="输入责任人姓名" />
					</div>

					{#if selectedStatus === 'closed'}
					<div>
						<label class="label">关闭原因</label>
						<input type="text" class="input" bind:value={closeReason} placeholder="输入关闭原因" />
					</div>
					{/if}

					<div>
						<label class="label">备注</label>
						<textarea class="input h-20 resize-none" bind:value={statusRemark} placeholder="状态变更说明" />
					</div>
				</div>

				<div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
					<button class="btn-secondary" on:click={() => (showStatusModal = false)}>
						取消
					</button>
					<button class="btn-primary" on:click={updateStatus}>
						确认更新
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
