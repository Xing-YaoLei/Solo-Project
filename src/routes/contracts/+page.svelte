<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc';
	import {
		FileText,
		Plus,
		Search,
		Filter,
		ChevronRight,
		Building2,
		User,
		CalendarDays,
		DollarSign,
		RefreshCw,
		Loader2,
		Eye
	} from 'lucide-svelte';

	let statusFilter = $state<string>('all');
	let searchQuery = $state<string>('');
	let loading = $state(true);
	let contracts = $state<any[]>([]);
	let user = $state<any>(null);

	const statusLabels: Record<string, string> = {
		pending: '待审批',
		active: '已生效',
		expired: '已到期',
		terminated: '已终止'
	};

	const statusClasses: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-700',
		active: 'bg-green-100 text-green-700',
		expired: 'bg-gray-100 text-gray-600',
		terminated: 'bg-red-100 text-red-600'
	};

	async function loadData() {
		loading = true;
		try {
			const session = await trpc.auth.getSession.query();
			user = session.user;

			const input: any = {};
			if (statusFilter !== 'all') input.status = statusFilter;
			if (searchQuery.trim()) input.keyword = searchQuery.trim();

			contracts = await trpc.contract.list.query(input);
		} catch (e) {
			console.error('Failed to load contracts:', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadData();
	});

	function navigateToDetail(id: string) {
		goto(`/contracts/${id}`);
	}

	function formatDate(d: any) {
		if (!d) return '-';
		const date = new Date(d);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	}

	function formatMoney(v: any) {
		if (v == null) return '-';
		return '¥' + Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}
</script>

<div class="p-6 space-y-6 animate-fade-in">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<FileText class="w-7 h-7 text-accent" />
			<h1 class="text-2xl font-bold text-text">租户合同管理</h1>
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={loadData}
				disabled={loading}
				class="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
			>
				<RefreshCw class="w-4 h-4" class:animate-spin={loading} />
				刷新
			</button>
			{#if user?.role === 'admin'}
				<button
					class="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors font-medium"
				>
					<Plus class="w-4 h-4" />
					新建合同
				</button>
			{/if}
		</div>
	</div>

	<div class="bg-surface rounded-xl shadow-sm border border-border p-4">
		<div class="flex flex-col sm:flex-row gap-3">
			<div class="relative flex-1">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
				<input
					type="text"
					placeholder="搜索租户名称、房间号..."
					bind:value={searchQuery}
					onkeydown={(e) => e.key === 'Enter' && loadData()}
					class="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg bg-surface-alt text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
				/>
			</div>
			<div class="relative">
				<Filter class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
				<select
					bind:value={statusFilter}
					onchange={loadData}
					class="pl-9 pr-8 py-2.5 border border-border rounded-lg bg-surface-alt text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer min-w-[140px]"
				>
					<option value="all">全部状态</option>
					<option value="pending">待审批</option>
					<option value="active">已生效</option>
					<option value="expired">已到期</option>
					<option value="terminated">已终止</option>
				</select>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex flex-col items-center justify-center py-16 text-text-muted">
			<Loader2 class="w-8 h-8 animate-spin mb-3" />
			<p>加载中...</p>
		</div>
	{:else if contracts.length === 0}
		<div class="text-center py-16 text-text-muted">
			<FileText class="w-12 h-12 mx-auto mb-3 opacity-40" />
			<p class="text-lg">暂无合同数据</p>
		</div>
	{:else}
		<div class="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-surface-alt border-b border-border">
						<tr>
							<th class="text-left font-medium text-text-secondary px-5 py-3">租户名称</th>
							<th class="text-left font-medium text-text-secondary px-5 py-3">位置</th>
							<th class="text-left font-medium text-text-secondary px-5 py-3">租赁期限</th>
							<th class="text-left font-medium text-text-secondary px-5 py-3">月租金</th>
							<th class="text-left font-medium text-text-secondary px-5 py-3">状态</th>
							<th class="text-left font-medium text-text-secondary px-5 py-3">创建时间</th>
							<th class="text-right font-medium text-text-secondary px-5 py-3">操作</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each contracts as contract (contract.id)}
							<tr class="hover:bg-surface-alt/50 transition-colors">
								<td class="px-5 py-4">
									<div class="flex items-center gap-2">
										<User class="w-4 h-4 text-text-muted" />
										<span class="font-medium text-text">{contract.tenantName || '-'}</span>
									</div>
								</td>
								<td class="px-5 py-4">
									<div class="flex items-center gap-2 text-text-secondary">
										<Building2 class="w-4 h-4" />
										<span>{contract.buildingName || '-'} {contract.roomNumber || ''}</span>
									</div>
								</td>
								<td class="px-5 py-4">
									<div class="flex items-center gap-2 text-text-secondary">
										<CalendarDays class="w-4 h-4" />
										<span>{formatDate(contract.startDate)} 至 {formatDate(contract.endDate)}</span>
									</div>
								</td>
								<td class="px-5 py-4">
									<div class="flex items-center gap-2 text-text">
										<DollarSign class="w-4 h-4 text-success" />
										<span class="font-medium">{formatMoney(contract.monthlyRent)}</span>
									</div>
								</td>
								<td class="px-5 py-4">
									<span
										class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {statusClasses[contract.status] || statusClasses.pending}"
									>
										{statusLabels[contract.status] || '待审批'}
									</span>
								</td>
								<td class="px-5 py-4 text-text-secondary">{formatDate(contract.createdAt)}</td>
								<td class="px-5 py-4 text-right">
									<button
										onclick={() => navigateToDetail(contract.id)}
										class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
									>
										<Eye class="w-3.5 h-3.5" />
										查看
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
