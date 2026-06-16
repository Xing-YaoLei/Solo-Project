<div class="page-header">
  <div>
    <h1 class="page-title">回访记录</h1>
    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">
      管理用药回访记录，追踪患者用药情况
    </p>
  </div>
  <div class="page-actions">
    <button class="btn-primary" on:click={openCreateModal}>+ 新建回访</button>
  </div>
</div>

<div class="card" style="margin-bottom: 1rem;">
  <div class="card-body">
    <div class="form-row" style="align-items: end;">
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label">状态筛选</label>
        <select class="form-input" bind:value={filterStatus}>
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label">风险等级</label>
        <select class="form-input" bind:value={filterRisk}>
          <option value="">全部风险</option>
          <option value="low">低风险</option>
          <option value="medium">中风险</option>
          <option value="high">高风险</option>
          <option value="critical">极高风险</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        {#if user && ['admin', 'manager'].includes(user.role)}
          <label class="form-label">
            <input type="checkbox" bind:checked={assignedOnly} style="margin-right: 0.5rem;" />
            只看我负责的
          </label>
        {:else}
          <label class="form-label" style="color: var(--text-muted);">
            🔒 仅显示您负责的记录
          </label>
        {/if}
        <button class="btn-secondary" on:click={loadRecords} style="width: 100%;">
          筛选
        </button>
      </div>
    </div>
  </div>
</div>

<div class="card">
  <div style="overflow-x: auto;">
    <table class="table">
      <thead>
        <tr>
          <th>会员信息</th>
          <th>风险等级</th>
          <th>状态</th>
          <th>负责人</th>
          <th>创建时间</th>
          <th>下次回访</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {#if loading}
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              加载中...
            </td>
          </tr>
        {:else if records.length === 0}
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              暂无回访记录
            </td>
          </tr>
        {:else}
          {#each records as record (record.id)}
            <tr>
              <td>
                <div style="font-weight: 500;">{record.member?.name || '-'}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                  {record.member?.phone || ''}
                </div>
              </td>
              <td>
                <span class="badge risk-{record.riskLevel}">
                  {getRiskLabel(record.riskLevel)}
                </span>
              </td>
              <td>
                <span class="badge {getStatusBadgeClass(record.status)}">
                  {getStatusLabel(record.status)}
                </span>
              </td>
              <td>
                {record.assignedUser?.name || '-'}
              </td>
              <td>
                {formatDate(record.createdAt)}
              </td>
              <td>
                {record.nextFollowupDate ? formatDate(record.nextFollowupDate) : '-'}
              </td>
              <td>
                <button class="btn-secondary btn-sm" on:click={() => goToDetail(record.id)}>
                  查看
                </button>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
  
  <div class="pagination" style="margin: 0 1rem;">
    <div class="pagination-info">
      共 {total} 条记录，第 {currentPage} / {Math.ceil(total / pageSize) || 1} 页
    </div>
    <div class="pagination-controls">
      <button class="btn-secondary btn-sm" on:click={prevPage} disabled={currentPage <= 1 || loading}>
        上一页
      </button>
      <button class="btn-secondary btn-sm" on:click={nextPage} disabled={currentPage >= Math.ceil(total / pageSize) || loading}>
        下一页
      </button>
    </div>
  </div>
</div>

<script lang="ts">
  import { goto } from '$app/navigation';
  import { trpc } from '$lib/trpc/client';
  import { page } from '$app/stores';

  $: user = $page.data?.user;

  let records: any[] = [];
  let total = 0;
  let currentPage = 1;
  let pageSize = 20;
  let loading = false;
  
  let filterStatus = '';
  let filterRisk = '';
  let assignedOnly = false;

  async function loadRecords() {
    loading = true;
    try {
      const result = await trpc.followup.list.query({
        status: filterStatus as any || undefined,
        riskLevel: filterRisk as any || undefined,
        assignedOnly,
        page: currentPage,
        pageSize
      });
      records = result.records;
      total = result.total;
    } catch (e) {
      console.error('加载回访记录失败', e);
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

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pending: '待处理',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    };
    return labels[status] || status;
  }

  function getStatusBadgeClass(status: string) {
    const classes: Record<string, string> = {
      pending: 'badge-warning',
      in_progress: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-secondary'
    };
    return classes[status] || 'badge-secondary';
  }

  function formatDate(date: Date | string) {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  function goToDetail(id: string) {
    goto(`/followup/${id}`);
  }

  function openCreateModal() {
    goto('/followup/new');
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
      loadRecords();
    }
  }

  function nextPage() {
    if (currentPage < Math.ceil(total / pageSize)) {
      currentPage++;
      loadRecords();
    }
  }

  loadRecords();
</script>
