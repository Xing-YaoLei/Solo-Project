<script lang="ts">
	import '../app.css';
	import AppLayout from '$lib/components/layout/AppLayout.svelte';

	export let data;
</script>

{#if data?.user}
	<AppLayout user={data.user}>
		<slot />
	</AppLayout>
{:else}
	<div class="min-h-screen w-full bg-industrial-950 text-industrial-100">
		<slot />
	</div>
{/if}
