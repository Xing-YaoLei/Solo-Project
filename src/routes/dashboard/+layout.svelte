<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { currentUser } from '$lib/stores/auth';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Topbar from '$lib/components/Topbar.svelte';

	if (browser && !$currentUser) {
		goto('/login', { replaceState: true });
	}
</script>

{#if $currentUser}
	<div class="flex min-h-screen">
		<Sidebar />
		<div class="flex-1 ml-60 flex flex-col">
			<Topbar />
			<main class="flex-1 p-8 overflow-auto">
				<slot />
			</main>
		</div>
	</div>
{/if}
