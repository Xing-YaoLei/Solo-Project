<script lang="ts">
  import { trpc } from '$lib/trpc/client';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let exceptions: any[] = [];
  let total = 0;
  let pageNum = 1;
  let pageSize = 20;
  let totalPages = 0;
  let status = '';
  let severity = '';
  let responsibility = '';
  let loading = true;
  let showNewModal = false;
  let showDetailModal = false;
  let selectedException: any = null;
  let resolveResult = '';
  let showResolveModal = false;

  let newException = {
    patientId: '',
    title: '',
    description: '',
    severity: 'medium' as const,
    impactScope: '',
    responsibility: 'patient' as const,
    responsiblePerson: ''
  };

  $: {
    if ($page.url.searchParams.get('new') === 'true') {
      showNewModal = true;
    }
  }

  async function loadExceptions() {
    loading = true;
    try {
      const result: any = await trpc.exceptionOrder.list.query({
        page: pageNum,
        pageSize,
        status: status || undefined,
        severity: severity || undefined,
        responsibility: responsibility || undefined
      });
      exceptions = result.items;
      total = result.total;
      totalPages = result.totalPages;
    } finally {
      loading = false;
    }
  }

  async function handleSearch() {
    pageNum = 1;
    loadExceptions();
  }

  async function handleCreateException(e: Event) {
    e.preventDefault();
    try {
      await trpc.exceptionOrder.create.mutate({
        ...newException
      });
      showNewModal = false;
      newException = {
        patientId: '',
        title: '',
        description: '',
        severity: 'medium',
        impactScope: '',
        responsibility: 'patient',
        responsiblePerson: ''
      };
      loadExceptions();
      goto('/exceptions');
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function viewDetail(id: string) {
    selectedException = await trpc.exceptionOrder.get.query({ id });
    showDetailModal = true;
  }

  function openResolveModal() {
    resolveResult = '';
    showResolveModal = true;
    showDetailModal = false;
  }

  async function handleResolve() {
    if (!selectedException || !resolveResult) return;
    await trpc.exceptionOrder.resolve.mutate({
      id: selectedException.id,
      handlingResult: resolveResult
    });
    showResolveModal = false;
    resolveResult = '';
    loadExceptions();
  }

  async function closeException(id: string) {
    if (confirm('确定关闭此异常单？')) {
      await trpc.exceptionOrder.close.mutate({ id });
      loadExceptions();
    }
  }

  const severityLabel = (s: string) => {
    const map: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '严重'
    };
    return map[s] || s;
  };

  const severityClass = (s: string) => {
    const map: Record<string, string> = {
      low: 'badge-info',
      medium: 'badge-warning',
      high: 'badge-danger',
      critical: 'badge-danger'
    };
    return map[s] || 'badge-gray';
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      open: '待处理',
      investigating: '调查中',
      resolved: '已解决',
      closed: '已关闭'
    };
    return map[s] || s;
  };

  const statusClass = (s: string) => {
    const map: Record<string, string> = {
      open: 'badge-danger',
      investigating: 'badge-warning',
      resolved: 'badge-success',
      closed: 'badge-gray'
    };
    return map[s] || 'badge-gray';
  };

  const responsibilityLabel = (r: string) => {
    const map: Record<string, string> = {
      patient: '患者责任',
      clinic: '诊所责任',
      doctor: '医生责任',
      system: '系统问题',
      other: '其他'
    };
    return map[r] || r;
  };

  function closeModal() {
    showNewModal = false;
    goto('/exceptions');
  }

  $: if (pageNum) {
    loadExceptions();
  }

  onMount(() => {
    loadExceptions();
  });
</script>

