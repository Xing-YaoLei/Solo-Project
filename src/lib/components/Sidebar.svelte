<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { trpc } from '$trpc/client';

	export let user: any;

	const menuItems = [
		{ path: '/', label: '项目总览', icon: '📋' },
		{ path: '/risks', label: '风险列表', icon: '⚠️' },
		{ path: '/dashboard', label: '管理层看板', icon: '📊', roles: ['manager', 'admin'] }
	];

	async function logout() {
		try {
			await trpc.auth.logout.mutate();
			goto('/login');
		} catch (e) {
			console.error('Logout failed:', e);
		}
	}

	function isActive(path: string) {
		if (path === '/') {
			return $page.url.pathname === '/';
		}
		return $page.url.pathname.startsWith(path);
	}
</script>

<aside class="sidebar">
	<div class="sidebar-header">
		<h2>🏠 家装协同台</h2>
	</div>

	<nav class="nav-menu">
		{#each menuItems as item}
			{#if !item.roles || item.roles.includes(user?.role)}
				<a
					class="nav-item"
					class:active={isActive(item.path)}
					href={item.path}
				>
					<span class="nav-icon">{item.icon}</span>
					<span class="nav-label">{item.label}</span>
				</a>
			{/if}
		{/each}
	</nav>

	<div class="sidebar-footer">
		<div class="user-info">
			<div class="user-avatar">{user?.fullName?.[0] || '?'}</div>
			<div class="user-details">
				<div class="user-name">{user?.fullName}</div>
				<div class="user-role">
					{user?.role === 'admin' ? '管理员' : user?.role === 'manager' ? '项目经理' : '施工员'}
				</div>
			</div>
		</div>
		<button class="logout-btn" on:click={logout}>
			退出登录
		</button>
	</div>
</aside>

<style>
	.sidebar {
		width: 250px;
		height: 100vh;
		position: fixed;
		left: 0;
		top: 0;
		background: linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%);
		color: white;
		display: flex;
		flex-direction: column;
		box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
	}

	.sidebar-header {
		padding: 24px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.sidebar-header h2 {
		font-size: 18px;
		font-weight: 600;
		margin: 0;
	}

	.nav-menu {
		flex: 1;
		padding: 16px 0;
		overflow-y: auto;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 20px;
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		transition: all 0.2s;
		cursor: pointer;
	}

	.nav-item:hover {
		background: rgba(255, 255, 255, 0.05);
		color: white;
	}

	.nav-item.active {
		background: rgba(59, 130, 246, 0.2);
		color: white;
		border-left: 3px solid #3b82f6;
	}

	.nav-icon {
		font-size: 18px;
	}

	.nav-label {
		font-size: 14px;
	}

	.sidebar-footer {
		padding: 16px 20px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
	}

	.user-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea, #764ba2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 16px;
	}

	.user-details {
		flex: 1;
		min-width: 0;
	}

	.user-name {
		font-size: 14px;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-role {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.5);
	}

	.logout-btn {
		width: 100%;
		padding: 8px 16px;
		background: rgba(239, 68, 68, 0.2);
		color: #f87171;
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		transition: all 0.2s;
	}

	.logout-btn:hover {
		background: rgba(239, 68, 68, 0.3);
	}
</style>
