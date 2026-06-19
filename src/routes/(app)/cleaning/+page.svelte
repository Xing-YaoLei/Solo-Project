<script lang="ts">
	import { trpcClient } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import { CLEANING_STATUS_LABELS, type CleaningStatusType } from '$lib/types';

	let tasks: any[] = [];
	let properties: any[] = [];
	let users: any[] = [];
	let loading = true;
	let filterStatus = '' as CleaningStatusType | '';
	let showModal = false;

	let newTask = {
		propertyId: '', orderId: undefined as string | undefined,
		type: 'checkout' as any, priority: 'medium' as any,
		scheduledDateStr: new Date().toISOString().split('T')[0],
		scheduledTime: '', assignedTo: '' as string, fee: 0
	};

	async function loadData() {
		loading = true;
		try {
			const [t, p, u] = await Promise.all([
				trpcClient.cleaning.list.query({ status: filterStatus || undefined }),
				trpcClient.property.list.query({ status: 'active' }),
				trpcClient.auth.list.query()
			]);
			tasks = t; properties = p; users = u;
			if (p.length > 0 && !newTask.propertyId) newTask.propertyId = p[0].id;
		} finally { loading = false; }
	}
	onMount(loadData);

	async function onCreate() {
		showModal = true;
	}
	async function submitCreate() {
		await trpcClient.cleaning.create.mutate({
			...newTask,
			scheduledDate: new Date(newTask.scheduledDateStr + 'T00:00:00'),
			assignedTo: newTask.assignedTo || undefined
		});
		showModal = false;
		loadData();
	}
	async function updateStatus(t: any, s: CleaningStatusType) {
		await trpcClient.cleaning.updateStatus.mutate({ id: t.id, status: s });
		loadData();
	}
	async function autoGenerate() {
		await trpcClient.cleaning.autoCreateFromCheckout.mutate({});
		loadData();
	}

	const statusBadge: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-800',
		in_progress: 'bg-blue-100 text-blue-800',
		completed: 'bg-green-100 text-green-800',
		cancelled: 'bg-gray-100 text-gray-800',
		rejected: 'bg-red-100 text-red-800'
	};
	const priorityBadge: Record<string, string> = {
		low: 'bg-gray-100 text-gray-700',
		medium: 'bg-blue-100 text-blue-700',
		high: 'bg-orange-100 text-orange-700',
		urgent: 'bg-red-100 text-red-700'
	};
	const typeLabels: Record<string, string> = {
		checkout: '退房清洁', periodic: '定期保洁', deep: '深度清洁', maintenance: '维护', other: '其他'
	};
	const propMap = new Map(properties.map((p) => [p.id, p.name]));
	const userMap = new Map(users.map((u) => [u.id, u.username]));

	function formatDate(d: any) {
		if (!d) return '-';
		return new Date(d).toLocaleDateString('zh-CN');
	}

	function cleaningStatusLabel(s: any) { return (CLEANING_STATUS_LABELS as any)[s]; }
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-3">
			<select bind:value={filterStatus} class="select w-40" on:change={loadData}>
				<option value="">全部状态</option>
				{#each Object.entries(CLEANING_STATUS_LABELS) as [k, v]}<option value={k}>{v}</option>{/each}
			</select>
			<div class="text-sm text-gray-500">共 {tasks.length} 条</div>
		</div>
		<div class="flex gap-2">
			<button on:click={autoGenerate} class="btn-secondary">
				<svg class="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
				根据退房自动生成
			</button>
			<button on:click={onCreate} class="btn-primary">新增任务</button>
		</div>
	</div>

	{#if loading}
		<div class="card card-body py-12 text-center text-gray-500">加载中...</div>
	{:else}
		<div class="card overflow-hidden">
			<table class="table">
				<thead class="bg-gray-50">
					<tr>
						<th class="table-th">任务号</th>
						<th class="table-th">类型/优先级</th>
						<th class="table-th">房源</th>
						<th class="table-th">计划时间</th>
						<th class="table-th">指派人员</th>
						<th class="table-th">费用</th>
						<th class="table-th">状态</th>
						<th class="table-th">操作</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#if tasks.length === 0}
						<tr><td colspan="8" class="py-16 text-center text-gray-400">暂无保洁任务</td></tr>
					{/if}
					{#each tasks as t}
						<tr class="hover:bg-gray-50">
							<td class="table-td font-mono text-xs">{t.taskNo}</td>
							<td class="table-td">
								<div class="flex flex-col gap-1">
									<span class="badge bg-indigo-50 text-indigo-700 w-fit">{typeLabels[t.type]}</span>
									<span class="badge {priorityBadge[t.priority]} w-fit">{t.priority === 'urgent' ? '紧急' : t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : '低'}</span>
								</div>
							</td>
							<td class="table-td text-sm">{propMap.get(t.propertyId) ?? '-'}</td>
							<td class="table-td text-sm">{formatDate(t.scheduledDate)} {t.scheduledTime ?? ''}</td>
							<td class="table-td text-sm">{userMap.get(t.assignedTo ?? '') ?? '未指派'}</td>
							<td class="table-td text-sm">¥{t.fee?.toFixed(2)}</td>
							<td class="table-td"><span class="badge {statusBadge[t.status]}">{cleaningStatusLabel(t.status)}</span></td>
							<td class="table-td">
								<div class="flex flex-wrap gap-1.5">
									{#if t.status === 'pending'}
										<button on:click={() => updateStatus(t, 'in_progress')} class="btn-primary text-xs py-1 px-2">开始</button>
									{/if}
									{#if t.status === 'in_progress'}
										<button on:click={() => updateStatus(t, 'completed')} class="btn-success text-xs py-1 px-2">完成</button>
									{/if}
									{(t.status === 'pending' || t.status === 'in_progress')}
										<button on:click={() => updateStatus(t, 'cancelled')} class="btn-secondary text-xs py-1 px-2">取消</button>
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
			<div class="px-6 py-4 border-b flex items-center justify-between">
				<h3 class="font-semibold text-lg">新增保洁任务</h3>
				<button on:click={() => showModal = false} class="text-gray-400 hover:text-gray-600">✕</button>
			</div>
			<div class="p-6 space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="col-span-2"><label class="label">房源 *</label>
						<select bind:value={newTask.propertyId} class="select">
							{#each properties as p}<option value={p.id}>{p.name}</option>{/each}
						</select>
					</div>
					<div><label class="label">类型</label>
						<select bind:value={newTask.type} class="select">
							{#each Object.entries(typeLabels) as [k, v]}<option value={k}>{v}</option>{/each}
						</select>
					</div>
					<div><label class="label">优先级</label>
						<select bind:value={newTask.priority} class="select">
							<option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="urgent">紧急</option>
						</select>
					</div>
					<div><label class="label">计划日期</label><input type="date" bind:value={newTask.scheduledDateStr} class="input" /></div>
					<div><label class="label">计划时间</label><input type="time" bind:value={newTask.scheduledTime} class="input" /></div>
					<div><label class="label">指派人员</label>
						<select bind:value={newTask.assignedTo} class="select">
							<option value="">未指派</option>
							{#each users as u}<option value={u.id}>{u.username}</option>{/each}
						</select>
					</div>
					<div><label class="label">费用 (¥)</label><input type="number" min="0" bind:value={newTask.fee} class="input" /></div>
				</div>
				<div class="pt-2 flex justify-end gap-3">
					<button on:click={() => showModal = false} class="btn-secondary">取消</button>
					<button on:click={submitCreate} class="btn-primary">创建</button>
				</div>
			</div>
		</div>
	</div>
{/if}
