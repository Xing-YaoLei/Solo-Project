<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { createQuery, createMutation } from '$lib/trpc/query';
	import type { AuthUser } from '$server/auth/lucia';

	let user: AuthUser | null = null;
	let sidebarOpen = true;

	const meQuery = createQuery<void, { user: AuthUser }>('auth.me', () => ({} as any));

	const logoutMutation = createMutation('auth.logout');

	$: if ($meQuery.data) {
		user = $meQuery.data.user;
	}

	async function handleLogout() {
		try {
			await logoutMutation.mutate();
			goto('/login');
		} catch (err) {
			console.error('Logout failed:', err);
		}
	}

	const menuItems = [
		{
			icon: 'dashboard',
			label: '仪表盘',
			href: '/dashboard',
			roles: ['student', 'assistant', 'lecturer', 'admin']
		},
		{
			icon: 'book',
			label: '操作区',
			href: '/workspace',
			roles: ['student', 'assistant', 'lecturer', 'admin']
		},
		{
			icon: 'todo',
			label: '待办池',
			href: '/todos',
			badge: 3,
			roles: ['assistant', 'lecturer', 'admin']
		},
		{
			icon: 'chart',
			label: '报表',
			href: '/reports',
			roles: ['lecturer', 'admin']
		},
		{
			icon: 'users',
			label: '学员管理',
			href: '/students',
			roles: ['assistant', 'lecturer', 'admin']
		},
		{
			icon: 'settings',
			label: '系统设置',
			href: '/settings',
			roles: ['admin']
		}
	];

	function hasAccess(roles: string[]) {
		if (!user) return false;
		return user.roles.some((r) => roles.includes(r));
	}

	function isActive(href: string) {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}

	const roleLabels: Record<string, string> = {
		student: '学员',
		assistant: '助教',
		lecturer: '讲师',
		admin: '教务'
	};
</script>

<div class="min-h-screen flex bg-gray-50">
	<aside class={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
		<div class="h-16 flex items-center px-4 border-b border-gray-200">
			<div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
				<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
				</svg>
			</div>
			{#if sidebarOpen}
				<span class="ml-3 font-bold text-gray-900 text-lg">证书协同平台</span>
			{/if}
		</div>

		<nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
			{#each menuItems as item}
				{#if hasAccess(item.roles)}
					<a
						href={item.href}
						class="sidebar-link {isActive(item.href) ? 'active' : ''}"
						data-sveltekit-preload-data="hover"
					>
						{#if item.icon === 'dashboard'}
							<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
							</svg>
						{:else if item.icon === 'book'}
							<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
							</svg>
						{:else if item.icon === 'todo'}
							<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
							</svg>
						{:else if item.icon === 'chart'}
							<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
							</svg>
						{:else if item.icon === 'users'}
							<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
							</svg>
						{:else if item.icon === 'settings'}
							<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
							</svg>
						{/if}
						{#if sidebarOpen}
							<span class="flex-1">{item.label}</span>
							{#if item.badge}
								<span class="badge badge-danger">{item.badge}</span>
							{/if}
						{/if}
					</a>
				{/if}
			{/each}
		</nav>

		<div class="border-t border-gray-200 p-3">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium flex-shrink-0">
					{user?.name?.charAt(0) || 'U'}
				</div>
				{#if sidebarOpen}
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-gray-900 truncate">{user?.name || '加载中...'}</p>
						<p class="text-xs text-gray-500 truncate">
							{#each user?.roles || [] as role, i}
								{roleLabels[role] || role}{#if i < (user?.roles?.length || 0) - 1}、{/if}
							{/each}
						</p>
					</div>
				{/if}
			</div>
			{#if sidebarOpen}
				<button
					on:click={handleLogout}
					class="w-full mt-3 text-sm text-gray-600 hover:text-red-600 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
					</svg>
					退出登录
				</button>
			{/if}
		</div>
	</aside>

	<div class="flex-1 flex flex-col min-w-0">
		<header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
			<div class="flex items-center gap-4">
				<button
					on:click={() => sidebarOpen = !sidebarOpen}
					class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
					aria-label="切换侧边栏"
				>
					<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
					</svg>
				</button>
				<h1 class="text-lg font-semibold text-gray-900">
					<slot name="title" />
				</h1>
			</div>

			<div class="flex items-center gap-3">
				<button class="p-2 rounded-lg hover:bg-gray-100 transition-colors relative" aria-label="通知">
					<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
					</svg>
					<span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
				</button>
			</div>
		</header>

		<main class="flex-1 overflow-auto p-6">
			<slot />
		</main>
	</div>
</div>
