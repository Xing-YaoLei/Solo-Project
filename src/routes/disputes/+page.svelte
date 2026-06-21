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
	let filterType = '';
	let filterStatus = '';
	let filterSeverity = '';
	let keyword = '';
	let startDate = '';
	let endDate = '';

	let selectedId = '';
	let selectedDetail: any = null;
	let detailLoading = false;
	let newMessage = '';

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
				trpc.dispute.list.query({
					page, pageSize,
					eventId: filterEventId || undefined,
					type: filterType || undefined,
					status: filterStatus || undefined,
					severity: filterSeverity || undefined,
					title: keyword || undefined,
					dateRange: (startDate || endDate) ? { startDate: startDate || undefined, endDate: endDate || undefined } : undefined
				}),
				trpc.dispute.statistics.query({
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

	async function loadDetail(id: string) {
		selectedId = id;
		detailLoading = true;
		try {
			selectedDetail = await trpc.dispute.get.query({ id });
		} finally {
			detailLoading = false;
		}
	}

	async function submit() {
		try {
			await trpc.dispute.create.mutate({
				eventId: form.eventId,
				type: form.type || 'refund_dispute',
				sourceType: form.sourceType || 'operator_report',
				relatedOrderId: form.relatedOrderId || undefined,
				relatedVerificationId: form.relatedVerificationId || undefined,
				title: form.title,
				description: form.description,
				severity: form.severity || 'medium',
				partyResponsible: form.partyResponsible || undefined,
				responsibilityDetail: form.responsibilityDetail,
				impactScope: form.impactScope ? JSON.parse(form.impactScope) : undefined
			});
			showCreateModal = false;
			form = {};
			await load();
		} catch (e: any) {
			alert(e?.message ?? '创建失败');
		}
	}

	async function updateStatus(status: string) {
		if (!selectedDetail?.dispute) return;
		try {
			await trpc.dispute.updateStatus.mutate({
				id: selectedDetail.dispute.id,
				status,
				resolution: selectedDetail.dispute.resolution,
				reason: `状态变更为: ${status}`
			});
			await loadDetail(selectedDetail.dispute.id);
			await load();
		} catch (e: any) { alert(e?.message ?? '操作失败'); }
	}

	async function submitResolution() {
		if (!selectedDetail?.dispute) return;
		try {
			await trpc.dispute.updateStatus.mutate({
				id: selectedDetail.dispute.id,
				status: 'resolved',
				resolution: selectedDetail.dispute.resolution || 'other',
				resolutionDetail: (selectedDetail.dispute as any).resolutionDetail_input,
				refundAmount: (selectedDetail.dispute as any).refundAmount_input,
				compensationAmount: (selectedDetail.dispute as any).compensationAmount_input
			});
			await loadDetail(selectedDetail.dispute.id);
			await load();
		} catch (e: any) { alert(e?.message ?? '操作失败'); }
	}

	async function updateImpact() {
		if (!selectedDetail?.dispute) return;
		try {
			const impact = (selectedDetail.dispute as any).impactScope_input
				? JSON.parse((selectedDetail.dispute as any).impactScope_input)
				: selectedDetail.dispute.impactScope;
			await trpc.dispute.updateImpact.mutate({
				id: selectedDetail.dispute.id,
				impactScope: impact,
				partyResponsible: selectedDetail.dispute.partyResponsible,
				responsibilityDetail: selectedDetail.dispute.responsibilityDetail
			});
			alert('已更新');
			await loadDetail(selectedDetail.dispute.id);
		} catch (e: any) { alert(e?.message ?? '操作失败'); }
	}

	async function sendMessage() {
		if (!selectedDetail?.dispute || !newMessage.trim()) return;
		try {
			await trpc.dispute.addMessage.mutate({
				disputeTicketId: selectedDetail.dispute.id,
				content: newMessage.trim()
			});
			newMessage = '';
			await loadDetail(selectedDetail.dispute.id);
		} catch (e: any) { alert(e?.message ?? '发送失败'); }
	}

	onMount(async () => {
		await loadEvents();
		await load();
	});

	$effect(() => {
		load();
	});

	const sevColor = (s: string) =>
		s === 'critical' ? 'badge-red' :
		s === 'high' ? 'badge-orange' :
		s === 'medium' ? 'badge-yellow' : 'badge-gray';
</script>

<div class="p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1>异常单 / 退票争议</h1>
			<p class="text-sm text-slate-500 mt-1">记录影响范围、责任归属与处理结果，形成完整追溯链</p>
		</div>
		<button class="btn-danger" on:click={() => (showCreateModal = true)}>🚨 提交异常</button>
	</div>

	{#if stats?.overview}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div class="stat-card border-l-4 !border-l-red-500"><div class="stat-label">待处理/调查中</div><div class="stat-value text-red-600">{(stats.overview.open ?? 0) + (stats.overview.investigating ?? 0)}</div></div>
			<div class="stat-card border-l-4 !border-l-yellow-500"><div class="stat-label">总数</div><div class="stat-value">{stats.overview.total}</div></div>
			<div class="stat-card border-l-4 !border-l-green-500"><div class="stat-label">已解决</div><div class="stat-value text-green-600">{stats.overview.resolved ?? 0}</div></div>
			<div class="stat-card border-l-4 !border-l-orange-500"><div class="stat-label">高危紧急</div><div class="stat-value text-orange-600">{(stats.overview.high ?? 0) + (stats.overview.critical ?? 0)}</div></div>
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
		<div class="lg:col-span-3 card">
			<div class="card-header">
				<div class="flex flex-wrap gap-2 items-center">
					<select class="select-input w-36" bind:value={filterEventId}>
						<option value="">全部活动</option>
						{#each events as e}<option value={e.event?.id ?? e.id}>{e.event?.name ?? e.name}</option>{/each}
					</select>
					<select class="select-input w-36" bind:value={filterType}>
						<option value="">全部类型</option>
						<option value="refund_dispute">退票争议</option>
						<option value="double_charge">重复扣款</option>
						<option value="fake_ticket">假票</option>
						<option value="duplicate_verify">重复核销</option>
						<option value="other">其他</option>
					</select>
					<select class="select-input w-28" bind:value={filterStatus}>
						<option value="">全部</option>
						<option value="open">待处理</option>
						<option value="investigating">调查中</option>
						<option value="pending_approval">待审批</option>
						<option value="resolved">已解决</option>
						<option value="closed">已归档</option>
					</select>
					<select class="select-input w-28" bind:value={filterSeverity}>
						<option value="">级别</option>
						<option value="critical">紧急</option>
						<option value="high">高</option>
						<option value="medium">中</option>
						<option value="low">低</option>
					</select>
					<input class="input w-48" placeholder="搜索标题" bind:value={keyword} />
					<input class="input w-32" type="date" bind:value={startDate} />
					<input class="input w-32" type="date" bind:value={endDate} />
				</div>
			</div>
			<div class="table-wrap">
				<table class="data-table">
					<thead><tr>
						<th>案件号</th>
						<th>标题</th>
						<th>类型</th>
						<th>级别</th>
						<th>责任方</th>
						<th>状态</th>
						<th>创建</th>
					</tr></thead>
					<tbody>
						{#if loading}
							<tr><td colspan="7" class="py-12 text-center text-slate-400">加载中...</td></tr>
						{:else if items.length === 0}
							<tr><td colspan="7" class="empty-state">暂无异常单</td></tr>
						{:else}
							{#each items as d}
								<tr class="cursor-pointer hover:bg-slate-50 {selectedId === d.id ? 'bg-brand-50' : ''}" on:click={() => loadDetail(d.id)}>
									<td class="font-mono text-xs">{d.caseNo}</td>
									<td class="font-medium">{d.title}</td>
									<td><span class="tag">{d.type}</span></td>
									<td><span class={sevColor(d.severity)}>{d.severity}</span></td>
									<td><span class="text-xs text-slate-600">{d.partyResponsible ?? '待定'}</span></td>
									<td>{@const b = statusBadge(d.status)}<span class={b.cls}>{b.label}</span></td>
									<td class="text-xs text-slate-500">{formatDateTime(d.createdAt)}</td>
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

		<div class="lg:col-span-2">
			<div class="card sticky top-6">
				<div class="card-header"><h3>异常详情</h3></div>
				<div class="card-body">
					{#if !selectedDetail}
						<div class="empty-state text-sm">点击左侧异常单查看详情</div>
					{:else if detailLoading}
						<div class="py-12 text-center text-slate-400">加载中...</div>
					{:else}
						<div class="space-y-4 text-sm max-h-[80vh] overflow-y-auto pr-2">
							<div>
								<div class="flex items-center justify-between mb-2">
									<span class="font-mono text-xs">{selectedDetail.dispute.caseNo}</span>
									<span class={sevColor(selectedDetail.dispute.severity)}>{selectedDetail.dispute.severity}</span>
								</div>
								<div class="text-lg font-semibold">{selectedDetail.dispute.title}</div>
								<div class="flex flex-wrap gap-2 mt-2">
									<span class="tag">{selectedDetail.dispute.type}</span>
									{@const b = statusBadge(selectedDetail.dispute.status)}
									<span class={b.cls}>{b.label}</span>
									{#if selectedDetail.dispute.sourceType}<span class="tag">{selectedDetail.dispute.sourceType}</span>{/if}
								</div>
							</div>

							{#if selectedDetail.dispute.description}
								<div class="rounded-lg bg-slate-50 p-3 text-slate-700 text-xs whitespace-pre-wrap">{selectedDetail.dispute.description}</div>
							{/if}

							<div>
								<div class="flex items-center justify-between mb-1">
									<span class="font-medium">📐 影响范围</span>
								</div>
								<textarea
									class="input text-xs min-h-[60px] font-mono"
									bind:value={(selectedDetail.dispute as any).impactScope_input = (selectedDetail.dispute as any).impactScope_input ?? JSON.stringify(selectedDetail.dispute.impactScope ?? {}, null, 2)}
								/>
								<button class="btn-secondary !py-1 mt-1 text-xs" on:click={updateImpact}>保存影响范围/责任方</button>
							</div>

							<div class="grid grid-cols-2 gap-2">
								<div>
									<label class="label !text-xs">责任归属</label>
									<select class="select-input !text-xs" bind:value={selectedDetail.dispute.partyResponsible}>
										<option value="undetermined">待定</option>
										<option value="buyer">购票人</option>
										<option value="operator">操作人</option>
										<option value="system">系统</option>
										<option value="third_party">第三方</option>
										<option value="venue">场馆</option>
									</select>
								</div>
							</div>
							<div>
								<label class="label !text-xs">责任说明</label>
								<textarea class="input !text-xs min-h-[50px]" bind:value={selectedDetail.dispute.responsibilityDetail ?? ''} />
							</div>

							{#if selectedDetail.relatedData?.order}
								<div class="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-1">
									<div class="text-xs font-semibold text-blue-800">关联订单</div>
									<div class="text-xs">单号：<span class="font-mono">{selectedDetail.relatedData.order.orderNo}</span></div>
									<div class="text-xs">金额：¥{formatMoney(selectedDetail.relatedData.order.totalAmount)} · {selectedDetail.relatedData.order.totalQuantity}张</div>
									<div class="text-xs">状态：{selectedDetail.relatedData.order.status}</div>
								</div>
							{/if}

							<div>
								<div class="font-medium mb-2">🎯 处理结果</div>
								<div class="grid grid-cols-2 gap-2">
									<div>
										<label class="label !text-xs">处理方式</label>
										<select class="select-input !text-xs" bind:value={selectedDetail.dispute.resolution ?? ''}>
											<option value="">请选择</option>
											<option value="full_refund">全额退款</option>
											<option value="partial_refund">部分退款</option>
											<option value="compensation">补偿</option>
											<option value="ticket_reissue">重出票</option>
											<option value="denied">不予处理</option>
											<option value="other">其他</option>
										</select>
									</div>
								</div>
								<div class="grid grid-cols-2 gap-2 mt-2">
									<div><label class="label !text-xs">退款(¥)</label><input class="input !text-xs" bind:value={(selectedDetail.dispute as any).refundAmount_input = (selectedDetail.dispute as any).refundAmount_input ?? String(selectedDetail.dispute.refundAmount ?? 0)} /></div>
									<div><label class="label !text-xs">补偿(¥)</label><input class="input !text-xs" bind:value={(selectedDetail.dispute as any).compensationAmount_input = (selectedDetail.dispute as any).compensationAmount_input ?? String(selectedDetail.dispute.compensationAmount ?? 0)} /></div>
								</div>
								<textarea class="input !text-xs mt-2 min-h-[50px]" placeholder="处理详情说明..." bind:value={(selectedDetail.dispute as any).resolutionDetail_input = (selectedDetail.dispute as any).resolutionDetail_input ?? selectedDetail.dispute.resolutionDetail ?? ''} />
								<button class="btn-primary w-full mt-2 !py-1.5" on:click={submitResolution}>提交处理方案</button>
							</div>

							<div class="flex flex-wrap gap-1 pt-2 border-t border-slate-200">
								{#if selectedDetail.dispute.status === 'open'}<button class="btn-secondary !py-1 !text-xs" on:click={() => updateStatus('investigating')}>开始调查</button>{/if}
								{#if selectedDetail.dispute.status === 'investigating'}<button class="btn-secondary !py-1 !text-xs" on:click={() => updateStatus('pending_approval')}>提交审批</button>{/if}
								{#if selectedDetail.dispute.status === 'pending_approval'}<button class="btn-green !py-1 !text-xs btn" style="background:#16a34a;color:white" on:click={() => updateStatus('resolved')}>通过</button>{/if}
								{#if selectedDetail.dispute.status === 'resolved'}<button class="btn-secondary !py-1 !text-xs" on:click={() => updateStatus('closed')}>归档</button>{/if}
							</div>

							{#if selectedDetail.transitions?.length > 0}
								<div>
									<div class="font-medium mb-2 pt-3 border-t border-slate-200">🔄 状态流转</div>
									<div class="space-y-1">
										{#each selectedDetail.transitions.slice(0, 8) as t}
											<div class="timeline-item !pb-3">
												<div class="timeline-dot" />
												<div class="text-xs">
													<span class="font-medium">{t.transitionType}</span>
													<span class="ml-2 text-slate-500">{formatDateTime(t.createdAt)}</span>
													{#if t.fromStatus}<div class="text-slate-500">{t.fromStatus} → {t.toStatus}</div>{/if}
													{#if t.remark}<div class="text-slate-600">{t.remark}</div>{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<div>
								<div class="font-medium mb-2 pt-3 border-t border-slate-200">💬 内部沟通</div>
								<div class="space-y-2 max-h-40 overflow-y-auto mb-2">
									{#if selectedDetail.messages?.length === 0}
										<div class="text-xs text-slate-400">暂无消息</div>
									{/if}
									{#each selectedDetail.messages ?? [] as m}
										<div class="rounded-lg bg-slate-50 p-2">
											<div class="flex justify-between text-xs">
												<span class="font-medium text-slate-700">{m.senderName ?? m.senderUsername ?? m.senderType}</span>
												<span class="text-slate-400">{formatDateTime(m.message.createdAt)}</span>
											</div>
											<div class="text-sm mt-1">{m.message.content}</div>
										</div>
									{/each}
								</div>
								<div class="flex gap-2">
									<input class="input !py-1.5 text-sm" placeholder="输入内部备注..." bind:value={newMessage} on:keydown={(e) => e.key === 'Enter' && sendMessage()} />
									<button class="btn-primary !py-1.5" on:click={sendMessage}>发送</button>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

{#if showCreateModal}
	<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
		<div class="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
			<div class="card-header"><h3>🚨 提交异常单</h3><button class="btn-ghost !p-1" on:click={() => (showCreateModal = false)}>✕</button></div>
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
						<label class="label">异常类型 *</label>
						<select class="select-input" bind:value={form.type} required>
							<option value="refund_dispute">退票争议</option>
							<option value="double_charge">重复扣款</option>
							<option value="fake_ticket">假票</option>
							<option value="duplicate_verify">重复核销</option>
							<option value="other">其他</option>
						</select>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div><label class="label">严重级别</label>
						<select class="select-input" bind:value={form.severity}>
							<option value="medium">中</option>
							<option value="low">低</option>
							<option value="high">高</option>
							<option value="critical">紧急</option>
						</select>
					</div>
					<div><label class="label">来源渠道</label>
						<select class="select-input" bind:value={form.sourceType}>
							<option value="operator_report">操作人上报</option>
							<option value="customer_complaint">客诉</option>
							<option value="audit_finding">审计发现</option>
							<option value="system_alarm">系统告警</option>
						</select>
					</div>
				</div>
				<div>
					<label class="label">标题 *</label>
					<input class="input" bind:value={form.title} required placeholder="一句话概括问题" />
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div><label class="label">关联订单号(ID)</label><input class="input" bind:value={form.relatedOrderId} /></div>
					<div><label class="label">关联核销码(ID)</label><input class="input" bind:value={form.relatedVerificationId} /></div>
				</div>
				<div>
					<label class="label">问题描述</label>
					<textarea class="input min-h-[100px]" bind:value={form.description} placeholder="详细情况、证据..." />
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="label">初步责任方</label>
						<select class="select-input" bind:value={form.partyResponsible}>
							<option value="undetermined">待定</option>
							<option value="buyer">购票人</option>
							<option value="operator">操作人</option>
							<option value="system">系统</option>
							<option value="third_party">第三方</option>
							<option value="venue">场馆</option>
						</select>
					</div>
				</div>
				<div>
					<label class="label">影响范围 JSON（订单数/票数/金额/座位）</label>
					<textarea class="input min-h-[80px] font-mono text-xs" bind:value={form.impactScope}
						placeholder='{"ticketCount":1,"involvedAmount":"99.00","seats":["A排1座"]}' />
				</div>
				<div>
					<label class="label">责任说明</label>
					<textarea class="input min-h-[60px]" bind:value={form.responsibilityDetail} />
				</div>
				<div class="flex justify-end gap-2 pt-2">
					<button class="btn-secondary" on:click={() => (showCreateModal = false)}>取消</button>
					<button class="btn-danger" disabled={!form.eventId || !form.title} on:click={submit}>提交</button>
				</div>
			</div>
		</div>
	</div>
{/if}
