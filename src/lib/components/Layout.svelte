<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Sidebar from './Sidebar.svelte';
  import { trpc } from '$lib/trpc/client';
  import { userStore } from '$lib/stores/user';
  import { Loader2, LogOut, User } from 'lucide-svelte';

  let loading = true;
  let user: any = null;

  async function checkAuth() {
    try {
      const result = await trpc.auth.getCurrentUser.query();
      user = result;
      $userStore = user;
      
      if (!$page.url.pathname.startsWith('/login') && !user) {
        await goto('/login');
      }
    } catch (e) {
      if (!$page.url.pathname.startsWith('/login')) {
        await goto('/login');
      }
    } finally {
      loading = false;
    }
  }

  async function logout() {
    await trpc.auth.logout.mutate();
    $userStore = null;
    await goto('/login');
  }

  onMount(() => {
    checkAuth();
  });

  $: currentRoute = $page.url.pathname;
</script>

{#if loading}
  <div class="min-h-screen flex items-center justify-center bg-industrial-bg">
    <div class="flex flex-col items-center gap-4">
      <Loader2 class="w-10 h-10 text-primary-500 animate-spin" />
      <p class="text-industrial-text-secondary">加载中...</p>
    </div>
  </div>
{:else if user}
  <div class="min-h-screen flex bg-industrial-bg">
    <Sidebar {user} {currentRoute} />
    
    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-16 bg-industrial-card border-b border-industrial-border flex items-center justify-between px-6">
        <div>
          <h1 class="font-display text-lg font-semibold text-industrial-text">
            {getPageTitle(currentRoute)}
          </h1>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3 px-3 py-1.5 bg-industrial-bg rounded-lg border border-industrial-border">
            <div class="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
              <User class="w-4 h-4 text-primary-400" />
            </div>
            <div class="text-left">
              <p class="text-sm font-medium text-industrial-text">{user.name}</p>
              <p class="text-xs text-industrial-text-muted">{getRoleLabel(user.role)}</p>
            </div>
          </div>
          
          <button
            on:click={logout}
            class="p-2 rounded-lg bg-industrial-bg border border-industrial-border hover:bg-accent-red/10 hover:border-accent-red/50 transition-all duration-200"
            title="退出登录"
          >
            <LogOut class="w-5 h-5 text-industrial-text-secondary hover:text-accent-red transition-colors" />
          </button>
        </div>
      </header>
      
      <main class="flex-1 p-6 overflow-auto scrollbar-thin">
        <slot />
      </main>
    </div>
  </div>
{/if}

<script lang="ts" context="module">
  function getPageTitle(route: string): string {
    const titles: Record<string, string> = {
      '/': '仪表盘',
      '/dictionary/quote-items': '报价单字典',
      '/dictionary/inspection-rules': '质检照片规则',
      '/dictionary/vehicle-thresholds': '车辆档案阈值',
      '/workorder/diagnosis': '诊断与工单处理',
      '/workorder/list': '工单列表',
      '/shortage/todo': '缺货待办中心',
      '/query': '综合查询',
      '/analysis/rework': '返修率分析'
    };
    
    if (route.startsWith('/shortage/')) {
      return '缺货单详情';
    }
    
    return titles[route] || '汽车维修报价协同台';
  }

  function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: '管理员',
      frontline: '一线人员',
      manager: '负责人',
      analyst: '质量分析员'
    };
    return labels[role] || role;
  }
</script>
