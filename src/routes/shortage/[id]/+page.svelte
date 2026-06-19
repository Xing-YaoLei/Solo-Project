<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { trpc } from '$lib/trpc/client';
  import { userStore } from '$lib/stores/user';
  import {
    AlertTriangle,
    ArrowLeft,
    Loader2,
    User,
    MapPin,
    Package,
    Clock,
    FileText,
    CheckCircle,
    RotateCcw,
    XCircle,
    UserPlus
  } from 'lucide-svelte';

  let loading = true;
  let processing = false;
  let shortage: any = null;
  let remark = '';
  let showAssignModal = false;
  let selectedAssignee = '';
  let users: any[] = [];

  const statusLabels: Record<string, { label: string; class: string }> = {
    pending: { label: '待处理', class: 'status-pending' },
    processing: { label: '处理中', class: 'status-processing' },
    replenished: { label: '已补录', class: 'status-replenished' },
    retried: { label: '已重试', class: 'status-retried' },
    closed: { label: '已关闭', class: 'status-closed' }
  };

  const actionLabels: Record<string, string> = {
    report: '上报缺货',
    assign: '分配处理人',
    replenish: '补录配件',
    retry: '重试处理',
    close: '关闭缺货单'
  };

  async function loadData() {
    loading = true;
    try {
      const id = $page.params.id;
      if (!id) return;
      [shortage, users] = await Promise.all([
        trpc.shortage.get.query(id),
        trpc.analysis.getUsers.query()
      ]);
    } finally {
      loading = false;
    }
  }

  async function processAction(action: string) {
    if (!remark && action !== 'close') {
      alert('请填写处理备注');
      return;
    }

    processing = true;
    try {
      await trpc.shortage.process.mutate({
        id: shortage.id,
        action: action as any,
        remark
      });
      remark = '';
      await loadData();
    } catch (e: any) {
      alert(e.message || '操作失败');
    } finally {
      processing = false;
    }
  }

  async function assign() {
    if (!selectedAssignee) {
      alert('请选择处理人');
      return;
    }

    processing = true;
    try {
      await trpc.shortage.assign.mutate({
        id: shortage.id,
        assigneeId: selectedAssignee,
        remark
      });
      showAssignModal = false;
      remark = '';
      selectedAssignee = '';
      await loadData();
    } catch (e: any) {
      alert(e.message || '分配失败');
    } finally {
      processing = false;
    }
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getActionIcon(action: string) {
    const icons: Record<string, any> = {
      report: AlertTriangle,
      assign: UserPlus,
      replenish: CheckCircle,
      retry: RotateCcw,
      close: XCircle
    };
    return icons[action] || FileText;
  }

  function getActionColor(action: string): string {
    const colors: Record<string, string> = {
      report: 'text-accent-orange bg-accent-orange/20',
      assign: 'text-blue-400 bg-blue-500/20',
      replenish: 'text-accent-green bg-accent-green/20',
      retry: 'text-yellow-400 bg-yellow-500/20',
      close: 'text-gray-400 bg-gray-500/20'
    };
    return colors[action] || 'text-industrial-text-muted bg-industrial-border';
  }

  $: availableActions = (() => {
    if (!shortage) return [];
    const transitions: Record<string, string[]> = {
      pending: ['assign', 'close'],
      processing: ['replenish', 'retry', 'close'],
      replenished: ['close'],
      retried: ['replenish', 'retry', 'close'],
      closed: []
    };
    return transitions[shortage.status] || [];
  })();

  $: isManager = $userStore?.role === 'admin' || $userStore?.role === 'manager';
  $: canProcess = isManager && shortage?.status !== 'closed';

  onMount(() => {
    loadData();
  });
</script>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <button
      on:click={() => goto('/shortage/todo')}
      class="p-2 rounded-lg border border-industrial-border hover:bg-industrial-border/30 transition-colors"
    >
      <ArrowLeft class="w-5 h-5 text-industrial-text-secondary" />
    </button>
    <div>
      <h1 class="font-display text-xl font-semibold text-industrial-text">缺货单详情</h1>
      <p class="text-sm text-industrial-text-muted">ID: {$page.params.id}</p>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-20">
      <Loader2 class="w-10 h-10 text-primary-500 animate-spin" />
    </div>
  {:else if !shortage}
    <div class="card p-12 text-center">
      <AlertTriangle class="w-16 h-16 text-accent-orange mx-auto mb-4" />
      <p class="text-industrial-text-muted">缺货单不存在或已被删除</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card p-6 animate-stagger">
          <div class="flex items-start justify-between mb-6">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-orange/30 to-accent-red/30 flex items-center justify-center">
                <Package class="w-8 h-8 text-accent-orange" />
              </div>
              <div>
                <h2 class="font-display text-xl font-semibold text-industrial-text">{shortage.partName}</h2>
                <p class="font-mono text-industrial-text-muted mt-1">{shortage.partNumber}</p>
              </div>
            </div>
            <span class="badge text-sm px-3 py-1 {statusLabels[shortage.status]?.class}">
              {statusLabels[shortage.status]?.label}
            </span>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="p-4 rounded-lg bg-industrial-bg border border-industrial-border">
              <p class="text-xs text-industrial-text-muted mb-1">缺货数量</p>
              <p class="font-display text-2xl font-bold text-accent-orange">{shortage.quantity} 件</p>
            </div>
            <div class="p-4 rounded-lg bg-industrial-bg border border-industrial-border">
              <p class="text-xs text-industrial-text-muted mb-1">负责人</p>
              <p class="font-medium text-industrial-text flex items-center gap-2">
                <User class="w-4 h-4 text-primary-400" />
                {shortage.assignee?.name}
              </p>
            </div>
            <div class="p-4 rounded-lg bg-industrial-bg border border-industrial-border">
              <p class="text-xs text-industrial-text-muted mb-1">上报人</p>
              <p class="font-medium text-industrial-text flex items-center gap-2">
                <User class="w-4 h-4 text-industrial-text-muted" />
                {shortage.reporter?.name}
              </p>
            </div>
            <div class="p-4 rounded-lg bg-industrial-bg border border-industrial-border">
              <p class="text-xs text-industrial-text-muted mb-1">区域</p>
              <p class="font-medium text-industrial-text flex items-center gap-2">
                <MapPin class="w-4 h-4 text-accent-green" />
                {shortage.region || '未分配'}
              </p>
            </div>
          </div>

          <div class="mt-6 p-4 rounded-lg bg-industrial-bg border border-industrial-border">
            <div class="flex items-center gap-2 mb-2">
              <FileText class="w-4 h-4 text-industrial-text-muted" />
              <span class="text-sm font-medium text-industrial-text">关联工单</span>
            </div>
            {#if shortage.workOrder}
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-industrial-text">
                    工单金额：<span class="font-mono text-accent-green">¥{Number(shortage.workOrder.totalAmount).toFixed(2)}</span>
                  </p>
                  <p class="text-sm text-industrial-text-muted">
                    创建时间：{formatDate(shortage.workOrder.createdAt)}
                  </p>
                </div>
                <button
                  on:click={() => goto(`/workorder/list`)}
                  class="btn btn-secondary text-sm py-1.5"
                >
                  查看工单
                </button>
              </div>
            {:else}
              <p class="text-industrial-text-muted text-sm">工单信息不存在</p>
            {/if}
          </div>
        </div>

        {#if canProcess}
          <div class="card p-6 animate-stagger" style="animation-delay: 80ms">
            <h3 class="font-display text-lg font-semibold text-industrial-text mb-4">处理操作</h3>
            
            <div class="mb-4">
              <label class="label">处理备注</label>
              <textarea
                bind:value={remark}
                rows="3"
                class="input resize-none"
                placeholder="请输入处理备注说明..."
              />
            </div>

            <div class="flex flex-wrap gap-3">
              {#if availableActions.includes('assign')}
                <button
                  on:click={() => showAssignModal = true}
                  class="btn btn-secondary flex items-center gap-2"
                >
                  <UserPlus class="w-4 h-4" />
                  分配处理人
                </button>
              {/if}
              {#if availableActions.includes('replenish')}
                <button
                  on:click={() => processAction('replenish')}
                  disabled={processing}
                  class="btn btn-success flex items-center gap-2"
                >
                  <CheckCircle class="w-4 h-4" />
                  补录配件
                </button>
              {/if}
              {#if availableActions.includes('retry')}
                <button
                  on:click={() => processAction('retry')}
                  disabled={processing}
                  class="btn btn-warning flex items-center gap-2"
                >
                  <RotateCcw class="w-4 h-4" />
                  重试处理
                </button>
              {/if}
              {#if availableActions.includes('close')}
                <button
                  on:click={() => processAction('close')}
                  disabled={processing}
                  class="btn btn-danger flex items-center gap-2"
                >
                  <XCircle class="w-4 h-4" />
                  关闭缺货单
                </button>
              {/if}
              {#if processing}
                <Loader2 class="w-5 h-5 text-primary-500 animate-spin self-center" />
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <div class="space-y-6">
        <div class="card p-6 animate-stagger" style="animation-delay: 160ms">
          <h3 class="font-display text-lg font-semibold text-industrial-text mb-4 flex items-center gap-2">
            <Clock class="w-5 h-5 text-primary-400" />
            时间信息
          </h3>
          <div class="space-y-4">
            <div class="flex justify-between">
              <span class="text-industrial-text-muted">创建时间</span>
              <span class="text-industrial-text text-sm font-mono">{formatDate(shortage.createdAt)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-industrial-text-muted">更新时间</span>
              <span class="text-industrial-text text-sm font-mono">{formatDate(shortage.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div class="card p-6 animate-stagger" style="animation-delay: 240ms">
          <h3 class="font-display text-lg font-semibold text-industrial-text mb-4">处理轨迹</h3>
          <div class="relative pl-6 space-y-6">
            <div class="absolute left-2 top-1 bottom-1 w-px bg-industrial-border" />
            {#each shortage.history as item, index}
              <div class="relative animate-fade-in" style="animation-delay: {index * 60}ms">
                <div class="absolute -left-[22px] top-1 w-4 h-4 rounded-full flex items-center justify-center {getActionColor(item.action)}">
                  <svelte:component this={getActionIcon(item.action)} class="w-2 h-2" />
                </div>
                <div class="bg-industrial-bg rounded-lg p-3 border border-industrial-border">
                  <div class="flex items-start justify-between mb-1">
                    <span class="font-medium text-industrial-text text-sm">{item.operatorName}</span>
                    <span class="text-xs text-industrial-text-muted font-mono">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <p class="text-sm text-primary-400">{actionLabels[item.action]}</p>
                  {#if item.remark}
                    <p class="text-sm text-industrial-text-muted mt-1">{item.remark}</p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

{#if showAssignModal}
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
    <div class="card w-full max-w-md animate-slide-up">
      <div class="px-6 py-4 border-b border-industrial-border flex items-center justify-between">
        <h2 class="font-display text-lg font-semibold text-industrial-text">分配处理人</h2>
        <button on:click={() => showAssignModal = false} class="p-2 rounded-lg hover:bg-industrial-border">
          <XCircle class="w-5 h-5 text-industrial-text-muted" />
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="label">选择处理人</label>
          <select bind:value={selectedAssignee} class="input">
            <option value="">请选择...</option>
            {#each users.filter(u => u.role === 'manager' || u.role === 'admin') as user}
              <option value={user.id}>{user.name} ({user.region || '未分配'})</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="label">分配备注</label>
          <textarea
            bind:value={remark}
            rows="2"
            class="input resize-none"
            placeholder="分配说明..."
          />
        </div>
      </div>
      <div class="px-6 py-4 border-t border-industrial-border flex items-center justify-end gap-3 bg-industrial-bg/50">
        <button on:click={() => showAssignModal = false} class="btn btn-secondary">取消</button>
        <button on:click={assign} disabled={processing || !selectedAssignee} class="btn btn-primary">
          {#if processing}
            <Loader2 class="w-4 h-4 animate-spin inline mr-2" />
          {/if}
          确认分配
        </button>
      </div>
    </div>
  </div>
{/if}
