<script lang="ts">
  import { trpc } from '$lib/trpc/client';

  let stats: any = null;
  let trendData: any[] = [];
  let loading = true;

  async function loadData() {
    loading = true;
    try {
      const [statsResult, trendResult] = await Promise.all([
        trpc.followup.getDashboardStats.query(),
        trpc.followup.getCompletionTrend.query({ days: 30 })
      ]);
      stats = statsResult;
      trendData = trendResult;
    } catch (e) {
      console.error('加载数据失败', e);
    } finally {
      loading = false;
    }
  }

  function getMaxValue() {
    if (!trendData.length) return 10;
    return Math.max(...trendData.map(d => d.total), 10);
  }

  loadData();
</script>

<div class="page-header">
  <div>
    <h1 class="page-title">管理仪表盘</h1>
    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">
      回访工作整体概览与趋势分析
    </p>
  </div>
  <div class="page-actions">
    <button class="btn-secondary" on:click={loadData}>
      🔄 刷新数据
    </button>
  </div>
</div>

{#if loading}
  <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
    加载中...
  </div>
{:else}
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">总回访记录</div>
      <div class="stat-value">{stats?.total || 0}</div>
      <div class="stat-change positive">累计全部记录</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">待处理</div>
      <div class="stat-value" style="color: var(--warning-color);">{stats?.pending || 0}</div>
      <div class="stat-change">需要跟进处理</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">进行中</div>
      <div class="stat-value" style="color: var(--info-color);">{stats?.inProgress || 0}</div>
      <div class="stat-change">正在回访中</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">已完成</div>
      <div class="stat-value" style="color: var(--success-color);">{stats?.completed || 0}</div>
      <div class="stat-change positive">已完成回访</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">高风险</div>
      <div class="stat-value" style="color: var(--danger-color);">{stats?.highRisk || 0}</div>
      <div class="stat-change negative">需要重点关注</div>
    </div>
  </div>

  <div class="card" style="margin-bottom: 1.5rem;">
    <div class="card-header">
      近30天回访完成趋势
    </div>
    <div class="card-body">
      <div class="chart-container" style="display: flex; align-items: flex-end; gap: 4px; padding: 1rem 0; height: 280px;">
        {#each trendData as day}
          <div class="chart-bar" style="flex: 1; min-width: 0;">
            <div style="width: 100%; background: var(--primary-light); border-radius: 4px 4px 0 0; position: relative; height: {day.total > 0 ? (day.total / getMaxValue()) * 200 : 0}px;">
              <div style="position: absolute; bottom: 0; left: 0; right: 0; background: var(--primary-color); border-radius: 4px 4px 0 0; height: {day.total > 0 ? (day.completed / getMaxValue()) * 200 : 0}px;"></div>
            </div>
            <div class="chart-bar-label">{day.date.slice(5)}</div>
          </div>
        {/each}
      </div>
      <div style="display: flex; justify-content: center; gap: 2rem; margin-top: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="width: 12px; height: 12px; background: var(--primary-light); border-radius: 2px;"></div>
          <span style="font-size: 0.875rem; color: var(--text-secondary);">总回访数</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="width: 12px; height: 12px; background: var(--primary-color); border-radius: 2px;"></div>
          <span style="font-size: 0.875rem; color: var(--text-secondary);">已完成数</span>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      每日完成率
    </div>
    <div class="card-body">
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        {#each trendData.slice(-7) as day}
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span style="font-size: 0.875rem; color: var(--text-secondary);">{day.date}</span>
              <span style="font-size: 0.875rem; font-weight: 500;">{day.completed}/{day.total} ({day.completionRate}%)</span>
            </div>
            <div style="width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; background: var(--primary-color); border-radius: 4px; width: {day.completionRate}%;"></div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}
