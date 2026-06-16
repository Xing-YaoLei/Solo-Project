<script lang="ts">
  import { goto } from '$app/navigation';
  import { trpc } from '$lib/trpc/client';

  let currentStep = 1;
  let submitLoading = false;

  let memberSearch = '';
  let members: any[] = [];
  let membersLoading = false;

  let selectedMember: any = null;

  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let nextFollowupDate = '';
  let initialNote = '';
  let reviewOpinion = '';

  let createNewPrescription = false;
  let prescriptionNo = '';
  let hospital = '';
  let doctor = '';
  let issueDate = '';
  let prescriptionStatus: 'clear' | 'unclear' | 'verified' | 'rejected' = 'clear';
  let prescriptionRiskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let prescriptionPhotoUrl = '';
  let prescriptionNotes = '';
  let prescriptionItems: any[] = [];

  let createNewReplenishment = false;
  let replenishmentItems: any[] = [];

  let createNewInsurance = false;
  let insuranceRecordNo = '';
  let insuranceTransactionDate = '';
  let insuranceTotalAmount = 0;
  let insuranceAmount = 0;
  let insuranceSelfPayAmount = 0;

  async function searchMembers() {
    if (!memberSearch.trim()) {
      members = [];
      return;
    }
    membersLoading = true;
    try {
      members = await trpc.followup.getMemberList.query({ search: memberSearch });
    } catch (e) {
      console.error('搜索会员失败', e);
    } finally {
      membersLoading = false;
    }
  }

  function selectMember(member: any) {
    selectedMember = member;
    memberSearch = `${member.name} (${member.memberNo})`;
    members = [];
  }

  function nextStep() {
    if (currentStep < 5) {
      currentStep++;
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
    }
  }

  function addPrescriptionItem() {
    prescriptionItems = [...prescriptionItems, {
      drugName: '',
      specification: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 1
    }];
  }

  function removePrescriptionItem(index: number) {
    prescriptionItems = prescriptionItems.filter((_, i) => i !== index);
  }

  function addReplenishmentItem() {
    replenishmentItems = [...replenishmentItems, {
      drugName: '',
      batchNo: '',
      expiryDate: '',
      quantity: 1,
      unitPrice: 0
    }];
  }

  function removeReplenishmentItem(index: number) {
    replenishmentItems = replenishmentItems.filter((_, i) => i !== index);
  }

  function calcSubtotal(item: any) {
    return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }

  async function submitFollowup() {
    if (!selectedMember) {
      alert('请选择会员');
      return;
    }

    if (createNewInsurance) {
      if (!insuranceRecordNo || !insuranceTransactionDate) {
        alert('请填写医保流水号和交易日期');
        return;
      }
    }

    submitLoading = true;
    try {
      const input: any = {
        memberId: selectedMember.id,
        riskLevel,
        initialNote: initialNote || undefined,
        reviewOpinion: reviewOpinion || undefined
      };

      if (nextFollowupDate) {
        input.nextFollowupDate = new Date(nextFollowupDate);
      }

      if (createNewPrescription) {
        input.prescriptionData = {
          prescriptionNo: prescriptionNo || undefined,
          hospital: hospital || undefined,
          doctor: doctor || undefined,
          issueDate: issueDate ? new Date(issueDate) : undefined,
          status: prescriptionStatus,
          riskLevel: prescriptionRiskLevel,
          photoUrl: prescriptionPhotoUrl || undefined,
          notes: prescriptionNotes || undefined,
          items: prescriptionItems.filter(item => item.drugName.trim())
        };
      }

      if (createNewReplenishment && replenishmentItems.length > 0) {
        const validItems = replenishmentItems.filter(item => item.drugName.trim());
        if (validItems.length > 0) {
          input.replenishmentData = {
            items: validItems.map(item => ({
              drugName: item.drugName,
              batchNo: item.batchNo || undefined,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
              quantity: Number(item.quantity) || 0,
              unitPrice: Math.round((Number(item.unitPrice) || 0) * 100),
              subtotal: Math.round(calcSubtotal(item) * 100)
            }))
          };
        }
      }

      if (createNewInsurance) {
        input.insuranceData = {
          recordNo: insuranceRecordNo,
          transactionDate: new Date(insuranceTransactionDate),
          totalAmount: Math.round(insuranceTotalAmount * 100),
          insuranceAmount: Math.round(insuranceAmount * 100),
          selfPayAmount: Math.round(insuranceSelfPayAmount * 100)
        };
      }

      const result = await trpc.followup.create.mutate(input);

      if (result) {
        goto(`/followup/${result.id}`);
      }
    } catch (e) {
      console.error(e);
      alert('创建回访失败，请重试');
    } finally {
      submitLoading = false;
    }
  }
