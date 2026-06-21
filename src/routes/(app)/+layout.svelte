<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let user: any = null;

	const navItems = [
		{ name: '核验记录', href: '/', icon: 'clipboard' },
		{ name: '异常处理', href: '/abnormal', icon: 'alert' },
		{ name: '数据统计', href: '/statistics', icon: 'chart' },
		{ name: '骑手管理', href: '/riders', icon: 'users' }
	];

	function isActive(href: string) {
		if (href === '/') {
			return $page.url.pathname === '/';
		}
		return $page.url.pathname.startsWith(href);
	}

	async function handleLogout() {
		try {
			await fetch('/api/trpc/auth.logout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ json: {} })
			});
			await goto('/login');
		} catch (e) {
			console.error('Logout failed:', e);
		}
	}

	onMount(() => {
		user = $page.data?.user || null;
	});

	$: user = $page.data?.user || null;
</script>

<div class="flex h-screen bg-gray-100">
	<!-- Sidebar -->
	<div class="flex w-64 flex-col bg-white shadow-sm">
		<div class="flex h-16 items-center px-6 border-b border-gray-200">
			<h1 class="text-lg font-bold text-indigo-600">核验协同台</h1>
		</div>

		<nav class="flex-1 space-y-1 px-3 py-4">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors
						{isActive(item.href)
							? 'bg-indigo-50 text-indigo-600'
							: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
				>
					<span class="mr-3">
						{#if item.icon === 'clipboard'}
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							</svg>
						{:else if item.icon === 'alert'}
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
						{:else if item.icon === 'chart'}
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
							</svg>
						{:else if item.icon === 'users'}
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
							</svg>
						{/if}
					</span>
					{item.name}
				</a>
			{/each}
		</nav>

		<!-- User info -->
		<div class="border-t border-gray-200 p-4">
			<div class="flex items-center">
				<div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
					<span class="text-indigo-600 font-medium text-sm">
						{user?.username?.charAt(0).toUpperCase()}
					</span>
				</div>
				<div class="ml-3">
					<p class="text-sm font-medium text-gray-700">{user?.username}</p>
					<p class="text-xs text-gray-500">
						{#if user?.role === 'admin'}
							管理员
						{:else if user?.role === 'reviewer'}
							复核员
						{:else}
							操作员
						{/if}
					</p>
				</div>
			</div>
			<button
				onclick={handleLogout}
				class="mt-3 w-full text-sm text-gray-500 hover:text-gray-700 text-left"
			>
				退出登录
			</button>
		</div>
	</div>

	<!-- Main content -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<main class="flex-1 overflow-y-auto p-6">
			<slot />
		</main>
	</div>
</div>
