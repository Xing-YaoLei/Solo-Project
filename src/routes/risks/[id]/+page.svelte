<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		riskEventTypeMap,
		riskSeverityMap,
		riskStatusMap,
		careLevelMap,
		communicationTypeMap
	} from '$lib/client-utils';
	import { formatDateTime, formatDate } from '$lib/server/utils';

	type Elderly = { id: string; name: string; roomNumber: string | null; careLevel: string };
	type User = { id: string; fullName: string };
	type Comm = { comm: { id: string; type: string; content: string; createdAt: number }; creator: User };
	type Review = {
		review: { id: string; content: string; reviewResult: string; improvementSuggestions: string | null; createdAt: number };
		reviewer: User;
	};

	let eventDetail: {
		event: {
			id: string;
			eventType: string;
			severity: string;
			status: string;
			occurredAt: number;
			location: string | null;
			description: string;
			immediateAction: string | null;
			resolvedAt: number | null;
			reviewStatus: string;
		};
		elderly: Elderly;
		reporter: User;
	} | null = null;
	let communications: Comm[] = [];
	let reviews: Review[] = [];
	let loading = true;

	let user: App.Locals['user'];

	let showAddComm = false;
	let newComm = { type: 'internal_note' as const, content: '' };

	let showAddReview = false;
	let newReview = { content: '', reviewResult: 'pending', improvementSuggestions: '' };

	const commTypes = [
		{ value: 'internal_note', label: '内部备注' },
		{ value: 'family_call', label: '家属沟通' },
		{ value: 'doctor_consult', label: '医生咨询' },
		{ value: 'meeting', label: '会议记录' }
	];

	const reviewResults = [
		{ value: 'pending', label: '待处理' },
		{ value: 'approved', label: '已通过' },
		{ value: 'needs_improvement', label: '需改进' },
		{ value: 'rejected', label: '驳回' }
	];

	const statusOptions = [
		{ value: 'reported', label: '已上报' },
		{ value: 'investigating', label: '调查中' },
		{ value: 'resolved', label: '已解决' },
		{ value: 'closed', label: '已关闭' }
	];

	$: isManager = user?.role === 'admin' || user?.role === 'manager';
	$: id = $page.params.id;

	onMount(async () => {
		await loadAll();
	});

	async function loadAll() {
		loading = true;
		try {
			const userRes = await fetch('/api/trpc/auth.getCurrentUser', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'auth.getCurrentUser' })
			});
			user = (await userRes.json()).result?.data;

			const res = await fetch('/api/trpc/risk.getById', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 2,
					method: 'risk.getById',
					params: { input: id }
				})
			});
			const data = (await res.json()).result?.data;
			eventDetail = data.event;
			communications = data.communications;
			reviews = data.reviews;
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function saveComm() {
		if (!newComm.content) {
			alert('请填写内容');
			return;
		}
		await fetch('/api/trpc/risk.addCommunication', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'risk.addCommunication',
				params: { input: { riskEventId: id, type: newComm.type, content: newComm.content } }
			})
		});
		showAddComm = false;
		newComm = { type: 'internal_note', content: '' };
		loadAll();
	}

	async function saveReview() {
		if (!newReview.content) {
			alert('请填写复核意见');
			return;
		}
		await fetch('/api/trpc/risk.addReview', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'risk.addReview',
				params: {
					input: {
						riskEventId: id,
						content: newReview.content,
						reviewResult: newReview.reviewResult,
						improvementSuggestions: newReview.improvementSuggestions
					}
				}
			})
		});
		showAddReview = false;
		newReview = { content: '', reviewResult: 'pending', improvementSuggestions: '' };
		loadAll();
	}

	async function updateStatus(status: string) {
		await fetch('/api/trpc/risk.updateStatus', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'risk.updateStatus',
				params: { input: { id, status } }
			})
		});
		loadAll();
	}
</script>

