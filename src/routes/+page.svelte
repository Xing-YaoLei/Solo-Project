<script lang="ts">
  import { onMount } from 'svelte';
  import { trpc } from '$lib/trpc/client';
  import {
    ClipboardList,
    AlertTriangle,
    TrendingDown,
    Clock,
    TrendingUp,
    ArrowRight,
    Loader2
  } from 'lucide-svelte';

  let loading = true;
  let stats: any = null;
  let recentOrders: any[] = [];
  let pendingShortages: any[] = [];

  async function loadData() {
    try {
      [stats, recentOrders, pendingShortages] = await Promise.all([
        trpc.analysis.getDashboardStats.query(),
        trpc.workorder.list.query({ limit: 5, offset: 0 }),
        trpc.shortage.list.query({ status: ['pending', 'processing'], limit: 5 })
      ]);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  const statCards = [
    {
      label: '今日工单',
      key: 'todayWorkOrders',
      icon: ClipboardList,
      color: 'from-blue-500 to-blue-600',
      shadowColor: 'shadow-blue-500/20'
    },
    {
      label: '待处理缺货',
      key: 'pendingShortages',
      icon: AlertTriangle,
      color: 'from-orange-500 to-orange-600',
      shadowColor: 'shadow-orange-500/20',
      warning: true
    },
    {
      label: '本月返修率',
      key: 'monthlyReworkRate',
      icon: TrendingDown,
      color: 'from-red-500 to-red-600',
      shadowColor: 'shadow-red-500/20',
      suffix: '%'
    },
    {
      label: '平均处理时长',
      key: 'avgProcessingTime',
      icon: Clock,
      color: 'from-green-500 to-green-600',
      shadowColor: 'shadow-green-500/20',
      suffix: '小时'
    }
  ];

  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: '待诊断',
      diagnosed: '已诊断',
      quoted: '已报价',
      in_progress: '维修中',
      completed: '已完成',
      cancelled: '已取消'
    };
    return labels[status] || status;
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

  function formatDate(date: Date): string {
    return new Date(date).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatCurrency(amount: string | number): string {
    return `¥${Number(amount).toFixed(2)}`;
  }
</script>

{#if loading}
  <div class="flex items-center justify-center h-full py-20">
    <div class="flex flex-col items-center gap-4">
      <Loader2 class="w-10 h-10 text-primary-500 animate-spin" />
      <p class="text-industrial-text-secondary">加载数据中...</p>
    </div>
  </div>
{:else}
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {#each statCards as card, i (card.key)}
        <div
          class="card p-6 card-hover animate-stagger"
          style="animation-delay: {i * 80}ms"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-industrial-text-muted text-sm mb-1">{card.label}</p>
              <p class="font-display text-3xl font-bold text-industrial-text mt-1">
                {stats?.[card.key] || 0}{card.suffix || ''}
              </p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br {card.color} flex items-center justify-center shadow-lg {card.shadowColor}">
              <svelte:component this={card.icon} class="w-6 h-6 text-white" />
            </div>
          </div>
          <div class="mt-4 flex items-center gap-1 text-xs">
            {#if card.warning && stats?.[card.key] > 0}
              <TrendingUp class="w-3.5 h-3.5 text-accent-orange" />
              <span class="text-accent-orange">需要关注</span>
            {:else if card.key === 'monthlyReworkRate' && stats?.[card.key] > 5}
              <TrendingUp class="w-3.5 h-3.5 text-accent-red" />
              <span class="text-accent-red">偏高</span>
            {:else}
              <TrendingDown class="w-3.5 h-3.5 text-accent-green" />
              <span class="text-accent-green">正常范围</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2 card p-6 animate-stagger" style="animation-delay: 320ms">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-display text-lg font-semibold text-industrial-text">最近工单</h2>
          <button
            on:click={() => goto('/workorder/list')}
            class="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            查看全部
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-3">
          {#if recentOrders.length === 0}
            <div class="text-center py-10 text-industrial-text-muted">
              暂无工单数据
            </div>
          {:else}
            {#each recentOrders as order (order.id)}
              <div
                class="flex items-center justify-between p-4 rounded-lg bg-industrial-bg border border-industrial-border hover:border-primary-500/30 transition-all duration-200"
              >
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <span class="text-primary-400 font-mono text-sm font-medium">
                      {order.vehicle?.plateNumber?.slice(-4) || '----'}
                    </span>
                  </div>
                  <div>
                    <p class="font-medium text-industrial-text">
                      {order.vehicle?.brand} {order.vehicle?.model}
                    </p>
                    <p class="text-sm text-industrial-text-muted">
                      {order.vehicle?.plateNumber} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <span class="font-mono text-accent-green font-medium">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  <span class="badge {getStatusClass(order.status)}">
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <div class="card p-6 animate-stagger" style="animation-delay: 400ms">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-display text-lg font-semibold text-industrial-text">缺货待办</h2>
          <button
            on:click={() => goto('/shortage/todo')}
            class="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            处理
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-3">
          {#if pendingShortages.length === 0}
            <div class="text-center py-10 text-industrial-text-muted">
              暂无缺货待办
            </div>
          {:else}
            {#each pendingShortages as shortage (shortage.id)}
              <button
                class="w-full text-left p-4 rounded-lg bg-industrial-bg border-l-4 border-accent-orange hover:bg-industrial-border/30 transition-all duration-200 cursor-pointer"
                on:click={() => goto(`/shortage/${shortage.id}`)}
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="font-medium text-industrial-text">{shortage.partName}</p>
                    <p class="text-xs text-industrial-text-muted mt-1">
                      {shortage.partNumber} · 缺 {shortage.quantity} 件
                    </p>
                  </div>
                  <span class="badge {shortage.status === 'pending' ? 'status-pending' : 'status-processing'}">
                    {shortage.status === 'pending' ? '待处理' : '处理中'}
                  </span>
                </div>
                <div class="mt-2 flex items-center gap-2 text-xs text-industrial-text-muted">
                  <span>负责人：{shortage.assignee?.name}</span>
                  <span>·</span>
                  <span>{formatDate(shortage.createdAt)}</span>
                </div>
              </button>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<script lang="ts" context="module">
  import { goto } from '$app/navigation';
</script>
