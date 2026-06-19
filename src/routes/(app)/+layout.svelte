<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/Sidebar.svelte';

	async function handleLogout() {
		await auth.logout();
	}

	const navItems = [
		{ path: '/', name: '仪表板', icon: 'dashboard' },
		{ path: '/properties', name: '房源管理', icon: 'home' },
		{ path: '/calendar', name: '房态日历', icon: 'calendar' },
		{ path: '/orders', name: '渠道订单', icon: 'order' },
		{ path: '/cleaning', name: '保洁任务', icon: 'clean' },
		{ path: '/guests', name: '入住证件', icon: 'id' },
		{ path: '/deposits', name: '押金明细', icon: 'money' },
		{ path: '/exceptions', name: '异常单', icon: 'alert' },
		{ path: '/reports', name: '报表下载', icon: 'report' },
		{ path: '/audit', name: '操作日志', icon: 'log' },
	];
</script>

<div class="min-h-screen flex bg-gray-50">
	<Sidebar {navItems} currentPath={$page.url.pathname} />

	<div class="flex-1 flex flex-col min-w-0">
		<header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
			<div>
				<h1 class="text-xl font-semibold text-gray-800">
					{#each navItems as item}
						{#if $page.url.pathname === item.path || (item.path !== '/' && $page.url.pathname.startsWith(item.path))}
							{item.name}
						{/if}
					{/each}
				</h1>
			</div>
			<div class="flex items-center gap-4">
				<div class="text-right">
					<div class="text-sm font-medium text-gray-700">{$auth.user?.username}</div>
					<div class="text-xs text-gray-500">
						{#if $auth.user?.role === 'admin'}管理员
						{:else if $auth.user?.role === 'manager'}经理
						{:else}员工{/if}
					</div>
				</div>
				<div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
					{$auth.user?.username?.[0]?.toUpperCase() ?? 'U'}
				</div>
				<button on:click={handleLogout} class="btn-secondary text-sm">退出</button>
			</div>
		</header>

		<main class="flex-1 p-6 overflow-auto">
			<slot />
		</main>
	</div>
</div>
