<script lang="ts">
  import { trpc } from '$lib/trpc/client';

  let batches: any[] = [];
  let loading = true;
  let expiringOnly = false;

  async function loadBatches() {
    loading = true;
    try {
      batches = await trpc.drug.getBatches.query({
        expiringSoon: expiringOnly
      });
    } catch (e) {
      console.error('加载批号失败', e);
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

  function isExpiringSoon(date: Date | string) {
    const d = new Date(date);
    const now = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    return d > now && d < threeMonthsLater;
  }

  function isExpired(date: Date | string) {
    const d = new Date(date);
    return d < new Date();
  }

  loadBatches();
</script>

<div class="page-header">
  <div>
    <h1 class="page-title">药品批号</h1>
    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">
      药品批号与效期管理，重点关注近效期药品
    </p>
  </div>
  <div class="page-actions">
    <button class="btn-primary">+ 新增批号</button>
  </div>
</div>

<div class="card" style="margin-bottom: 1rem;">
  <div class="card-body">
    <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem;">
      <input type="checkbox" bind:checked={expiringOnly} on:change={loadBatches} />
      <span>只看近效期（3个月内）</span>
    </label>
  </div>
</div>

<div class="card">
  <div style="overflow-x: auto;">
    <table class="table">
      <thead>
        <tr>
          <th>药品名称</th>
          <th>规格</th>
          <th>批号</th>
          <th>生产日期</th>
          <th>有效期</th>
          <th>库存数量</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        {#if loading}
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              加载中...
            </td>
          </tr>
        {:else if batches.length === 0}
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              暂无批号数据
            </td>
          </tr>
        {:else}
          {#each batches as batch}
            <tr>
              <td style="font-weight: 500;">{batch.drug?.name || '-'}</td>
              <td>{batch.drug?.specification || '-'}</td>
              <td style="font-family: monospace;">{batch.batchNo}</td>
              <td>{formatDate(batch.productionDate)}</td>
              <td>{formatDate(batch.expiryDate)}</td>
              <td>{batch.quantity}</td>
              <td>
                {#if isExpired(batch.expiryDate)}
                  <span class="badge badge-danger">已过期</span>
                {:else if isExpiringSoon(batch.expiryDate)}
                  <span class="badge badge-warning">近效期</span>
                {:else}
                  <span class="badge badge-success">正常</span>
                {/if}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
