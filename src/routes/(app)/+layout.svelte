<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getTrpcClient } from '$lib/trpc';

	let { data } = $props();

	let user = $state<any>(null);

	$effect(() => {
		if (data?.user) {
			user = data.user;
		}
	});

	const navItems = [
		{ key: 'todo', label: '我的待办', icon: '📋', path: '/todo' },
		{ key: 'orders', label: '售后单列表', icon: '📦', path: '/orders' },
		{ key: 'create', label: '新建售后单', icon: '➕', path: '/create' },
		{ key: 'stats', label: '复盘统计', icon: '📊', path: '/stats' },
		{ key: 'admin', label: '系统管理', icon: '⚙️', path: '/admin' }
	];

	async function handleLogout() {
		try {
			const result = await getTrpcClient().auth.logout.mutate();
			if (result.sessionCookie) {
				document.cookie = `${result.sessionCookie.name}=; path=/; max-age=0`;
			}
			goto('/login');
		} catch (e) {
			console.error('Logout error:', e);
		}
	}

	function isActive(path: string) {
		return $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
	}
</script>

<div class="layout">
	<aside class="sidebar">
		<div class="sidebar-header">
			🏪 售后协同台
		</div>
		<nav class="sidebar-nav">
			{#each navItems as item}
				<div
					class="sidebar-nav-item {isActive(item.path) ? 'active' : ''}"
					onclick={() => goto(item.path)}
				>
					<span>{item.icon}</span>
					<span>{item.label}</span>
				</div>
			{/each}
		</nav>
	</aside>

	<div class="main-content">
		<header class="topbar">
			<div class="topbar-title">
				{$page.url.pathname === '/todo' ? '我的待办' :
					$page.url.pathname === '/orders' ? '售后单列表' :
					$page.url.pathname === '/create' ? '新建售后单' :
					$page.url.pathname === '/stats' ? '复盘统计' :
					$page.url.pathname === '/admin' ? '系统管理' :
					'售后退款协同台'}
			</div>
			<div class="topbar-user">
				{#if user}
					<span>{user.realName || user.username}</span>
					<span class="user-role">{user.role === 'admin' ? '管理员' : '运营'}</span>
					<button class="btn btn-sm" onclick={handleLogout}>退出</button>
				{/if}
			</div>
		</header>

		<main class="page-content">
			{@render children?.()}
		</main>
	</div>
</div>

<style>
	.user-role {
		font-size: 12px;
		color: var(--text-secondary);
		background: var(--bg-tertiary);
		padding: 2px 8px;
		border-radius: 4px;
	}
</style>
