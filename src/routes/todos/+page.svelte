<script lang="ts">
  import { goto } from '$app/navigation';
  import { trpc } from '$lib/trpc/client';

  let todos: any[] = [];
  let loading = true;

  async function loadTodos() {
    loading = true;
    try {
      todos = await trpc.followup.getMyTodos.query();
    } catch (e) {
      console.error('加载待办失败', e);
    } finally {
      loading = false;
    }
  }

  function getRiskLabel(level: string) {
    const labels: Record<string, string> = {
      low: '低风险',
      medium: '中风险',
      high: '高风险',
      critical: '极高风险'
    };
    return labels[level] || level;
  }

  function formatDate(date: Date | string | null) {
    if (!date) return '未设置';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    });
  }

  loadTodos();
</script>

<div class="page-header">
  <div>
    <h1 class="page-title">我的待办</h1>
    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">
      您负责的待处理回访记录
    </p>
  </div>
  <div class="page-actions">
    <button class="btn-secondary" on:click={loadTodos}>
      🔄 刷新
    </button>
  </div>
</div>

<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-label">待处理回访</div>
    <div class="stat-value" style="color: var(--warning-color);">{todos.length}</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">高风险待办</div>
    <div class="stat-value" style="color: var(--danger-color);">
      {todos.filter(t => t.riskLevel === 'high' || t.riskLevel === 'critical').length}
    </div>
  </div>
</div>

<div class="card">
  <div style="overflow-x: auto;">
    <table class="table">
      <thead>
        <tr>
          <th>优先级</th>
          <th>会员姓名</th>
          <th>联系电话</th>
          <th>风险等级</th>
          <th>计划回访时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {#if loading}
          <tr>
            <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              加载中...
            </td>
          </tr>
        {:else if todos.length === 0}
          <tr>
            <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              🎉 太棒了！您没有待办事项
            </td>
          </tr>
        {:else}
          {#each todos as todo, index}
            <tr>
              <td>
                <span style="font-weight: 600; color: {index < 3 ? 'var(--danger-color)' : 'var(--text-secondary)'};">
                  #{index + 1}
                </span>
              </td>
              <td>
                <div style="font-weight: 500;">{todo.member?.name || '-'}</div>
              </td>
              <td>{todo.member?.phone || '-'}</td>
              <td>
                <span class="badge risk-{todo.riskLevel}">
                  {getRiskLabel(todo.riskLevel)}
                </span>
              </td>
              <td>{formatDate(todo.nextFollowupDate)}</td>
              <td>
                <button class="btn-primary btn-sm" on:click={() => goto(`/followup/${todo.id}`)}>
                  开始处理
                </button>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
