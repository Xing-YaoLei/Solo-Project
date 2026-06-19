<script lang="ts">
  import { onMount } from 'svelte';
  import { trpc } from '$lib/trpc/client';
  import { goto } from '$app/navigation';
  import {
    FileText,
    Loader2,
    Filter,
    Search,
    Car,
    User,
    MapPin,
    AlertTriangle,
    ChevronRight
  } from 'lucide-svelte';

  let loading = true;
  let orders: any[] = [];
  let users: any[] = [];
  let statusFilter = '';
  let searchKeyword = '';
  let currentPage = 0;
  const pageSize = 20;

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待诊断' },
    { value: 'diagnosed', label: '已诊断' },
    { value: 'quoted', label: '已报价' },
    { value: 'in_progress', label: '维修中' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' }
  ];

  async function loadData() {
    loading = true;
    try {
      const filter: any = { limit: pageSize, offset: currentPage * pageSize };
      if (statusFilter) filter.status = statusFilter as any;

      [orders, users] = await Promise.all([
        trpc.workorder.list.query(filter),
        trpc.analysis.getUsers.query()
      ]);
    } finally {
      loading = false;
    }
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getStatusLabel(status: string): string {
    return statusOptions.find(s => s.value === status)?.label || status;
  }

  function getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'status-pending',
      diagnosed: 'bg-blue-900/50 text-blue-400 border border-blue-700',
      quoted: 'bg-purple-900/50 text-purple-400 border border-purple-700',
      in_progress: 'bg-yellow-900/50 text-yellow-400 border border-yellow-700',
      completed: 'bg-green-900/50 text-green-400 border border-green-700',
      cancelled: 'bg-gray-800 text-gray-400 border border-gray-700'
    };
    return classes[status] || 'bg-gray-800 text-gray-400';
  }

  $: filteredOrders = orders.filter(o => {
    if (!searchKeyword) return true;
    const kw = searchKeyword.toLowerCase();
    return o.vehicle?.plateNumber?.toLowerCase().includes(kw) ||
           o.vehicle?.brand?.toLowerCase().includes(kw) ||
           o.vehicle?.vin?.toLowerCase().includes(kw);
  });

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
          placeholder="搜索车牌号、品牌..."
        />
      </div>
      <select
        bind:value={statusFilter}
        on:change={loadData}
        class="input w-40"
      >
        {#each statusOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>
    <button on:click={() => goto('/workorder/diagnosis')} class="btn btn-primary flex items-center gap-2">
      <FileText class="w-4 h-4" />
      新建工单
    </button>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-20">
      <Loader2 class="w-10 h-10 text-primary-500 animate-spin" />
    </div>
  {:else}
    <div class="card overflow-hidden">
      <div class="divide-y divide-industrial-border">
        {#each filteredOrders as order, index (order.id)}
          <button
            class="w-full text-left p-5 hover:bg-industrial-bg/30 transition-colors cursor-pointer animate-fade-in"
            style="animation-delay: {index * 30}ms"
            on:click={() => goto(`/shortage/${order.id}`)}
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <Car class="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <div class="flex items-center gap-3">
                    <span class="font-mono font-semibold text-industrial-text">
                      {order.vehicle?.plateNumber}
                    </span>
                    <span class="text-industrial-text-muted">
                      {order.vehicle?.brand} {order.vehicle?.model}
                    </span>
                    {#if order.isRework}
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-accent-red/20 text-accent-red rounded border border-accent-red/30">
                        <AlertTriangle class="w-3 h-3" />
                        返修
                      </span>
                    {/if}
                  </div>
                  <div class="flex items-center gap-4 mt-1 text-sm text-industrial-text-muted">
                    <span class="flex items-center gap-1">
                      <User class="w-3.5 h-3.5" />
                      {users.find(u => u.id === order.createdBy)?.name || '未知'}
                    </span>
                    <span class="flex items-center gap-1">
                      <MapPin class="w-3.5 h-3.5" />
                      {order.region || '未分配'}
                    </span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-6">
                <span class="font-mono text-xl font-bold text-accent-green">
                  ¥{Number(order.totalAmount).toFixed(2)}
                </span>
                <span class="badge {getStatusClass(order.status)}">
                  {getStatusLabel(order.status)}
                </span>
                <ChevronRight class="w-5 h-5 text-industrial-text-muted" />
              </div>
            </div>
            {#if order.diagnosisResult}
              <div class="mt-3 pl-16">
                <p class="text-sm text-industrial-text-muted line-clamp-2">
                  <span class="text-industrial-text-secondary font-medium">诊断：</span>
                  {order.diagnosisResult}
                </p>
              </div>
            {/if}
          </button>
        {:else}
          <div class="p-12 text-center text-industrial-text-muted">
            暂无工单数据
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
