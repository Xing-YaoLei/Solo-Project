<script lang="ts">
  import '../app.css';
  import Layout from '$lib/components/Layout.svelte';
  import { page } from '$app/stores';

  $: isLoginPage = $page.url.pathname === '/login';
</script>

{#if isLoginPage}
  <slot />
{:else}
  <Layout>
    <slot />
  </Layout>
{/if}
