<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		ArrowLeft, User, Phone, Car, Wrench, Calendar, Clock, CreditCard,
		FileText, Package, Paperclip, Activity, Upload, X, Download,
		Trash2, AlertTriangle, Image, File, ChevronRight, Check, Circle,
		CheckCircle2
	} from 'lucide-svelte';
	import {
		mockWorkOrders, mockParts, delay,
		type MockWorkOrder, type WorkOrderItem
	} from '$lib/mock/data';

	// TODO: tRPC 调用 - 替换为真实数据
	// import { trpc } from '$lib/trpc/client';
	// const wo = await trpc.workOrder.get.query($page.params.id);
	// const attachments = await trpc.attachment.list.query({ refType: 'WORK_ORDER', refId: $page.params.id });

	let loading = true;
	let workOrder: MockWorkOrder | null = null;
	let activeTab: 'items' | 'parts' | 'attachments' | 'logs' = 'items';
	let uploadDragging = false;
	let newAttachments: File[] = [];

	onMount(async () => {
		await delay(null, 300);
		workOrder = mockWorkOrders.find(w => w.id === $page.params.id) || mockWorkOrders[0];
		loading = false;
	});

	function statusClass(s: string) {
		switch (s) {
			case 'PENDING': return 'bg-slate-100 text-slate-700';
			case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
			case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700';
			case 'INSPECTION': return 'bg-purple-100 text-purple-700';
			case 'COMPLETED': return 'bg-green-100 text-green-700';
			case 'CANCELLED': return 'bg-red-100 text-red-700';
			default: return 'bg-slate-100 text-slate-700';
		}
	}
	function statusName(s: string) {
		switch (s) {
			case 'PENDING': return '待确认';
			case 'CONFIRMED': return '已确认';
			case 'IN_PROGRESS': return '施工中';
			case 'INSPECTION': return '质检中';
			case 'COMPLETED': return '已完成';
			case 'CANCELLED': return '已取消';
			default: return s;
		}
	}
	function itemStatusIcon(s: string) {
		switch (s) {
			case 'TODO': return Circle;
			case 'DOING': return Activity;
			case 'DONE': return CheckCircle2;
			default: return Circle;
		}
	}
	function itemStatusClass(s: string) {
		switch (s) {
			case 'TODO': return 'text-slate-400';
			case 'DOING': return 'text-amber-500 animate-pulse';
			case 'DONE': return 'text-green-500';
			default: return 'text-slate-400';
		}
	}
	function itemStatusName(s: string) {
		switch (s) {
			case 'TODO': return '待施工';
			case 'DOING': return '施工中';
			case 'DONE': return '已完成';
			default: return s;
		}
	}
	function formatFileSize(bytes: number) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
	}
	function fileIconClass(mime: string) {
		if (mime.startsWith('image/')) return 'text-pink-500 bg-pink-50';
		if (mime.includes('pdf')) return 'text-red-500 bg-red-50';
		return 'text-blue-500 bg-blue-50';
	}
	function fileIcon(mime: string) {
		if (mime.startsWith('image/')) return Image;
		return File;
	}
	async function handleUpload(e: DragEvent | Event) {
		let files: FileList | null = null;
		if (e instanceof DragEvent && e.dataTransfer) {
			files = e.dataTransfer.files;
		} else if (e.target instanceof HTMLInputElement) {
			files = e.target.files;
		}
		if (!files) return;
		// TODO: tRPC 调用 - 替换为真实上传
		// const formData = new FormData();
		// for (let i = 0; i < files.length; i++) formData.append('files', files[i]);
		// await fetch('/api/attachments', { method: 'POST', body: formData });
		await delay(null, 500);
		alert(`模拟上传成功: ${files.length} 个文件`);
		uploadDragging = false;
	}
	const statusTimeline = [
		{ key: 'PENDING', label: '创建工单', desc: '客户到店，创建维修工单' },
		{ key: 'CONFIRMED', label: '确认项目', desc: '与客户确认维修项目及报价' },
		{ key: 'IN_PROGRESS', label: '施工中', desc: '技师正在执行维修作业' },
		{ key: 'INSPECTION', label: '质量检验', desc: '完工后进行全面质检' },
		{ key: 'COMPLETED', label: '交车完成', desc: '客户验收，完成结算' }
	];

	function getTimelineStepState(wo: MockWorkOrder | null, idx: number): { isDone: boolean; isCurrent: boolean } {
		if (!wo) return { isDone: false, isCurrent: false };
		const currentIdx = statusTimeline.findIndex(s => s.key === wo.status);
		const stepKey = statusTimeline[idx]?.key;
		return {
			isDone: idx < currentIdx || stepKey === wo.status,
			isCurrent: stepKey === wo.status
		};
	}
	function getTimelineCurrentIdx(wo: MockWorkOrder | null): number {
		if (!wo) return -1;
		return statusTimeline.findIndex(s => s.key === wo.status);
	}
	type WorkOrderLog = { time: Date; operator: string; action: string; detail: string };
	function getWorkOrderLogs(wo: MockWorkOrder | null): WorkOrderLog[] {
		if (!wo) return [];
		return [
			{ time: wo.createdAt, operator: wo.advisor.name, action: '创建工单', detail: `创建工单 ${wo.orderNo}` },
			{ time: new Date(wo.createdAt.getTime() + 30 * 60 * 1000), operator: wo.advisor.name, action: '添加项目', detail: `添加维修项目 2 项` },
			{ time: new Date(wo.createdAt.getTime() + 60 * 60 * 1000), operator: '系统', action: '状态变更', detail: '工单状态变更为 已确认' }
		];
	}

	$: if (workOrder) {
		const orderIdx = statusTimeline.findIndex(s => s.key === workOrder?.status);
		orderIdx;
	}

	const tabs = [
		{ key: 'items' as const, label: '项目清单', icon: FileText, count: workOrder?.items?.length || 0 },
		{ key: 'parts' as const, label: '配件出库', icon: Package, count: workOrder?.movements?.filter(m => m.type === 'OUT').length || 0 },
		{ key: 'attachments' as const, label: '附件上传', icon: Paperclip, count: workOrder?.attachments?.length || 0 },
		{ key: 'logs' as const, label: '流转日志', icon: Activity, count: 0 }
	];
