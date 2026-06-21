<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { data, children } = $props();

	let currentPath = $derived(page.url.pathname);

	$effect(() => {
		if (!data.user && currentPath !== '/login' && currentPath !== '/register') {
			goto('/login');
		}
	});

	const navItems = [
		{ href: '/performances', label: '排期管理', icon: '📋' },
		{ href: '/exceptions', label: '异常处理', icon: '⚠️' },
		{ href: '/reports', label: '统计报表', icon: '📊' },
		{ href: '/closed', label: '已关闭记录', icon: '🗄️' }
	];

	function isActive(href: string): boolean {
		if (href === '/') return currentPath === '/';
		return currentPath === href || currentPath.startsWith(href + '/');
	}
</script>

{#if data.user || currentPath === '/login' || currentPath === '/register'}
	<div class="app-layout">
		{#if data.user}
			<aside class="sidebar">
				<div class="sidebar-header">
					<span class="sidebar-icon">🎭</span>
					<h1 class="sidebar-title">演出排期协同台</h1>
				</div>

				<nav class="sidebar-nav">
					{#each navItems as item}
						<a
							href={item.href}
							class="nav-link"
							class:active={isActive(item.href)}
						>
							<span class="nav-icon">{item.icon}</span>
							<span>{item.label}</span>
						</a>
					{/each}
				</nav>

				<div class="sidebar-footer">
					<div class="user-info">
						<div class="user-avatar">{data.user.displayName?.[0] ?? data.user.username[0]}</div>
						<div class="user-details">
							<span class="user-name">{data.user.displayName ?? data.user.username}</span>
							<span class="user-role">{data.user.role}</span>
						</div>
					</div>
					<form method="POST" action="/logout">
						<button type="submit" class="logout-btn">退出登录</button>
					</form>
				</div>
			</aside>
		{/if}

		<main class="main-content">
			{@render children()}
		</main>
	</div>
{/if}

<style>
	.app-layout {
		display: flex;
		min-height: 100vh;
	}

	.sidebar {
		width: 240px;
		background: #1e293b;
		color: #e2e8f0;
		display: flex;
		flex-direction: column;
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		z-index: 10;
	}

	.sidebar-header {
		padding: 20px 16px;
		border-bottom: 1px solid #334155;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.sidebar-icon {
		font-size: 24px;
	}

	.sidebar-title {
		font-size: 16px;
		font-weight: 600;
		margin: 0;
		white-space: nowrap;
	}

	.sidebar-nav {
		flex: 1;
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border-radius: 6px;
		color: #94a3b8;
		text-decoration: none;
		font-size: 14px;
		transition: background 0.15s, color 0.15s;
	}

	.nav-link:hover {
		background: #334155;
		color: #e2e8f0;
	}

	.nav-link.active {
		background: #3b82f6;
		color: #ffffff;
	}

	.nav-icon {
		font-size: 18px;
		width: 24px;
		text-align: center;
	}

	.sidebar-footer {
		padding: 16px;
		border-top: 1px solid #334155;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
	}

	.user-avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: #3b82f6;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		font-weight: 600;
		color: #fff;
		flex-shrink: 0;
	}

	.user-details {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.user-name {
		font-size: 13px;
		font-weight: 500;
		color: #e2e8f0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.user-role {
		font-size: 11px;
		color: #64748b;
	}

	.logout-btn {
		width: 100%;
		padding: 8px;
		border: 1px solid #475569;
		border-radius: 6px;
		background: transparent;
		color: #94a3b8;
		font-size: 13px;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.logout-btn:hover {
		background: #334155;
		color: #e2e8f0;
	}

	.main-content {
		flex: 1;
		background: #f8fafc;
		padding: 24px;
		margin-left: 240px;
		min-height: 100vh;
	}
</style>
