<script lang="ts">
	import { currentUser } from '$lib/stores/auth';
	import { pageTitle } from '$lib/stores/page';
	import { goto } from '$app/navigation';

	async function handleLogout() {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
		} catch {
			/* ignore */
		}
		currentUser.logout();
		await goto('/login');
	}
</script>

<header class="h-16 bg-navy-900/80 backdrop-blur-md border-b border-navy-700/40 flex items-center justify-between px-8 sticky top-0 z-20">
	<div class="flex items-center">
		<h1 class="text-white text-lg font-semibold">
			{$pageTitle}
		</h1>
	</div>

	<div class="flex items-center space-x-4">
		<div class="text-navy-300 text-sm hidden md:block">
			{new Date().toLocaleDateString('zh-CN', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				weekday: 'long'
			})}
		</div>

		<button
			on:click={handleLogout}
			class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm text-navy-300 hover:text-white hover:bg-navy-800/80 transition-all duration-200"
		>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-4 h-4 mr-1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
			</svg>
			退出登录
		</button>
	</div>
</header>
