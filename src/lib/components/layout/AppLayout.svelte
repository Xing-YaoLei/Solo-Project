<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils/cn';
	import type { AuthUser } from '$lib/server/auth/lucia';
	import Sidebar from './Sidebar.svelte';
	import Topbar from './Topbar.svelte';
	import type { ComponentEvents } from 'svelte';

	export let user: AuthUser | null = null;
	let className: string | undefined = undefined;
	export { className as class };

	let collapsed = false;
	let mobileOpen = false;
	let isMd = true;

	function handleToggleCollapse() {
		collapsed = !collapsed;
		if (browser && localStorage) {
			localStorage.setItem('sidebar-collapsed', String(collapsed));
		}
	}

	function handleToggleSidebar() {
		if (isMd) {
			handleToggleCollapse();
		} else {
			mobileOpen = !mobileOpen;
		}
	}

	function handleCloseMobile() {
		mobileOpen = false;
	}

	async function handleLogout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await goto('/login');
	}

	function handleSearch(e: CustomEvent<string>) {
		console.log('Search:', e.detail);
	}

	onMount(() => {
		if (browser) {
			const saved = localStorage.getItem('sidebar-collapsed');
			if (saved !== null) collapsed = saved === 'true';

			const checkSize = () => {
				isMd = window.innerWidth >= 768;
				if (!isMd) mobileOpen = false;
			};
			checkSize();
			window.addEventListener('resize', checkSize);
			return () => window.removeEventListener('resize', checkSize);
		}
	});
</script>

<div class={cn('flex h-screen w-screen bg-industrial-950 text-industrial-100 overflow-hidden', className)}>
	<div class="hidden md:block">
		<Sidebar
			{collapsed}
			userRole={user?.role ?? 'ADVISOR'}
			on:toggleCollapse={handleToggleCollapse}
		/>
	</div>

	{#if mobileOpen}
		<div
			class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
			role="presentation"
			on:click={() => (mobileOpen = false)}
			on:keydown={(e) => {
				if (e.key === 'Escape' || e.key === ' ') mobileOpen = false;
			}}
		/>
		<div class="md:hidden fixed inset-y-0 left-0 z-50">
			<Sidebar
				collapsed={false}
				userRole={user?.role ?? 'ADVISOR'}
				{mobileOpen}
				on:closeMobile={handleCloseMobile}
			/>
		</div>
	{/if}

	<div class="flex-1 flex flex-col min-w-0">
		<Topbar {user} on:toggleSidebar={handleToggleSidebar} on:logout={handleLogout} on:search={handleSearch} />
		<main class="flex-1 overflow-y-auto overflow-x-hidden">
			<div class="p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto w-full">
				<slot />
			</div>
		</main>
	</div>
</div>
