<script lang="ts">
  import { trpc } from '$lib/trpc/client';

  let prescriptions: any[] = [];
  let total = 0;
  let page = 1;
  let pageSize = 20;
  let loading = false;
  let filterStatus = '';
  let filterRisk = '';

  async function loadPrescriptions() {
    loading = true;
    try {
      const result = await trpc.prescription.list.query({
        status: filterStatus as any || undefined,
        riskLevel: filterRisk as any || undefined,
        page,
        pageSize
      });
      prescriptions = result.records;
      total = result.total;
    } catch (e) {
      console.error('加载处方失败', e);
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
      clear: '清晰',
      unclear: '不清晰',
      verified: '已复核',
      rejected: '已退回'
    };
    return labels[status] || status;
  }

  function handleFilter() {
    page = 1;
    loadPrescriptions();
  }

  function prevPage() {
    if (page > 1) {
      page--;
      loadPrescriptions();
    }
  }

  function nextPage() {
    if (page < Math.ceil(total / pageSize)) {
      page++;
      loadPrescriptions();
    }
  }

  loadPrescriptions();
</script>

<div class="page-header">
  <div>
    <h1 class="page-title">处方管理</h1>
    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">
      处方信息管理，风险等级标识，处方照片查看
    </p>
  </div>
  <div class="page-actions">
    <button class="btn-primary">+ 新增处方</button>
  </div>
</div>

<div class="card" style="margin-bottom: 1rem;">
  <div class="card-body">
    <div class="form-row" style="align-items: end;">
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label">处方状态</label>
        <select class="form-input" bind:value={filterStatus}>
          <option value="">全部状态</option>
          <option value="clear">清晰</option>
          <option value="unclear">不清晰</option>
          <option value="verified">已复核</option>
          <option value="rejected">已退回</option>
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
        <label class="form-label">&nbsp;</label>
        <button class="btn-secondary" on:click={handleFilter} style="width: 100%;">
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
          <th>处方编号</th>
          <th>会员姓名</th>
          <th>开具医院</th>
          <th>风险等级</th>
          <th>处方状态</th>
          <th>开具日期</th>
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
        {:else if prescriptions.length === 0}
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              暂无处方数据
            </td>
          </tr>
        {:else}
          {#each prescriptions as prescription}
            <tr>
              <td style="font-family: monospace;">{prescription.prescriptionNo || '-'}</td>
              <td style="font-weight: 500;">{prescription.member?.name || '-'}</td>
              <td>{prescription.hospital || '-'}</td>
              <td>
                <span class="badge risk-{prescription.riskLevel}">
                  {getRiskLabel(prescription.riskLevel)}
                </span>
              </td>
              <td>
                <span class="badge {prescription.status === 'clear' ? 'badge-success' : prescription.status === 'unclear' ? 'badge-warning' : prescription.status === 'verified' ? 'badge-info' : 'badge-danger'}">
                  {getStatusLabel(prescription.status)}
                </span>
              </td>
              <td>{formatDate(prescription.issueDate)}</td>
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
