<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		ArrowLeft, User, FileText, Clock, AlertTriangle, Package, Wrench,
		MessageSquare, AlertOctagon, Send, Shield, CheckCircle2, X,
		ChevronRight, FileText as FileTextIcon
	} from 'lucide-svelte';
	import {
		mockExceptions, mockUsers, delay,
		type MockException, type ExceptionStatus
	} from '$lib/mock/data';

	// TODO: tRPC 调用 - 替换为真实数据
	// import { trpc } from '$lib/trpc/client';
	// const exc = await trpc.exception.get.query($page.params.id);

	let loading = true;
	let exception: MockException | null = null;
	let currentUserRole = 'MANAGER';

	let newLogContent = '';
	let closeConclusion = '';
	let showReviewModal = false;

	onMount(async () => {
		await delay(null, 300);
		exception = mockExceptions.find(e => e.id === $page.params.id) || mockExceptions[0];
		if (exception.closeConclusion) closeConclusion = exception.closeConclusion;
		loading = false;
	});

	function gotoWorkOrderFn(e: MockException) {
		if (e.workOrder) goto(`/work-orders/${e.workOrder.id}`);
	}
	function isLastLogFn(e: MockException, idx: number): boolean {
		return idx === (e.logs?.length || 0) - 1;
	}

	function typeBarColor(t: string) {
		switch (t) {
			case 'PARTS_SHORTAGE': return 'bg-amber-500';
			case 'REWORK': return 'bg-red-500';
			case 'CUSTOMER_COMPLAINT': return 'bg-purple-500';
			default: return 'bg-slate-500';
		}
	}
	function typeBgClass(t: string) {
		switch (t) {
			case 'PARTS_SHORTAGE': return 'bg-amber-50 text-amber-700 border-amber-200';
			case 'REWORK': return 'bg-red-50 text-red-700 border-red-200';
			case 'CUSTOMER_COMPLAINT': return 'bg-purple-50 text-purple-700 border-purple-200';
			default: return 'bg-slate-50 text-slate-700 border-slate-200';
		}
	}
	function typeIcon(t: string) {
		switch (t) {
			case 'PARTS_SHORTAGE': return Package;
			case 'REWORK': return Wrench;
			case 'CUSTOMER_COMPLAINT': return MessageSquare;
			default: return AlertOctagon;
		}
	}
	function typeName(t: string) {
		switch (t) {
			case 'PARTS_SHORTAGE': return '配件短缺';
			case 'REWORK': return '返修异常';
			case 'CUSTOMER_COMPLAINT': return '客户投诉';
			default: return '其他问题';
		}
	}
	function statusClass(s: ExceptionStatus) {
		switch (s) {
			case 'PENDING': return 'bg-slate-100 text-slate-700';
			case 'PROCESSING': return 'bg-blue-100 text-blue-700';
			case 'REVIEWING': return 'bg-amber-100 text-amber-700';
			case 'CLOSED': return 'bg-green-100 text-green-700';
			default: return 'bg-slate-100 text-slate-700';
		}
	}
	function statusName(s: ExceptionStatus) {
		switch (s) {
			case 'PENDING': return '待处理';
			case 'PROCESSING': return '处理中';
			case 'REVIEWING': return '复核中';
			case 'CLOSED': return '已关闭';
			default: return s;
		}
	}
	async function submitLog() {
		if (!newLogContent.trim() || !exception) return;
		// TODO: tRPC 调用
		// await trpc.exception.addLog.mutate({ exceptionId: exception.id, content: newLogContent });
		await delay(null, 300);
		exception = {
			...exception,
			logs: [
				...exception.logs,
				{
					id: `el-new-${Date.now()}`,
					exceptionId: exception.id,
					operatorId: mockUsers[0].id,
					content: newLogContent.trim(),
					createdAt: new Date(),
					operator: mockUsers[0]
				}
			]
		};
		newLogContent = '';
	}
	async function submitClose() {
		if (!closeConclusion.trim() || !exception) return;
		// TODO: tRPC 调用（仅厂长可调用）
		// await trpc.exception.close.mutate({ exceptionId: exception.id, conclusion: closeConclusion });
		await delay(null, 400);
		exception = {
			...exception,
			status: 'CLOSED',
			closeConclusion: closeConclusion.trim(),
			logs: [
				...exception.logs,
				{
					id: `el-close-${Date.now()}`,
					exceptionId: exception.id,
					operatorId: mockUsers[0].id,
					content: `厂长审核关闭：${closeConclusion.trim()}`,
					createdAt: new Date(),
					operator: mockUsers[0]
				}
			]
		};
		showReviewModal = false;
	}
	function startReview() {
		if (currentUserRole !== 'MANAGER') {
			alert('仅厂长角色可进行复核关闭操作');
			return;
		}
		showReviewModal = true;
	}