<div class="p-8">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">异常单管理</h1>
      <p class="mt-1 text-gray-500">处理爽约等异常情况，记录影响范围和责任归属</p>
    </div>
    <button class="btn-primary" on:click={() => (showNewModal = true)}>
      ➕ 上报异常
    </button>
  </div>

  <div class="card mb-6">
    <div class="card-body">
      <div class="flex gap-4 items-end flex-wrap">
        <div class="w-40">
          <label class="label">状态</label>
          <select bind:value={status} class="input-field" on:change={handleSearch}>
            <option value="">全部状态</option>
            <option value="open">待处理</option>
            <option value="investigating">调查中</option>
            <option value="resolved">已解决</option>
            <option value="closed">已关闭</option>
          </select>
        </div>
        <div class="w-40">
          <label class="label">严重程度</label>
          <select bind:value={severity} class="input-field" on:change={handleSearch}>
            <option value="">全部</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="critical">严重</option>
          </select>
        </div>
        <div class="w-40">
          <label class="label">责任归属</label>
          <select bind:value={responsibility} class="input-field" on:change={handleSearch}>
            <option value="">全部</option>
            <option value="patient">患者责任</option>
            <option value="clinic">诊所责任</option>
            <option value="doctor">医生责任</option>
            <option value="system">系统问题</option>
            <option value="other">其他</option>
          </select>
        </div>
        <button class="btn-secondary" on:click={handleSearch}>查询</button>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">严重程度</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">责任归属</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#if loading}
            <tr>
              <td colspan="6" class="px-6 py-12 text-center text-gray-500">加载中...</td>
            </tr>
          {:else if exceptions.length === 0}
            <tr>
              <td colspan="6" class="px-6 py-12 text-center text-gray-500">暂无异常单</td>
            </tr>
          {:else}
            {#each exceptions as exc}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <p class="text-sm font-medium text-gray-900">{exc.title}</p>
                  {#if exc.description}
                    <p class="text-sm text-gray-500 mt-1 truncate max-w-md">{exc.description}</p>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class={`badge ${severityClass(exc.severity)}`}>
                    {severityLabel(exc.severity)}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class={`badge ${statusClass(exc.status)}`}>
                    {statusLabel(exc.status)}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {exc.responsibility ? responsibilityLabel(exc.responsibility) : '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(exc.createdAt).toLocaleString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    class="text-dental-600 hover:text-dental-900"
                    on:click={() => viewDetail(exc.id)}
                  >
                    详情
                  </button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    {#if totalPages > 1}
      <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          共 {total} 条，第 {pageNum} / {totalPages} 页
        </div>
        <div class="flex gap-2">
          <button
            class="btn-secondary text-sm"
            disabled={pageNum <= 1}
            on:click={() => (pageNum--)}
          >
            上一页
          </button>
          <button
            class="btn-secondary text-sm"
            disabled={pageNum >= totalPages}
            on:click={() => (pageNum++)}
          >
            下一页
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

{#if showNewModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">上报异常</h2>
          <button class="text-gray-400 hover:text-gray-600" on:click={closeModal}>✕</button>
        </div>
      </div>
      <form on:submit={handleCreateException} class="p-6 space-y-4">
        <div>
          <label class="label">患者ID *</label>
          <input type="text" bind:value={newException.patientId} class="input-field" required placeholder="请输入患者UUID" />
        </div>
        <div>
          <label class="label">标题 *</label>
          <input type="text" bind:value={newException.title} class="input-field" required />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">严重程度</label>
            <select bind:value={newException.severity} class="input-field">
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="critical">严重</option>
            </select>
          </div>
          <div>
            <label class="label">责任归属</label>
            <select bind:value={newException.responsibility} class="input-field">
              <option value="patient">患者责任</option>
              <option value="clinic">诊所责任</option>
              <option value="doctor">医生责任</option>
              <option value="system">系统问题</option>
              <option value="other">其他</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label">描述</label>
          <textarea bind:value={newException.description} class="input-field" rows="3"></textarea>
        </div>
        <div>
          <label class="label">影响范围</label>
          <textarea bind:value={newException.impactScope} class="input-field" rows="2"></textarea>
        </div>
        <div>
          <label class="label">责任人</label>
          <input type="text" bind:value={newException.responsiblePerson} class="input-field" />
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button type="button" class="btn-secondary" on:click={closeModal}>取消</button>
          <button type="submit" class="btn-primary">提交</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if showDetailModal && selectedException}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">异常单详情</h2>
          <button class="text-gray-400 hover:text-gray-600" on:click={() => (showDetailModal = false)}>✕</button>
        </div>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <p class="text-sm text-gray-500 mb-1">标题</p>
          <p class="font-medium text-gray-900">{selectedException.title}</p>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <p class="text-sm text-gray-500 mb-1">严重程度</p>
            <span class={`badge ${severityClass(selectedException.severity)}`}>
              {severityLabel(selectedException.severity)}
            </span>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">状态</p>
            <span class={`badge ${statusClass(selectedException.status)}`}>
              {statusLabel(selectedException.status)}
            </span>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">责任归属</p>
            <span class="text-sm text-gray-900">
              {selectedException.responsibility ? responsibilityLabel(selectedException.responsibility) : '-'}
            </span>
          </div>
        </div>
        {#if selectedException.description}
          <div>
            <p class="text-sm text-gray-500 mb-1">描述</p>
            <p class="text-sm text-gray-700">{selectedException.description}</p>
          </div>
        {/if}
        {#if selectedException.impactScope}
          <div>
            <p class="text-sm text-gray-500 mb-1">影响范围</p>
            <p class="text-sm text-gray-700">{selectedException.impactScope}</p>
          </div>
        {/if}
        {#if selectedException.handlingResult}
          <div>
            <p class="text-sm text-gray-500 mb-1">处理结果</p>
            <p class="text-sm text-gray-700 bg-green-50 p-3 rounded-lg">{selectedException.handlingResult}</p>
          </div>
        {/if}
        {#if selectedException.responsiblePerson}
          <div>
            <p class="text-sm text-gray-500 mb-1">责任人</p>
            <p class="text-sm text-gray-900">{selectedException.responsiblePerson}</p>
          </div>
        {/if}
        <div class="flex justify-between text-xs text-gray-400 pt-2 border-t">
          <span>创建时间：{new Date(selectedException.createdAt).toLocaleString()}</span>
          {#if selectedException.closedAt}
            <span>关闭时间：{new Date(selectedException.closedAt).toLocaleString()}</span>
          {/if}
        </div>
        <div class="flex justify-end gap-3 pt-4 border-t">
          {#if selectedException.status !== 'resolved' && selectedException.status !== 'closed'}
            <button class="btn-primary" on:click={openResolveModal}>
              处理解决
            </button>
          {/if}
          {#if selectedException.status === 'resolved' && selectedException.status !== 'closed'}
            <button
              class="btn-secondary"
              on:click={() => closeException(selectedException.id)}
            >
              关闭
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

{#if showResolveModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl w-full max-w-md">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">处理异常</h2>
          <button class="text-gray-400 hover:text-gray-600" on:click={() => (showResolveModal = false)}>✕</button>
        </div>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="label">处理结果 *</label>
          <textarea bind:value={resolveResult} class="input-field" rows="4" placeholder="请详细描述处理过程和结果"></textarea>
        </div>
        <div class="flex justify-end gap-3">
          <button class="btn-secondary" on:click={() => (showResolveModal = false)}>取消</button>
          <button class="btn-primary" on:click={handleResolve}>提交</button>
        </div>
      </div>
    </div>
  </div>
{/if}