</script>

<div class="page-header">
  <div>
    <h1 class="page-title">新建回访记录</h1>
    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">
      按步骤完成回访记录创建
    </p>
  </div>
  <div class="page-actions">
    <button class="btn-secondary" on:click={() => goto('/')}>
      ← 返回列表
    </button>
  </div>
  </div>

<div class="card" style="margin-bottom: 1.5rem;">
  <div class="card-body">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      {#each [1, 2, 3, 4, 5] as step}
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
          <div style="width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; background: {currentStep >= step ? 'var(--primary-color)' : 'var(--bg-tertiary)'}; color: {currentStep >= step ? 'white' : 'var(--text-secondary)'}; border: 2px solid {currentStep >= step ? 'var(--primary-color)' : 'var(--border-color)'};">
            {step}
          </div>
          <div style="font-size: 0.75rem; color: {currentStep >= step ? 'var(--primary-color)' : 'var(--text-muted)'}; margin-top: 0.5rem; text-align: center;">
            {step === 1 ? '选择会员' : step === 2 ? '关联处方' : step === 3 ? '关联补货' : step === 4 ? '医保流水' : '完成信息'}
          </div>
        </div>
        {#if step < 5}
          <div style="height: 2px; flex: 1; background: {currentStep > step ? 'var(--primary-color)' : 'var(--border-color)'};"></div>
        {/if}
      {/each}
    </div>
  </div>
</div>

{#if currentStep === 1}
  <div class="card">
    <div class="card-header">
      步骤 1：选择会员
    </div>
    <div class="card-body">
      <div class="form-group">
        <label class="form-label">搜索会员</label>
        <input
          type="text"
          class="form-input"
          placeholder="输入会员姓名、会员号或手机号..."
          bind:value={memberSearch}
          on:input={searchMembers}
        />
      </div>

      {#if membersLoading}
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          搜索中...
        </div>
      {:else if members.length > 0}
        <div style="border: 1px solid var(--border-color); border-radius: var(--border-radius); overflow: hidden;">
          {#each members as member}
            <div
              style="padding: 1rem; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.2s;"
              on:mouseenter={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; }}
              on:mouseleave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              on:click={() => selectMember(member)}
            >
              <div style="font-weight: 500;">{member.name}</div>
              <div style="font-size: 0.875rem; color: var(--text-secondary);">
                会员号：{member.memberNo} · 电话：{member.phone}
              </div>
            </div>
          {/each}
        </div>
      {:else if memberSearch && members.length === 0}
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          未找到匹配的会员
        </div>
      {/if}

      {#if selectedMember}
        <div style="margin-top: 1.5rem; padding: 1rem; background: #f0fdfa; border-radius: var(--border-radius); border-left: 4px solid var(--primary-color);">
          <div style="font-weight: 600; color: var(--primary-dark); margin-bottom: 0.5rem;">
            ✅ 已选择会员
          </div>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">姓名</span>
              <span class="info-value">{selectedMember.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">会员号</span>
              <span class="info-value">{selectedMember.memberNo}</span>
            </div>
            <div class="info-item">
              <span class="info-label">手机号</span>
              <span class="info-value">{selectedMember.phone}</span>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

{#if currentStep === 2}
  <div class="card">
    <div class="card-header">
      步骤 2：关联处方信息（含处方照片）
    </div>
    <div class="card-body">
      <div class="form-group">
        <label style="display: flex; align-items: center; gap: 0.5rem;">
          <input type="checkbox" bind:checked={createNewPrescription} />
          <span>创建新处方并关联</span>
        </label>
      </div>

      {#if createNewPrescription}
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">处方编号</label>
            <input type="text" class="form-input" bind:value={prescriptionNo} placeholder="如：RX202406001" />
          </div>
          <div class="form-group">
            <label class="form-label">开具医院</label>
            <input type="text" class="form-input" bind:value={hospital} placeholder="如：北京协和医院" />
          </div>
          <div class="form-group">
            <label class="form-label">医生</label>
            <input type="text" class="form-input" bind:value={doctor} />
          </div>
          <div class="form-group">
            <label class="form-label">开具日期</label>
            <input type="date" class="form-input" bind:value={issueDate} />
          </div>
          <div class="form-group">
            <label class="form-label">处方状态</label>
            <select class="form-input" bind:value={prescriptionStatus}>
              <option value="clear">清晰</option>
              <option value="unclear">不清晰</option>
              <option value="verified">已复核</option>
              <option value="rejected">已退回</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">风险等级</label>
            <select class="form-input" bind:value={prescriptionRiskLevel}>
              <option value="low">低风险</option>
              <option value="medium">中风险</option>
              <option value="high">高风险</option>
              <option value="critical">极高风险</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">处方照片 URL</label>
          <input type="text" class="form-input" bind:value={prescriptionPhotoUrl} placeholder="https://example.com/prescription.jpg" />
        </div>
        <div class="form-group">
          <label class="form-label">处方备注</label>
          <textarea class="form-input" rows={2} bind:value={prescriptionNotes}></textarea>
        </div>

        <div style="margin-top: 1.5rem;">
          <div class="section-title">
            处方药品明细
            <button class="btn-secondary btn-sm" style="margin-left: auto;" on:click={addPrescriptionItem}>
              + 添加药品
            </button>
          </div>
          {#each prescriptionItems as item, index}
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem;">
              <input type="text" class="form-input" placeholder="药品名称" bind:value={item.drugName} />
              <input type="text" class="form-input" placeholder="规格" bind:value={item.specification} />
              <input type="text" class="form-input" placeholder="用量" bind:value={item.dosage} />
              <input type="text" class="form-input" placeholder="频次" bind:value={item.frequency} />
              <input type="text" class="form-input" placeholder="疗程" bind:value={item.duration} />
              <input type="number" class="form-input" placeholder="数量" bind:value={item.quantity} />
              <button class="btn-danger btn-sm" on:click={() => removePrescriptionItem(index)}>删除</button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

{#if currentStep === 3}
  <div class="card">
    <div class="card-header">
      步骤 3：关联补货单（批号效期）
    </div>
    <div class="card-body">
      <div class="form-group">
        <label style="display: flex; align-items: center; gap: 0.5rem;">
          <input type="checkbox" bind:checked={createNewReplenishment} />
          <span>创建新补货单并关联批号效期</span>
        </label>
      </div>

      {#if createNewReplenishment}
        <div style="margin-top: 1rem;">
          <div class="section-title">
            补货药品明细（含批号效期）
            <button class="btn-secondary btn-sm" style="margin-left: auto;" on:click={addReplenishmentItem}>
              + 添加药品
            </button>
          </div>
          {#each replenishmentItems as item, index}
            <div class="card" style="margin-bottom: 0.75rem;">
              <div class="card-body">
                <div class="form-row">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">药品名称</label>
                    <input type="text" class="form-input" placeholder="如：苯磺酸氨氯地平片" bind:value={item.drugName} />
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">批号</label>
                    <input type="text" class="form-input" placeholder="如：B2401001" bind:value={item.batchNo} />
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">效期</label>
                    <input type="date" class="form-input" bind:value={item.expiryDate} />
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">数量</label>
                    <input type="number" class="form-input" bind:value={item.quantity} min="1" />
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">单价(元)</label>
                    <input type="number" class="form-input" bind:value={item.unitPrice} step="0.01" min="0" />
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">小计(元)</label>
                    <input type="text" class="form-input" value={calcSubtotal(item).toFixed(2)} disabled />
                  </div>
                </div>
                <div style="text-align: right; margin-top: 0.5rem;">
                  <button class="btn-danger btn-sm" on:click={() => removeReplenishmentItem(index)}>删除</button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

{#if currentStep === 4}
  <div class="card">
    <div class="card-header">
      步骤 4：医保流水
    </div>
    <div class="card-body">
      <div class="form-group">
        <label style="display: flex; align-items: center; gap: 0.5rem;">
          <input type="checkbox" bind:checked={createNewInsurance} />
          <span>添加医保流水记录</span>
        </label>
      </div>

      {#if createNewInsurance}
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">流水号 *</label>
            <input type="text" class="form-input" bind:value={insuranceRecordNo} placeholder="如：INS20240615001" />
          </div>
          <div class="form-group">
            <label class="form-label">交易日期 *</label>
            <input type="date" class="form-input" bind:value={insuranceTransactionDate} />
          </div>
          <div class="form-group">
            <label class="form-label">总金额(元)</label>
            <input type="number" class="form-input" bind:value={insuranceTotalAmount} step="0.01" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">医保支付(元)</label>
            <input type="number" class="form-input" bind:value={insuranceAmount} step="0.01" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">自付金额(元)</label>
            <input type="number" class="form-input" bind:value={insuranceSelfPayAmount} step="0.01" min="0" />
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

{#if currentStep === 5}
  <div class="card">
    <div class="card-header">
      步骤 5：完成回访信息
    </div>
    <div class="card-body">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">风险等级</label>
          <select class="form-input" bind:value={riskLevel}>
            <option value="low">低风险</option>
            <option value="medium">中风险</option>
            <option value="high">高风险</option>
            <option value="critical">极高风险</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">下次回访日期</label>
          <input type="date" class="form-input" bind:value={nextFollowupDate} />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">初始沟通备注（将作为沟通备注保存）</label>
        <textarea class="form-input" rows={4} bind:value={initialNote} placeholder="输入本次回访的初始沟通备注，将写入 communication_notes 表..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">复核意见（将标记为 isReview: true）</label>
        <textarea class="form-input" rows={3} bind:value={reviewOpinion} placeholder="如有复核意见请填写，将标记为复核备注..."></textarea>
      </div>

      <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--border-radius);">
        <div style="font-weight: 600; margin-bottom: 0.75rem;">
          📋 信息确认
        </div>
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">会员</span>
            <span class="info-value">{selectedMember?.name || '未选择'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">处方</span>
            <span class="info-value">{createNewPrescription ? `新建(${prescriptionItems.length}种药品)` : '不创建'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">处方照片</span>
            <span class="info-value">{createNewPrescription && prescriptionPhotoUrl ? '已填写' : '无'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">补货单</span>
            <span class="info-value">{createNewReplenishment ? `新建(${replenishmentItems.length}种药品，含批号效期)` : '不创建'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">医保流水</span>
            <span class="info-value">{createNewInsurance ? '已填写' : '无'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">初始备注</span>
            <span class="info-value">{initialNote ? '已填写' : '无'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">复核意见</span>
            <span class="info-value">{reviewOpinion ? '已填写' : '无'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">风险等级</span>
            <span class="badge risk-{riskLevel}">
              {riskLevel === 'low' ? '低风险' : riskLevel === 'medium' ? '中风险' : riskLevel === 'high' ? '高风险' : '极高风险'}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
  <button class="btn-secondary" on:click={prevStep} disabled={currentStep === 1 || submitLoading}>
    上一步
  </button>
  {#if currentStep < 5}
    <button class="btn-primary" on:click={nextStep} disabled={!selectedMember || submitLoading}>
      下一步
    </button>
  {:else}
    <button class="btn-primary" on:click={submitFollowup} disabled={submitLoading || !selectedMember}>
      {submitLoading ? '创建中...' : '✅ 创建回访记录'}
    </button>
  {/if}
</div>
