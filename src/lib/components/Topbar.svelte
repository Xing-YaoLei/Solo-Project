<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	export let onToggleSidebar: () => void;

	$: title = getPageTitle($page.url.pathname);

	function getPageTitle(pathname: string): string {
		const titles: Record<string, string> = {
			'/': '工作台',
			'/medications': '用药提醒',
			'/activities': '活动签到',
			'/risks': '风险事件',
			'/elderly': '老人档案',
			'/dashboard': '数据看板',
			'/users': '用户管理'
		};
		for (const [path, title] of Object.entries(titles)) {
			if (path === '/') {
				if (pathname === '/') return title;
			} else if (pathname.startsWith(path)) {
				return title;
			}
		}
		return '养老护理协同台';
	}

	async function handleLogout() {
		try {
			await fetch('/api/trpc/auth.logout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'auth.logout' })
			});
			goto('/login');
		} catch (e) {
			console.error(e);
		}
	}
</script>

<header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
	<div class="flex items-center gap-4">
		<button
			class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
			on:click={onToggleSidebar}
			aria-label="切换侧边栏"
		>
			<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</button>
		<h2 class="text-xl font-semibold text-gray-800">{title}</h2>
	</div>

	<div class="flex items-center gap-3">
		<button
			class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
			on:click={handleLogout}
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
				/>
			</svg>
			退出
		</button>
	</div>
</header>
