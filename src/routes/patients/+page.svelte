<script lang="ts">
  import { trpc } from '$lib/trpc/client';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let patients: any[] = [];
  let total = 0;
  let pageNum = 1;
  let pageSize = 20;
  let totalPages = 0;
  let search = '';
  let status = '';
  let loading = true;
  let showNewModal = false;

  let newPatient = {
    patientNo: '',
    name: '',
    gender: '',
    birthDate: '',
    phone: '',
    idCard: '',
    address: '',
    remarks: ''
  };

  $: {
    if ($page.url.searchParams.get('new') === 'true') {
      showNewModal = true;
    }
  }

  async function loadPatients() {
    loading = true;
    try {
      const result: any = await trpc.patient.list.query({
        page: pageNum,
        pageSize,
        search: search || undefined,
        status: status || undefined
      });
      patients = result.items;
      total = result.total;
      totalPages = result.totalPages;
    } finally {
      loading = false;
    }
  }

  async function handleSearch() {
    pageNum = 1;
    loadPatients();
  }

  async function handleCreatePatient(e: Event) {
    e.preventDefault();
    try {
      await trpc.patient.create.mutate(newPatient);
      showNewModal = false;
      newPatient = {
        patientNo: '',
        name: '',
        gender: '',
        birthDate: '',
        phone: '',
        idCard: '',
        address: '',
        remarks: ''
      };
      loadPatients();
      goto('/patients');
    } catch (err: any) {
      alert(err.message);
    }
  }

  function viewPatient(id: string) {
    goto(`/patients/${id}`);
  }

  function closeModal() {
    showNewModal = false;
    goto('/patients');
  }

  $: if (pageNum) {
    loadPatients();
  }

  onMount(() => {
    loadPatients();
  });
</script>

<div class="p-8">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">患者档案</h1>
      <p class="mt-1 text-gray-500">管理所有患者的基本信息和病历</p>
    </div>
    <button class="btn-primary" on:click={() => (showNewModal = true)}>
      ➕ 新建患者
    </button>
  </div>

  <div class="card mb-6">
    <div class="card-body">
      <div class="flex gap-4 items-end">
        <div class="flex-1">
          <label class="label">搜索</label>
          <input
            type="text"
            bind:value={search}
            class="input-field"
            placeholder="搜索患者姓名、编号、电话"
            on:keydown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div class="w-40">
          <label class="label">状态</label>
          <select bind:value={status} class="input-field" on:change={handleSearch}>
            <option value="">全部状态</option>
            <option value="active">在诊</option>
            <option value="inactive">非活跃</option>
            <option value="archived">已归档</option>
          </select>
        </div>
        <button class="btn-secondary" on:click={handleSearch}>搜索</button>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">患者编号</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">性别</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">电话</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#if loading}
            <tr>
              <td colspan="7" class="px-6 py-12 text-center text-gray-500">加载中...</td>
            </tr>
          {:else if patients.length === 0}
            <tr>
              <td colspan="7" class="px-6 py-12 text-center text-gray-500">暂无患者数据</td>
            </tr>
          {:else}
            {#each patients as patient}
              <tr class="hover:bg-gray-50 cursor-pointer" on:click={() => viewPatient(patient.id)}>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-dental-600">{patient.patientNo}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.gender || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.phone || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class={`badge ${patient.status === 'active' ? 'badge-success' : patient.status === 'inactive' ? 'badge-warning' : 'badge-gray'}`}>
                    {patient.status === 'active' ? '在诊' : patient.status === 'inactive' ? '非活跃' : '已归档'}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(patient.createdAt).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button class="text-dental-600 hover:text-dental-900" on:click|stopPropagation={() => viewPatient(patient.id)}>
                    查看
                  </button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    {#if totalPages > 1}
      <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          共 {total} 条，第 {pageNum} / {totalPages} 页
        </div>
        <div class="flex gap-2">
          <button
            class="btn-secondary text-sm"
            disabled={pageNum <= 1}
            on:click={() => (pageNum--)}
          >
            上一页
          </button>
          <button
            class="btn-secondary text-sm"
            disabled={pageNum >= totalPages}
            on:click={() => (pageNum++)}
          >
            下一页
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

{#if showNewModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">新建患者</h2>
          <button class="text-gray-400 hover:text-gray-600" on:click={closeModal}>✕</button>
        </div>
      </div>
      <form on:submit={handleCreatePatient} class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">患者编号 *</label>
            <input type="text" bind:value={newPatient.patientNo} class="input-field" required />
          </div>
          <div>
            <label class="label">姓名 *</label>
            <input type="text" bind:value={newPatient.name} class="input-field" required />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">性别</label>
            <select bind:value={newPatient.gender} class="input-field">
              <option value="">请选择</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div>
            <label class="label">出生日期</label>
            <input type="date" bind:value={newPatient.birthDate} class="input-field" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">电话</label>
            <input type="tel" bind:value={newPatient.phone} class="input-field" />
          </div>
          <div>
            <label class="label">身份证号</label>
            <input type="text" bind:value={newPatient.idCard} class="input-field" />
          </div>
        </div>
        <div>
          <label class="label">地址</label>
          <input type="text" bind:value={newPatient.address} class="input-field" />
        </div>
        <div>
          <label class="label">备注</label>
          <textarea bind:value={newPatient.remarks} class="input-field" rows="3"></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button type="button" class="btn-secondary" on:click={closeModal}>取消</button>
          <button type="submit" class="btn-primary">创建</button>
        </div>
      </form>
    </div>
  </div>
{/if}
