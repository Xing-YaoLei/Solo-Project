<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Topbar from '$lib/components/Topbar.svelte';
	import { page } from '$app/stores';

	let isSidebarOpen = true;

	$: isLoginPage = $page.url.pathname === '/login' || $page.url.pathname === '/register';

	const toggleSidebar = () => {
		isSidebarOpen = !isSidebarOpen;
	};
</script>

{#if isLoginPage}
	<slot />
{:else}
	<div class="flex h-screen overflow-hidden bg-gray-50">
		<Sidebar bind:isOpen={isSidebarOpen} />
		<div class="flex-1 flex flex-col overflow-hidden">
			<Topbar onToggleSidebar={toggleSidebar} />
			<main class="flex-1 overflow-y-auto p-6">
				<slot />
			</main>
		</div>
	</div>
{/if}
