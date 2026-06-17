<script lang="ts">
	import { roleLabels, getAccessibleModules } from '$lib/auth';
	import type { UserRole } from '$lib/auth';
	import { trpc } from '$lib/trpc';
	import {
		ClipboardList,
		FileCheck,
		AlertTriangle,
		Route,
		ShieldCheck,
		FileText,
		Zap,
		Wrench,
		CheckSquare,
		Archive,
		LayoutDashboard
	} from 'lucide-svelte';

	let { data } = $props();
	let loading = $state(true);

	let user = $derived(data.user);
	let displayName = $derived(user?.displayName ?? '用户');
	let role = $derived((user?.role ?? 'tenant') as UserRole);
	let roleLabel = $derived(roleLabels[role]);

	let stats = $state({
		pendingWorkOrders: 0,
		pendingApprovals: 0,
		overdueAlerts: 0,
		inspectionTasks: 0
	});

	let accessibleModules = $derived(getAccessibleModules(role));

	let allQuickEntries = [
		{ key: 'inspection', label: '巡检管理', icon: Route, href: '/inspection', color: 'bg-primary-light/15 text-primary' },
		{ key: 'contracts', label: '合同管理', icon: FileText, href: '/contracts', color: 'bg-accent/15 text-accent' },
		{ key: 'utilities', label: '水电抄表', icon: Zap, href: '/utilities', color: 'bg-warning/15 text-warning' },
		{ key: 'work-orders', label: '工单中心', icon: Wrench, href: '/work-orders', color: 'bg-danger/15 text-danger' },
		{ key: 'approvals', label: '审批中心', icon: CheckSquare, href: '/approvals', color: 'bg-success/15 text-success' },
		{ key: 'archives', label: '档案管理', icon: Archive, href: '/archives', color: 'bg-text-secondary/15 text-text-secondary' },
		{ key: 'dashboard', label: '数据看板', icon: LayoutDashboard, href: '/dashboard', color: 'bg-primary/15 text-primary-dark' }
	];

	let quickEntries = $derived(
		allQuickEntries.filter((entry) => accessibleModules.includes(entry.key))
	);

	async function loadStats() {
		loading = true;
		try {
			const [workOrders, approvals, inspections, completionStats] = await Promise.allSettled([
				role === 'tenant' ? [] : trpc.workOrder.list.query({}),
				['admin', 'finance'].includes(role) ? trpc.approval.list.query({}) : [],
				['admin', 'inspector'].includes(role) ? trpc.inspection.list.query({}) : [],
				role === 'admin' ? trpc.dashboard.getCompletionRate.query() : null
			]).catch(() => []);

			stats.pendingWorkOrders = 0;
			stats.pendingApprovals = 0;
			stats.overdueAlerts = 0;
			stats.inspectionTasks = 0;

			try {
				if (workOrders.status === 'fulfilled' && Array.isArray(workOrders.value)) {
					const list = workOrders.value;
					stats.pendingWorkOrders = list.filter(
						(o: any) => ['submitted', 'assigned', 'in_progress'].includes(o.status)
					).length;
					stats.overdueAlerts = list.filter((o: any) => o.isOverdue).length;
				} else if (completionStats?.status === 'fulfilled' && completionStats.value) {
					const s = completionStats.value as any;
					stats.pendingWorkOrders = Number(s.pending || 0) + Number(s.inProgress || 0);
					stats.overdueAlerts = Number(s.overdue || 0);
				}
			} catch (_) {}

			try {
				if (approvals.status === 'fulfilled' && Array.isArray(approvals.value)) {
					stats.pendingApprovals = approvals.value.filter((a: any) => a.action === 'approve' && a.contractStatus === 'pending').length;
				}
			} catch (_) {}

			try {
				if (inspections.status === 'fulfilled' && Array.isArray(inspections.value)) {
					stats.inspectionTasks = inspections.value.filter(
						(i: any) => ['pending', 'in_progress'].includes(i.status)
					).length;
				}
			} catch (_) {}
		} catch (e) {
			console.error('Stats load error:', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadStats();
	});
</script>

<div class="space-y-6 p-6 animate-fade-in">
	<section class="flex items-center justify-between flex-wrap gap-3">
		<div>
			<h1 class="text-2xl font-semibold text-text">你好, {displayName}</h1>
			<p class="mt-1 text-sm text-text-secondary">欢迎使用园区物业管理平台</p>
		</div>
		<span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
			<ShieldCheck size={14} />
			{roleLabel}
		</span>
	</section>

	{#if stats.overdueAlerts > 0}
		<div class="animate-pulse-border flex items-center gap-2 rounded-lg border-2 border-danger bg-danger-bg px-4 py-3 text-sm font-medium text-danger">
			<AlertTriangle size={18} />
			<span>⚠ 有 <strong class="text-lg mx-1">{stats.overdueAlerts}</strong> 个工单已超时，请及时处理</span>
		</div>
	{/if}

	<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="rounded-xl bg-surface p-5 shadow-sm border border-border">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
					<ClipboardList size={20} />
				</div>
				<div>
					<div class="text-2xl font-bold text-text">
						{loading ? '...' : stats.pendingWorkOrders}
					</div>
					<div class="text-sm text-text-secondary">待处理工单</div>
				</div>
			</div>
		</div>

		{#if accessibleModules.includes('approvals')}
			<div class="rounded-xl bg-surface p-5 shadow-sm border border-border">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
						<FileCheck size={20} />
					</div>
					<div>
						<div class="text-2xl font-bold text-text">
							{loading ? '...' : stats.pendingApprovals}
						</div>
						<div class="text-sm text-text-secondary">待审批事项</div>
					</div>
				</div>
			</div>
		{/if}

		<div
			class="rounded-xl bg-surface p-5 shadow-sm border border-border"
			class:border-danger={stats.overdueAlerts > 0}
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-full"
					class:bg-danger/10={stats.overdueAlerts === 0}
					class:text-danger={stats.overdueAlerts === 0}
					class:bg-danger-bg={stats.overdueAlerts > 0}
					class:text-danger={stats.overdueAlerts > 0}
				>
					<AlertTriangle size={20} />
				</div>
				<div>
					<div
						class="text-2xl font-bold"
						class:text-text={stats.overdueAlerts === 0}
						class:text-danger={stats.overdueAlerts > 0}
					>
						{loading ? '...' : stats.overdueAlerts}
					</div>
					<div class="text-sm text-text-secondary">超时预警</div>
				</div>
			</div>
		</div>

		{#if accessibleModules.includes('inspection')}
			<div class="rounded-xl bg-surface p-5 shadow-sm border border-border">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
						<Route size={20} />
					</div>
					<div>
						<div class="text-2xl font-bold text-text">
							{loading ? '...' : stats.inspectionTasks}
						</div>
						<div class="text-sm text-text-secondary">巡检任务</div>
					</div>
				</div>
			</div>
		{/if}
	</section>

	<section>
		<h2 class="mb-3 text-lg font-semibold text-text">快捷入口</h2>
		{#if quickEntries.length === 0}
			<div class="text-center py-8 text-text-muted text-sm bg-surface rounded-xl border border-border">
				当前角色暂无可访问的功能模块
			</div>
		{:else}
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
				{#each quickEntries as entry (entry.key)}
					<a
						href={entry.href}
						class="flex flex-col items-center gap-2 rounded-xl bg-surface p-5 shadow-sm border border-border transition-colors hover:bg-surface-hover hover:shadow-md"
					>
						<div class="flex h-12 w-12 items-center justify-center rounded-full {entry.color}">
							<entry.icon size={22} />
						</div>
						<span class="text-sm font-medium text-text">{entry.label}</span>
					</a>
				{/each}
			</div>
		{/if}
	</section>
</div>
