<script lang="ts">
	import { page } from '$app/stores';

	let currentPath = $derived($page.url.pathname);

	let title = $state('工作台');

	$effect(() => {
		const path = currentPath;
		if (path === '/mobile') title = '工作台';
		else if (path === '/mobile/checkin') title = '工人签到';
		else if (path.startsWith('/mobile/change-orders')) title = '变更单';
		else if (path === '/mobile/acceptance') title = '验收照片';
		else if (path === '/mobile/after-sales') title = '售后工单';
		else if (path === '/mobile/material-delays') title = '材料延期';
		else if (path === '/mobile/todo') title = '待办事项';
		else if (path === '/mobile/profile') title = '我的';
	});

	const navItems = [
		{ path: '/mobile', icon: '🏠', label: '首页' },
		{ path: '/mobile/change-orders', icon: '📋', label: '待办' },
		{ path: '/mobile/checkin', icon: '⏰', label: '签到' },
		{ path: '/mobile/profile', icon: '👤', label: '我的' }
	];

	function isActive(path: string): boolean {
		if (path === '/mobile') return currentPath === '/mobile';
		return currentPath.startsWith(path);
	}
</script>

<div class="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
	<header class="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
		<div class="px-4 py-3 flex items-center justify-between">
			<h1 class="text-lg font-semibold text-gray-900">{title}</h1>
			<div class="flex items-center gap-2">
				<button class="p-2 -mr-2 text-gray-500 hover:text-gray-700 active:bg-gray-100 rounded-lg">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
					</svg>
				</button>
			</div>
		</div>
	</header>

	<main class="flex-1 overflow-y-auto pb-24">
		<slot />
	</main>

	<nav class="bg-white border-t border-gray-100 fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50">
		<div class="flex items-center justify-around py-2">
			{#each navItems as item}
				<a
					href={item.path}
					class="flex flex-col items-center py-1 px-3 rounded-lg transition-colors {isActive(item.path) ? 'text-primary-600' : 'text-gray-500'}"
				>
					<span class="text-xl mb-0.5">{item.icon}</span>
					<span class="text-xs font-medium">{item.label}</span>
				</a>
			{/each}
		</div>
	</nav>
</div>

<style>
	main {
		-webkit-overflow-scrolling: touch;
	}
</style>