{#if loading || !eventDetail}
	<div class="flex items-center justify-center h-full">
		<div class="text-gray-500">加载中...</div>
	</div>
{:else}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<button class="text-primary-600 hover:underline flex items-center gap-1" on:click={() => goto('/risks')}>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				返回列表
			</button>
			<div class="flex gap-2">
				{#each statusOptions as s}
					{#if eventDetail.event.status !== s.value}
						<button
							class="btn btn-sm btn-secondary"
							on:click={() => updateStatus(s.value)}
						>
							标记为{s.label}
						</button>
					{/if}
				{/each}
			</div>
		</div>

		<div
			class="{eventDetail.event.eventType === 'fall'
				? 'border-l-4 border-red-500 bg-red-50/30'
				: ''} card"
		>
			<div class="card-header">
				<div class="flex items-start justify-between">
					<div>
						<div class="flex items-center gap-2 flex-wrap">
							<h2 class="text-xl font-bold text-gray-800">风险事件详情</h2>
							{eventDetail.event.eventType === 'fall' && (
								<span class="badge bg-red-200 text-red-800 font-bold">🔥 跌倒高危事件</span>
							)}
						</div>
						<div class="mt-2 flex items-center gap-2 flex-wrap">
							<span class="badge {riskEventTypeMap[eventDetail.event.eventType].color}">
								{riskEventTypeMap[eventDetail.event.eventType].label}
							</span>
							<span class="badge {riskSeverityMap[eventDetail.event.severity].color}">
								{riskSeverityMap[eventDetail.event.severity].label}风险
							</span>
							<span class="badge {riskStatusMap[eventDetail.event.status].color}">
								{riskStatusMap[eventDetail.event.status].label}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div class="card-body grid grid-cols-1 md:grid-cols-2 gap-6">
				<div class="space-y-4">
					<div>
						<h3 class="font-semibold text-gray-800 mb-2">👴 涉事老人</h3>
						<div class="p-4 rounded-lg bg-gray-50">
							<div class="flex items-center gap-3">
								<div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
									{eventDetail.elderly.name.charAt(0)}
								</div>
								<div>
									<div class="font-medium text-gray-800 text-lg">{eventDetail.elderly.name}</div>
									<div class="text-sm text-gray-500 mt-0.5">
										{eventDetail.elderly.roomNumber || '未分配房间'} ·{' '}
										<span class="badge {careLevelMap[eventDetail.elderly.careLevel].color}">
											{careLevelMap[eventDetail.elderly.careLevel].label}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div>
						<h3 class="font-semibold text-gray-800 mb-2">📝 事件描述</h3>
						<div class="p-4 rounded-lg bg-gray-50 text-gray-700 whitespace-pre-wrap">
							{eventDetail.event.description}
						</div>
					</div>

					{#if eventDetail.event.immediateAction}
						<div>
							<h3 class="font-semibold text-gray-800 mb-2">🚑 应急措施</h3>
							<div class="p-4 rounded-lg bg-yellow-50 text-gray-700 whitespace-pre-wrap">
								{eventDetail.event.immediateAction}
							</div>
						</div>
					{/if}
				</div>

				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<div class="text-xs text-gray-500 mb-1">发生时间</div>
							<div class="font-medium text-gray-800">{formatDateTime(eventDetail.event.occurredAt)}</div>
						</div>
						<div>
							<div class="text-xs text-gray-500 mb-1">发生地点</div>
							<div class="font-medium text-gray-800">{eventDetail.event.location || '-'}</div>
						</div>
						<div>
							<div class="text-xs text-gray-500 mb-1">上报人</div>
							<div class="font-medium text-gray-800">{eventDetail.reporter.fullName}</div>
						</div>
						<div>
							<div class="text-xs text-gray-500 mb-1">解决时间</div>
							<div class="font-medium text-gray-800">
								{eventDetail.event.resolvedAt ? formatDateTime(eventDetail.event.resolvedAt) : '-'}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="card-header flex items-center justify-between">
				<h3 class="font-semibold text-gray-800">💬 沟通过程（{communications.length}）</h3>
				<button class="btn btn-primary btn-sm" on:click={() => (showAddComm = true)}>
					+ 添加记录
				</button>
			</div>
			<div class="card-body">
				{#if communications.length === 0}
					<div class="text-center py-8 text-gray-400">
						暂无沟通记录
					</div>
				{:else}
					<div class="space-y-4">
						{#each communications as c}
							<div class="p-4 rounded-lg bg-gray-50 border border-gray-100">
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center gap-2">
										<div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
											{c.creator.fullName.charAt(0)}
										</div>
										<span class="font-medium text-gray-800">{c.creator.fullName}</span>
										<span class="badge {communicationTypeMap[c.comm.type].color}">
											{communicationTypeMap[c.comm.type].label}
										</span>
									</div>
									<span class="text-xs text-gray-400">{formatDateTime(c.comm.createdAt)}</span>
								</div>
								<div class="text-gray-700 whitespace-pre-wrap pl-10">{c.comm.content}</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="card">
			<div class="card-header flex items-center justify-between">
				<h3 class="font-semibold text-gray-800">📋 复核意见（{reviews.length}）</h3>
				{#if isManager}
					<button class="btn btn-primary btn-sm" on:click={() => (showAddReview = true)}>
						+ 添加复核
					</button>
				{/if}
			</div>
			<div class="card-body">
				{#if reviews.length === 0}
					<div class="text-center py-8 text-gray-400">
						暂无复核意见
						{#if !isManager}
							<div class="text-xs mt-1">仅管理层可添加复核意见</div>
						{/if}
					</div>
				{:else}
					<div class="space-y-4">
						{#each reviews as r}
							<div class="p-4 rounded-lg bg-blue-50/50 border border-blue-100">
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center gap-2">
										<div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
											{r.reviewer.fullName.charAt(0)}
										</div>
										<span class="font-medium text-gray-800">{r.reviewer.fullName}</span>
										<span
											class="badge {r.review.reviewResult === 'approved'
												? 'bg-green-100 text-green-800'
												: r.review.reviewResult === 'needs_improvement'
													? 'bg-yellow-100 text-yellow-800'
													: r.review.reviewResult === 'rejected'
														? 'bg-red-100 text-red-800'
														: 'bg-gray-100 text-gray-600'}"
										>
											{r.review.reviewResult === 'approved'
												? '已通过'
												: r.review.reviewResult === 'needs_improvement'
													? '需改进'
													: r.review.reviewResult === 'rejected'
														? '驳回'
														: '待处理'}
										</span>
									</div>
									<span class="text-xs text-gray-400">{formatDateTime(r.review.createdAt)}</span>
								</div>
								<div class="text-gray-700 whitespace-pre-wrap pl-10">{r.review.content}</div>
								{#if r.review.improvementSuggestions}
									<div class="mt-3 pl-10">
										<div class="text-xs text-gray-500 mb-1">改进建议：</div>
										<div class="text-sm text-gray-600 p-2 rounded bg-white border border-gray-100 whitespace-pre-wrap">
											{r.review.improvementSuggestions}
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if showAddComm}
		<div class="modal-backdrop" on:click={(e) => e.target === e.currentTarget && (showAddComm = false)}>
			<div class="modal">
				<div class="modal-header">
					<h3 class="text-lg font-semibold">添加沟通记录</h3>
					<button class="p-1 hover:bg-gray-100 rounded" on:click={() => (showAddComm = false)}>
						<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				<div class="modal-body space-y-4">
					<div>
						<label class="label">类型</label>
						<select class="select" bind:value={newComm.type}>
							{#each commTypes as t}
								<option value={t.value}>{t.label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="label">内容 *</label>
						<textarea
							class="textarea"
							rows="4"
							bind:value={newComm.content}
							placeholder="记录沟通内容、家属反馈、医生意见等"
						></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-secondary" on:click={() => (showAddComm = false)}>取消</button>
					<button class="btn btn-primary" on:click={saveComm}>保存</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showAddReview}
		<div class="modal-backdrop" on:click={(e) => e.target === e.currentTarget && (showAddReview = false)}>
			<div class="modal">
				<div class="modal-header">
					<h3 class="text-lg font-semibold">添加复核意见</h3>
					<button class="p-1 hover:bg-gray-100 rounded" on:click={() => (showAddReview = false)}>
						<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				<div class="modal-body space-y-4">
					<div>
						<label class="label">复核结果</label>
						<select class="select" bind:value={newReview.reviewResult}>
							{#each reviewResults as r}
								<option value={r.value}>{r.label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="label">复核意见 *</label>
						<textarea
							class="textarea"
							rows="4"
							bind:value={newReview.content}
							placeholder="详细的复核意见和处理建议"
						></textarea>
					</div>
					<div>
						<label class="label">改进建议</label>
						<textarea
							class="textarea"
							rows="3"
							bind:value={newReview.improvementSuggestions}
							placeholder="后续工作改进方向和预防措施"
						></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-secondary" on:click={() => (showAddReview = false)}>取消</button>
					<button class="btn btn-primary" on:click={saveReview}>提交复核</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
