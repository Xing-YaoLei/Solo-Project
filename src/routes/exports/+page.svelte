<script lang="ts">
  import { trpc } from '$lib/trpc/client';
  import { onMount } from 'svelte';

  let exports: any[] = [];
  let total = 0;
  let pageNum = 1;
  let pageSize = 20;
  let totalPages = 0;
  let loading = true;
  let showDetailModal = false;
  let selectedExport: any = null;

  async function loadExports() {
    loading = true;
    try {
      const result: any = await trpc.statistics.exportLogs.query({
        page: pageNum,
        pageSize
      });
      exports = result.items;
      total = result.total;
      totalPages = result.totalPages;
    } finally {
      loading = false;
    }
  }

  function viewDetail(exp: any) {
    selectedExport = exp;
    showDetailModal = true;
  }

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      followup: '随访任务',
      exception: '异常单',
      patient: '患者档案',
      medicalRecord: '病历记录',
      other: '其他'
    };
    return map[type] || type;
  };

  $: if (pageNum) {
    loadExports();
  }

  onMount(() => {
    loadExports();
  });
</script>

<div class="p-8">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">导出记录</h1>
    <p class="mt-1 text-gray-500">查看所有历史导出记录及统计口径说明</p>
  </div>

  <div class="card">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">导出时间</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#if loading}
            <tr>
              <td colspan="5" class="px-6 py-12 text-center text-gray-500">加载中...</td>
            </tr>
          {:else if exports.length === 0}
            <tr>
              <td colspan="5" class="px-6 py-12 text-center text-gray-500">暂无导出记录</td>
            </tr>
          {:else}
            {#each exports as exp}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <p class="text-sm font-medium text-gray-900">{exp.title}</p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="badge badge-info">{typeLabel(exp.type)}</span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {exp.description || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(exp.createdAt).toLocaleString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    class="text-dental-600 hover:text-dental-900"
                    on:click={() => viewDetail(exp)}
                  >
                    查看口径
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

{#if showDetailModal && selectedExport}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">导出详情</h2>
          <button class="text-gray-400 hover:text-gray-600" on:click={() => (showDetailModal = false)}>✕</button>
        </div>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <p class="text-sm text-gray-500 mb-1">标题</p>
          <p class="font-medium text-gray-900">{selectedExport.title}</p>
        </div>
        <div class="flex gap-6">
          <div>
            <p class="text-sm text-gray-500 mb-1">类型</p>
            <span class="badge badge-info">{typeLabel(selectedExport.type)}</span>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">导出时间</p>
            <p class="text-sm text-gray-900">{new Date(selectedExport.createdAt).toLocaleString()}</p>
          </div>
        </div>
        {#if selectedExport.description}
          <div>
            <p class="text-sm text-gray-500 mb-1">描述</p>
            <p class="text-sm text-gray-700">{selectedExport.description}</p>
          </div>
        {/if}
        {#if selectedExport.dataScope}
          <div>
            <p class="text-sm text-gray-500 mb-1">数据范围</p>
            <pre class="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg font-mono">{JSON.stringify(selectedExport.dataScope, null, 2)}</pre>
          </div>
        {/if}
        {#if selectedExport.statisticalCaliber}
          <div>
            <p class="text-sm text-gray-500 mb-2">📊 统计口径说明</p>
            <div class="bg-dental-50 rounded-lg p-4">
              <pre class="text-sm text-dental-800 whitespace-pre-wrap font-sans">{selectedExport.statisticalCaliber}</pre>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
