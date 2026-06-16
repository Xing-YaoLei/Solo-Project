<script lang="ts">
  import { trpc } from '$lib/trpc/client';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let followups: any[] = [];
  let total = 0;
  let pageNum = 1;
  let pageSize = 20;
  let totalPages = 0;
  let status = '';
  let type = '';
  let startDate = '';
  let endDate = '';
  let loading = true;
  let showNewModal = false;

  let newFollowup = {
    patientId: '',
    type: 'visit' as const,
    scheduledDate: '',
    notes: ''
  };

  $: {
    if ($page.url.searchParams.get('new') === 'true') {
      showNewModal = true;
    }
  }

  async function loadFollowups() {
    loading = true;
    try {
      const result: any = await trpc.followupTask.list.query({
        page: pageNum,
        pageSize,
        status: status || undefined,
        type: type || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      followups = result.items;
      total = result.total;
      totalPages = result.totalPages;
    } finally {
      loading = false;
    }
  }

  async function handleSearch() {
    pageNum = 1;
    loadFollowups();
  }

  async function handleCreateFollowup(e: Event) {
    e.preventDefault();
    try {
      await trpc.followupTask.create.mutate({
        ...newFollowup
      });
      showNewModal = false;
      newFollowup = {
        patientId: '',
        type: 'visit',
        scheduledDate: '',
        notes: ''
      };
      loadFollowups();
      goto('/followups');
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function markCompleted(id: string) {
    await trpc.followupTask.markCompleted.mutate({ id });
    loadFollowups();
  }

  async function markMissed(id: string) {
    if (confirm('确定标记为爽约？这将生成异常单')) {
      await trpc.followupTask.markMissed.mutate({ id, createException: true });
      loadFollowups();
    }
  }

  const followupStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: '待执行',
      completed: '已完成',
      missed: '已爽约',
      cancelled: '已取消'
    };
    return map[status] || status;
  };

  const followupStatusClass = (status: string) => {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      completed: 'badge-success',
      missed: 'badge-danger',
      cancelled: 'badge-gray'
    };
    return map[status] || 'badge-gray';
  };

  const followupTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      phone: '电话随访',
      visit: '门诊复诊',
      imaging: '影像复查',
      consultation: '咨询回访'
    };
    return map[type] || type;
  };

  function closeModal() {
    showNewModal = false;
    goto('/followups');
  }

  $: if (pageNum) {
    loadFollowups();
  }

  onMount(() => {
    loadFollowups();
  });
</script>

<div class="p-8">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">随访任务</h1>
      <p class="mt-1 text-gray-500">管理所有患者的随访安排和执行记录</p>
    </div>
    <button class="btn-primary" on:click={() => (showNewModal = true)}>
      ➕ 创建随访
    </button>
  </div>

  <div class="card mb-6">
    <div class="card-body">
      <div class="flex gap-4 items-end flex-wrap">
        <div class="w-40">
          <label class="label">状态</label>
          <select bind:value={status} class="input-field" on:change={handleSearch}>
            <option value="">全部状态</option>
            <option value="pending">待执行</option>
            <option value="completed">已完成</option>
            <option value="missed">已爽约</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
        <div class="w-40">
          <label class="label">类型</label>
          <select bind:value={type} class="input-field" on:change={handleSearch}>
            <option value="">全部类型</option>
            <option value="phone">电话随访</option>
            <option value="visit">门诊复诊</option>
            <option value="imaging">影像复查</option>
            <option value="consultation">咨询回访</option>
          </select>
        </div>
        <div class="w-40">
          <label class="label">开始日期</label>
          <input type="date" bind:value={startDate} class="input-field" on:change={handleSearch} />
        </div>
        <div class="w-40">
          <label class="label">结束日期</label>
          <input type="date" bind:value={endDate} class="input-field" on:change={handleSearch} />
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
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">随访类型</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">患者ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">计划时间</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#if loading}
            <tr>
              <td colspan="6" class="px-6 py-12 text-center text-gray-500">加载中...</td>
            </tr>
          {:else if followups.length === 0}
            <tr>
              <td colspan="6" class="px-6 py-12 text-center text-gray-500">暂无随访任务</td>
            </tr>
          {:else}
            {#each followups as task}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-gray-900">{followupTypeLabel(task.type)}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.patientId.slice(0, 8)}...</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(task.scheduledDate).toLocaleString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class={`badge ${followupStatusClass(task.status)}`}>
                    {followupStatusLabel(task.status)}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {task.notes || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {#if task.status === 'pending'}
                    <button
                      class="text-green-600 hover:text-green-900 mr-3"
                      on:click={() => markCompleted(task.id)}
                    >
                      完成
                    </button>
                    <button
                      class="text-red-600 hover:text-red-900"
                      on:click={() => markMissed(task.id)}
                    >
                      爽约
                    </button>
                  {:else}
                    <button
                      class="text-dental-600 hover:text-dental-900"
                      on:click={() => goto(`/patients/${task.patientId}`)}
                    >
                      查看患者
                    </button>
                  {/if}
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
          <h2 class="text-lg font-semibold text-gray-900">创建随访任务</h2>
          <button class="text-gray-400 hover:text-gray-600" on:click={closeModal}>✕</button>
        </div>
      </div>
      <form on:submit={handleCreateFollowup} class="p-6 space-y-4">
        <div>
          <label class="label">患者ID *</label>
          <input type="text" bind:value={newFollowup.patientId} class="input-field" required placeholder="请输入患者UUID" />
        </div>
        <div>
          <label class="label">随访类型 *</label>
          <select bind:value={newFollowup.type} class="input-field">
            <option value="phone">电话随访</option>
            <option value="visit">门诊复诊</option>
            <option value="imaging">影像复查</option>
            <option value="consultation">咨询回访</option>
          </select>
        </div>
        <div>
          <label class="label">计划时间 *</label>
          <input type="datetime-local" bind:value={newFollowup.scheduledDate} class="input-field" required />
        </div>
        <div>
          <label class="label">备注</label>
          <textarea bind:value={newFollowup.notes} class="input-field" rows="3"></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button type="button" class="btn-secondary" on:click={closeModal}>取消</button>
          <button type="submit" class="btn-primary">创建</button>
        </div>
      </form>
    </div>
  </div>
{/if}
