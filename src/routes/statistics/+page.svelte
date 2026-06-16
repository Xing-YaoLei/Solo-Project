<script lang="ts">
  import { trpc } from '$lib/trpc/client';
  import { onMount } from 'svelte';

  let startDate = '';
  let endDate = '';
  let revisitData: any = null;
  let loading = false;

  function setDefaultDates() {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    startDate = start.toISOString().split('T')[0];
    endDate = end.toISOString().split('T')[0];
  }

  async function calculateRevisitRate() {
    if (!startDate || !endDate) {
      alert('请选择开始和结束日期');
      return;
    }
    loading = true;
    try {
      revisitData = await trpc.statistics.revisitRate.query({
        startDate,
        endDate
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      loading = false;
    }
  }

  async function exportFollowups() {
    if (!startDate || !endDate) {
      alert('请选择开始和结束日期');
      return;
    }
    try {
      const result: any = await trpc.statistics.exportFollowups.mutate({
        startDate,
        endDate
      });
      alert('导出生成成功！请在导出记录中查看。');
      console.log('导出数据:', result);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function exportExceptions() {
    if (!startDate || !endDate) {
      alert('请选择开始和结束日期');
      return;
    }
    try {
      const result: any = await trpc.statistics.exportExceptions.mutate({
        startDate,
        endDate
      });
      alert('导出生成成功！请在导出记录中查看。');
      console.log('导出数据:', result);
    } catch (err: any) {
      alert(err.message);
    }
  }

  onMount(() => {
    setDefaultDates();
  });
</script>

<div class="p-8">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">数据统计</h1>
    <p class="mt-1 text-gray-500">查看复诊率等关键指标，支持数据导出</p>
  </div>

  <div class="card mb-6">
    <div class="card-body">
      <div class="flex items-end gap-4">
        <div class="w-40">
          <label class="label">开始日期</label>
          <input type="date" bind:value={startDate} class="input-field" />
        </div>
        <div class="w-40">
          <label class="label">结束日期</label>
          <input type="date" bind:value={endDate} class="input-field" />
        </div>
        <button class="btn-primary" on:click={calculateRevisitRate} disabled={loading}>
          {loading ? '计算中...' : '计算复诊率'}
        </button>
      </div>
    </div>
  </div>

  {#if revisitData}
    <div class="card mb-6">
      <div class="card-header">
        <h2 class="text-lg font-semibold text-gray-900">复诊率统计</h2>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-4 gap-6 mb-6">
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <p class="text-3xl font-bold text-blue-600">{revisitData.revisitRate}%</p>
            <p class="text-sm text-blue-600 mt-1">复诊率</p>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <p class="text-3xl font-bold text-green-600">{revisitData.totalPatients}</p>
            <p class="text-sm text-green-600 mt-1">就诊患者数</p>
          </div>
          <div class="text-center p-4 bg-purple-50 rounded-lg">
            <p class="text-3xl font-bold text-purple-600">{revisitData.revisitCount}</p>
            <p class="text-sm text-purple-600 mt-1">复诊患者数</p>
          </div>
          <div class="text-center p-4 bg-yellow-50 rounded-lg">
            <p class="text-3xl font-bold text-yellow-600">{revisitData.totalVisits}</p>
            <p class="text-sm text-yellow-600 mt-1">总就诊次数</p>
          </div>
        </div>

        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-sm font-medium text-gray-700 mb-2">📊 统计口径说明</h3>
          <pre class="text-xs text-gray-600 whitespace-pre-wrap font-sans">{revisitData.statisticalCaliber}</pre>
        </div>
      </div>
    </div>
  {/if}

  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-semibold text-gray-900">数据导出</h2>
    </div>
    <div class="card-body">
      <p class="text-sm text-gray-500 mb-4">导出的所有数据都会附带口径说明，方便团队理解数据含义</p>
      <div class="grid grid-cols-3 gap-4">
        <div class="border border-gray-200 rounded-lg p-4 hover:border-dental-200 transition-colors">
          <div class="text-3xl mb-3">📅</div>
          <h3 class="font-medium text-gray-900">随访任务导出</h3>
          <p class="text-sm text-gray-500 mt-1">导出指定时间范围内的随访记录</p>
          <button class="btn-secondary w-full mt-4" on:click={exportFollowups}>
            导出随访
          </button>
        </div>
        <div class="border border-gray-200 rounded-lg p-4 hover:border-dental-200 transition-colors">
          <div class="text-3xl mb-3">⚠️</div>
          <h3 class="font-medium text-gray-900">异常单导出</h3>
          <p class="text-sm text-gray-500 mt-1">导出异常单记录及处理结果</p>
          <button class="btn-secondary w-full mt-4" on:click={exportExceptions}>
            导出异常单
          </button>
        </div>
        <div class="border border-gray-200 rounded-lg p-4 hover:border-dental-200 transition-colors">
          <div class="text-3xl mb-3">📋</div>
          <h3 class="font-medium text-gray-900">更多导出</h3>
          <p class="text-sm text-gray-500 mt-1">查看所有历史导出记录</p>
          <a href="/exports" class="btn-secondary w-full mt-4 text-center block">
            查看导出记录
          </a>
        </div>
      </div>
    </div>
  </div>
</div>
