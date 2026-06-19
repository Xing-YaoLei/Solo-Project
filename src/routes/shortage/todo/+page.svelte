<script lang="ts">
  import { onMount } from 'svelte';
  import { trpc } from '$lib/trpc/client';
  import { goto } from '$app/navigation';
  import { userStore } from '$lib/stores/user';
  import {
    AlertTriangle,
    Filter,
    Search,
    ChevronDown,
    ChevronRight,
    Clock,
    User,
    MapPin,
    Loader2,
    Package,
    RefreshCw
  } from 'lucide-svelte';

  let loading = true;
  let shortageOrders: any[] = [];
  let stats: any = null;
  let users: any[] = [];
  let regions: string[] = [];
  let statusFilter: string[] = ['pending', 'processing', 'retried'];
  let assigneeFilter = '';
  let regionFilter = '';
  let searchKeyword = '';
  let expandedId: string | null = null;
  let processingId: string | null = null;

  const statusOptions = [
    { value: 'pending', label: '待处理', class: 'status-pending' },
    { value: 'processing', label: '处理中', class: 'status-processing' },
    { value: 'replenished', label: '已补录', class: 'status-replenished' },
    { value: 'retried', label: '已重试', class: 'status-retried' },
    { value: 'closed', label: '已关闭', class: 'status-closed' }
  ];

  async function loadData() {
    loading = true;
    try {
      const filter: any = {};
      if (statusFilter.length > 0) filter.status = statusFilter;
      if (assigneeFilter) filter.assigneeId = assigneeFilter;
      if (regionFilter) filter.region = regionFilter;

      [shortageOrders, stats, users, regions] = await Promise.all([
        trpc.shortage.list.query(filter),
        trpc.shortage.getStats.query(),
        trpc.analysis.getUsers.query(),
        trpc.analysis.getRegions.query()
      ]);
    } finally {
      loading = false;
    }
  }

  function toggleStatus(status: string) {
    const idx = statusFilter.indexOf(status);
    if (idx > -1) {
      statusFilter.splice(idx, 1);
    } else {
      statusFilter.push(status);
    }
    statusFilter = [...statusFilter];
    loadData();
  }

  function toggleExpand(id: string) {
    expandedId = expandedId === id ? null : id;
  }

  function formatDate(date: Date): string {
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getTimeAgo(date: Date): string {
    const now = new Date().getTime();
    const diff = now - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    return '刚刚';
  }

  function getUrgencyLevel(date: Date): { label: string; class: string } {
    const hours = (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60);
    if (hours > 48) return { label: '紧急', class: 'bg-accent-red/20 text-accent-red border-accent-red/50' };
    if (hours > 24) return { label: '高', class: 'bg-accent-orange/20 text-accent-orange border-accent-orange/50' };
    return { label: '中', class: 'bg-yellow-900/50 text-yellow-400 border-yellow-700' };
  }

  $: filteredOrders = shortageOrders.filter(order => {
    if (!searchKeyword) return true;
    const kw = searchKeyword.toLowerCase();
    return order.partName.toLowerCase().includes(kw) ||
           order.partNumber.toLowerCase().includes(kw) ||
           order.assignee?.name.toLowerCase().includes(kw);
  });

  $: isManager = $userStore?.role === 'admin' || $userStore?.role === 'manager';

  onMount(() => {
    loadData();
  });
</script>

<div class="space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-text-muted" />
        <input
          type="text"
          bind:value={searchKeyword}
          class="input pl-10 w-64"
          placeholder="搜索配件名称、编号..."
        />
      </div>
      <select
        bind:value={assigneeFilter}
        on:change={loadData}
        class="input w-40"
      >
        <option value="">全部负责人</option>
        {#each users.filter(u => u.role === 'manager' || u.role === 'admin') as user}
          <option value={user.id}>{user.name}</option>
        {/each}
      </select>
      <select
        bind:value={regionFilter}
        on:change={loadData}
        class="input w-36"
      >
        <option value="">全部区域</option>
        {#each regions as region}
          <option value={region}>{region}</option>
        {/each}
      </select>
      <button
        on:click={loadData}
        class="btn btn-secondary flex items-center gap-2"
        title="刷新"
      >
        <RefreshCw class="w-4 h-4" />
      </button>
    </div>
  </div>

  <div class="grid grid-cols-5 gap-3">
    {#each statusOptions as option}
      <button
        on:click={() => toggleStatus(option.value)}
        class="card p-4 text-left transition-all duration-200 {
          statusFilter.includes(option.value)
            ? 'border-primary-500 bg-primary-500/10'
            : 'hover:bg-industrial-border/30'
        }"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="badge {option.class}">{option.label}</span>
          <span class="font-display text-2xl font-bold text-industrial-text">
            {stats?.[option.value] || 0}
          </span>
        </div>
        <p class="text-xs text-industrial-text-muted">{option.label}缺货单</p>
      </button>
    {/each}
  </div>

  <div class="flex items-center gap-2 text-sm text-industrial-text-muted">
    <Filter class="w-4 h-4" />
    <span>状态筛选：</span>
    <div class="flex flex-wrap gap-2">
      {#each statusOptions as option}
        <button
          on:click={() => toggleStatus(option.value)}
          class="px-2.5 py-1 text-xs rounded border transition-all {
            statusFilter.includes(option.value)
              ? option.class
              : 'border-industrial-border text-industrial-text-muted hover:border-industrial-text-muted'
          }"
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-20">
      <Loader2 class="w-10 h-10 text-primary-500 animate-spin" />
    </div>
  {:else if filteredOrders.length === 0}
    <div class="card p-12 text-center">
      <Package class="w-16 h-16 text-industrial-text-muted mx-auto mb-4 opacity-50" />
      <p class="text-industrial-text-muted">暂无符合条件的缺货单</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each filteredOrders as order, index (order.id)}
        <div
          class="card overflow-hidden animate-stagger"
          style="animation-delay: {index * 50}ms"
          class:border-l-4={order.status === 'pending' || order.status === 'retried'}
          class:border-l-accent-orange={order.status === 'pending' || order.status === 'retried'}
        >
          <div
            class="p-5 cursor-pointer hover:bg-industrial-bg/30 transition-colors"
            on:click={() => toggleExpand(order.id)}
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-orange/20 to-accent-red/20 flex items-center justify-center">
                  <AlertTriangle class="w-6 h-6 text-accent-orange" />
                </div>
                <div>
                  <div class="flex items-center gap-3">
                    <h3 class="font-medium text-industrial-text">{order.partName}</h3>
                    <span class="font-mono text-xs text-industrial-text-muted">{order.partNumber}</span>
                    {#if order.status === 'pending'}
                      <span class="badge {getUrgencyLevel(order.createdAt).class}">
                        {getUrgencyLevel(order.createdAt).label}
                      </span>
                    {/if}
                  </div>
                  <div class="flex items-center gap-4 mt-1 text-sm text-industrial-text-muted">
                    <span class="flex items-center gap-1">
                      <Package class="w-3.5 h-3.5" />
                      缺 {order.quantity} 件
                    </span>
                    <span class="flex items-center gap-1">
                      <User class="w-3.5 h-3.5" />
                      {order.assignee?.name}
                    </span>
                    <span class="flex items-center gap-1">
                      <MapPin class="w-3.5 h-3.5" />
                      {order.region || '未分配'}
                    </span>
                    <span class="flex items-center gap-1">
                      <Clock class="w-3.5 h-3.5" />
                      {formatDate(order.createdAt)} · {getTimeAgo(order.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <span class="badge {statusOptions.find(s => s.value === order.status)?.class || ''}">
                  {statusOptions.find(s => s.value === order.status)?.label || order.status}
                </span>
                <button
                  on:click|stopPropagation={() => goto(`/shortage/${order.id}`)}
                  class="btn btn-primary text-sm py-1.5"
                >
                  处理
                </button>
                {#if expandedId === order.id}
                  <ChevronDown class="w-5 h-5 text-industrial-text-muted" />
                {:else}
                  <ChevronRight class="w-5 h-5 text-industrial-text-muted" />
                {/if}
              </div>
            </div>
          </div>

          {#if expandedId === order.id && order.history?.length > 0}
            <div class="px-5 pb-5 border-t border-industrial-border pt-4 bg-industrial-bg/30">
              <h4 class="text-sm font-medium text-industrial-text mb-3">处理轨迹</h4>
              <div class="relative pl-6 space-y-4">
                <div class="absolute left-2 top-1 bottom-1 w-px bg-industrial-border" />
                {#each order.history as h, hIdx}
                  <div class="relative" style="animation-delay: {hIdx * 50}ms">
                    <div class="absolute -left-[22px] top-1 w-3 h-3 rounded-full {
                      h.action === 'report' ? 'bg-accent-orange' :
                      h.action === 'assign' ? 'bg-blue-500' :
                      h.action === 'replenish' ? 'bg-accent-green' :
                      h.action === 'retry' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }" />
                    <div class="flex items-start justify-between">
                      <div>
                        <p class="text-sm text-industrial-text">
                          <span class="font-medium">{h.operatorName}</span>
                          <span class="text-industrial-text-muted">
                            {h.action === 'report' ? ' 上报了缺货' :
                             h.action === 'assign' ? ' 分配了处理人' :
                             h.action === 'replenish' ? ' 补录了配件' :
                             h.action === 'retry' ? ' 重试了处理' :
                             ' 关闭了缺货单'}
                          </span>
                        </p>
                        {#if h.remark}
                          <p class="text-sm text-industrial-text-muted mt-0.5">{h.remark}</p>
                        {/if}
                      </div>
                      <span class="text-xs text-industrial-text-muted font-mono">
                        {formatDate(h.createdAt)}
                      </span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
