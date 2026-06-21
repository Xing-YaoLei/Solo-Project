<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc/client';
	import { onMount, onDestroy } from 'svelte';
	import '../app.css';

	let { data } = $props<{
		data: {
			user: {
				id: string;
				username: string;
				email: string;
				fullName: string;
				role: string;
				phone?: string;
				avatar?: string;
			} | null;
		};
	}>();

	let windowWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1280);
	let mobileMenuOpen = $state(false);
	let userMenuOpen = $state(false);
	let isLoggingOut = $state(false);

	let isMobile = $derived(windowWidth < 768);

	let handleResize: (() => void) | undefined;

	onMount(() => {
		handleResize = () => {
			windowWidth = window.innerWidth;
		};
		window.addEventListener('resize', handleResize);
	});

	onDestroy(() => {
		if (handleResize) {
			window.removeEventListener('resize', handleResize);
		}
	});

	const navItems = [
		{ name: '仪表盘', href: '/', icon: '📊' },
		{ name: '项目管理', href: '/projects', icon: '🏗️' },
		{ name: '变更单', href: '/change-orders', icon: '📝' },
		{ name: '验收记录', href: '/acceptance', icon: '✅' },
		{ name: '考勤管理', href: '/checkins', icon: '⏰' },
		{ name: '售后工单', href: '/after-sales', icon: '🔧' },
		{ name: '材料延误', href: '/material-delays', icon: '🚚' }
	];

	const getRoleLabel = (role: string): string => {
		const labels: Record<string, string> = {
			project_manager: '项目经理',
			designer: '设计师',
			foreman: '施工队长',
			worker: '工人',
			supplier: '供应商',
			client: '客户',
			admin: '管理员'
		};
		return labels[role] || role;
	};

	const handleLogout = async () => {
		if (isLoggingOut) return;
		isLoggingOut = true;

		try {
			await trpc.auth.logout.mutate();
			await goto('/login');
		} catch (error) {
			console.error('Logout failed:', error);
		} finally {
			isLoggingOut = false;
			userMenuOpen = false;
		}
	};

	const toggleMobileMenu = () => {
		mobileMenuOpen = !mobileMenuOpen;
		if (mobileMenuOpen) {
			userMenuOpen = false;
		}
	};

	const toggleUserMenu = () => {
		userMenuOpen = !userMenuOpen;
		if (userMenuOpen) {
			mobileMenuOpen = false;
		}
	};

	const closeMenus = () => {
		mobileMenuOpen = false;
		userMenuOpen = false;
	};

	$effect(() => {
		if ($page.url.pathname) {
			closeMenus();
		}
	});
</script>

