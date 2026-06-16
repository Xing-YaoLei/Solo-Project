<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { redirect } from '@sveltejs/kit';

  let isLoggedIn = false;

  $: {
    if ($page.url.pathname !== '/login' && !$page.data?.user) {
      throw redirect(302, '/login');
    }
    isLoggedIn = !!$page.data?.user;
  }
</script>

<svelte:head>
  <title>口腔诊所影像归档协同台</title>
</svelte:head>

{#if isLoggedIn && $page.url.pathname !== '/login'}
  <div class="flex h-screen bg-gray-50">
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div class="p-6 border-b border-gray-100">
        <h1 class="text-xl font-bold text-dental-600">🦷 口腔影像协同台</h1>
        <p class="text-xs text-gray-500 mt-1">影像归档 · 协同办公</p>
      </div>
      <nav class="flex-1 p-4 space-y-1">
        <a
          href="/"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors {
            $page.url.pathname === '/' ? 'bg-dental-50 text-dental-700' : 'text-gray-600 hover:bg-gray-50'
          }"
        >
          <span class="mr-3">📊</span>
          仪表盘
        </a>
        <a
          href="/patients"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors {
            $page.url.pathname.startsWith('/patients') ? 'bg-dental-50 text-dental-700' : 'text-gray-600 hover:bg-gray-50'
          }"
        >
          <span class="mr-3">👤</span>
          患者档案
        </a>
        <a
          href="/followups"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors {
            $page.url.pathname.startsWith('/followups') ? 'bg-dental-50 text-dental-700' : 'text-gray-600 hover:bg-gray-50'
          }"
        >
          <span class="mr-3">📅</span>
          随访任务
        </a>
        <a
          href="/exceptions"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors {
            $page.url.pathname.startsWith('/exceptions') ? 'bg-dental-50 text-dental-700' : 'text-gray-600 hover:bg-gray-50'
          }"
        >
          <span class="mr-3">⚠️</span>
          异常单管理
        </a>
        <a
          href="/statistics"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors {
            $page.url.pathname.startsWith('/statistics') ? 'bg-dental-50 text-dental-700' : 'text-gray-600 hover:bg-gray-50'
          }"
        >
          <span class="mr-3">📈</span>
          数据统计
        </a>
        <a
          href="/exports"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors {
            $page.url.pathname.startsWith('/exports') ? 'bg-dental-50 text-dental-700' : 'text-gray-600 hover:bg-gray-50'
          }"
        >
          <span class="mr-3">📤</span>
          导出记录
        </a>
      </nav>
      <div class="p-4 border-t border-gray-100">
        {#if $page.data?.user}
          <div class="flex items-center">
            <div class="w-8 h-8 bg-dental-100 rounded-full flex items-center justify-center">
              <span class="text-dental-700 font-medium text-sm">{$page.data.user.name.charAt(0)}</span>
            </div>
            <div class="ml-3 flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{$page.data.user.name}</p>
              <p class="text-xs text-gray-500 truncate">{$page.data.user.role}</p>
            </div>
          </div>
        {/if}
      </div>
    </aside>
    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
{:else}
  <slot />
{/if}
