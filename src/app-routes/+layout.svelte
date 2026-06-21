<script lang="ts">
	import { page } from '$app/stores';
	import { trpc } from '$trpc/client';
	import { onMount } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	export let data;

	$: isAuthPage = $page.url.pathname === '/login' || $page.url.pathname === '/signup';
	$: user = data.user;
</script>

{#if isAuthPage}
	<div class="auth-wrapper">
		<slot />
	</div>
{:else}
	<div class="app-layout">
		<Sidebar {user} />
		<main class="main-content">
			<slot />
		</main>
	</div>
{/if}

<style>
	.auth-wrapper {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.app-layout {
		display: flex;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
		margin-left: 250px;
		padding: 24px;
		overflow-x: auto;
	}
</style>