</script>

<div class="min-h-screen bg-slate-50 p-6 lg:p-8">
	<button
		on:click={() => goto('/work-orders')}
		class="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-6 transition-colors"
	>
		<ArrowLeft class="w-5 h-5" />
		返回工单列表
	</button>

	{#if loading || !workOrder}
		<div class="flex items-center justify-center py-32">
			<div class="inline-flex items-center gap-2 text-slate-500">
				<svg class="animate-spin h-5 w-5 text-primary-500" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
				</svg>
				加载中...
			</div>
		</div>
	{:else}
		<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
			<div class="p-6 lg:p-8 border-b border-slate-100">
				<div class="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
					<div class="space-y-4 flex-1">
						<div class="flex flex-wrap items-center gap-3">
							<h1 class="text-2xl lg:text-3xl font-bold text-slate-900 font-display">{workOrder.orderNo}</h1>
							<span class={'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ' + statusClass(workOrder.status)}>
								{statusName(workOrder.status)}
							</span>
							{#if workOrder.remark}
								<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm">
									<AlertTriangle class="w-4 h-4" />
									{workOrder.remark}
								</div>
							{/if}
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
							<div class="space-y-2">
								<div class="text-xs text-slate-500 flex items-center gap-1.5"><Car class="w-3.5 h-3.5" /> 车辆信息</div>
								<div class="font-bold text-lg text-slate-900">{workOrder.vehicle.plateNumber}</div>
								<div class="text-sm text-slate-600">{workOrder.vehicle.brand} {workOrder.vehicle.model}</div>
								<div class="text-xs text-slate-500">VIN: {workOrder.vehicle.vin}</div>
								<div class="text-xs text-slate-500">里程: {workOrder.vehicle.mileage.toLocaleString()} km</div>
							</div>
							<div class="space-y-2">
								<div class="text-xs text-slate-500 flex items-center gap-1.5"><User class="w-3.5 h-3.5" /> 客户信息</div>
								<div class="font-bold text-lg text-slate-900">{workOrder.customer.name}</div>
								<div class="text-sm text-slate-600 flex items-center gap-1.5">
									<Phone class="w-3.5 h-3.5" /> {workOrder.customer.phone}
								</div>
								{#if workOrder.customer.remark}
									<div class="text-xs text-primary-600">{workOrder.customer.remark}</div>
								{/if}
							</div>
							<div class="space-y-2">
								<div class="text-xs text-slate-500 flex items-center gap-1.5"><Wrench class="w-3.5 h-3.5" /> 负责人员</div>
								<div class="flex items-center gap-2">
									<div class="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
										{workOrder.advisor.name.charAt(0)}
									</div>
									<div>
										<div class="font-semibold text-slate-800">{workOrder.advisor.name}</div>
										<div class="text-xs text-slate-500">服务顾问</div>
									</div>
								</div>
								<div class="flex items-center gap-2 pt-2">
									<div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold">
										{workOrder.technician ? workOrder.technician.name.charAt(0) : '?'}
									</div>
									<div>
										<div class="font-semibold text-slate-800">{workOrder.technician?.name || '待分配'}</div>
										<div class="text-xs text-slate-500">主技师</div>
									</div>
								</div>
							</div>
							<div class="space-y-2">
								<div class="text-xs text-slate-500 flex items-center gap-1.5"><CreditCard class="w-3.5 h-3.5" /> 金额信息</div>
								<div class="font-bold text-2xl text-accent-600">¥{Number(workOrder.totalAmount).toLocaleString()}</div>
								<div class="text-xs text-slate-500">
									<Calendar class="w-3.5 h-3.5 inline mr-1" />
									创建: {workOrder.createdAt.getFullYear()}-{String(workOrder.createdAt.getMonth() + 1).padStart(2, '0')}-{String(workOrder.createdAt.getDate()).padStart(2, '0')}
								</div>
								{#if workOrder.completedAt}
									<div class="text-xs text-slate-500">
										<Check class="w-3.5 h-3.5 inline mr-1" />
										完成: {workOrder.completedAt.getFullYear()}-{String(workOrder.completedAt.getMonth() + 1).padStart(2, '0')}-{String(workOrder.completedAt.getDate()).padStart(2, '0')}
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
				<div class="mb-4">
					<h3 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
						<Activity class="w-4 h-4" /> 工单流转
					</h3>
				</div>
				<div class="relative">
					<div class="flex items-start">
						{#each statusTimeline as step, idx}
							{@const state = getTimelineStepState(workOrder, idx)}
							{@const curIdx = getTimelineCurrentIdx(workOrder)}
							<div class="flex-1 relative">
								<div class="flex flex-col items-center text-center px-2">
									<div class={'relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ' + (state.isCurrent ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 ring-4 ring-primary-100' : state.isDone ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400')}>
										{#if state.isDone && !state.isCurrent}
											<Check class="w-5 h-5" />
										{:else}
											{idx + 1}
										{/if}
									</div>
									<div class="mt-3 space-y-1 max-w-[140px]">
										<div class={'text-sm font-semibold ' + (state.isCurrent ? 'text-primary-700' : state.isDone ? 'text-slate-700' : 'text-slate-400')}>{step.label}</div>
										<div class="text-xs text-slate-500 line-clamp-2">{step.desc}</div>
									</div>
								</div>
								{#if idx < statusTimeline.length - 1}
									<div class={'absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2 z-0 ' + (state.isDone && idx < curIdx ? 'bg-green-500' : 'bg-slate-200')} />
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
			<div class="border-b border-slate-100 px-2">
				<div class="flex">
					{#each tabs as tab}
						<button
							on:click={() => activeTab = tab.key}
							class="relative px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap {activeTab === tab.key ? 'text-primary-700' : 'text-slate-500 hover:text-slate-700'}"
						>
							<span class="inline-flex items-center gap-2">
								<svelte:component this={tab.icon} class="w-4.5 h-4.5" />
								{tab.label}
								{#if tab.count > 0}
									<span class="px-2 py-0.5 rounded-full text-xs font-semibold {activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}">{tab.count}</span>
								{/if}
							</span>
							{#if activeTab === tab.key}
								<div class="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-600 rounded-t-full" />
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<div class="p-6 lg:p-8">
				{#if activeTab === 'items'}
					<div class="space-y-6">
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold text-slate-900">维修项目清单</h3>
							<button class="text-sm text-primary-600 hover:text-primary-700 font-medium">+ 添加项目</button>
						</div>
						<div class="overflow-x-auto">
							<table class="w-full">
								<thead class="bg-slate-50 border border-slate-200 rounded-xl">
									<tr>
										<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4 w-12">状态</th>
										<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">项目名称</th>
										<th class="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">工时</th>
										<th class="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">工时费</th>
										<th class="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">配件费</th>
										<th class="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">小计</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-100">
									{#each workOrder.items as item, idx}
										<tr class="hover:bg-slate-50/50 transition-colors">
											<td class="py-4 px-4">
												<button on:click={() => alert('TODO: 修改状态')} class={itemStatusClass(item.status) + ' transition-transform hover:scale-110'}>
													<svelte:component this={itemStatusIcon(item.status)} class="w-6 h-6" />
												</button>
											</td>
											<td class="py-4 px-4">
												<div class="flex items-center gap-3">
													<div class="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
													<div>
														<div class="font-semibold text-slate-800">{item.name}</div>
														<div class="text-xs text-slate-500 mt-0.5">{itemStatusName(item.status)}</div>
													</div>
												</div>
											</td>
											<td class="py-4 px-4 text-right text-sm text-slate-700">{Number(item.laborHours)}h</td>
											<td class="py-4 px-4 text-right text-sm text-slate-700">¥{Number(item.laborPrice).toLocaleString()}</td>
											<td class="py-4 px-4 text-right text-sm text-slate-700">¥{Number(item.partsPrice).toLocaleString()}</td>
											<td class="py-4 px-4 text-right">
												<span class="font-bold text-accent-600">¥{(Number(item.laborPrice) + Number(item.partsPrice)).toLocaleString()}</span>
											</td>
										</tr>
									{/each}
								</tbody>
								<tfoot>
									<tr class="border-t-2 border-slate-200 bg-slate-50/50">
										<td colspan="3" class="py-4 px-4 text-right font-semibold text-slate-700">合计：</td>
										<td class="py-4 px-4 text-right font-semibold text-slate-700">¥{workOrder.items.reduce((s, i) => s + Number(i.laborPrice), 0).toLocaleString()}</td>
										<td class="py-4 px-4 text-right font-semibold text-slate-700">¥{workOrder.items.reduce((s, i) => s + Number(i.partsPrice), 0).toLocaleString()}</td>
										<td class="py-4 px-4 text-right">
											<span class="text-xl font-bold text-accent-600">¥{Number(workOrder.totalAmount).toLocaleString()}</span>
										</td>
									</tr>
								</tfoot>
							</table>
						</div>
					</div>
				{:else if activeTab === 'parts'}
					<div class="space-y-6">
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold text-slate-900">配件出库明细</h3>
							<button class="text-sm text-primary-600 hover:text-primary-700 font-medium">+ 出库配件</button>
						</div>
						{#if workOrder.movements.filter(m => m.type === 'OUT').length === 0}
							<div class="py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
								<Package class="w-12 h-12 mx-auto mb-3 text-slate-300" />
								暂无出库记录
							</div>
						{:else}
							<div class="overflow-x-auto">
								<table class="w-full">
									<thead class="bg-slate-50">
										<tr>
											<th class="text-left text-xs font-semibold text-slate-500 uppercase py-3 px-4">配件SKU</th>
											<th class="text-left text-xs font-semibold text-slate-500 uppercase py-3 px-4">配件名称</th>
											<th class="text-left text-xs font-semibold text-slate-500 uppercase py-3 px-4">分类</th>
											<th class="text-right text-xs font-semibold text-slate-500 uppercase py-3 px-4">数量</th>
											<th class="text-right text-xs font-semibold text-slate-500 uppercase py-3 px-4">单价</th>
											<th class="text-left text-xs font-semibold text-slate-500 uppercase py-3 px-4">出库时间</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-slate-100">
										{#each workOrder.movements.filter(m => m.type === 'OUT') as mv}
											<tr class="hover:bg-slate-50/50">
												<td class="py-4 px-4 font-mono text-sm text-slate-600">{mv.part?.sku || '-'}</td>
												<td class="py-4 px-4 font-medium text-slate-800">{mv.part?.name || '-'}</td>
												<td class="py-4 px-4">
													<span class="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs">{mv.part?.category || '-'}</span>
												</td>
												<td class="py-4 px-4 text-right font-semibold text-accent-600">{mv.quantity} {mv.part?.unit || ''}</td>
												<td class="py-4 px-4 text-right text-sm text-slate-700">¥{mv.part?.unitPrice ? Number(mv.part.unitPrice).toLocaleString() : '-'}</td>
												<td class="py-4 px-4 text-sm text-slate-500">
													{mv.createdAt.getMonth() + 1}/{mv.createdAt.getDate()} {mv.createdAt.getHours()}:{String(mv.createdAt.getMinutes()).padStart(2, '0')}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</div>
				{:else if activeTab === 'attachments'}
					<div class="space-y-6">
						<h3 class="text-lg font-semibold text-slate-900">附件资料</h3>
						<div
							on:dragover|preventDefault={() => uploadDragging = true}
							on:dragleave={() => uploadDragging = false}
							on:drop|preventDefault={(e) => handleUpload(e)}
							class={'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ' + (uploadDragging ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50')}
						>
							<div class="inline-flex w-14 h-14 rounded-2xl bg-primary-100 text-primary-600 items-center justify-center mb-4">
								<Upload class="w-7 h-7" />
							</div>
							<p class="font-medium text-slate-800 mb-1">拖拽文件到此处上传</p>
							<p class="text-sm text-slate-500 mb-4">支持 JPG、PNG、PDF 等格式，单文件最大 20MB</p>
							<label class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl cursor-pointer font-medium transition-colors">
								选择文件
								<input type="file" multiple class="hidden" accept="image/*,.pdf" on:change={handleUpload} />
							</label>
						</div>

						{#if workOrder.attachments.length === 0}
							<div class="py-12 text-center text-slate-400">
								<Paperclip class="w-10 h-10 mx-auto mb-2 text-slate-300" />
								暂无附件
							</div>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{#each workOrder.attachments as att}
									<div class="group relative border border-slate-200 rounded-xl p-4 hover:border-primary-200 hover:shadow-md transition-all">
										<div class="flex items-start gap-3">
											<div class={'w-12 h-12 rounded-xl flex items-center justify-center ' + fileIconClass(att.mimeType)}>
												<svelte:component this={fileIcon(att.mimeType)} class="w-6 h-6" />
											</div>
											<div class="flex-1 min-w-0">
												<div class="font-medium text-slate-800 truncate" title={att.fileName}>{att.fileName}</div>
												<div class="text-xs text-slate-500 mt-0.5">{formatFileSize(Number(att.fileSize))}</div>
												<div class="text-xs text-slate-400 mt-0.5">{att.createdAt.getMonth() + 1}/{att.createdAt.getDate()}</div>
											</div>
										</div>
										<div class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
											<button class="flex-1 py-1.5 rounded-lg text-xs text-primary-600 hover:bg-primary-50 flex items-center justify-center gap-1 transition-colors">
												<Download class="w-3.5 h-3.5" /> 下载
											</button>
											<button class="flex-1 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 flex items-center justify-center gap-1 transition-colors">
												<Trash2 class="w-3.5 h-3.5" /> 删除
											</button>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{:else if activeTab === 'logs'}
					<div class="space-y-6">
						<h3 class="text-lg font-semibold text-slate-900">操作日志</h3>
						<div class="relative pl-6">
							<div class="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200" />
							{#each getWorkOrderLogs(workOrder) as log}
								<div class="relative pb-6 last:pb-0">
									<div class="absolute -left-[18px] top-1.5 w-4 h-4 rounded-full bg-primary-600 ring-4 ring-white border-2 border-primary-200" />
									<div class="bg-slate-50 rounded-xl p-4">
										<div class="flex items-start justify-between gap-4">
											<div>
												<div class="font-semibold text-slate-800">
													<span class="text-primary-600">{log.operator}</span>
													{log.action}
												</div>
												<div class="text-sm text-slate-600 mt-1">{log.detail}</div>
											</div>
											<span class="text-xs text-slate-400 whitespace-nowrap">
												{log.time.getMonth() + 1}/{log.time.getDate()} {log.time.getHours()}:{String(log.time.getMinutes()).padStart(2, '0')}
											</span>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
