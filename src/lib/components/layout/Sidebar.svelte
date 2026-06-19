<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils/cn';
	import { getRoleLabel } from '$lib/utils/enumLabels';
	import type { UserRole } from '$lib/server/db/schema';
	import {
		LayoutDashboard,
		Wrench,
		Package,
		Receipt,
		ShieldCheck,
		AlertTriangle,
		BarChart3,
		Users,
		ChevronLeft,
		ChevronRight,
		Settings
	} from 'lucide-svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	export let collapsed = false;
	export let userRole: UserRole = 'ADVISOR';
	let className: string | undefined = undefined;
	export { className as class };
	export let mobileOpen = false;

	type MenuItem = {
		id: string;
		label: string;
		href: string;
		icon: typeof LayoutDashboard;
		roles: UserRole[];
		badge?: string;
		badgeVariant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'secondary';
	};

	const menuItems: MenuItem[] = [
		{
			id: 'dashboard',
			label: '工作台',
			href: '/',
			icon: LayoutDashboard,
			roles: ['ADVISOR', 'TECHNICIAN', 'PARTS', 'MANAGER']
		},
		{
			id: 'workorders',
			label: '工单管理',
			href: '/workorders',
			icon: Wrench,
			roles: ['ADVISOR', 'TECHNICIAN', 'MANAGER'],
			badgeVariant: 'accent'
		},
		{
			id: 'parts',
			label: '配件库存',
			href: '/parts',
			icon: Package,
			roles: ['PARTS', 'MANAGER']
		},
		{
			id: 'quotes',
			label: '报价管理',
			href: '/quotes',
			icon: Receipt,
			roles: ['ADVISOR', 'MANAGER']
		},
		{
			id: 'inspection',
			label: '质检管理',
			href: '/inspection',
			icon: ShieldCheck,
			roles: ['MANAGER']
		},
		{
			id: 'exceptions',
			label: '异常处理',
			href: '/exceptions',
			icon: AlertTriangle,
			roles: ['ADVISOR', 'TECHNICIAN', 'MANAGER'],
			badgeVariant: 'warning'
		},
		{
			id: 'stats',
			label: '数据统计',
			href: '/stats',
			icon: BarChart3,
			roles: ['MANAGER']
		},
		{
			id: 'users',
			label: '用户管理',
			href: '/users',
			icon: Users,
			roles: ['MANAGER']
		}
	];

	const visibleItems = menuItems.filter((item) => item.roles.includes(userRole));

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher<{
		toggleCollapse: void;
		closeMobile: void;
	}>();

	$: currentPath = $page.url.pathname;
</script>

<aside
	class={cn(
		'flex flex-col h-full bg-industrial-900 border-r border-industrial-800 transition-all duration-300 ease-in-out flex-shrink-0',
		collapsed ? 'w-[72px]' : 'w-64',
		mobileOpen ? 'fixed inset-y-0 left-0 z-40' : '',
		className
	)}
>
	<div class="relative flex-shrink-0">
		<div class={cn(
			'flex items-center h-16 px-4 border-b border-industrial-800 transition-all duration-300',
			collapsed ? 'justify-center px-2' : 'gap-3'
		)}>
			<div class="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-primary">
				<svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
				</svg>
			</div>
			{#if !collapsed}
				<div class="flex-1 min-w-0">
					<h1 class="font-display font-bold text-base text-white tracking-tight truncate">
						AutoCare
					</h1>
					<p class="text-[11px] text-industrial-500 -mt-0.5 truncate">协同管理平台</p>
				</div>
			{/if}
		</div>
	</div>

	<nav class="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3">
		<ul class="space-y-1">
			{#each visibleItems as item}
				{@const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href))}
				<li>
					<a
						href={item.href}
						class={cn(
							'relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
							collapsed ? 'h-11 justify-center px-2' : 'h-11 px-3',
							isActive
								? 'bg-primary-600/20 text-primary-300 shadow-inner'
								: 'text-industrial-400 hover:text-white hover:bg-industrial-800'
						)}
						title={collapsed ? item.label : undefined}
						on:click={() => dispatch('closeMobile')}
					>
						{#if isActive && !collapsed}
							<span class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary-500" />
						{/if}
						<svelte:component
							this={item.icon}
							class={cn(
								'w-5 h-5 flex-shrink-0 transition-colors',
								isActive ? 'text-primary-400' : ''
							)}
							strokeWidth={isActive ? 2.25 : 2}
						/>
						{#if !collapsed}
							<span class="flex-1 truncate">{item.label}</span>
							{#if item.badge}
								<Badge variant={item.badgeVariant ?? 'accent'} size="sm">{item.badge}</Badge>
							{/if}
						{/if}
						{#if collapsed && isActive}
							<span class="absolute right-1.5 w-1.5 h-1.5 rounded-full bg-primary-400" />
						{/if}
					</a>
				</li>
			{/each}
		</ul>

		{#if !collapsed}
			<div class="mt-6 pt-4 border-t border-industrial-800/60">
				<p class="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-industrial-600">
					系统
				</p>
				<ul class="space-y-1">
					<li>
						<a
							href="/settings"
							class={cn(
								'flex items-center gap-3 h-11 px-3 rounded-lg text-sm font-medium transition-all duration-200',
								currentPath.startsWith('/settings')
									? 'bg-industrial-800 text-white'
									: 'text-industrial-400 hover:text-white hover:bg-industrial-800'
							)}
							on:click={() => dispatch('closeMobile')}
						>
							<Settings class="w-5 h-5 flex-shrink-0" strokeWidth={2} />
							<span>系统设置</span>
						</a>
					</li>
				</ul>
			</div>
		{/if}
	</nav>

	<div class="flex-shrink-0 p-3 border-t border-industrial-800">
		<div class={cn(
			'flex items-center rounded-lg bg-industrial-800/60 transition-all duration-300',
			collapsed ? 'flex-col gap-1 p-2' : 'gap-3 p-3'
		)}>
			<div class="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-industrial-700">
				{getRoleLabel(userRole).charAt(0)}
			</div>
			{#if !collapsed}
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-white truncate">{getRoleLabel(userRole)}</p>
					<p class="text-xs text-industrial-500 truncate">已登录</p>
				</div>
			{/if}
		</div>
	</div>

	<button
		type="button"
		on:click={() => dispatch('toggleCollapse')}
		class={cn(
			'absolute hidden md:flex top-20 -right-3 w-6 h-6 rounded-full items-center justify-center',
			'bg-industrial-800 border border-industrial-700 text-industrial-400 hover:text-white hover:bg-primary-600 hover:border-primary-500',
			'transition-all duration-200 shadow-industrial z-10'
		)}
		aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
	>
		{#if collapsed}
			<ChevronRight class="w-3.5 h-3.5" strokeWidth={2.5} />
		{:else}
			<ChevronLeft class="w-3.5 h-3.5" strokeWidth={2.5} />
		{/if}
	</button>
</aside>
