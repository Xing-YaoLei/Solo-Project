<script lang="ts">
	import { trpcClient } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import { EXCEPTION_STATUS_LABELS, EXCEPTION_TYPE_LABELS, type ExceptionStatusType, type ExceptionTypeType } from '$lib/types';

	let exceptions: any[] = [];
	let users: any[] = [];
	let properties: any[] = [];
	let loading = true;
	let filterStatus = '' as ExceptionStatusType | '';
	let filterType = '' as ExceptionTypeType | '';
	let showModal = false;
	let showDetail = false;
	let currentEx: any = null;
	let editData: any = {};
	let selectedRespUserId = '';

	async function loadData() {
		loading = true;
		try {
			const [e, u, p] = await Promise.all([
				trpcClient.exception.list.query({ status: filterStatus || undefined, type: filterType || undefined }),
				trpcClient.auth.list.query(),
				trpcClient.property.list.query({ status: 'active' })
			]);
			exceptions = e; users = u; properties = p;
		} finally { loading = false; }
	}
	onMount(loadData);

	async function runDetect() {
		await trpcClient.exception.runAutoDetect.mutate();
		loadData();
	}
	async function openDetail(ex: any) {
		const d = await trpcClient.exception.get.query(ex.id);
		if (!d) return;
		currentEx = d;
		editData = {
			status: d.status,
			impactScope: d.impactScope ?? '',
			rootCause: d.rootCause ?? '',
			resolution: d.resolution ?? '',
			conclusion: d.conclusion ?? '',
			financialImpact: d.financialImpact ?? 0,
			compensationAmount: d.compensationAmount ?? 0,
			ownerId: d.ownerId ?? ''
		};
		showDetail = true;
	}
	async function saveStatus() {
		await trpcClient.exception.updateStatus.mutate({
			id: currentEx.id,
			status: editData.status,
			impactScope: editData.impactScope || undefined,
			rootCause: editData.rootCause || undefined,
			resolution: editData.resolution || undefined,
			conclusion: editData.conclusion || undefined,
			financialImpact: Number(editData.financialImpact) || 0,
			compensationAmount: Number(editData.compensationAmount) || 0,
			ownerId: editData.ownerId || undefined
		});
		showDetail = false;
		currentEx = null;
		loadData();
	}
	async function addResp(uid: string) {
		if (!uid || !currentEx) return;
		await trpcClient.exception.addResponsibles.mutate({
			exceptionId: currentEx.id,
			responsibles: [{ userId: uid, role: '责任人' }]
		});
		const d = await trpcClient.exception.get.query(currentEx.id);
		currentEx = d;
	}
	async function handleAddResp() {
		if (selectedRespUserId) {
			await addResp(selectedRespUserId);
			selectedRespUserId = '';
		}
	}

	const statusBadge: Record<string, string> = {
		open: 'bg-red-100 text-red-800',
		investigating: 'bg-yellow-100 text-yellow-800',
		resolved: 'bg-blue-100 text-blue-800',
		closed: 'bg-gray-100 text-gray-800'
	};
	const severityBadge: Record<string, string> = {
		low: 'bg-gray-100 text-gray-700',
		medium: 'bg-blue-100 text-blue-700',
		high: 'bg-orange-100 text-orange-700',
		critical: 'bg-red-100 text-red-700'
	};
	const userMap = new Map(users.map((u) => [u.id, u.username]));
	const propMap = new Map(properties.map((p) => [p.id, p.name]));
	function formatDate(d: any) { if (!d) return '-'; return new Date(d).toLocaleString('zh-CN'); }

	function exceptionTypeLabel(t: any) { return (EXCEPTION_TYPE_LABELS as any)[t]; }
	function exceptionStatusLabel(s: any) { return (EXCEPTION_STATUS_LABELS as any)[s]; }
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-3">
			<select bind:value={filterType} class="select w-40" on:change={loadData}>
				<option value="">全部类型</option>
				{#each Object.entries(EXCEPTION_TYPE_LABELS) as [k, v]}<option value={k}>{v}</option>{/each}
			</select>
			<select bind:value={filterStatus} class="select w-40" on:change={loadData}>
				<option value="">全部状态</option>
				{#each Object.entries(EXCEPTION_STATUS_LABELS) as [k, v]}<option value={k}>{v}</option>{/each}
			</select>
		</div>
		<button on:click={runDetect} class="btn-secondary">
			<svg class="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
			自动检测冲突
		</button>
	</div>

	{#if loading}
		<div class="card card-body py-12 text-center text-gray-500">加载中...</div>
	{:else}
		<div class="card overflow-hidden">
			<table class="table">
				<thead class="bg-gray-50"><tr>
					<th class="table-th">异常单号</th>
					<th class="table-th">标题</th>
					<th class="table-th">类型</th>
					<th class="table-th">严重级别</th>
					<th class="table-th">关联房源/订单</th>
					<th class="table-th">创建时间</th>
					<th class="table-th">状态</th>
					<th class="table-th">操作</th>
				</tr></thead>
				<tbody class="divide-y">
					{#if exceptions.length === 0}
						<tr><td colspan="8" class="py-16 text-center text-gray-400">暂无异常，运行良好 ✅</td></tr>
					{/if}
					{#each exceptions as e}
						<tr class="hover:bg-gray-50">
							<td class="table-td font-mono text-xs">{e.exceptionNo}</td>
							<td class="table-td font-medium max-w-xs truncate">{e.title}</td>
							<td class="table-td"><span class="badge bg-indigo-50 text-indigo-700">{exceptionTypeLabel(e.type)}</span></td>
							<td class="table-td"><span class="badge {severityBadge[e.severity]}">{e.severity === 'critical' ? '紧急' : e.severity === 'high' ? '高' : e.severity === 'medium' ? '中' : '低'}</span></td>
							<td class="table-td text-sm">
								<div>{propMap.get(e.propertyId ?? '') ?? '-'}</div>
								<div class="text-xs text-gray-400">{e.orderId ? '订单#' + e.orderId.slice(-6) : ''}</div>
							</td>
							<td class="table-td text-sm text-gray-500">{formatDate(e.createdAt)}</td>
							<td class="table-td"><span class="badge {statusBadge[e.status]}">{exceptionStatusLabel(e.status)}</span></td>
							<td class="table-td">
								<button on:click={() => openDetail(e)} class="btn-primary text-xs py-1 px-2">处理</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if showDetail && currentEx}
	<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" on:click={(e) => { if (e.target === e.currentTarget) showDetail = false; }}>
		<div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-auto">
			<div class="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
				<div>
					<div class="font-semibold text-lg">异常单处理 - {currentEx.exceptionNo}</div>
					<div class="text-xs text-gray-500 mt-0.5">创建于 {formatDate(currentEx.createdAt)} · 创建人 {userMap.get(currentEx.createdBy) ?? '-'}</div>
				</div>
				<button on:click={() => showDetail = false} class="text-gray-400 hover:text-gray-600">✕</button>
			</div>
			<div class="p-6 space-y-5">
				<div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
					<div class="grid grid-cols-2 gap-4 mb-3">
						<div><div class="text-xs text-gray-500">类型</div><div class="font-medium mt-0.5">{exceptionTypeLabel(currentEx.type)}</div></div>
						<div><div class="text-xs text-gray-500">严重级别</div><div class="font-medium mt-0.5">{currentEx.severity}</div></div>
						<div><div class="text-xs text-gray-500">房源</div><div class="font-medium mt-0.5">{propMap.get(currentEx.propertyId ?? '') ?? '-'}</div></div>
						<div><div class="text-xs text-gray-500">关联订单</div><div class="font-medium mt-0.5">{currentEx.orderId ?? '-'}</div></div>
					</div>
					<div><div class="text-xs text-gray-500 mb-1">标题</div><div class="font-medium">{currentEx.title}</div></div>
					<div class="mt-3"><div class="text-xs text-gray-500 mb-1">问题描述</div><div class="text-sm whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">{currentEx.description}</div></div>
				</div>

				<div>
					<div class="font-semibold text-sm mb-3">责任人（关闭前必填）</div>
					<div class="flex flex-wrap gap-2 mb-2">
						{#each currentEx.responsibles ?? [] as r}
							<span class="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg border border-primary-200 text-sm">
								<span class="font-medium">{userMap.get(r.userId) ?? r.userId}</span>
								<span class="text-xs text-primary-600/70">{r.role}</span>
							</span>
						{/each}
						{#if (currentEx.responsibles ?? []).length === 0}
							<span class="text-sm text-red-500">⚠ 尚未指定责任人</span>
						{/if}
					</div>
					<div class="flex gap-2">
						<select bind:value={selectedRespUserId} class="select w-48">
							<option value="">选择添加责任人...</option>
							{#each users as u}
								<option value={u.id}>{u.username} ({u.role})</option>
							{/each}
						</select>
						<button on:click={handleAddResp} class="btn-secondary">添加</button>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div><label class="label">影响范围（关闭前必填）</label>
						<textarea bind:value={editData.impactScope} class="input min-h-[80px]" placeholder="描述受影响的房源、日期、客人、经济损失范围等" />
					</div>
					<div><label class="label">根本原因分析</label>
						<textarea bind:value={editData.rootCause} class="input min-h-[80px]" placeholder="分析冲突产生的原因，如：操作失误、系统问题、渠道同步延迟等" />
					</div>
					<div><label class="label">处理方案</label>
						<textarea bind:value={editData.resolution} class="input min-h-[80px]" placeholder="已采取的解决措施" />
					</div>
					<div><label class="label">处理结论（关闭前必填）</label>
						<textarea bind:value={editData.conclusion} class="input min-h-[80px]" placeholder="最终处理结论，包含对客处理、内部整改、经验教训等" />
					</div>
					<div><label class="label">经济损失 (¥)</label>
						<input type="number" min="0" bind:value={editData.financialImpact} class="input" />
					</div>
					<div><label class="label">赔偿/补偿金额 (¥)</label>
						<input type="number" min="0" bind:value={editData.compensationAmount} class="input" />
					</div>
					<div><label class="label">跟进人</label>
						<select bind:value={editData.ownerId} class="select">
							<option value="">未指定</option>
							{#each users as u}<option value={u.id}>{u.username}</option>{/each}
						</select>
					</div>
					<div><label class="label">状态流转</label>
						<select bind:value={editData.status} class="select">
							{#each Object.entries(EXCEPTION_STATUS_LABELS) as [k, v]}<option value={k}>{v}</option>{/each}
						</select>
					</div>
				</div>

				<div class="border-t pt-4 flex justify-end gap-3">
					<button on:click={() => showDetail = false} class="btn-secondary">取消</button>
					<button on:click={saveStatus} class="btn-primary">保存并{editData.status === 'closed' ? '关闭' : '更新'}</button>
				</div>
			</div>
		</div>
	</div>
{/if}
