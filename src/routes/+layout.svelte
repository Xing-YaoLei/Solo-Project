<script lang="ts">
	import NavHeader from '$lib/components/NavHeader.svelte';
	import type { PageData } from './$types';
	import type { Snippet } from 'svelte';

	let { data, children } = $props<{ data: PageData; children?: Snippet }>();
</script>

<div class="min-h-screen bg-gray-50">
	<NavHeader />
	<main class="max-w-7xl mx-auto px-4 py-6">
		{@render children?.()}
	</main>
</div>
