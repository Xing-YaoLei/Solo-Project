<script lang="ts">
  import { trpc } from '$lib/trpc/client';
  import { onMount } from 'svelte';

  let dashboard: any = null;
  let loading = true;

  onMount(async () => {
    try {
      dashboard = await trpc.statistics.dashboard.query();
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  });

  const stats = [
    { label: '在诊患者', key: 'activePatients', icon: '👤', color: 'bg-blue-50 text-blue-600' },
    { label: '待随访', key: 'pendingFollowups', icon: '📅', color: 'bg-yellow-50 text-yellow-600' },
    { label: '待处理异常', key: 'openExceptions', icon: '⚠️', color: 'bg-red-50 text-red-600' },
    { label: '病历总数', key: 'totalRecords', icon: '📋', color: 'bg-green-50 text-green-600' }
  ];
</script>

<div class="p-8">
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-gray-900">仪表盘</h1>
    <p class="mt-1 text-gray-500">欢迎回来，这是今天的工作概览</p>
  </div>

  {#if loading}
    <div class="text-center py-12 text-gray-500">加载中...</div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {#each stats as stat}
        <div class="card p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">{stat.label}</p>
              <p class="mt-2 text-3xl font-bold text-gray-900">{dashboard?.[stat.key] ?? 0}</p>
            </div>
            <div class={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <div class="card-header flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">快捷操作</h2>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-2 gap-4">
            <a href="/patients?new=true" class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
              <div class="text-2xl mb-2">➕</div>
              <p class="text-sm font-medium text-gray-700">新建患者</p>
            </a>
            <a href="/followups?new=true" class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
              <div class="text-2xl mb-2">📅</div>
              <p class="text-sm font-medium text-gray-700">创建随访</p>
            </a>
            <a href="/exceptions?new=true" class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
              <div class="text-2xl mb-2">⚠️</div>
              <p class="text-sm font-medium text-gray-700">上报异常</p>
            </a>
            <a href="/statistics" class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
              <div class="text-2xl mb-2">📈</div>
              <p class="text-sm font-medium text-gray-700">查看统计</p>
            </a>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-semibold text-gray-900">系统状态</h2>
        </div>
        <div class="card-body space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-gray-600">数据库连接</span>
            <span class="badge badge-success">正常</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600">认证服务</span>
            <span class="badge badge-success">正常</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600">影像存储</span>
            <span class="badge badge-success">正常</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600">系统版本</span>
            <span class="text-sm text-gray-500">v0.1.0</span>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
