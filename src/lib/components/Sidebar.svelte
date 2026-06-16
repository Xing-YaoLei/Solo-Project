<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	export let isOpen: boolean;

	let user: App.Locals['user'];

	$: if (typeof window !== 'undefined') {
		fetchCurrentUser();
	}

	async function fetchCurrentUser() {
		try {
			const res = await fetch('/api/trpc/auth.getCurrentUser', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 1,
					method: 'auth.getCurrentUser'
				})
			});
			const data = await res.json();
			if (data.result) {
				user = data.result.data;
			}
		} catch (e) {
			console.error(e);
		}
	}

	$: role = user?.role || 'caregiver';

	$: menuItems = [
		{ label: '工作台', icon: '🏠', path: '/', roles: ['admin', 'manager', 'nurse', 'caregiver'] },
		{ label: '用药提醒', icon: '💊', path: '/medications', roles: ['admin', 'manager', 'nurse', 'caregiver'] },
		{ label: '活动签到', icon: '✅', path: '/activities', roles: ['admin', 'manager', 'nurse', 'caregiver'] },
		{ label: '风险事件', icon: '⚠️', path: '/risks', roles: ['admin', 'manager', 'nurse', 'caregiver'] },
		{ label: '老人档案', icon: '👵', path: '/elderly', roles: ['admin', 'manager', 'nurse', 'caregiver'] },
		{ label: '数据看板', icon: '📊', path: '/dashboard', roles: ['admin', 'manager'] },
		{ label: '用户管理', icon: '👥', path: '/users', roles: ['admin'] }
	].filter((item) => item.roles.includes(role as typeof item.roles[number]));

	function isActive(path: string) {
		if (path === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(path);
	}
</script>

<aside
	class="{isOpen
		? 'w-64'
		: 'w-0'} flex-shrink-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-200 overflow-hidden"
>
	<div class="p-5 border-b border-gray-100 flex-shrink-0">
		<h1 class="text-xl font-bold text-primary-700">养老护理协同台</h1>
		<p class="text-xs text-gray-400 mt-1">用药提醒 · 活动签到 · 风险管理</p>
	</div>

	<nav class="flex-1 p-3 space-y-1 overflow-y-auto">
		{#each menuItems as item}
			<a
				class="sidebar-link {isActive(item.path) ? 'sidebar-link-active' : ''}"
				href={item.path}
				on:click={(e) => {
					e.preventDefault();
					goto(item.path);
				}}
			>
				<span class="text-lg">{item.icon}</span>
				<span class="font-medium">{item.label}</span>
			</a>
		{/each}
	</nav>

	{#if user}
		<div class="p-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
			<div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
				{user.fullName?.charAt(0) || user.username?.charAt(0)}
			</div>
			<div class="flex-1 min-w-0">
				<p class="font-medium text-sm text-gray-900 truncate">{user.fullName}</p>
				<p class="text-xs text-gray-500 truncate">{user.role}</p>
			</div>
		</div>
	{/if}
</aside>
