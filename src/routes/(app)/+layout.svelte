<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  let { data, children }: { data: PageData; children: any } = $props();

  let sidebarCollapsed = $state(false);

  const navItems = [
    { href: '/', label: '工作台', icon: 'dashboard', permission: 'dashboard:view' },
    { href: '/complaints', label: '投诉管理', icon: 'complaint', permission: 'complaint:view' },
    { href: '/complaints/overdue', label: '超时待办', icon: 'overdue', permission: 'complaint:view' },
    { href: '/reports', label: '数据报表', icon: 'report', permission: 'report:view' },
    { href: '/admin/users', label: '用户管理', icon: 'user', permission: 'user:view' },
    { href: '/admin/roles', label: '角色管理', icon: 'role', permission: 'role:view' },
    { href: '/admin/tags', label: '标签管理', icon: 'tag', permission: 'tag:view' }
  ];

  const visibleNavItems = $derived(
    navItems.filter((item) => data.user.permissions?.includes(item.permission))
  );

  const isAdminSection = $derived(
    data.user.permissions?.includes('user:view') ||
    data.user.permissions?.includes('role:view') ||
    data.user.permissions?.includes('tag:view')
  );

  async function handleLogout() {
    await fetch('/api/trpc/auth.logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ json: { sessionId: '' } })
    });
    document.cookie = 'auth_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    goto('/login');
  }

  function isActive(href: string): boolean {
    const path = $page.url.pathname;
    if (href === '/') return path === '/';
    return path.startsWith(href);
  }
</script>

<div class="h-screen flex bg-slate-50">
  <aside
    class="flex-shrink-0 bg-sidebar text-white flex flex-col transition-all duration-300 {sidebarCollapsed ? 'w-16' : 'w-60'}"
  >
    <div class="h-16 flex items-center px-4 border-b border-white/10">
      {#if !sidebarCollapsed}
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span class="font-bold text-sm">景区投诉协同台</span>
        </div>
      {:else}
        <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      {/if}
    </div>

    <nav class="flex-1 py-4 overflow-y-auto scrollbar-thin">
      {#each visibleNavItems as item}
        <a
          href={item.href}
          class="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm transition-colors {isActive(item.href) ? 'bg-sidebar-active text-white' : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'}"
        >
          <span class="w-5 h-5 flex-shrink-0">
            {#if item.icon === 'dashboard'}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            {:else if item.icon === 'complaint'}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
            {:else if item.icon === 'overdue'}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {:else if item.icon === 'report'}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            {:else if item.icon === 'user'}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 1112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            {:else if item.icon === 'role'}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            {:else if item.icon === 'tag'}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            {/if}
          </span>
          {#if !sidebarCollapsed}
            <span>{item.label}</span>
          {/if}
        </a>
      {/each}
    </nav>

    <div class="border-t border-white/10 p-3">
      <button
        onclick={() => sidebarCollapsed = !sidebarCollapsed}
        class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-sidebar-hover transition text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d={sidebarCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
        </svg>
        {#if !sidebarCollapsed}
          <span>收起</span>
        {/if}
      </button>
    </div>
  </aside>

  <div class="flex-1 flex flex-col min-w-0">
    <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h2 class="text-lg font-semibold text-slate-800">
          {$page.url.pathname === '/' ? '工作台' : 
           $page.url.pathname.startsWith('/complaints/overdue') ? '超时待办' :
           $page.url.pathname.startsWith('/complaints') ? '投诉管理' :
           $page.url.pathname.startsWith('/reports') ? '数据报表' :
           $page.url.pathname.startsWith('/admin/users') ? '用户管理' :
           $page.url.pathname.startsWith('/admin/roles') ? '角色管理' :
           $page.url.pathname.startsWith('/admin/tags') ? '标签管理' : ''}
        </h2>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-xs px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full font-medium">
          {data.user.roleLabel || '未知角色'}
        </span>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">
            {data.user.displayName[0]}
          </div>
          <span class="text-sm text-slate-700">{data.user.displayName}</span>
        </div>
        <button
          onclick={handleLogout}
          class="text-sm text-slate-500 hover:text-red-600 transition"
        >
          退出
        </button>
      </div>
    </header>

    <main class="flex-1 overflow-auto p-6">
      {@render children()}
    </main>
  </div>
</div>
