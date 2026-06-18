<template>
  <div class="page-container">
    <NSpace justify="space-between" align="center" style="margin-bottom: 16px;">
      <h1 class="page-title" style="margin: 0;">记录池管理</h1>
      <NButton type="primary" @click="showCreateModal = true">新建过户记录</NButton>
    </NSpace>
    <NTabs v-model:value="activeTab" type="line" animated @update:value="handleTabChange">
      <NTabPane name="pending" tab="待处理">
        <RecordTable :records="recordsStore.records" status="pending" @open="openWorkspace" @refresh="refreshList" />
      </NTabPane>
      <NTabPane name="review" tab="待复核">
        <RecordTable :records="recordsStore.records" status="review" @open="openWorkspace" @refresh="refreshList" />
      </NTabPane>
      <NTabPane name="completed" tab="已完成">
        <RecordTable :records="recordsStore.records" status="completed" @open="openWorkspace" @refresh="refreshList" />
      </NTabPane>
    </NTabs>

    <NModal v-model:show="showCreateModal" preset="dialog" title="新建过户记录" positive-text="创建" negative-text="取消" :loading="creating" @positive-click="handleCreate">
      <NForm ref="formRef" :model="createForm" :rules="formRules" label-placement="left" label-width="auto" style="margin-top: 16px;">
        <NFormItem label="合同编号" path="contract_no">
          <NInput v-model:value="createForm.contract_no" placeholder="请输入合同编号" />
        </NFormItem>
        <NFormItem label="买方姓名" path="buyer_name">
          <NInput v-model:value="createForm.buyer_name" placeholder="请输入买方姓名" />
        </NFormItem>
        <NFormItem label="买方身份证号" path="buyer_id_no">
          <NInput v-model:value="createForm.buyer_id_no" placeholder="请输入买方身份证号" />
        </NFormItem>
        <NFormItem label="卖方姓名" path="seller_name">
          <NInput v-model:value="createForm.seller_name" placeholder="请输入卖方姓名" />
        </NFormItem>
        <NFormItem label="卖方身份证号" path="seller_id_no">
          <NInput v-model:value="createForm.seller_id_no" placeholder="请输入卖方身份证号" />
        </NFormItem>
        <NFormItem label="过户税费" path="transfer_tax">
          <NInputNumber v-model:value="createForm.transfer_tax" :min="0" :precision="2" style="width: 100%;" placeholder="请输入金额" />
        </NFormItem>
      </NForm>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'

const recordsStore = useRecordsStore()
const authStore = useAuthStore()
const { message } = useNaiveDiscrete()

const activeTab = ref('pending')
const showCreateModal = ref(false)
const creating = ref(false)
const formRef = ref<FormInst | null>(null)

const createForm = reactive({
  contract_no: '',
  buyer_name: '',
  buyer_id_no: '',
  seller_name: '',
  seller_id_no: '',
  transfer_tax: 0,
})

const formRules: FormRules = {
  contract_no: { required: true, message: '请输入合同编号', trigger: 'blur' },
  buyer_name: { required: true, message: '请输入买方姓名', trigger: 'blur' },
  buyer_id_no: { required: true, message: '请输入买方身份证号', trigger: 'blur' },
  seller_name: { required: true, message: '请输入卖方姓名', trigger: 'blur' },
  seller_id_no: { required: true, message: '请输入卖方身份证号', trigger: 'blur' },
  transfer_tax: { type: 'number', required: true, message: '请输入过户税费', trigger: 'blur' },
}

function handleTabChange(tab: string) {
  activeTab.value = tab
  refreshList()
}

function refreshList() {
  recordsStore.fetchRecords({ status: activeTab.value, page_size: 50 })
}

function openWorkspace(id: string) {
  navigateTo(`/workspace/${id}`)
}

async function handleCreate() {
  try {
    await formRef.value?.validate()
  } catch {
    return false
  }
  creating.value = true
  try {
    const record = await recordsStore.createRecord({
      ...createForm,
      assignee_id: authStore.user?.id || '',
    })
    showCreateModal.value = false
    Object.assign(createForm, {
      contract_no: '',
      buyer_name: '',
      buyer_id_no: '',
      seller_name: '',
      seller_id_no: '',
      transfer_tax: 0,
    })
    message.success('创建成功')
    navigateTo(`/workspace/${record.id}`)
  } catch (e: any) {
    message.error(e.message || '创建失败')
    return false
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  refreshList()
})
</script>
