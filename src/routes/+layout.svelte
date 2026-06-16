<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';

	let AppShell: any = null;

	if (browser) {
		import('$lib/components/AppShell.svelte').then(m => { AppShell = m.default; });
	}

	$: serverUser = $page.data.user;
	$: authUser = browser ? $auth.user : null;
	$: user = authUser || serverUser;
	$: isLoginPage = $page.url.pathname === '/login';
	$: showShell = !isLoginPage && !!user && !!AppShell;
</script>

{#if showShell && AppShell}
	<svelte:component this={AppShell} {user}>
		<slot />
	</svelte:component>
{:else}
	<slot />
{/if}
