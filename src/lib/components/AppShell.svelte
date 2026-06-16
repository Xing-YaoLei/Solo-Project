<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { LogOut, User, Home, Users, ClipboardList, Pill, Calendar, AlertTriangle, BarChart3, Settings, Menu, X, Heart, FileCheck, UserPlus } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';
	import { auth, roleLabelMap } from '$lib/stores/auth';
	import type { SessionUser, UserRole } from '$shared/types';

	export let user: SessionUser;

	interface NavItem {
		label: string;
		href: string;
		icon: typeof Home;
		roles?: UserRole[];
	}

	const sidebarNav: NavItem[] = [
		{ label: '工作台', href: '/', icon: Home },
		{ label: '老人档案', href: '/elders', icon: Users },
		{ label: '入住评估', href: '/assessments', icon: FileCheck },
		{ label: '用药管理', href: '/medications', icon: Pill, roles: ['admin', 'supervisor', 'nurse', 'doctor'] },
		{ label: '探访登记', href: '/visits', icon: UserPlus, roles: ['admin', 'supervisor', 'nurse', 'doctor'] },
		{ label: '护理等级', href: '/care-levels', icon: Heart, roles: ['admin', 'supervisor'] },
		{ label: '跌倒事件', href: '/incidents', icon: AlertTriangle },
		{ label: '数据分析', href: '/analytics', icon: BarChart3, roles: ['admin', 'supervisor'] },
		{ label: '系统设置', href: '/settings', icon: Settings, roles: ['admin'] }
	];

	const mobileNav: NavItem[] = [
		{ label: '首页', href: '/', icon: Home },
		{ label: '老人', href: '/elders', icon: Users },
		{ label: '事件', href: '/incidents', icon: AlertTriangle },
		{ label: '我的', href: '/settings', icon: User }
	];

	$: currentPath = $page.url.pathname;
	$: filteredSidebarNav = sidebarNav.filter((item) => !item.roles || item.roles.includes(user.role));
	let userMenuOpen = false;
	let sidebarOpen = false;

	function isActive(href: string): boolean {
		if (href === '/') return currentPath === '/';
		return currentPath === href || currentPath.startsWith(href + '/');
	}

	function navigate(href: string) {
		goto(href);
		sidebarOpen = false;
		userMenuOpen = false;
	}

	async function handleLogout() {
		auth.logout();
		goto('/login');
	}

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function toggleUserMenu() {
		userMenuOpen = !userMenuOpen;
	}
</script>

<div class="min-h-screen bg-ivory">
	<aside
		class={cn(
			'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0',
			sidebarOpen ? 'translate-x-0' : '-translate-x-full'
		)}
	>
		<div class="flex flex-col h-full">
			<div class="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
				<div class="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-soft">
					<Heart class="w-5 h-5 text-white" />
				</div>
				<div>
					<h1 class="font-serif font-bold text-primary-800 leading-tight">养老评估</h1>
					<p class="text-xs text-gray-400">协同管理平台</p>
				</div>
			</div>

			<nav class="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
				<p class="px-3 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">功能导航</p>
				<ul class="space-y-1">
					{#each filteredSidebarNav as item}
						<li>
							<button
								type="button"
								on:click={() => navigate(item.href)}
								class={cn('sidebar-link w-full text-left', isActive(item.href) && 'active')}
							>
								<svelte:component this={item.icon} class="w-5 h-5 flex-shrink-0" />
								<span class="text-sm">{item.label}</span>
							</button>
						</li>
					{/each}
				</ul>
			</nav>

			<div class="p-3 border-t border-gray-100">
				<div class="px-3 py-3 rounded-xl bg-primary-50">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
							{user.name.charAt(0)}
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-800 truncate">{user.name}</p>
							<p class="text-xs text-gray-500 truncate">{roleLabelMap[user.role]}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</aside>

	{#if sidebarOpen}
		<button
			type="button"
			aria-label="关闭侧边栏"
			class="fixed inset-0 z-30 bg-black/40 lg:hidden p-0 border-0 cursor-default"
			on:click={toggleSidebar}
			on:keydown={(e) => e.key === 'Escape' && toggleSidebar()}
		/>
	{/if}

	<div class="lg:pl-64 flex flex-col min-h-screen">
		<header class="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200">
			<div class="flex items-center justify-between px-4 md:px-6 h-16">
				<div class="flex items-center gap-3">
					<button
						type="button"
						on:click={toggleSidebar}
						class="lg:hidden p-2 -ml-2 rounded-xl text-gray-600 hover:bg-gray-100"
					>
						{#if sidebarOpen}
							<X class="w-5 h-5" />
						{:else}
							<Menu class="w-5 h-5" />
						{/if}
					</button>
					<h2 class="text-base font-semibold text-gray-800 truncate max-w-[200px] md:max-w-none">
						{#each filteredSidebarNav as item}
							{#if isActive(item.href)}
								{item.label}
							{/if}
						{/each}
					</h2>
				</div>

				<div class="flex items-center gap-2">
					<div class="relative">
						<button
							type="button"
							on:click={toggleUserMenu}
							class="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
						>
							<div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
								{user.name.charAt(0)}
							</div>
							<div class="hidden sm:block text-left">
								<p class="text-sm font-medium text-gray-800 leading-tight">{user.name}</p>
								<p class="text-xs text-gray-500">{roleLabelMap[user.role]}</p>
							</div>
						</button>

						{#if userMenuOpen}
							<div class="absolute right-0 mt-2 w-56 card py-2 z-50">
								<div class="px-4 py-3 border-b border-gray-100">
									<p class="text-sm font-medium text-gray-800">{user.name}</p>
									<p class="text-xs text-gray-500 truncate">{user.email}</p>
								</div>
								<div class="py-1">
									<button
										type="button"
										on:click={() => navigate('/profile')}
										class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
									>
										<User class="w-4 h-4 text-gray-400" />
										个人中心
									</button>
									<button
										type="button"
										on:click={() => navigate('/settings')}
										class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
									>
										<Settings class="w-4 h-4 text-gray-400" />
										系统设置
									</button>
								</div>
								<div class="border-t border-gray-100 pt-1">
									<button
										type="button"
										on:click={handleLogout}
										class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50"
									>
										<LogOut class="w-4 h-4" />
										退出登录
									</button>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</header>

		<main class="flex-1 px-4 md:px-6 py-6 pb-24 lg:pb-6">
			<slot />
		</main>
	</div>

	<nav class="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white border-t border-gray-200 safe-area-bottom">
		<ul class="grid grid-cols-4 h-16">
			{#each mobileNav as item}
				<li>
					<button
						type="button"
						on:click={() => navigate(item.href)}
						class={cn(
							'w-full h-full flex flex-col items-center justify-center gap-1 transition-colors',
							isActive(item.href) ? 'text-primary-600' : 'text-gray-500'
						)}
					>
						<svelte:component this={item.icon} class="w-5 h-5" />
						<span class="text-[11px]">{item.label}</span>
					</button>
				</li>
			{/each}
		</ul>
	</nav>
</div>
