<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { trpc } from '$lib/trpc/client';

  $: currentPath = $page.url.pathname;
  $: user = $page.data?.user;
  $: isLoginPage = currentPath === '/login';

  async function handleLogout() {
    await trpc.auth.logout.mutate();
    goto('/login');
  }
</script>

{#if isLoginPage}
  <slot />
{:else}
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        🏥 用药回访台
      </div>
      <nav class="sidebar-nav">
        {#if user && ['admin', 'manager'].includes(user.role)}
          <a href="/dashboard" class="sidebar-item {currentPath === '/dashboard' ? 'active' : ''}">
            <span>📊</span>
            <span>管理仪表盘</span>
          </a>
        {/if}
        <a href="/" class="sidebar-item {currentPath === '/' ? 'active' : ''}">
          <span>📋</span>
          <span>回访记录</span>
        </a>
        <a href="/todos" class="sidebar-item {currentPath === '/todos' ? 'active' : ''}">
          <span>✅</span>
          <span>我的待办</span>
        </a>
        <a href="/members" class="sidebar-item {currentPath.startsWith('/members') ? 'active' : ''}">
          <span>👤</span>
          <span>会员档案</span>
        </a>
        <a href="/drugs" class="sidebar-item {currentPath.startsWith('/drugs') ? 'active' : ''}">
          <span>💊</span>
          <span>药品批号</span>
        </a>
        <a href="/replenishment" class="sidebar-item {currentPath.startsWith('/replenishment') ? 'active' : ''}">
          <span>📦</span>
          <span>补货单</span>
        </a>
        <a href="/prescriptions" class="sidebar-item {currentPath.startsWith('/prescriptions') ? 'active' : ''}">
          <span>📝</span>
          <span>处方管理</span>
        </a>
        <a href="/insurance" class="sidebar-item {currentPath.startsWith('/insurance') ? 'active' : ''}">
          <span>🏥</span>
          <span>医保流水</span>
        </a>
      </nav>
      <div class="sidebar-footer">
        {#if user}
          <div class="user-info">
            <div class="user-avatar">{user.name.charAt(0)}</div>
            <div>
              <div style="font-size: 0.875rem; font-weight: 500;">{user.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">
                {user.role === 'admin' ? '系统管理员' : user.role === 'manager' ? '门店经理' : user.role === 'pharmacist' ? '执业药师' : '一线员工'}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </aside>
    <main class="main-content">
      <div class="topbar">
        <div class="topbar-title">
          {#if currentPath === '/dashboard'}
            管理仪表盘
          {:else if currentPath === '/'}
            回访记录
          {:else if currentPath === '/todos'}
            我的待办
          {:else if currentPath.startsWith('/members')}
            会员档案
          {:else if currentPath.startsWith('/drugs')}
            药品批号
          {:else if currentPath.startsWith('/replenishment')}
            补货单
          {:else if currentPath.startsWith('/prescriptions')}
            处方管理
          {:else if currentPath.startsWith('/insurance')}
            医保流水
          {:else}
            用药回访协同台
          {/if}
        </div>
        <div class="topbar-actions">
          <button class="btn-secondary btn-sm" on:click={handleLogout}>退出登录</button>
        </div>
      </div>
      <div class="content-wrapper">
        <slot />
      </div>
    </main>
  </div>
{/if}
