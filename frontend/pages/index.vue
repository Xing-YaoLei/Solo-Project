<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1 class="dashboard-title">工作台</h1>
      <NText depth="3">{{ greeting }}，{{ authStore.user?.username || '用户' }}</NText>
    </div>

    <div class="stat-grid">
      <div class="stat-card" :class="'stat-card--' + item.key" v-for="item in statCards" :key="item.key" @click="item.route && navigateTo(item.route)">
        <div class="stat-card__border"></div>
        <div class="stat-card__body">
          <div class="stat-card__icon-wrap">
            <NIcon :size="28" :color="item.color">
              <component :is="item.icon" />
            </NIcon>
          </div>
          <div class="stat-card__content">
            <div class="stat-card__value">{{ stats[item.key as keyof typeof stats] }}</div>
            <div class="stat-card__label">{{ item.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <NGrid :cols="24" :x-gap="20" :y-gap="20" style="margin-top: 24px;">
      <NGridItem span="0:24 1024:8">
        <NCard title="快捷操作" class="panel-card">
          <NSpace vertical :size="12">
            <NButton type="primary" block size="large" @click="showCreateModal = true">
              <template #icon><NIcon><AddCircleOutline /></NIcon></template>
              新建过户记录
            </NButton>
            <NButton block size="large" secondary @click="navigateTo('/records/pending')">
              <template #icon><NIcon><TimeOutline /></NIcon></template>
              查看待处理
            </NButton>
            <NButton block size="large" secondary type="error" @click="navigateTo('/exceptions')">
              <template #icon><NIcon><AlertCircleOutline /></NIcon></template>
              处理异常项
            </NButton>
          </NSpace>
        </NCard>
      </NGridItem>

      <NGridItem span="0:24 1024:16">
        <NCard title="最近记录" class="panel-card">
          <template #header-extra>
            <NButton text type="primary" @click="navigateTo('/records')">查看全部</NButton>
          </template>
          <NEmpty v-if="recentRecords.length === 0" description="暂无记录" />
          <div v-else class="record-list">
            <div v-for="record in recentRecords" :key="record.id" class="record-item" @click="navigateTo(`/workspace/${record.id}`)">
              <div class="record-item__left">
                <NText class="record-item__contract">{{ record.contract_no }}</NText>
                <NTag :type="statusTagType(record.status)" size="small" round>{{ statusLabel(record.status) }}</NTag>
              </div>
              <div class="record-item__middle">
                <NText depth="3">{{ record.buyer_name }}</NText>
                <NIcon :size="14" color="#94A3B8"><ArrowForwardOutline /></NIcon>
                <NText depth="3">{{ record.seller_name }}</NText>
              </div>
              <div class="record-item__right">
                <NText depth="3" style="font-size: 13px;">{{ formatTime(record.created_at) }}</NText>
              </div>
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <NModal v-model:show="showCreateModal" preset="card" title="新建过户记录" style="width: 560px;" :mask-closable="false">
      <NForm ref="createFormRef" :model="createForm" :rules="createRules" label-placement="left" label-width="100px">
        <NFormItem label="合同编号" path="contract_no">
          <NInput v-model:value="createForm.contract_no" placeholder="请输入合同编号" />
        </NFormItem>
        <NFormItem label="买方姓名" path="buyer_name">
          <NInput v-model:value="createForm.buyer_name" placeholder="请输入买方姓名" />
        </NFormItem>
        <NFormItem label="买方身份证号" path="buyer_id_no">
          <NInput v-model:value="createForm.buyer_id_no" placeholder="请输入身份证号" />
        </NFormItem>
        <NFormItem label="卖方姓名" path="seller_name">
          <NInput v-model:value="createForm.seller_name" placeholder="请输入卖方姓名" />
        </NFormItem>
        <NFormItem label="卖方身份证号" path="seller_id_no">
          <NInput v-model:value="createForm.seller_id_no" placeholder="请输入身份证号" />
        </NFormItem>
        <NFormItem label="过户税费" path="transfer_tax">
          <NInputNumber v-model:value="createForm.transfer_tax" :min="0" :precision="2" style="width: 100%;" placeholder="请输入金额">
            <template #prefix>¥</template>
          </NInputNumber>
        </NFormItem>
        <NFormItem v-if="authStore.user?.role !== 'specialist'" label="负责人" path="assignee">
          <NSelect
            v-model:value="createForm.assignee"
            :options="assigneeOptions"
            placeholder="请选择负责人"
            clearable
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showCreateModal = false">取消</NButton>
          <NButton type="primary" :loading="creating" @click="handleCreate">创建</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { format } from 'date-fns'
import {
  TimeOutline,
  EyeOutline,
  AlertCircleOutline,
  CheckmarkCircleOutline,
  AddCircleOutline,
  ArrowForwardOutline,
} from '@vicons/ionicons5'
import type { FormInst, FormRules, SelectOption } from 'naive-ui'
import type { TransferRecord, TransferRecordCreate, UserSummary } from '~/types'

const api = useApi()
const recordsStore = useRecordsStore()
const authStore = useAuthStore()
const { message } = useNaiveDiscrete()

const stats = reactive({
  pending_count: 0,
  review_count: 0,
  exception_count: 0,
  completed_this_month: 0,
})

const statCards = [
  { key: 'pending_count', label: '待处理', color: '#F59E0B', icon: TimeOutline, route: '/records/pending' },
  { key: 'review_count', label: '待复核', color: '#3B82F6', icon: EyeOutline, route: '/records/review' },
  { key: 'exception_count', label: '异常项', color: '#EF4444', icon: AlertCircleOutline, route: '/exceptions' },
  { key: 'completed_this_month', label: '本月完成', color: '#10B981', icon: CheckmarkCircleOutline, route: undefined },
]

const recentRecords = ref<TransferRecord[]>([])
const showCreateModal = ref(false)
const creating = ref(false)
const createFormRef = ref<FormInst | null>(null)
const assigneeOptions = ref<SelectOption[]>([])

const createForm = reactive({
  contract_no: '',
  buyer_name: '',
  buyer_id_no: '',
  seller_name: '',
  seller_id_no: '',
  transfer_tax: null as number | null,
  assignee: null as string | number | null,
})

async function loadAssigneeOptions() {
  try {
    const users = await api.getUsers({ role: 'specialist' })
    assigneeOptions.value = users.map(u => ({ label: u.username, value: u.id }))
  } catch {}
}

watch(showCreateModal, async (val) => {
  if (val && authStore.user?.role !== 'specialist') {
    await loadAssigneeOptions()
  }
})

const createRules: FormRules = {
  contract_no: { required: true, message: '请输入合同编号', trigger: 'blur' },
  buyer_name: { required: true, message: '请输入买方姓名', trigger: 'blur' },
  buyer_id_no: { required: true, message: '请输入买方身份证号', trigger: 'blur' },
  seller_name: { required: true, message: '请输入卖方姓名', trigger: 'blur' },
  seller_id_no: { required: true, message: '请输入卖方身份证号', trigger: 'blur' },
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

function statusTagType(status: string) {
  const map: Record<string, string> = { pending: 'warning', review: 'info', completed: 'success', exception: 'error' }
  return map[status] || 'default'
}

function statusLabel(status: string) {
  const map: Record<string, string> = { pending: '待处理', review: '待复核', completed: '已完成', exception: '异常' }
  return map[status] || status
}

function formatTime(dt: string) {
  if (!dt) return ''
  return format(new Date(dt), 'MM-dd HH:mm')
}

async function loadDashboard() {
  try {
    const data = await api.get<{ pending_count: number; review_count: number; exception_count: number; completed_this_month: number }>('/dashboard/stats/')
    Object.assign(stats, data)
  } catch {}
  try {
    await recordsStore.fetchRecords({ page_size: 5 })
    recentRecords.value = recordsStore.records.slice(0, 5)
  } catch {}
}

async function handleCreate() {
  try {
    await createFormRef.value?.validate()
  } catch {
    return
  }
  creating.value = true
  try {
    const payload: TransferRecordCreate = {
      contract_no: createForm.contract_no,
      buyer_name: createForm.buyer_name,
      buyer_id_no: createForm.buyer_id_no,
      seller_name: createForm.seller_name,
      seller_id_no: createForm.seller_id_no,
      transfer_tax: createForm.transfer_tax ?? 0,
    }
    if (authStore.user?.role === 'specialist') {
      payload.assignee = authStore.userId ?? undefined
    } else if (createForm.assignee) {
      payload.assignee = createForm.assignee
    }
    const record = await recordsStore.createRecord(payload)
    showCreateModal.value = false
    Object.assign(createForm, { contract_no: '', buyer_name: '', buyer_id_no: '', seller_name: '', seller_id_no: '', transfer_tax: null, assignee: null })
    message.success('过户记录创建成功')
    navigateTo(`/workspace/${record.id}`)
  } catch (e: any) {
    message.error(e.message || '创建失败')
  } finally {
    creating.value = false
  }
}

onMounted(loadDashboard)
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.dashboard-header {
  margin-bottom: 28px;
}

.dashboard-title {
  font-size: 26px;
  font-weight: 700;
  color: #1E293B;
  margin: 0 0 4px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1024px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .stat-grid { grid-template-columns: 1fr; }
}

.stat-card {
  position: relative;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-card__border {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.stat-card--pending_count .stat-card__border { background: #F59E0B; }
.stat-card--review_count .stat-card__border { background: #3B82F6; }
.stat-card--exception_count .stat-card__border { background: #EF4444; }
.stat-card--completed_this_month .stat-card__border { background: #10B981; }

.stat-card__body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 20px 20px 24px;
}

.stat-card__icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card--pending_count .stat-card__icon-wrap { background: #FEF3C7; }
.stat-card--review_count .stat-card__icon-wrap { background: #DBEAFE; }
.stat-card--exception_count .stat-card__icon-wrap { background: #FEE2E2; }
.stat-card--completed_this_month .stat-card__icon-wrap { background: #D1FAE5; }

.stat-card__value {
  font-size: 28px;
  font-weight: 700;
  color: #1E293B;
  line-height: 1.2;
}

.stat-card__label {
  font-size: 13px;
  color: #64748B;
  margin-top: 2px;
}

.panel-card {
  height: 100%;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #F1F5F9;
  cursor: pointer;
  transition: background-color 0.15s;
  gap: 12px;
}

.record-item:last-child {
  border-bottom: none;
}

.record-item:hover {
  background-color: #F8FAFC;
  margin: 0 -20px;
  padding: 12px 20px;
}

.record-item__left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-shrink: 1;
}

.record-item__contract {
  font-weight: 600;
  color: #1E293B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.record-item__middle {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.record-item__right {
  flex-shrink: 0;
}
</style>
