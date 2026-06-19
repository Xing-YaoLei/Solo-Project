<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    LayoutDashboard,
    BookOpen,
    Wrench,
    FileText,
    AlertTriangle,
    Search,
    BarChart3,
    Settings,
    Camera,
    Car
  } from 'lucide-svelte';

  export let user: { role: string; name: string };
  export let currentRoute: string;

  interface NavItem {
    label: string;
    icon: any;
    path: string;
    roles: string[];
    badge?: string;
  }

  const navItems: NavItem[] = [
    { label: '仪表盘', icon: LayoutDashboard, path: '/', roles: ['admin', 'frontline', 'manager', 'analyst'] },
    { label: '工单处理', icon: Wrench, path: '/workorder/diagnosis', roles: ['admin', 'frontline'] },
    { label: '工单列表', icon: FileText, path: '/workorder/list', roles: ['admin', 'frontline', 'manager', 'analyst'] },
    { label: '缺货待办', icon: AlertTriangle, path: '/shortage/todo', roles: ['admin', 'manager'], badge: '待处理' },
    { label: '综合查询', icon: Search, path: '/query', roles: ['admin', 'frontline', 'manager', 'analyst'] },
    { label: '返修率分析', icon: BarChart3, path: '/analysis/rework', roles: ['admin', 'analyst'] },
    { label: '报价单字典', icon: BookOpen, path: '/dictionary/quote-items', roles: ['admin'] },
    { label: '质检规则', icon: Camera, path: '/dictionary/inspection-rules', roles: ['admin'] },
    { label: '车辆阈值', icon: Car, path: '/dictionary/vehicle-thresholds', roles: ['admin'] }
  ];

  $: filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  async function navigate(path: string) {
    await goto(path);
  }
</script>

<aside class="w-64 bg-industrial-card border-r border-industrial-border flex flex-col shrink-0">
  <div class="h-16 flex items-center px-6 border-b border-industrial-border">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
        <Wrench class="w-5 h-5 text-white" />
      </div>
      <div>
        <h1 class="font-display font-bold text-lg text-industrial-text">维修协同台</h1>
        <p class="text-xs text-industrial-text-muted">Auto Repair Pro</p>
      </div>
    </div>
  </div>

  <nav class="flex-1 py-4 overflow-y-auto scrollbar-thin">
    <div class="px-4 mb-4">
      <p class="text-xs font-medium text-industrial-text-muted uppercase tracking-wider px-3 mb-2">
        工作区
      </p>
      <div class="space-y-1">
        {#each filteredNavItems.filter(i => !i.path.startsWith('/dictionary')) as item (item.path)}
          <button
            on:click={() => navigate(item.path)}
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group {
              currentRoute === item.path || (item.path !== '/' && currentRoute.startsWith(item.path))
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-industrial-text-secondary hover:bg-industrial-border/50 hover:text-industrial-text border border-transparent'
            }"
          >
            <svelte:component
              this={item.icon}
              class="w-5 h-5 {currentRoute === item.path || (item.path !== '/' && currentRoute.startsWith(item.path))
                ? 'text-primary-400'
                : 'text-industrial-text-muted group-hover:text-industrial-text-secondary'}"
            />
            <span class="text-sm font-medium flex-1 text-left">{item.label}</span>
            {#if item.badge && currentRoute !== item.path}
              <span class="px-2 py-0.5 text-xs bg-accent-orange/20 text-accent-orange rounded-full font-medium">
                {item.badge}
              </span>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    {#if user.role === 'admin'}
      <div class="px-4">
        <p class="text-xs font-medium text-industrial-text-muted uppercase tracking-wider px-3 mb-2">
          <Settings class="w-3 h-3 inline mr-1" />
          系统配置
        </p>
        <div class="space-y-1">
          {#each filteredNavItems.filter(i => i.path.startsWith('/dictionary')) as item (item.path)}
            <button
              on:click={() => navigate(item.path)}
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group {
                currentRoute === item.path
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-industrial-text-secondary hover:bg-industrial-border/50 hover:text-industrial-text border border-transparent'
              }"
            >
              <svelte:component
                this={item.icon}
                class="w-5 h-5 {currentRoute === item.path
                  ? 'text-primary-400'
                  : 'text-industrial-text-muted group-hover:text-industrial-text-secondary'}"
              />
              <span class="text-sm font-medium flex-1 text-left">{item.label}</span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </nav>

  <div class="p-4 border-t border-industrial-border">
    <div class="px-3 py-2 rounded-lg bg-industrial-bg border border-industrial-border">
      <p class="text-xs text-industrial-text-muted">当前角色</p>
      <p class="text-sm font-medium text-industrial-text mt-0.5">
        {user.role === 'admin' ? '系统管理员' : 
         user.role === 'frontline' ? '一线维修人员' :
         user.role === 'manager' ? '配件负责人' : '质量分析员'}
      </p>
    </div>
  </div>
</aside>
