<script lang="ts">
  import { trpc } from '$lib/trpc/client';

  let orders: any[] = [];
  let total = 0;
  let page = 1;
  let pageSize = 20;
  let loading = false;
  let filterStatus = '';

  async function loadOrders() {
    loading = true;
    try {
      const result = await trpc.replenishment.list.query({
        status: filterStatus || undefined,
        page,
        pageSize
      });
      orders = result.records;
      total = result.total;
    } catch (e) {
      console.error('加载补货单失败', e);
    } finally {
      loading = false;
    }
  }

  function formatDate(date: Date | string | null) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  function formatAmount(amount: number) {
    return '¥' + ((amount || 0) / 100).toFixed(2);
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      completed: '已完成',
      cancelled: '已取消'
    };
    return labels[status] || status;
  }

  function handleFilter() {
    page = 1;
    loadOrders();
  }

  function prevPage() {
    if (page > 1) {
      page--;
      loadOrders();
    }
  }

  function nextPage() {
    if (page < Math.ceil(total / pageSize)) {
      page++;
      loadOrders();
    }
  }

  loadOrders();
</script>

<div class="page-header">
  <div>
    <h1 class="page-title">补货单</h1>
    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">
      药品补货单管理，跟踪补货进度
    </p>
  </div>
  <div class="page-actions">
    <button class="btn-primary">+ 新建补货单</button>
  </div>
</div>

<div class="card" style="margin-bottom: 1rem;">
  <div class="card-body">
    <div style="display: flex; gap: 0.75rem; max-width: 400px; align-items: end;">
      <div style="flex: 1;">
        <label class="form-label">状态筛选</label>
        <select class="form-input" bind:value={filterStatus}>
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>
      <button class="btn-secondary" on:click={handleFilter}>
        筛选
      </button>
    </div>
  </div>
</div>

<div class="card">
  <div style="overflow-x: auto;">
    <table class="table">
      <thead>
        <tr>
          <th>补货单号</th>
          <th>会员姓名</th>
          <th>状态</th>
          <th>总金额</th>
          <th>创建时间</th>
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
        {:else if orders.length === 0}
          <tr>
            <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              暂无补货单
            </td>
          </tr>
        {:else}
          {#each orders as order}
            <tr>
              <td style="font-family: monospace;">{order.orderNo}</td>
              <td style="font-weight: 500;">{order.member?.name || '-'}</td>
              <td>
                <span class="badge {order.status === 'completed' ? 'badge-success' : order.status === 'processing' ? 'badge-info' : order.status === 'cancelled' ? 'badge-secondary' : 'badge-warning'}">
                  {getStatusLabel(order.status)}
                </span>
              </td>
              <td style="font-weight: 600;">{formatAmount(order.totalAmount || 0)}</td>
              <td>{formatDate(order.createdAt)}</td>
              <td>
                <button class="btn-secondary btn-sm">
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
      共 {total} 条记录，第 {page} / {Math.ceil(total / pageSize) || 1} 页
    </div>
    <div class="pagination-controls">
      <button class="btn-secondary btn-sm" on:click={prevPage} disabled={page <= 1 || loading}>
        上一页
      </button>
      <button class="btn-secondary btn-sm" on:click={nextPage} disabled={page >= Math.ceil(total / pageSize) || loading}>
        下一页
      </button>
    </div>
  </div>
</div>
