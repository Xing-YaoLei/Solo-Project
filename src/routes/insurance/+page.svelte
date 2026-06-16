<script lang="ts">
  import { trpc } from '$lib/trpc/client';

  let records: any[] = [];
  let total = 0;
  let page = 1;
  let pageSize = 20;
  let loading = false;

  async function loadRecords() {
    loading = true;
    try {
      const result = await trpc.insurance.list.query({
        page,
        pageSize
      });
      records = result.records;
      total = result.total;
    } catch (e) {
      console.error('加载医保流水失败', e);
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

  function prevPage() {
    if (page > 1) {
      page--;
      loadRecords();
    }
  }

  function nextPage() {
    if (page < Math.ceil(total / pageSize)) {
      page++;
      loadRecords();
    }
  }

  loadRecords();
</script>

<div class="page-header">
  <div>
    <h1 class="page-title">医保流水</h1>
    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">
      医保交易流水记录查询
    </p>
  </div>
  <div class="page-actions">
    <button class="btn-primary">+ 新增记录</button>
  </div>
</div>

<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-label">总交易笔数</div>
    <div class="stat-value">{total}</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">总金额</div>
    <div class="stat-value" style="font-size: 1.5rem;">
      {formatAmount(records.reduce((sum, r) => sum + (r.totalAmount || 0), 0))}
    </div>
  </div>
  <div class="stat-card">
    <div class="stat-label">医保支付</div>
    <div class="stat-value" style="font-size: 1.5rem; color: var(--success-color);">
      {formatAmount(records.reduce((sum, r) => sum + (r.insuranceAmount || 0), 0))}
    </div>
  </div>
  <div class="stat-card">
    <div class="stat-label">自付金额</div>
    <div class="stat-value" style="font-size: 1.5rem;">
      {formatAmount(records.reduce((sum, r) => sum + (r.selfPayAmount || 0), 0))}
    </div>
  </div>
</div>

<div class="card">
  <div style="overflow-x: auto;">
    <table class="table">
      <thead>
        <tr>
          <th>流水号</th>
          <th>会员姓名</th>
          <th>交易时间</th>
          <th>总金额</th>
          <th>医保支付</th>
          <th>自付金额</th>
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
              暂无医保流水记录
            </td>
          </tr>
        {:else}
          {#each records as record}
            <tr>
              <td style="font-family: monospace;">{record.recordNo}</td>
              <td style="font-weight: 500;">{record.member?.name || '-'}</td>
              <td>{formatDate(record.transactionDate)}</td>
              <td style="font-weight: 600;">{formatAmount(record.totalAmount)}</td>
              <td style="color: var(--success-color);">{formatAmount(record.insuranceAmount)}</td>
              <td>{formatAmount(record.selfPayAmount)}</td>
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
