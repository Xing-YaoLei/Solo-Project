<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { trpc } from '$lib/trpc';
	import { roleLabels, getAccessibleModules, type UserRole } from '$lib/auth';
	import {
		Home,
		Route,
		FileText,
		Zap,
		Wrench,
		CheckSquare,
		Archive,
		LayoutDashboard,
		LogOut,
		User,
		ShieldCheck,
		ChevronLeft,
		ChevronRight,
		Menu
	} from 'lucide-svelte';

	let { data } = $props();
	let user = $derived(data.user);
	let displayName = $derived(user?.displayName ?? '用户');
	let role = $derived((user?.role ?? 'tenant') as UserRole);
	let roleLabel = $derived(roleLabels[role]);
	let currentPath = $derived(get(page).url.pathname);
	let sidebarCollapsed = $state(false);

	let navItems = [
		{ key: 'home', label: '首页', icon: Home, href: '/' },
		{ key: 'inspection', label: '巡检管理', icon: Route, href: '/inspection' },
		{ key: 'contracts', label: '合同管理', icon: FileText, href: '/contracts' },
		{ key: 'utilities', label: '水电抄表', icon: Zap, href: '/utilities' },
		{ key: 'work-orders', label: '工单中心', icon: Wrench, href: '/work-orders' },
		{ key: 'approvals', label: '审批中心', icon: CheckSquare, href: '/approvals' },
		{ key: 'archives', label: '档案管理', icon: Archive, href: '/archives' },
		{ key: 'dashboard', label: '数据看板', icon: LayoutDashboard, href: '/dashboard' }
	];

	let accessibleNav = $derived.by(() => {
		if (!user) return [];
		const modules = getAccessibleModules(role);
		return navItems.filter((item) => item.key === 'home' || modules.includes(item.key));
	});

	function isActive(href: string): boolean {
		if (href === '/') return currentPath === '/';
		return currentPath === href || currentPath.startsWith(href + '/');
	}

	async function handleLogout() {
		try {
			await trpc.auth.logout.mutate();
			goto('/login');
		} catch (e) {
			console.error('Logout failed:', e);
		}
	}
</script>

<div class="flex h-screen overflow-hidden bg-surface-alt">
	<aside
		class="flex flex-col border-r border-border bg-surface transition-all duration-300"
		class:w-60={!sidebarCollapsed}
		class:w-16={sidebarCollapsed}
	>
		<div class="flex items-center gap-3 border-b border-border p-4">
			<div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-white font-bold">
				园
			</div>
			{#if !sidebarCollapsed}
				<span class="font-semibold text-text truncate">园区协同平台</span>
			{/if}
		</div>

		<nav class="flex-1 space-y-1 overflow-y-auto p-3">
			{#each accessibleNav as item (item.key)}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
					class:bg-primary={isActive(item.href)}
					class:text-white={isActive(item.href)}
					class:text-text-secondary={!isActive(item.href)}
					class:hover:bg-surface-hover={!isActive(item.href)}
				>
					<item.icon class="h-5 w-5 flex-shrink-0" />
					{#if !sidebarCollapsed}
						<span class="truncate">{item.label}</span>
					{/if}
				</a>
			{/each}
		</nav>

		<div class="border-t border-border p-3">
			<button
				onclick={() => (sidebarCollapsed = !sidebarCollapsed)}
				class="flex w-full items-center justify-center rounded-lg p-2 text-text-muted hover:bg-surface-hover transition-colors"
				title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
			>
				{#if sidebarCollapsed}
					<ChevronRight class="h-4 w-4" />
				{:else}
					<ChevronLeft class="h-4 w-4" />
				{/if}
			</button>
		</div>
	</aside>

	<div class="flex flex-1 flex-col overflow-hidden">
		<header class="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
			<button
				class="lg:hidden p-2 text-text-muted hover:bg-surface-hover rounded-lg"
				onclick={() => (sidebarCollapsed = !sidebarCollapsed)}
			>
				<Menu class="h-5 w-5" />
			</button>

			<div class="flex-1" />

			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2">
					<div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
						<User class="h-4 w-4" />
					</div>
					{#if !sidebarCollapsed || true}
						<div class="hidden sm:block">
							<div class="text-sm font-medium text-text">{displayName}</div>
							<div class="flex items-center gap-1 text-xs text-text-secondary">
								<ShieldCheck class="h-3 w-3" />
								{roleLabel}
							</div>
						</div>
					{/if}
				</div>

				<button
					onclick={handleLogout}
					class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-danger transition-colors"
					title="退出登录"
				>
					<LogOut class="h-4 w-4" />
					<span class="hidden sm:inline">退出</span>
				</button>
			</div>
		</header>

		<main class="flex-1 overflow-y-auto">
			<slot />
		</main>
	</div>
</div>