<div class="min-h-screen bg-gray-50">
	{#if isMobile}
		<header class="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 safe-area-top">
			<div class="flex items-center justify-between px-4 h-14">
				<button
					class="btn-ghost !min-h-10 !px-3"
					onclick={toggleMobileMenu}
					aria-label="菜单"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width={2}
							d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
						/>
					</svg>
				</button>

				<h1 class="text-lg font-bold text-primary-600">变更协同</h1>

				{#if data.user}
					<button
						class="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 transition-colors"
						onclick={toggleUserMenu}
						aria-label="用户菜单"
					>
						{#if data.user.avatar}
							<img
								src={data.user.avatar}
								alt={data.user.fullName}
								class="w-8 h-8 rounded-full object-cover"
							/>
						{:else}
							<div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-sm">
								{data.user.fullName.charAt(0)}
							</div>
						{/if}
					</button>
				{:else}
					<a href="/login" class="btn-primary !min-h-10 !px-4 text-sm">登录</a>
				{/if}
			</div>

			{#if mobileMenuOpen}
				<nav class="absolute top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
					<div class="py-2 px-3">
						{#each navItems as item}
							<a
								href={item.href}
								class="nav-link {$page.url.pathname === item.href ? 'nav-link-active' : ''}"
								onclick={closeMenus}
							>
								<span class="text-xl">{item.icon}</span>
								<span>{item.name}</span>
							</a>
						{/each}
					</div>
				</nav>
			{/if}

			{#if userMenuOpen && data.user}
				<div class="absolute top-14 right-2 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
					<div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
						<p class="font-medium text-gray-900">{data.user.fullName}</p>
						<p class="text-sm text-gray-500">{data.user.username}</p>
						<p class="text-xs text-primary-600 mt-1">{getRoleLabel(data.user.role)}</p>
					</div>
					<div class="py-1">
						<a href="/profile" class="nav-link rounded-none border-b border-gray-100">
							<span>👤</span>
							<span>个人资料</span>
						</a>
						<a href="/settings" class="nav-link rounded-none border-b border-gray-100">
							<span>⚙️</span>
							<span>设置</span>
						</a>
						<button
							class="nav-link w-full rounded-none text-red-600 hover:text-red-700 hover:bg-red-50"
							onclick={handleLogout}
							disabled={isLoggingOut}
						>
							<span>🚪</span>
							<span>{isLoggingOut ? '退出中...' : '退出登录'}</span>
						</button>
					</div>
				</div>
			{/if}
		</header>

		{#if mobileMenuOpen || userMenuOpen}
			<div class="fixed inset-0 bg-black/20 z-30" onclick={closeMenus} />
		{/if}

		<main class="pt-14 pb-20 min-h-screen safe-area-bottom">
			<slot />
		</main>

		{#if data.user}
			<nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
				<div class="flex justify-around items-center h-16">
					{#each navItems.slice(0, 5) as item}
						<a
							href={item.href}
							class="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-0 flex-1"
						>
							<span class="text-xl">{$page.url.pathname === item.href ? item.icon : item.icon}</span>
							<span
								class="text-xs truncate max-w-full {$page.url.pathname === item.href
									? 'text-primary-600 font-medium'
									: 'text-gray-500'}"
							>
								{item.name}
							</span>
						</a>
					{/each}
				</div>
			</nav>
		{/if}
	{:else}
		<div class="flex min-h-screen">
			<aside class="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-gray-200">
				<div class="flex items-center h-16 px-6 border-b border-gray-200">
					<h1 class="text-xl font-bold text-primary-600">变更协同管理系统</h1>
				</div>

				<nav class="flex-1 px-3 py-4 overflow-y-auto">
					{#each navItems as item}
						<a
							href={item.href}
							class="nav-link {$page.url.pathname === item.href ? 'nav-link-active' : ''}"
						>
							<span class="text-lg">{item.icon}</span>
							<span>{item.name}</span>
						</a>
					{/each}
				</nav>

				{#if data.user}
					<div class="border-t border-gray-200 p-4">
						<div class="flex items-center gap-3 mb-3">
							{#if data.user.avatar}
								<img
									src={data.user.avatar}
									alt={data.user.fullName}
									class="w-10 h-10 rounded-full object-cover"
								/>
							{:else}
								<div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
									{data.user.fullName.charAt(0)}
								</div>
							{/if}
							<div class="min-w-0 flex-1">
								<p class="font-medium text-gray-900 truncate">{data.user.fullName}</p>
								<p class="text-sm text-primary-600 truncate">{getRoleLabel(data.user.role)}</p>
							</div>
						</div>
						<button
							class="btn-ghost w-full !min-h-10 !text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
							onclick={handleLogout}
							disabled={isLoggingOut}
						>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width={2}
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								/>
							</svg>
							{isLoggingOut ? '退出中...' : '退出登录'}
						</button>
					</div>
				{/if}
			</aside>

			<div class="flex-1 md:ml-64">
				<header class="hidden md:flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 sticky top-0 z-30">
					<h2 class="text-lg font-semibold text-gray-800">
						{#each navItems as item}
							{#if $page.url.pathname === item.href}
								{item.name}
							{/if}
						{/each}
						{#if $page.url.pathname === '/login'}
							登录
						{/if}
					</h2>

					{#if data.user}
						<div class="relative">
							<button
								class="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
								onclick={toggleUserMenu}
							>
								<div class="text-right hidden sm:block">
									<p class="text-sm font-medium text-gray-900">{data.user.fullName}</p>
									<p class="text-xs text-gray-500">{getRoleLabel(data.user.role)}</p>
								</div>
								{#if data.user.avatar}
									<img
										src={data.user.avatar}
										alt={data.user.fullName}
										class="w-9 h-9 rounded-full object-cover"
									/>
								{:else}
									<div class="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
										{data.user.fullName.charAt(0)}
									</div>
								{/if}
								<svg
									class="w-4 h-4 text-gray-400 hidden sm:block"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width={2}
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>

							{#if userMenuOpen}
								<div class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
									<div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
										<p class="font-medium text-gray-900">{data.user.fullName}</p>
										<p class="text-sm text-gray-500">{data.user.email}</p>
									</div>
									<div class="py-1">
										<a href="/profile" class="nav-link rounded-none border-b border-gray-100">
											<span>👤</span>
											<span>个人资料</span>
										</a>
										<a href="/settings" class="nav-link rounded-none">
											<span>⚙️</span>
											<span>设置</span>
										</a>
									</div>
								</div>
							{/if}
						</div>
					{:else}
						<a href="/login" class="btn-primary !min-h-10 !px-5">登录</a>
					{/if}
				</header>

				{#if userMenuOpen}
					<div class="fixed inset-0 z-20" onclick={closeMenus} />
				{/if}

				<main class="container-responsive py-6 lg:py-8">
					<slot />
				</main>
			</div>
		</div>
	{/if}
</div>
