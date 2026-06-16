<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { trpc } from '$lib/trpc/client';

  let record: any = null;
  let loading = true;
  let activeTab = 'basic';
  
  let noteContent = '';
  let isReviewNote = false;
  let addingNote = false;

  $: id = $page.params.id;
  $: user = $page.data?.user;
  $: isManager = user && ['admin', 'manager'].includes(user.role);

  async function loadRecord() {
    if (!id) return;
    loading = true;
    try {
      record = await trpc.followup.get.query(id);
    } catch (e) {
      console.error('加载回访记录失败', e);
    } finally {
      loading = false;
    }
  }

  async function addNote() {
    if (!noteContent.trim() || !id) return;
    
    addingNote = true;
    try {
      await trpc.followup.addNote.mutate({
        followupRecordId: id,
        content: noteContent,
        isReview: isReviewNote
      });
      noteContent = '';
      isReviewNote = false;
      await loadRecord();
    } catch (e) {
      alert('添加备注失败');
    } finally {
      addingNote = false;
    }
  }

  async function updateStatus(status: string) {
    if (!id) return;
    try {
      await trpc.followup.update.mutate({
        id,
        status: status as any
      });
      await loadRecord();
    } catch (e) {
      alert('更新状态失败');
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

  function formatDate(date: Date | string | null) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  function formatDateTime(date: Date | string | null) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  loadRecord();
</script>

{#if loading}
  <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
    加载中...
  </div>
{:else if !record}
  <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
    记录不存在
  </div>
{:else}
  <div class="page-header">
    <div style="display: flex; align-items: center; gap: 1rem;">
      <button class="btn-secondary btn-sm" on:click={() => goto('/')}>
        ← 返回列表
      </button>
      <div>
        <h1 class="page-title" style="margin-bottom: 0.25rem;">
          回访详情 - {record.member?.name || '未知会员'}
        </h1>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span class="badge risk-{record.riskLevel}">
            {getRiskLabel(record.riskLevel)}
          </span>
          <span class="badge {record.status === 'completed' ? 'badge-success' : record.status === 'in_progress' ? 'badge-info' : 'badge-warning'}">
            {getStatusLabel(record.status)}
          </span>
        </div>
      </div>
    </div>
    <div class="page-actions">
      {#if record.status === 'pending'}
        <button class="btn-secondary" on:click={() => updateStatus('in_progress')}>
          开始处理
        </button>
      {/if}
      {#if record.status === 'in_progress'}
        <button class="btn-primary" on:click={() => updateStatus('completed')}>
          完成回访
        </button>
      {/if}
    </div>
  </div>

  <div class="tabs">
    <div 
      class="tab {activeTab === 'basic' ? 'active' : ''}" 
      on:click={() => activeTab = 'basic'}
    >
      基础信息
    </div>
    <div 
      class="tab {activeTab === 'member' ? 'active' : ''}" 
      on:click={() => activeTab = 'member'}
    >
      会员档案
    </div>
    <div 
      class="tab {activeTab === 'prescription' ? 'active' : ''}" 
      on:click={() => activeTab = 'prescription'}
    >
      处方信息
    </div>
    <div 
      class="tab {activeTab === 'replenishment' ? 'active' : ''}" 
      on:click={() => activeTab = 'replenishment'}
    >
      补货单
    </div>
    <div 
      class="tab {activeTab === 'insurance' ? 'active' : ''}" 
      on:click={() => activeTab = 'insurance'}
    >
      医保流水
    </div>
    <div 
      class="tab {activeTab === 'notes' ? 'active' : ''}" 
      on:click={() => activeTab = 'notes'}
    >
      沟通备注
      {#if record.notes?.length > 0}
        <span style="background: var(--primary-color); color: white; border-radius: 9999px; padding: 0 0.375rem; font-size: 0.7rem; margin-left: 0.25rem;">
          {record.notes.length}
        </span>
      {/if}
    </div>
  </div>

  {#if activeTab === 'basic'}
    <div class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">回访基本信息</div>
      <div class="card-body">
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">会员姓名</span>
            <span class="info-value">{record.member?.name || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">会员手机号</span>
            <span class="info-value">{record.member?.phone || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">会员编号</span>
            <span class="info-value">{record.member?.memberNo || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">风险等级</span>
            <span class="badge risk-{record.riskLevel}" style="width: fit-content;">
              {getRiskLabel(record.riskLevel)}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">状态</span>
            <span class="info-value">{getStatusLabel(record.status)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">负责人</span>
            <span class="info-value">{record.assignedUser?.name || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value">{formatDateTime(record.createdAt)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">上次更新</span>
            <span class="info-value">{formatDateTime(record.updatedAt)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">回访时间</span>
            <span class="info-value">{formatDateTime(record.followupDate)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">下次回访</span>
            <span class="info-value">{formatDateTime(record.nextFollowupDate)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">用药依从性</span>
            <span class="info-value">{record.medicationAdherence === true ? '良好' : record.medicationAdherence === false ? '不佳' : '未评估'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">不良反应</span>
            <span class="info-value">{record.adverseReaction ? '有' : '无'}</span>
          </div>
        </div>
        
        {#if record.reviewOpinion}
          <div style="margin-top: 1.5rem; padding: 1rem; background: #f0fdfa; border-radius: var(--border-radius); border-left: 4px solid var(--primary-color);">
            <div style="font-weight: 600; margin-bottom: 0.5rem; color: var(--primary-dark);">
              📋 复核意见
            </div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              {record.reviewOpinion}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if activeTab === 'member'}
    <div class="card">
      <div class="card-header">会员档案</div>
      <div class="card-body">
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">会员编号</span>
            <span class="info-value">{record.member?.memberNo || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">姓名</span>
            <span class="info-value">{record.member?.name || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">手机号</span>
            <span class="info-value">{record.member?.phone || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">身份证号</span>
            <span class="info-value">{record.member?.idCard || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">性别</span>
            <span class="info-value">{record.member?.gender || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">出生日期</span>
            <span class="info-value">{formatDate(record.member?.birthday)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">医保卡号</span>
            <span class="info-value">{record.member?.insuranceCardNo || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">住址</span>
            <span class="info-value">{record.member?.address || '-'}</span>
          </div>
        </div>
        
        <div style="margin-top: 1.5rem;">
          <div class="section-title">过敏史</div>
          <p style="font-size: 0.875rem; color: var(--text-secondary); padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--border-radius);">
            {record.member?.allergyHistory || '暂无记录'}
          </p>
        </div>
        
        <div style="margin-top: 1.5rem;">
          <div class="section-title">既往病史</div>
          <p style="font-size: 0.875rem; color: var(--text-secondary); padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--border-radius);">
            {record.member?.medicalHistory || '暂无记录'}
          </p>
        </div>
      </div>
    </div>
  {/if}

  {#if activeTab === 'prescription'}
    <div class="card">
      <div class="card-header">处方信息</div>
      <div class="card-body">
        {#if record.prescription}
          <div class="info-list" style="margin-bottom: 1.5rem;">
            <div class="info-item">
              <span class="info-label">处方编号</span>
              <span class="info-value">{record.prescription.prescriptionNo || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">开具医院</span>
              <span class="info-value">{record.prescription.hospital || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">医生</span>
              <span class="info-value">{record.prescription.doctor || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">开具日期</span>
              <span class="info-value">{formatDate(record.prescription.issueDate)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">处方状态</span>
              <span class="badge {record.prescription.status === 'clear' ? 'badge-success' : record.prescription.status === 'unclear' ? 'badge-warning' : record.prescription.status === 'verified' ? 'badge-info' : 'badge-danger'}">
                {record.prescription.status === 'clear' ? '清晰' : record.prescription.status === 'unclear' ? '不清晰' : record.prescription.status === 'verified' ? '已复核' : '已退回'}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">风险等级</span>
              <span class="badge risk-{record.prescription.riskLevel}">
                {getRiskLabel(record.prescription.riskLevel)}
              </span>
            </div>
          </div>
          
          {#if record.prescription.photoUrl}
            <div style="margin-bottom: 1.5rem;">
              <div class="section-title">处方照片</div>
              <img src={record.prescription.photoUrl} alt="处方照片" style="max-width: 100%; border-radius: var(--border-radius); border: 1px solid var(--border-color);" />
            </div>
          {/if}
          
          <div>
            <div class="section-title">处方药品</div>
            <table class="table">
              <thead>
                <tr>
                  <th>药品名称</th>
                  <th>规格</th>
                  <th>用法用量</th>
                  <th>频次</th>
                  <th>疗程</th>
                  <th>数量</th>
                </tr>
              </thead>
              <tbody>
                {#each record.prescription.items || [] as item}
                  <tr>
                    <td>{item.drugName}</td>
                    <td>{item.specification || '-'}</td>
                    <td>{item.dosage || '-'}</td>
                    <td>{item.frequency || '-'}</td>
                    <td>{item.duration || '-'}</td>
                    <td>{item.quantity || '-'}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          
          {#if record.prescription.notes}
            <div style="margin-top: 1.5rem;">
              <div class="section-title">处方备注</div>
              <p style="font-size: 0.875rem; color: var(--text-secondary); padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--border-radius);">
                {record.prescription.notes}
              </p>
            </div>
          {/if}
        {:else}
          <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
            暂无处方信息
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if activeTab === 'replenishment'}
    <div class="card">
      <div class="card-header">补货单</div>
      <div class="card-body">
        {#if record.replenishmentOrder}
          <div class="info-list" style="margin-bottom: 1.5rem;">
            <div class="info-item">
              <span class="info-label">补货单号</span>
              <span class="info-value">{record.replenishmentOrder.orderNo}</span>
            </div>
            <div class="info-item">
              <span class="info-label">状态</span>
              <span class="badge badge-info">{record.replenishmentOrder.status}</span>
            </div>
            <div class="info-item">
              <span class="info-label">总金额</span>
              <span class="info-value">¥{((record.replenishmentOrder.totalAmount || 0) / 100).toFixed(2)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">创建时间</span>
              <span class="info-value">{formatDateTime(record.replenishmentOrder.createdAt)}</span>
            </div>
          </div>
          
          <div>
            <div class="section-title">药品明细</div>
            <table class="table">
              <thead>
                <tr>
                  <th>药品名称</th>
                  <th>批号</th>
                  <th>效期</th>
                  <th>数量</th>
                  <th>单价</th>
                  <th>小计</th>
                </tr>
              </thead>
              <tbody>
                {#each record.replenishmentOrder.items || [] as item}
                  <tr>
                    <td>{item.drug?.name || '-'}</td>
                    <td>{item.batch?.batchNo || '-'}</td>
                    <td>{item.batch?.expiryDate ? formatDate(item.batch.expiryDate) : '-'}</td>
                    <td>{item.quantity}</td>
                    <td>¥{(item.unitPrice / 100).toFixed(2)}</td>
                    <td>¥{(item.subtotal / 100).toFixed(2)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
            暂无补货单
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if activeTab === 'insurance'}
    <div class="card">
      <div class="card-header">医保流水</div>
      <div class="card-body">
        {#if record.insuranceRecord}
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">流水号</span>
              <span class="info-value">{record.insuranceRecord.recordNo}</span>
            </div>
            <div class="info-item">
              <span class="info-label">交易时间</span>
              <span class="info-value">{formatDateTime(record.insuranceRecord.transactionDate)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">总金额</span>
              <span class="info-value">¥{((record.insuranceRecord.totalAmount || 0) / 100).toFixed(2)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">医保支付</span>
              <span class="info-value" style="color: var(--success-color); font-weight: 600;">
                ¥{((record.insuranceRecord.insuranceAmount || 0) / 100).toFixed(2)}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">自付金额</span>
              <span class="info-value">¥{((record.insuranceRecord.selfPayAmount || 0) / 100).toFixed(2)}</span>
            </div>
          </div>
        {:else}
          <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
            暂无医保流水记录
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if activeTab === 'notes'}
    <div class="card">
      <div class="card-header">沟通备注与复核意见</div>
      <div class="card-body">
        <div style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-color);">
          <textarea 
            class="form-input" 
            placeholder="输入沟通备注内容..."
            rows={3}
            bind:value={noteContent}
          ></textarea>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
            {#if isManager}
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem;">
                <input type="checkbox" bind:checked={isReviewNote} />
                <span style="color: var(--info-color);">标记为复核意见</span>
              </label>
            {:else}
              <span></span>
            {/if}
            <button class="btn-primary btn-sm" on:click={addNote} disabled={addingNote || !noteContent.trim()}>
              {addingNote ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
        
        {#if record.notes?.length > 0}
          <div class="timeline">
            {#each record.notes as note}
              <div class="timeline-item {note.isReview ? 'review' : ''}">
                <div class="timeline-header">
                  <span class="timeline-author">
                    {note.createdBy?.name || '未知'}
                    {#if note.isReview}
                      <span style="background: var(--info-color); color: white; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; margin-left: 0.5rem;">
                        复核意见
                      </span>
                    {/if}
                  </span>
                  <span class="timeline-time">{formatDateTime(note.createdAt)}</span>
                </div>
                <div class="timeline-content">{note.content}</div>
              </div>
            {/each}
          </div>
        {:else}
          <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
            暂无沟通备注
          </div>
        {/if}
      </div>
    </div>
  {/if}
{/if}
