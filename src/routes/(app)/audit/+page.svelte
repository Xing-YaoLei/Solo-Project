<script lang="ts">
	import { trpcClient } from '$lib/trpc/client';
	import { onMount } from 'svelte';

	let logs: any[] = [];
	let users: any[] = [];
	let loading = true;
	let filters = {
		entityType: '' as string,
		action: '' as string,
		userId: '' as string,
		limit: 500 as number
	};

	const entityTypes = [
		'user', 'property', 'order', 'cleaning_task', 'guest_registration',
		'deposit', 'exception', 'calendar', 'occupancy_report'
	];
	const actions = [
		'create', 'update', 'delete', 'status_change', 'register', 'login',
		'logout', 'update_role', 'add_responsibles', 'auto_create', 'refund', 'export'
	];

	async function loadData() {
		loading = true;
		try {
			const [l, u] = await Promise.all([
				trpcClient.audit.list.query({
					entityType: filters.entityType || undefined,
					action: filters.action || undefined,
					userId: filters.userId || undefined,
					limit: filters.limit
				}),
				trpcClient.auth.list.query()
			]);
			logs = l; users = u;
		} finally { loading = false; }
	}
	onMount(loadData);

	const userMap = new Map(users.map((u) => [u.id, u.username]));
	const actionLabels: Record<string, { label: string; color: string }> = {
		create: { label: '创建', color: 'bg-green-100 text-green-800' },
		update: { label: '更新', color: 'bg-blue-100 text-blue-800' },
		delete: { label: '删除', color: 'bg-red-100 text-red-800' },
		status_change: { label: '状态变更', color: 'bg-purple-100 text-purple-800' },
		register: { label: '注册', color: 'bg-teal-100 text-teal-800' },
		login: { label: '登录', color: 'bg-indigo-100 text-indigo-800' },
		logout: { label: '登出', color: 'bg-gray-100 text-gray-800' },
		update_role: { label: '角色变更', color: 'bg-amber-100 text-amber-800' },
		add_responsibles: { label: '添加责任人', color: 'bg-pink-100 text-pink-800' },
		auto_create: { label: '自动生成', color: 'bg-cyan-100 text-cyan-800' },
		refund: { label: '退款处理', color: 'bg-orange-100 text-orange-800' },
		export: { label: '导出报表', color: 'bg-lime-100 text-lime-800' }
	};

	function formatDateTime(d: any) { if (!d) return '-'; return new Date(d).toLocaleString('zh-CN'); }
	function formatValue(v: any) {
		if (v === null || v === undefined) return '-';
		try {
			const parsed = typeof v === 'string' ? JSON.parse(v) : v;
			return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 0);
		} catch { return String(v).slice(0, 80); }
	}
</script>

<div class="space-y-6">
	<div class="card card-body">
		<div class="grid grid-cols-1 md:grid-cols-5 gap-3">
			<div><label class="label">实体类型</label>
				<select bind:value={filters.entityType} class="select" on:change={loadData}>
					<option value="">全部</option>
					{#each entityTypes as e}<option value={e}>{e}</option>{/each}
				</select>
			</div>
			<div><label class="label">操作类型</label>
				<select bind:value={filters.action} class="select" on:change={loadData}>
					<option value="">全部</option>
					{#each actions as a}<option value={a}>{actionLabels[a]?.label ?? a}</option>{/each}
				</select>
			</div>
			<div><label class="label">操作人</label>
				<select bind:value={filters.userId} class="select" on:change={loadData}>
					<option value="">全部</option>
					{#each users as u}<option value={u.id}>{u.username}</option>{/each}
				</select>
			</div>
			<div><label class="label">显示条数</label>
				<select bind:value={filters.limit} class="select" on:change={loadData}>
					<option value={100}>最近100条</option>
					<option value={500}>最近500条</option>
					<option value={2000}>最近2000条</option>
				</select>
			</div>
			<div class="flex items-end">
				<button on:click={loadData} class="btn-secondary w-full">刷新</button>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="card card-body py-12 text-center text-gray-500">加载中...</div>
	{:else}
		<div class="card overflow-hidden">
			<div class="overflow-x-auto">
				<table class="table">
					<thead class="bg-gray-50"><tr>
						<th class="table-th">时间</th>
						<th class="table-th">操作人</th>
						<th class="table-th">操作</th>
						<th class="table-th">实体类型</th>
						<th class="table-th">实体ID</th>
						<th class="table-th">字段</th>
						<th class="table-th">变更内容</th>
					</tr></thead>
					<tbody class="divide-y divide-gray-100">
						{#if logs.length === 0}
							<tr><td colspan="7" class="py-16 text-center text-gray-400">暂无操作日志</td></tr>
						{/if}
						{#each logs as log}
							<tr class="hover:bg-gray-50">
								<td class="table-td text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
								<td class="table-td text-sm">
									<span class="inline-flex items-center gap-1.5">
										<span class="h-6 w-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
											{(userMap.get(log.userId ?? '') ?? '?')[0]?.toUpperCase()}
										</span>
										<span>{userMap.get(log.userId ?? '') ?? '系统'}</span>
									</span>
								</td>
								<td class="table-td"><span class="badge {actionLabels[log.action]?.color ?? 'bg-gray-100 text-gray-800'}">{actionLabels[log.action]?.label ?? log.action}</span></td>
								<td class="table-td text-sm font-mono text-xs text-gray-600">{log.entityType}</td>
								<td class="table-td font-mono text-xs text-gray-500 max-w-[120px] truncate" title={log.entityId}>{log.entityId.slice(0, 10)}...</td>
								<td class="table-td text-sm">{log.field ?? '-'}</td>
								<td class="table-td text-xs max-w-xs">
									{#if log.field && (log.oldValue !== undefined || log.newValue !== undefined)}
										<div class="space-y-0.5">
											{#if log.oldValue !== undefined}<div><span class="text-red-500">-</span> <span class="text-red-700">{formatValue(log.oldValue)}</span></div>{/if}
											{#if log.newValue !== undefined}<div><span class="text-green-500">+</span> <span class="text-green-700">{formatValue(log.newValue)}</span></div>{/if}
										</div>
									{:else if log.meta}
										<span class="text-gray-500">{formatValue(log.meta)}</span>
									{:else}
										<span class="text-gray-400">-</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="card-header text-xs text-gray-500 flex items-center justify-between">
				<span>共显示 {logs.length} 条记录 · 每次状态变化都已留痕</span>
			</div>
		</div>
	{/if}
</div>
