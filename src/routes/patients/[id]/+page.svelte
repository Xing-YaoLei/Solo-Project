<script lang="ts">
  import { trpc } from '$lib/trpc/client';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let patient: any = null;
  let activeTab = 'records';
  let loading = true;
  let showNewRecordModal = false;
  let showNewPlanModal = false;
  let showNewFollowupModal = false;
  let showUploadImagingModal = false;
  let showStatusHistoryModal = false;

  let medicalRecords: any[] = [];
  let treatmentPlans: any[] = [];
  let followupTasks: any[] = [];
  let imagingAttachments: any[] = [];
  let statusHistory: any[] = [];

  const tabs = [
    { key: 'records', label: '病历摘要', icon: '📋' },
    { key: 'plans', label: '治疗计划', icon: '💊' },
    { key: 'followups', label: '随访任务', icon: '📅' },
    { key: 'imaging', label: '影像附件', icon: '🖼️' }
  ];

  let newRecord = {
    visitDate: '',
    chiefComplaint: '',
    diagnosis: '',
    treatmentSummary: '',
    status: 'draft' as const
  };

  let newPlan = {
    title: '',
    description: '',
    estimatedCost: '',
    startDate: '',
    endDate: ''
  };

  let newFollowup = {
    type: 'visit' as const,
    scheduledDate: '',
    notes: ''
  };

  let newImaging = {
    type: 'xray' as const,
    fileName: '',
    fileUrl: '',
    description: ''
  };

  $: patientId = $page.params.id;

  async function loadPatient() {
    loading = true;
    try {
      patient = await trpc.patient.get.query({ id: patientId });
      loadMedicalRecords();
      loadTreatmentPlans();
      loadFollowupTasks();
      loadImagingAttachments();
    } finally {
      loading = false;
    }
  }

  async function loadMedicalRecords() {
    const result: any = await trpc.medicalRecord.listByPatient.query({
      patientId,
      page: 1,
      pageSize: 50
    });
    medicalRecords = result.items;
  }

  async function loadTreatmentPlans() {
    const result: any = await trpc.treatmentPlan.listByPatient.query({
      patientId,
      page: 1,
      pageSize: 50
    });
    treatmentPlans = result.items;
  }

  async function loadFollowupTasks() {
    const result: any = await trpc.followupTask.list.query({
      patientId,
      page: 1,
      pageSize: 50
    });
    followupTasks = result.items;
  }

  async function loadImagingAttachments() {
    const result: any = await trpc.imagingAttachment.listByPatient.query({
      patientId,
      page: 1,
      pageSize: 50
    });
    imagingAttachments = result.items;
  }

  async function handleCreateRecord(e: Event) {
    e.preventDefault();
    try {
      await trpc.medicalRecord.create.mutate({
        patientId,
        ...newRecord
      });
      showNewRecordModal = false;
      newRecord = {
        visitDate: '',
        chiefComplaint: '',
        diagnosis: '',
        treatmentSummary: '',
        status: 'draft'
      };
      loadMedicalRecords();
    } catch (err: any) {
        alert(err.message);
      }
  }

  async function handleCreatePlan(e: Event) {
    e.preventDefault();
    try {
      await trpc.treatmentPlan.create.mutate({
        patientId,
        title: newPlan.title,
        description: newPlan.description,
        estimatedCost: newPlan.estimatedCost ? parseInt(newPlan.estimatedCost) : undefined,
        startDate: newPlan.startDate || undefined,
        endDate: newPlan.endDate || undefined
      });
      showNewPlanModal = false;
      newPlan = {
        title: '',
        description: '',
        estimatedCost: '',
        startDate: '',
        endDate: ''
      };
      loadTreatmentPlans();
    } catch (err: any) {
        alert(err.message);
      }
  }

  async function handleCreateFollowup(e: Event) {
    e.preventDefault();
    try {
      await trpc.followupTask.create.mutate({
        patientId,
        type: newFollowup.type,
        scheduledDate: newFollowup.scheduledDate,
        notes: newFollowup.notes || undefined
      });
      showNewFollowupModal = false;
      newFollowup = {
        type: 'visit',
        scheduledDate: '',
        notes: ''
      };
      loadFollowupTasks();
    } catch (err: any) {
        alert(err.message);
      }
  }

  async function handleUploadImaging(e: Event) {
    e.preventDefault();
    try {
      await trpc.imagingAttachment.create.mutate({
        patientId,
        type: newImaging.type,
        fileName: newImaging.fileName,
        fileUrl: newImaging.fileUrl,
        description: newImaging.description || undefined
      });
      showUploadImagingModal = false;
      newImaging = {
        type: 'xray',
        fileName: '',
        fileUrl: '',
        description: ''
      };
      loadImagingAttachments();
    } catch (err: any) {
        alert(err.message);
      }
  }

  async function viewStatusHistory(recordId: string) {
    statusHistory = await trpc.medicalRecord.getStatusHistory.query({ recordId });
    showStatusHistoryModal = true;
  }

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      draft: '草稿',
      reviewing: '审核中',
      confirmed: '已确认',
      archived: '已归档'
    };
    return map[status] || status;
  };

  const statusClass = (status: string) => {
    const map: Record<string, string> = {
      draft: 'badge-gray',
      reviewing: 'badge-warning',
      confirmed: 'badge-success',
      archived: 'badge-gray'
    };
    return map[status] || 'badge-gray';
  };

  const treatmentStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      planned: '计划中',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    };
    return map[status] || status;
  };

  const treatmentStatusClass = (status: string) => {
    const map: Record<string, string> = {
      planned: 'badge-info',
      in_progress: 'badge-warning',
      completed: 'badge-success',
      cancelled: 'badge-gray'
    };
    return map[status] || 'badge-gray';
  };

  const followupStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: '待执行',
      completed: '已完成',
      missed: '已爽约',
      cancelled: '已取消'
    };
    return map[status] || status;
  };

  const followupStatusClass = (status: string) => {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      completed: 'badge-success',
      missed: 'badge-danger',
      cancelled: 'badge-gray'
    };
    return map[status] || 'badge-gray';
  };

  const followupTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      phone: '电话随访',
      visit: '门诊复诊',
      imaging: '影像复查',
      consultation: '咨询回访'
    };
    return map[type] || type;
  };

  const imagingTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      xray: 'X光片',
      cbct: 'CBCT',
      intraoral: '口内照',
      panoramic: '全景片',
      other: '其他'
    };
    return map[type] || type;
  };

  onMount(() => {
    loadPatient();
  });
