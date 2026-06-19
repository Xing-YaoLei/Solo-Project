<script lang="ts">
  import { onMount } from 'svelte';
  import { trpc } from '$lib/trpc/client';
  import {
    Search,
    Filter,
    ChevronDown,
    ChevronRight,
    Loader2,
    X,
    Download,
    Save,
    Car,
    User,
    MapPin,
    Calendar,
    Tag,
    AlertTriangle
  } from 'lucide-svelte';

  let loading = false;
  let results: any[] = [];
  let users: any[] = [];
  let regions: string[] = [];
  let showFilters = true;

  let filter = {
    statuses: [] as string[],
    dateFrom: '',
    dateTo: '',
    regions: [] as string[],
    assignees: [] as string[],
    vehiclePlate: '',
    keywords: ''
  };

  let savedQueries: any[] = [];
  let queryName = '';
  let showSaveModal = false;

  const statusOptions = [
    { value: 'pending', label: '待诊断' },
    { value: 'diagnosed', label: '已诊断' },
    { value: 'quoted', label: '已报价' },
    { value: 'in_progress', label: '维修中' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' }
  ];

  async function loadInitialData() {
    [users, regions] = await Promise.all([
      trpc.analysis.getUsers.query(),
      trpc.analysis.getRegions.query()
    ]);
  }

  async function executeQuery() {
    loading = true;
    try {
      const input: any = {};
      if (filter.statuses.length > 0) input.statuses = filter.statuses;
      if (filter.dateFrom) input.dateFrom = new Date(filter.dateFrom);
      if (filter.dateTo) input.dateTo = new Date(filter.dateTo + 'T23:59:59');
      if (filter.regions.length > 0) input.regions = filter.regions;
      if (filter.assignees.length > 0) input.assignees = filter.assignees;
      if (filter.vehiclePlate) input.vehiclePlate = filter.vehiclePlate;
      if (filter.keywords) input.keywords = filter.keywords;

      results = await trpc.analysis.queryWorkOrders.query(input);
    } finally {
      loading = false;
    }
  }

  function toggleArrayItem(arr: string[], value: string) {
    const idx = arr.indexOf(value);
    if (idx > -1) {
      arr.splice(idx, 1);
    } else {
      arr.push(value);
    }
  }

  function toggleStatus(status: string) {
    toggleArrayItem(filter.statuses, status);
  }

  function toggleRegion(region: string) {
    toggleArrayItem(filter.regions, region);
  }

  function toggleAssignee(userId: string) {
    toggleArrayItem(filter.assignees, userId);
  }

  function clearFilters() {
    filter = {
      statuses: [],
      dateFrom: '',
      dateTo: '',
      regions: [],
      assignees: [],
      vehiclePlate: '',
      keywords: ''
    };
  }

  function saveQuery() {
    if (!queryName.trim()) {
      alert('请输入查询名称');
      return;
    }
    savedQueries.push({
      name: queryName,
      filter: { ...filter }
    });
    localStorage.setItem('savedQueries', JSON.stringify(savedQueries));
    showSaveModal = false;
    queryName = '';
  }

  function loadSavedQuery(query: any) {
    filter = { ...query.filter };
    executeQuery();
  }

  function deleteSavedQuery(index: number) {
    savedQueries.splice(index, 1);
    localStorage.setItem('savedQueries', JSON.stringify(savedQueries));
  }

  function exportCSV() {
    if (results.length === 0) {
      alert('没有数据可导出');
      return;
    }

    const headers = ['车牌号', '品牌型号', '状态', '创建人', '区域', '创建时间', '总金额', '是否返修'];
    const rows = results.map(r => [
      r.vehicle?.plateNumber || '',
      `${r.vehicle?.brand || ''} ${r.vehicle?.model || ''}`,
      statusOptions.find(s => s.value === r.status)?.label || r.status,
      r.creator?.name || '',
      r.region || '',
      formatDate(r.createdAt),
      Number(r.totalAmount).toFixed(2),
      r.isRework ? '是' : '否'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `工单查询_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
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

  $: activeFilterCount = [
    filter.statuses.length,
    filter.dateFrom ? 1 : 0,
    filter.dateTo ? 1 : 0,
    filter.regions.length,
    filter.assignees.length,
    filter.vehiclePlate ? 1 : 0,
    filter.keywords ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  onMount(() => {
    loadInitialData();
    const saved = localStorage.getItem('savedQueries');
    if (saved) {
      savedQueries = JSON.parse(saved);
    }
  });
</script>

<div class="space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <button
        on:click={() => showFilters = !showFilters}
        class="btn btn-secondary flex items-center gap-2"
      >
        <Filter class="w-4 h-4" />
        筛选条件
        {#if activeFilterCount > 0}
          <span class="px-2 py-0.5 text-xs bg-primary-500 text-white rounded-full">
            {activeFilterCount}
          </span>
        {/if}
      </button>
      <button
        on:click={executeQuery}
        disabled={loading}
        class="btn btn-primary flex items-center gap-2"
      >
        <Search class="w-4 h-4" />
        {#if loading}
          <Loader2 class="w-4 h-4 animate-spin" />
        {:else}
          查询
        {/if}
      </button>
      <button on:click={clearFilters} class="btn btn-secondary">重置</button>
    </div>
    <div class="flex items-center gap-3">
      <button
        on:click={() => showSaveModal = true}
        class="btn btn-secondary flex items-center gap-2"
      >
        <Save class="w-4 h-4" />
        保存查询
      </button>
      <button
        on:click={exportCSV}
        disabled={results.length === 0}
        class="btn btn-secondary flex items-center gap-2"
      >
        <Download class="w-4 h-4" />
        导出
      </button>
    </div>
  </div>

  {#if savedQueries.length > 0}
    <div class="card p-4">
      <p class="text-sm font-medium text-industrial-text-secondary mb-3">常用查询</p>
      <div class="flex flex-wrap gap-2">
        {#each savedQueries as query, index}
          <div class="group flex items-center gap-1 px-3 py-1.5 bg-industrial-bg rounded-lg border border-industrial-border hover:border-primary-500/50 transition-all">
            <button
              on:click={() => loadSavedQuery(query)}
              class="text-sm text-industrial-text hover:text-primary-400"
            >
              {query.name}
            </button>
            <button
              on:click={() => deleteSavedQuery(index)}
              class="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-accent-red/20 text-industrial-text-muted hover:text-accent-red transition-all"
            >
              <X class="w-3 h-3" />
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if showFilters}
    <div class="card p-6 space-y-6 animate-slide-up">
      <div>
        <div class="flex items-center gap-2 mb-3">
          <Tag class="w-4 h-4 text-primary-400" />
          <span class="text-sm font-medium text-industrial-text">工单状态</span>
        </div>
        <div class="flex flex-wrap gap-2">
          {#each statusOptions as option}
            <button
              on:click={() => toggleStatus(option.value)}
              class="px-3 py-1.5 text-sm rounded-lg border transition-all {
                filter.statuses.includes(option.value)
                  ? 'bg-primary-500/20 text-primary-400 border-primary-500'
                  : 'bg-industrial-bg text-industrial-text-secondary border-industrial-border hover:border-primary-500/50'
              }"
            >
              {option.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div class="flex items-center gap-2 mb-3">
            <Calendar class="w-4 h-4 text-primary-400" />
            <span class="text-sm font-medium text-industrial-text">创建日期</span>
          </div>
          <div class="flex items-center gap-3">
            <input
              type="date"
              bind:value={filter.dateFrom}
              class="input flex-1"
            />
            <span class="text-industrial-text-muted">至</span>
            <input
              type="date"
              bind:value={filter.dateTo}
              class="input flex-1"
            />
          </div>
        </div>

        <div>
          <div class="flex items-center gap-2 mb-3">
            <Car class="w-4 h-4 text-primary-400" />
            <span class="text-sm font-medium text-industrial-text">车牌号</span>
          </div>
          <input
            type="text"
            bind:value={filter.vehiclePlate}
            class="input"
            placeholder="输入车牌号模糊搜索..."
          />
        </div>
      </div>

      <div>
        <div class="flex items-center gap-2 mb-3">
          <MapPin class="w-4 h-4 text-primary-400" />
          <span class="text-sm font-medium text-industrial-text">区域</span>
        </div>
        <div class="flex flex-wrap gap-2">
          {#each regions as region}
            <button
              on:click={() => toggleRegion(region)}
              class="px-3 py-1.5 text-sm rounded-lg border transition-all {
                filter.regions.includes(region)
                  ? 'bg-primary-500/20 text-primary-400 border-primary-500'
                  : 'bg-industrial-bg text-industrial-text-secondary border-industrial-border hover:border-primary-500/50'
              }"
            >
              {region}
            </button>
          {/each}
        </div>
      </div>

      <div>
        <div class="flex items-center gap-2 mb-3">
          <User class="w-4 h-4 text-primary-400" />
          <span class="text-sm font-medium text-industrial-text">负责人</span>
        </div>
        <div class="flex flex-wrap gap-2">
          {#each users as user}
            <button
              on:click={() => toggleAssignee(user.id)}
              class="px-3 py-1.5 text-sm rounded-lg border transition-all {
                filter.assignees.includes(user.id)
                  ? 'bg-primary-500/20 text-primary-400 border-primary-500'
                  : 'bg-industrial-bg text-industrial-text-secondary border-industrial-border hover:border-primary-500/50'
              }"
            >
              {user.name}
              <span class="text-xs text-industrial-text-muted ml-1">({user.role})</span>
            </button>
          {/each}
        </div>
      </div>

      <div>
        <div class="flex items-center gap-2 mb-3">
          <Search class="w-4 h-4 text-primary-400" />
          <span class="text-sm font-medium text-industrial-text">关键词</span>
        </div>
        <input
          type="text"
          bind:value={filter.keywords}
          class="input"
          placeholder="搜索诊断结果、车架号等..."
        />
      </div>

      {#if activeFilterCount > 0}
        <div class="flex flex-wrap items-center gap-2 pt-4 border-t border-industrial-border">
          <span class="text-sm text-industrial-text-muted">已选条件：</span>
          {#if filter.statuses.length > 0}
            <span class="px-2 py-1 text-xs bg-industrial-bg rounded border border-industrial-border">
              状态: {filter.statuses.map(s => statusOptions.find(o => o.value === s)?.label).join(', ')}
              <button on:click={() => filter.statuses = []} class="ml-2 text-industrial-text-muted hover:text-accent-red">
                <X class="w-3 h-3 inline" />
              </button>
            </span>
          {/if}
          {#if filter.dateFrom || filter.dateTo}
            <span class="px-2 py-1 text-xs bg-industrial-bg rounded border border-industrial-border">
              日期: {filter.dateFrom || '不限'} ~ {filter.dateTo || '不限'}
              <button on:click={() => { filter.dateFrom = ''; filter.dateTo = ''; }} class="ml-2 text-industrial-text-muted hover:text-accent-red">
                <X class="w-3 h-3 inline" />
              </button>
            </span>
          {/if}
          {#if filter.regions.length > 0}
            <span class="px-2 py-1 text-xs bg-industrial-bg rounded border border-industrial-border">
              区域: {filter.regions.join(', ')}
              <button on:click={() => filter.regions = []} class="ml-2 text-industrial-text-muted hover:text-accent-red">
                <X class="w-3 h-3 inline" />
              </button>
            </span>
          {/if}
          {#if filter.assignees.length > 0}
            <span class="px-2 py-1 text-xs bg-industrial-bg rounded border border-industrial-border">
              负责人: {filter.assignees.map(id => users.find(u => u.id === id)?.name).join(', ')}
              <button on:click={() => filter.assignees = []} class="ml-2 text-industrial-text-muted hover:text-accent-red">
                <X class="w-3 h-3 inline" />
              </button>
            </span>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  {#if loading}
    <div class="flex items-center justify-center py-20">
      <Loader2 class="w-10 h-10 text-primary-500 animate-spin" />
    </div>
  {:else if results.length === 0}
    <div class="card p-12 text-center">
      <Search class="w-16 h-16 text-industrial-text-muted mx-auto mb-4 opacity-50" />
      <p class="text-industrial-text-muted">暂无查询结果</p>
      <p class="text-sm text-industrial-text-muted mt-1">请调整筛选条件后重试</p>
    </div>
  {:else}
    <div class="card overflow-hidden">
      <div class="px-6 py-4 border-b border-industrial-border flex items-center justify-between">
        <h3 class="font-medium text-industrial-text">
          查询结果 <span class="text-industrial-text-muted">({results.length} 条)</span>
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-industrial-bg/50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-industrial-text-muted uppercase tracking-wider">车辆信息</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-industrial-text-muted uppercase tracking-wider">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-industrial-text-muted uppercase tracking-wider">创建人</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-industrial-text-muted uppercase tracking-wider">区域</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-industrial-text-muted uppercase tracking-wider">创建时间</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-industrial-text-muted uppercase tracking-wider">金额</th>
              <th class="px-6 py-3 text-center text-xs font-medium text-industrial-text-muted uppercase tracking-wider">返修</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-industrial-border">
            {#each results as order, index (order.id)}
              <tr class="hover:bg-industrial-bg/30 transition-colors animate-fade-in" style="animation-delay: {index * 20}ms">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                      <Car class="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <p class="font-mono font-medium text-industrial-text">{order.vehicle?.plateNumber || '-'}</p>
                      <p class="text-xs text-industrial-text-muted">{order.vehicle?.brand} {order.vehicle?.model}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="badge {getStatusClass(order.status)}">
                    {statusOptions.find(s => s.value === order.status)?.label || order.status}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-industrial-text">{order.creator?.name || '-'}</td>
                <td class="px-6 py-4 text-sm text-industrial-text">{order.region || '-'}</td>
                <td class="px-6 py-4 text-sm text-industrial-text-muted font-mono">{formatDate(order.createdAt)}</td>
                <td class="px-6 py-4 text-right font-mono font-medium text-accent-green">
                  ¥{Number(order.totalAmount).toFixed(2)}
                </td>
                <td class="px-6 py-4 text-center">
                  {#if order.isRework}
                    <span class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-accent-red/20 text-accent-red rounded border border-accent-red/30">
                      <AlertTriangle class="w-3 h-3" />
                      是
                    </span>
                  {:else}
                    <span class="text-industrial-text-muted">-</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

{#if showSaveModal}
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
    <div class="card w-full max-w-md animate-slide-up">
      <div class="px-6 py-4 border-b border-industrial-border flex items-center justify-between">
        <h2 class="font-display text-lg font-semibold text-industrial-text">保存查询</h2>
        <button on:click={() => showSaveModal = false} class="p-2 rounded-lg hover:bg-industrial-border">
          <X class="w-5 h-5 text-industrial-text-muted" />
        </button>
      </div>
      <div class="p-6">
        <label for="query-name" class="label">查询名称</label>
        <input
          id="query-name"
          type="text"
          bind:value={queryName}
          class="input"
          placeholder="如：本月华东区待处理工单"
        />
      </div>
      <div class="px-6 py-4 border-t border-industrial-border flex items-center justify-end gap-3 bg-industrial-bg/50">
        <button on:click={() => showSaveModal = false} class="btn btn-secondary">取消</button>
        <button on:click={saveQuery} class="btn btn-primary">保存</button>
      </div>
    </div>
  </div>
{/if}
