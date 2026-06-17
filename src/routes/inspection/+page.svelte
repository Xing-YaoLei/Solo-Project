<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc';
	import { ClipboardList, Plus, Search, ChevronRight, MapPin, User, Clock, Filter, RefreshCw, Loader2 } from 'lucide-svelte';

	let statusFilter = $state<string>('all');
	let searchQuery = $state<string>('');
	let loading = $state(true);
	let routes = $state<any[]>([]);
	let user = $state<any>(null);

	const statusLabels: Record<string, string> = {
		pending: '待执行',
		in_progress: '进行中',
		completed: '已完成',
		cancelled: '已取消'
	};

	const statusClasses: Record<string, string> = {
		pending: 'bg-gray-100 text-gray-600',
		in_progress: 'bg-blue-100 text-blue-600',
		completed: 'bg-green-100 text-green-600',
		cancelled: 'bg-red-100 text-red-600'
	};

	async function loadData() {
		loading = true;
		try {
			const session = await trpc.auth.getSession.query();
			user = session.user;

			const input: any = {};
			if (statusFilter !== 'all') input.status = statusFilter;

			const data = await trpc.inspection.list.query(input);
			routes = searchQuery.trim()
				? data.filter((r: any) => {
						const q = searchQuery.trim().toLowerCase();
						return (
							r.name?.toLowerCase().includes(q) ||
							r.buildingName?.toLowerCase().includes(q) ||
							r.assigneeName?.toLowerCase().includes(q)
						);
				  })
				: data;
		} catch (e) {
			console.error('Failed to load inspections:', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadData();
	});

	$effect(() => {
		if (statusFilter) loadData();
	});

	$effect(() => {
		const t = setTimeout(loadData, 300);
		return () => clearTimeout(t);
	});

	function navigateToDetail(id: string) {
		goto(`/inspection/${id}`);
	}

	function formatDate(d: any) {
		if (!d) return '-';
		const date = new Date(d);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
	}
</script>

<div class="p-6 space-y-6 animate-fade-in">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<ClipboardList class="w-7 h-7 text-primary" />
			<h1 class="text-2xl font-bold text-text">巡检路线管理</h1>
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
					创建路线
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
					placeholder="搜索路线名称、楼栋、负责人..."
					bind:value={searchQuery}
					oninput={loadData}
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
					<option value="pending">待执行</option>
					<option value="in_progress">进行中</option>
					<option value="completed">已完成</option>
					<option value="cancelled">已取消</option>
				</select>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex flex-col items-center justify-center py-16 text-text-muted">
			<Loader2 class="w-8 h-8 animate-spin mb-3" />
			<p>加载中...</p>
		</div>
	{:else if routes.length === 0}
		<div class="text-center py-16 text-text-muted">
			<ClipboardList class="w-12 h-12 mx-auto mb-3 opacity-40" />
			<p class="text-lg">暂无巡检路线</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each routes as route (route.id)}
				<button
					class="w-full bg-surface rounded-xl shadow-sm border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all text-left group"
					onclick={() => navigateToDetail(route.id)}
				>
					<div class="flex items-start justify-between mb-3">
						<h3 class="text-lg font-semibold text-text group-hover:text-primary transition-colors">
							{route.name}
						</h3>
						<span
							class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {statusClasses[route.status] || statusClasses.pending}"
						>
							{statusLabels[route.status] || '待执行'}
						</span>
					</div>
					<div class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary mb-3">
						<span class="flex items-center gap-1.5">
							<MapPin class="w-3.5 h-3.5" />
							{route.buildingName || '-'}
						</span>
						<span class="flex items-center gap-1.5">
							<User class="w-3.5 h-3.5" />
							{route.assigneeName || '-'}
						</span>
						<span class="flex items-center gap-1.5">
							<Clock class="w-3.5 h-3.5" />
							{formatDate(route.scheduledAt)}
						</span>
					</div>
					<div class="flex items-center justify-end">
						<ChevronRight class="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