</script>

{#if loading}
  <div class="flex items-center justify-center h-full">
    <div class="text-gray-500">加载中...</div>
  </div>
{:else if patient}
  <div class="p-8">
    <button
      class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      on:click={() => goto('/patients')}
    >
      ← 返回患者列表
    </button>

    <div class="card mb-6">
      <div class="card-body">
      <div class="flex items-start justify-between">
        <div class="flex items-center">
          <div class="w-16 h-16 bg-dental-100 rounded-full flex items-center justify-center">
            <span class="text-dental-700 font-bold text-xl">{patient.name.charAt(0)}</span>
          </div>
          <div class="ml-4">
            <h1 class="text-2xl font-bold text-gray-900">{patient.name}</h1>
            <div class="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span>编号：{patient.patientNo}</span>
              <span class={`badge ${patient.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                {patient.status === 'active' ? '在诊' : patient.status === 'inactive' ? '非活跃' : '已归档'}
              </span>
            </div>
          </div>
        </div>
        <button class="btn-secondary">编辑信息</button>
      </div>
      <div class="grid grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-100">
        <div>
          <p class="text-xs text-gray-500">性别</p>
          <p class="text-sm font-medium text-gray-900 mt-1">{patient.gender || '-'}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">出生日期</p>
          <p class="text-sm font-medium text-gray-900 mt-1">{patient.birthDate || '-'}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">联系电话</p>
          <p class="text-sm font-medium text-gray-900 mt-1">{patient.phone || '-'}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">身份证号</p>
          <p class="text-sm font-medium text-gray-900 mt-1">{patient.idCard || '-'}</p>
        </div>
      </div>
      {#if patient.address || patient.remarks}
        <div class="mt-4 pt-4 border-t border-gray-100">
          <p class="text-xs text-gray-500 mb-1">地址</p>
          <p class="text-sm text-gray-700">{patient.address || '-'}</p>
        </div>
        {#if patient.remarks}
          <div class="mt-4">
            <p class="text-xs text-gray-500 mb-1">备注</p>
            <p class="text-sm text-gray-700">{patient.remarks}</p>
          </div>
        {/if}
      {/if}
    </div>
    </div>

    <div class="card">
      <div class="border-b border-gray-100">
        <nav class="flex px-6 -mb-px">
          {#each tabs as item}
            <button
              class={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === item.key
                  ? 'border-dental-600 text-dental-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              on:click={() => (activeTab = item.key)}
            >
              <span class="mr-1.5">{item.icon}</span>
              {item.label}
            </button>
          {/each}
        </nav>
      </div>

      <div class="p-6">
        {#if activeTab === 'records'}
          <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">病历记录</h3>
        <button class="btn-primary" on:click={() => (showNewRecordModal = true)}>
          ➕ 新建病历
        </button>
          </div>

          {#if medicalRecords.length === 0}
            <div class="text-center py-12 text-gray-500">暂无病历记录</div>
          {:else}
            <div class="space-y-4">
              {#each medicalRecords as record}
                <div class="border border-gray-200 rounded-lg p-4 hover:border-dental-200 transition-colors">
                  <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-3">
                    <p class="font-medium text-gray-900">
                      {record.visitDate} 就诊</p>
                    <span class={`badge ${statusClass(record.status)}`}>
                      {statusLabel(record.status)}
                    </span>
                  </div>
                  {#if record.chiefComplaint}
                    <p class="text-sm text-gray-600 mt-2">
                      <span class="text-gray-400">主诉：</span>{record.chiefComplaint}
                    </p>
                  {/if}
                  {#if record.diagnosis}
                    <p class="text-sm text-gray-600 mt-1">
                      <span class="text-gray-400">诊断：</span>{record.diagnosis}
                    </p>
                  {/if}
                </div>
                <button
                  class="text-sm text-dental-600 hover:text-dental-800"
                  on:click={() => viewStatusHistory(record.id)}
                >
                  状态历史
                </button>
              </div>
            </div>
          {/each}
        </div>
          {/if}
        {:else if activeTab === 'plans'}
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">治疗计划</h3>
            <button class="btn-primary" on:click={() => (showNewPlanModal = true)}>
              ➕ 新建计划
            </button>
          </div>

          {#if treatmentPlans.length === 0}
            <div class="text-center py-12 text-gray-500">暂无治疗计划</div>
          {:else}
            <div class="space-y-4">
              {#each treatmentPlans as plan}
                <div class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-3">
                        <p class="font-medium text-gray-900">{plan.title}</p>
                        <span class={`badge ${treatmentStatusClass(plan.status)}`}>
                          {treatmentStatusLabel(plan.status)}
                        </span>
                      </div>
                      {#if plan.description}
                        <p class="text-sm text-gray-600 mt-2">{plan.description}</p>
                      {/if}
                      <div class="flex gap-6 mt-3 text-xs text-gray-500">
                        {#if plan.estimatedCost}
                          <span>预估费用：¥{plan.estimatedCost}</span>
                        {/if}
                        {#if plan.startDate}
                          <span>开始日期：{plan.startDate}</span>
                        {/if}
                        {#if plan.endDate}
                          <span>结束日期：{plan.endDate}</span>
                        {/if}
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {:else if activeTab === 'followups'}
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">随访任务</h3>
            <button class="btn-primary" on:click={() => (showNewFollowupModal = true)}>
              ➕ 创建随访
            </button>
          </div>

          {#if followupTasks.length === 0}
            <div class="text-center py-12 text-gray-500">暂无随访任务</div>
          {:else}
            <div class="space-y-4">
              {#each followupTasks as task}
                <div class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="flex items-center gap-3">
                        <p class="font-medium text-gray-900">{followupTypeLabel(task.type)}</p>
                        <span class={`badge ${followupStatusClass(task.status)}`}>
                          {followupStatusLabel(task.status)}
                        </span>
                      </div>
                      <p class="text-sm text-gray-500 mt-1">
                        计划时间：{new Date(task.scheduledDate).toLocaleString()}
                      </p>
                      {#if task.notes}
                        <p class="text-sm text-gray-600 mt-2">{task.notes}</p>
                      {/if}
                    </div>
                    {#if task.status === 'pending'}
                      <div class="flex gap-2">
                        <button
                          class="text-sm text-green-600 hover:text-green-800"
                          on:click={async () => {
                            await trpc.followupTask.markCompleted.mutate({ id: task.id });
                            loadFollowupTasks();
                          }}
                        >
                          标记完成
                        </button>
                        <button
                          class="text-sm text-red-600 hover:text-red-800"
                          on:click={async () => {
                          if (confirm('确定标记为爽约？这将生成异常单')) {
                            await trpc.followupTask.markMissed.mutate({
                              id: task.id,
                              createException: true
                            });
                            loadFollowupTasks();
                          }
                        }}
                        >
                          标记爽约
                        </button>
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {:else if activeTab === 'imaging'}
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">影像附件</h3>
            <button class="btn-primary" on:click={() => (showUploadImagingModal = true)}>
              ⬆️ 上传影像
            </button>
          </div>

          {#if imagingAttachments.length === 0}
            <div class="text-center py-12 text-gray-500">暂无影像附件</div>
          {:else}
            <div class="grid grid-cols-4 gap-4">
              {#each imagingAttachments as img}
                <div class="border border-gray-200 rounded-lg overflow-hidden">
                  <div class="aspect-square bg-gray-100 flex items-center justify-center">
                    <span class="text-4xl">🖼️</span>
                  </div>
                  <div class="p-3">
                    <p class="text-sm font-medium text-gray-900 truncate">{img.fileName}</p>
                    <div class="flex items-center justify-between mt-1">
                      <span class="badge badge-info">{imagingTypeLabel(img.type)}</span>
                      <span class="text-xs text-gray-500">
                        {new Date(img.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {#if img.description}
                      <p class="text-xs text-gray-500 mt-2 truncate">{img.description}</p>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if showNewRecordModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">新建病历</h2>
          <button class="text-gray-400 hover:text-gray-600" on:click={() => (showNewRecordModal = false)}>✕</button>
        </div>
      </div>
      <form on:submit={handleCreateRecord} class="p-6 space-y-4">
        <div>
          <label class="label">就诊日期 *</label>
          <input type="date" bind:value={newRecord.visitDate} class="input-field" required />
        </div>
        <div>
          <label class="label">主诉</label>
          <textarea bind:value={newRecord.chiefComplaint} class="input-field" rows="2"></textarea>
        </div>
        <div>
          <label class="label">诊断</label>
          <textarea bind:value={newRecord.diagnosis} class="input-field" rows="2"></textarea>
        </div>
        <div>
          <label class="label">治疗摘要</label>
          <textarea bind:value={newRecord.treatmentSummary} class="input-field" rows="3"></textarea>
        </div>
        <div>
          <label class="label">状态</label>
          <select bind:value={newRecord.status} class="input-field">
            <option value="draft">草稿</option>
            <option value="reviewing">审核中</option>
            <option value="confirmed">已确认</option>
          </select>
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button type="button" class="btn-secondary" on:click={() => (showNewRecordModal = false)}>取消</button>
          <button type="submit" class="btn-primary">创建</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if showNewPlanModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">新建治疗计划</h2>
          <button class="text-gray-400 hover:text-gray-600" on:click={() => (showNewPlanModal = false)}>✕</button>
        </div>
      </div>
      <form on:submit={handleCreatePlan} class="p-6 space-y-4">
        <div>
          <label class="label">计划标题 *</label>
          <input type="text" bind:value={newPlan.title} class="input-field" required />
        </div>
        <div>
          <label class="label">计划描述</label>
          <textarea bind:value={newPlan.description} class="input-field" rows="3"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">预估费用（元）</label>
            <input type="number" bind:value={newPlan.estimatedCost} class="input-field" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">开始日期</label>
            <input type="date" bind:value={newPlan.startDate} class="input-field" />
          </div>
          <div>
            <label class="label">结束日期</label>
            <input type="date" bind:value={newPlan.endDate} class="input-field" />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button type="button" class="btn-secondary" on:click={() => (showNewPlanModal = false)}>取消</button>
          <button type="submit" class="btn-primary">创建</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if showNewFollowupModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">创建随访任务</h2>
          <button class="text-gray-400 hover:text-gray-600" on:click={() => (showNewFollowupModal = false)}>✕</button>
        </div>
      </div>
      <form on:submit={handleCreateFollowup} class="p-6 space-y-4">
        <div>
          <label class="label">随访类型 *</label>
          <select bind:value={newFollowup.type} class="input-field">
            <option value="phone">电话随访</option>
            <option value="visit">门诊复诊</option>
            <option value="imaging">影像复查</option>
            <option value="consultation">咨询回访</option>
          </select>
        </div>
        <div>
          <label class="label">计划时间 *</label>
          <input type="datetime-local" bind:value={newFollowup.scheduledDate} class="input-field" required />
        </div>
        <div>
          <label class="label">备注</label>
          <textarea bind:value={newFollowup.notes} class="input-field" rows="3"></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button type="button" class="btn-secondary" on:click={() => (showNewFollowupModal = false)}>取消</button>
          <button type="submit" class="btn-primary">创建</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if showUploadImagingModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">上传影像</h2>
          <button class="text-gray-400 hover:text-gray-600" on:click={() => (showUploadImagingModal = false)}>✕</button>
        </div>
      </div>
      <form on:submit={handleUploadImaging} class="p-6 space-y-4">
        <div>
          <label class="label">影像类型 *</label>
          <select bind:value={newImaging.type} class="input-field">
            <option value="xray">X光片</option>
            <option value="cbct">CBCT</option>
            <option value="intraoral">口内照</option>
            <option value="panoramic">全景片</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div>
          <label class="label">文件名 *</label>
          <input type="text" bind:value={newImaging.fileName} class="input-field" required />
        </div>
        <div>
          <label class="label">文件地址 *</label>
          <input type="text" bind:value={newImaging.fileUrl} class="input-field" placeholder="https://..." required />
        </div>
        <div>
          <label class="label">描述</label>
          <textarea bind:value={newImaging.description} class="input-field" rows="3"></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button type="button" class="btn-secondary" on:click={() => (showUploadImagingModal = false)}>取消</button>
          <button type="submit" class="btn-primary">上传</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if showStatusHistoryModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">状态变更历史</h2>
          <button class="text-gray-400 hover:text-gray-600" on:click={() => (showStatusHistoryModal = false)}>✕</button>
        </div>
      </div>
      <div class="p-6">
        {#if statusHistory.length === 0}
          <div class="text-center py-8 text-gray-500">暂无状态变更记录</div>
        {:else}
          <div class="space-y-4">
            {#each statusHistory as item}
              <div class="flex gap-4">
                <div class="flex flex-col items-center">
                  <div class="w-3 h-3 rounded-full bg-dental-500"></div>
                  {#if item !== statusHistory[statusHistory.length - 1]}
                    <div class="w-0.5 flex-1 bg-gray-200 my-1"></div>
                  {/if}
                </div>
                <div class="flex-1 pb-4">
                  <div class="flex items-center gap-2">
                    {#if item.fromStatus}
                      <span class={`badge ${statusClass(item.fromStatus)}`}>{statusLabel(item.fromStatus)}</span>
                      <span class="text-gray-400">→</span>
                    {/if}
                    <span class={`badge ${statusClass(item.toStatus)}`}>{statusLabel(item.toStatus)}</span>
                  </div>
                  <p class="text-sm text-gray-500 mt-1">
                    {new Date(item.changedAt).toLocaleString()}
                  </p>
                  {#if item.remark}
                    <p class="text-sm text-gray-600 mt-2">{item.remark}</p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