</script>

<div class="min-h-screen bg-slate-50 p-6 lg:p-8">
	<button
		on:click={() => goto('/exceptions')}
		class="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-6 transition-colors"
	>
		<ArrowLeft class="w-5 h-5" />
		返回异常列表
	</button>

	{#if loading || !exception}
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
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2 space-y-6">
				<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
					<div class="relative">
						<div class={'absolute left-0 top-0 bottom-0 w-1.5 ' + typeBarColor(exception.type)} />
						<div class="p-6 lg:p-8 pl-8">
							<div class="flex flex-wrap items-start justify-between gap-4 mb-6">
								<div>
									<div class="flex flex-wrap items-center gap-3 mb-3">
										<div class={'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ' + typeBgClass(exception.type)}>
											<svelte:component this={typeIcon(exception.type)} class="w-4.5 h-4.5" />
											<span class="text-sm font-semibold">{typeName(exception.type)}</span>
										</div>
										<span class={'inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-semibold ' + statusClass(exception.status)}>
											{statusName(exception.status)}
										</span>
										<span class="font-mono text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-lg">
											{exception.id.toUpperCase()}
										</span>
									</div>
									<h1 class="text-2xl lg:text-3xl font-bold text-slate-900 font-display leading-tight">
										{exception.title}
									</h1>
								</div>
								{#if exception.status !== 'CLOSED' && currentUserRole === 'MANAGER'}
									<button
										on:click={startReview}
										class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
									>
										<Shield class="w-5 h-5" />
										复核关闭
									</button>
								{/if}
							</div>

							<div class="grid grid-cols-2 md:grid-cols-4 gap-5 pt-5 border-t border-slate-100">
								<div class="space-y-1">
									<div class="text-xs text-slate-500 flex items-center gap-1.5"><User class="w-3.5 h-3.5" /> 创建人</div>
									<div class="font-semibold text-slate-800">{exception.creator.name}</div>
									<div class="text-xs text-slate-500">{exception.creator.role === 'MANAGER' ? '厂长' : exception.creator.role === 'ADVISOR' ? '服务顾问' : exception.creator.role === 'TECHNICIAN' ? '技师' : '库管'}</div>
								</div>
								<div class="space-y-1">
									<div class="text-xs text-slate-500 flex items-center gap-1.5"><Wrench class="w-3.5 h-3.5" /> 处理人</div>
									<div class="font-semibold text-slate-800">{exception.assignee.name}</div>
									<div class="text-xs text-slate-500">{exception.assignee.role === 'MANAGER' ? '厂长' : exception.assignee.role === 'ADVISOR' ? '服务顾问' : exception.assignee.role === 'TECHNICIAN' ? '技师' : '库管'}</div>
								</div>
								<div class="space-y-1">
									<div class="text-xs text-slate-500 flex items-center gap-1.5"><FileText class="w-3.5 h-3.5" /> 关联工单</div>
									{#if exception.workOrder}
										<button on:click={() => gotoWorkOrderFn(exception)} class="font-mono font-semibold text-primary-600 hover:text-primary-700 text-left">
											{exception.workOrder.orderNo}
										</button>
										<div class="text-xs text-slate-500">{exception.workOrder.vehicle.plateNumber}</div>
									{:else}
										<div class="font-medium text-slate-400">无</div>
									{/if}
								</div>
								<div class="space-y-1">
									<div class="text-xs text-slate-500 flex items-center gap-1.5"><Clock class="w-3.5 h-3.5" /> 创建时间</div>
									<div class="font-semibold text-slate-800">{exception.createdAt.getFullYear()}-{String(exception.createdAt.getMonth() + 1).padStart(2, '0')}-{String(exception.createdAt.getDate()).padStart(2, '0')}</div>
									<div class="text-xs text-slate-500">{exception.createdAt.getHours()}:{String(exception.createdAt.getMinutes()).padStart(2, '0')}</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
					<div class="flex items-center gap-2 mb-4">
						<div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
							<Package class="w-5 h-5" />
						</div>
						<h3 class="text-lg font-semibold text-slate-900">材料来源</h3>
					</div>
					<div class="rounded-xl bg-slate-50 border border-slate-200 p-5">
						<p class="text-slate-700 whitespace-pre-wrap leading-relaxed">
							{exception.materialSource || '暂无材料来源描述'}
						</p>
					</div>
				</div>

				<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
					<div class="flex items-center justify-between mb-6">
						<div class="flex items-center gap-2">
							<div class="w-9 h-9 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
								<FileTextIcon class="w-5 h-5" />
							</div>
							<h3 class="text-lg font-semibold text-slate-900">处理过程</h3>
						</div>
						<span class="text-sm text-slate-500">共 {exception.logs.length} 条记录</span>
					</div>

					<div class="relative pl-2">
						<div class="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200" />
						<div class="space-y-5">
							{#each exception.logs as log, idx}
								<div class="relative">
									<div class={'absolute -left-[2px] top-2 w-4 h-4 rounded-full ' + (isLastLogFn(exception, idx) && exception.status !== 'CLOSED' ? 'bg-primary-600 ring-4 ring-primary-100 animate-pulse' : 'bg-white border-2 border-slate-300') + ' z-10'} />
									<div class="ml-8">
										<div class="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:bg-slate-50/80 transition-colors">
											<div class="flex flex-wrap items-center justify-between gap-2 mb-2">
												<div class="flex items-center gap-2.5">
													<div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
														{log.operator.name.charAt(0)}
													</div>
													<div>
														<span class="font-semibold text-slate-800">{log.operator.name}</span>
														<span class="text-xs text-slate-400 ml-2">
															{log.operator.role === 'MANAGER' ? '厂长' : log.operator.role === 'ADVISOR' ? '服务顾问' : log.operator.role === 'TECHNICIAN' ? '技师' : '库管'}
														</span>
													</div>
												</div>
												<span class="text-xs text-slate-400 whitespace-nowrap">
													{log.createdAt.getMonth() + 1}/{log.createdAt.getDate()} {log.createdAt.getHours()}:{String(log.createdAt.getMinutes()).padStart(2, '0')}
												</span>
											</div>
											<p class="text-slate-700 leading-relaxed ml-10">{log.content}</p>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>

					{#if exception.status !== 'CLOSED'}
						<div class="mt-6 pt-6 border-t border-slate-100">
							<label class="block text-sm font-medium text-slate-700 mb-2">添加处理记录</label>
							<div class="flex gap-3">
								<textarea
									bind:value={newLogContent}
									rows="2"
									placeholder="请输入处理进展..."
									class="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
								/>
								<button
									on:click={submitLog}
									disabled={!newLogContent.trim()}
									class="self-end px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-medium transition-colors inline-flex items-center gap-2"
								>
									<Send class="w-4 h-4" />
									提交
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<div class="space-y-6">
				{#if exception.status === 'CLOSED'}
					<div class="bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-2xl border border-emerald-200 shadow-sm p-6">
						<div class="flex items-center gap-3 mb-4">
							<div class="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
								<CheckCircle2 class="w-6 h-6" />
							</div>
							<div>
								<h3 class="font-bold text-emerald-800">异常已关闭</h3>
								<p class="text-sm text-emerald-700/80">厂长复核结论</p>
							</div>
						</div>
						<div class="bg-white/70 rounded-xl p-4 border border-emerald-100">
							<p class="text-emerald-900/90 leading-relaxed">
								{exception.closeConclusion || '暂无关闭结论'}
							</p>
						</div>
					</div>
				{:else if currentUserRole === 'MANAGER'}
					<div class="bg-gradient-to-br from-amber-50 to-amber-50/50 rounded-2xl border border-amber-200 shadow-sm p-6">
						<div class="flex items-center gap-3 mb-4">
							<div class="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
								<Shield class="w-6 h-6" />
							</div>
							<div>
								<h3 class="font-bold text-amber-800">厂长复核区</h3>
								<p class="text-sm text-amber-700/80">确认处理完毕后关闭异常</p>
							</div>
						</div>
						<button
							on:click={startReview}
							class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-semibold shadow-md transition-all inline-flex items-center justify-center gap-2"
						>
							<Shield class="w-5 h-5" />
							开始复核关闭
						</button>
					</div>
				{/if}

				{#if exception.workOrder}
					<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
						<div class="flex items-center gap-2 mb-4">
							<div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
								<FileText class="w-5 h-5" />
							</div>
							<h3 class="font-semibold text-slate-900">关联工单</h3>
						</div>
						<button
							on:click={() => goto(`/work-orders/${exception.workOrder!.id}`)}
							class="w-full text-left rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:bg-slate-50 transition-all group"
						>
							<div class="flex items-center justify-between mb-2">
								<span class="font-mono font-bold text-primary-700">{exception.workOrder.orderNo}</span>
								<ChevronRight class="w-5 h-5 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
							</div>
							<div class="space-y-1 text-sm">
								<div class="text-slate-700">
									<span class="font-semibold">{exception.workOrder.vehicle.plateNumber}</span>
									<span class="text-slate-400 mx-1.5">·</span>
									<span>{exception.workOrder.vehicle.brand} {exception.workOrder.vehicle.model}</span>
								</div>
								<div class="text-slate-500">
									客户：{exception.workOrder.customer.name}
									<span class="text-slate-400 mx-1.5">·</span>
									¥{Number(exception.workOrder.totalAmount).toLocaleString()}
								</div>
							</div>
						</button>
					</div>
				{/if}

				<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
					<div class="flex items-center gap-2 mb-4">
						<div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
							<AlertTriangle class="w-5 h-5" />
						</div>
						<h3 class="font-semibold text-slate-900">异常统计</h3>
					</div>
					<div class="space-y-3">
						<div class="flex items-center justify-between py-2.5 border-b border-slate-100">
							<span class="text-sm text-slate-500">处理耗时</span>
							<span class="font-semibold text-slate-800">
								{Math.max(1, Math.floor((Date.now() - exception.createdAt.getTime()) / 86400000))} 天
							</span>
						</div>
						<div class="flex items-center justify-between py-2.5 border-b border-slate-100">
							<span class="text-sm text-slate-500">处理记录</span>
							<span class="font-semibold text-slate-800">{exception.logs.length} 条</span>
						</div>
						<div class="flex items-center justify-between py-2.5">
							<span class="text-sm text-slate-500">参与人数</span>
							<span class="font-semibold text-slate-800">
								{new Set(exception.logs.map(l => l.operatorId)).size} 人
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

{#if showReviewModal && exception}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" on:click={() => showReviewModal = false}>
		<div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" on:click|stopPropagation>
			<div class="flex items-center justify-between mb-6">
				<div class="flex items-center gap-3">
					<div class="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
						<Shield class="w-6 h-6" />
					</div>
					<div>
						<h3 class="text-lg font-bold text-slate-900">复核关闭异常</h3>
						<p class="text-sm text-slate-500">填写关闭结论后确认</p>
					</div>
				</div>
				<button on:click={() => showReviewModal = false} class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
					<X class="w-5 h-5" />
				</button>
			</div>

			<div class="space-y-5">
				<div class="p-4 rounded-xl bg-amber-50 border border-amber-200">
					<div class="text-sm text-amber-800">
						<span class="font-semibold">异常单号：</span>
						<span class="font-mono">{exception.id.toUpperCase()}</span>
					</div>
					<div class="text-sm text-amber-800 mt-1">
						<span class="font-semibold">标题：</span>{exception.title}
					</div>
				</div>

				<div>
					<label class="block text-sm font-semibold text-slate-700 mb-2">
						关闭结论 <span class="text-red-500">*</span>
					</label>
					<textarea
						bind:value={closeConclusion}
						rows="4"
						placeholder="请填写最终处理结论、经验总结、改进措施等..."
						class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
					/>
					<p class="text-xs text-slate-500 mt-1.5">此结论将永久记录，作为异常追溯依据</p>
				</div>
			</div>

			<div class="flex justify-end gap-3 mt-6">
				<button on:click={() => showReviewModal = false} class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors">
					取消
				</button>
				<button
					on:click={submitClose}
					disabled={!closeConclusion.trim()}
					class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-slate-300 disabled:to-slate-300 text-white font-semibold shadow-md transition-all inline-flex items-center gap-2"
				>
					<CheckCircle2 class="w-5 h-5" />
					确认关闭
				</button>
			</div>
		</div>
	</div>
{/if}
