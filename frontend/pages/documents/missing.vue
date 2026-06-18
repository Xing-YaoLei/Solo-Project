<template>
  <div class="page-container p-6">
    <NSpin :show="loading">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold">资料缺失筛选</h1>
          <p class="text-gray-500 text-sm mt-1">快速定位并处理资料缺失的车辆 · 共 {{ total }} 条记录</p>
        </div>
      </div>

      <NGrid :cols="5" x-gap="16" y-gap="16" class="mb-6">
        <NGi>
          <NCard :bordered="false" size="small" class="stat-card">
            <div class="flex items-center justify-between mb-2">
              <span class="text-gray-500 text-sm">总缺失数</span>
              <div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <NIcon :component="AlertOutlined" style="color: #f5222d" />
              </div>
            </div>
            <div class="flex items-end gap-2">
              <NNumberAnimation :from="0" :to="stats.total_missing" :active="loaded" class="text-2xl font-bold text-red-600" />
              <span class="text-gray-500 text-sm mb-1">台</span>
            </div>
          </NCard>
        </NGi>
        <NGi v-for="s in docStats" :key="s.type">
          <NCard :bordered="false" size="small" class="stat-card">
            <div class="flex items-center justify-between mb-2">
              <span class="text-gray-500 text-sm">缺{{ s.label }}</span>
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" :style="{ background: s.bg }">
                <NIcon :component="FileProtectOutlined" :style="{ color: s.color }" />
              </div>
            </div>
            <div class="flex items-end gap-2">
              <NNumberAnimation :from="0" :to="s.count" :active="loaded" class="text-2xl font-bold" :style="{ color: s.color }" />
              <span class="text-gray-500 text-sm mb-1">台</span>
            </div>
          </NCard>
        </NGi>
      </NGrid>

      <NCard :bordered="false" size="small" class="mb-4">
        <NForm inline :label-width="80" label-placement="left">
          <NFormItem label="品牌">
            <NSelect
              v-model:value="filters.brand"
              :options="brandOptions"
              placeholder="全部品牌"
              clearable
              :max-tag-count="1"
              style="width: 160px"
            />
          </NFormItem>
          <NFormItem label="状态">
            <NSelect
              v-model:value="filters.status"
              :options="statusOptions"
              placeholder="全部状态"
              clearable
              style="width: 140px"
            />
          </NFormItem>
          <NFormItem label="缺失证件">
            <NSelect
              v-model:value="filters.doc_types"
              :options="docTypeOptions"
              multiple
              placeholder="证件类型"
              clearable
              :max-tag-count="2"
              style="width: 220px"
            />
          </NFormItem>
          <NFormItem label="库存天数">
            <NInputNumber
              v-model:value="filters.min_days"
              placeholder="最小"
              :min="0"
              style="width: 110px"
            />
            <span class="mx-2 text-gray-400">-</span>
            <NInputNumber
              v-model:value="filters.max_days"
              placeholder="最大"
              :min="0"
              style="width: 110px"
            />
          </NFormItem>
          <NFormItem>
            <NSpace>
              <NButton type="primary" @click="search">
                <NIcon :component="SearchOutlined" class="mr-1" />
                搜索
              </NButton>
              <NButton @click="resetFilters">
                <NIcon :component="ReloadOutlined" class="mr-1" />
                重置
              </NButton>
            </NSpace>
          </NFormItem>
        </NForm>
      </NCard>

      <NCard :bordered="false" size="small">
        <template #header>
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-3">
              <span class="font-medium">车辆列表</span>
              <span v-if="selectedRows.length > 0" class="text-sm text-gray-500">
                已选 <NTag size="small" type="info" :bordered="false">{{ selectedRows.length }}</NTag> 项
              </span>
            </div>
            <NSpace>
              <NButton
                type="warning"
                :disabled="selectedRows.length === 0"
                @click="batchNotify"
              >
                <NIcon :component="BellOutlined" class="mr-1" />
                批量通知
              </NButton>
              <NButton
                type="primary"
                ghost
                :disabled="selectedRows.length === 0"
                @click="showAssignModal = true"
              >
                <NIcon :component="UserOutlined" class="mr-1" />
                批量分配
              </NButton>
              <NButton @click="loadData">
                <NIcon :component="ReloadOutlined" class="mr-1" />
                刷新
              </NButton>
            </NSpace>
          </div>
        </template>

        <NDataTable
          :columns="columns"
          :data="dataList"
          :loading="loading"
          :pagination="pagination"
          :row-key="(row: any) => row.id"
          :checked-row-keys="checkedRowKeys"
          :on-update:checked-row-keys="onCheckedRowKeysChange"
          :single="false"
          size="small"
          :bordered="false"
          :single-line="false"
        />
      </NCard>
    </NSpin>

    <NModal v-model:show="showUploadModal" preset="card" title="上传缺失证件" style="width: 560px">
      <template v-if="currentRow">
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
          <div class="font-medium mb-1">{{ currentRow.brand }} {{ currentRow.model }} {{ currentRow.year }}款</div>
          <div class="text-sm text-gray-500">车牌: {{ currentRow.plate_number }} · VIN: {{ currentRow.vin.slice(-8) }}</div>
        </div>
        <NForm label-placement="left" label-width="100px">
          <NFormItem label="证件类型" required>
            <NSelect
              v-model:value="uploadForm.doc_type"
              :options="getMissingDocTypeOptions(currentRow)"
              placeholder="请选择要上传的证件类型"
            />
          </NFormItem>
          <NFormItem label="资料类别">
            <NSelect
              v-model:value="uploadForm.category"
              :options="categoryOptions"
              placeholder="资料类别"
              style="width: 200px"
            />
          </NFormItem>
          <NFormItem label="证件标题" required>
            <NInput v-model:value="uploadForm.title" placeholder="请输入文件标题" />
          </NFormItem>
          <NFormItem label="选择文件" required>
            <NUpload
              :max="1"
              accept=".pdf,.jpg,.jpeg,.png"
              :show-file-list="true"
              :default-file-list="uploadForm.file ? [uploadForm.file] : []"
              @change="onUploadFileChange"
              :custom-request="() => {}"
            >
              <NButton>
                <NIcon :component="UploadOutlined" class="mr-1" />
                点击选择文件
              </NButton>
            </NUpload>
          </NFormItem>
          <NFormItem label="描述说明">
            <NInput v-model:value="uploadForm.description" type="textarea" :rows="2" placeholder="可填写描述说明" />
          </NFormItem>
        </NForm>
      </template>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="closeUploadModal">取消</NButton>
          <NButton type="primary" :loading="uploadLoading" @click="submitUpload">提交上传</NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal v-model:show="showSupplementModal" preset="card" title="标记已补充" style="width: 480px">
      <template v-if="currentRow">
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
          <div class="font-medium mb-1">{{ currentRow.brand }} {{ currentRow.model }} {{ currentRow.year }}款</div>
          <div class="text-sm text-gray-500">车牌: {{ currentRow.plate_number }}</div>
        </div>
        <NForm label-placement="left" label-width="100px">
          <NFormItem label="补充证件" required>
            <NCheckboxGroup v-model:value="supplementForm.doc_types">
              <NSpace wrap>
                <NCheckbox
                  v-for="t in getMissingDocTypeOptions(currentRow)"
                  :key="t.value"
                  :value="t.value"
                >
                  {{ t.label }}
                </NCheckbox>
              </NSpace>
            </NCheckboxGroup>
          </NFormItem>
          <NFormItem label="补充说明">
            <NInput v-model:value="supplementForm.remark" type="textarea" :rows="3" placeholder="请填写补充方式或来源说明" />
          </NFormItem>
        </NForm>
      </template>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showSupplementModal = false">取消</NButton>
          <NButton type="primary" :loading="supplementLoading" @click="submitSupplement">确认标记</NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal v-model:show="showAssignModal" preset="card" title="批量分配处理人" style="width: 480px">
      <NForm label-placement="left" label-width="100px">
        <NFormItem label="已选车辆">
          <NTag type="info" :bordered="false" size="small">{{ selectedRows.length }} 台</NTag>
        </NFormItem>
        <NFormItem label="分配给" required>
          <NSelect
            v-model:value="assignForm.handler"
            :options="handlerOptions"
            placeholder="请选择处理人员"
            filterable
          />
        </NFormItem>
        <NFormItem label="通知方式">
          <NCheckboxGroup v-model:value="assignForm.notify_types">
            <NSpace>
              <NCheckbox value="system">系统消息</NCheckbox>
              <NCheckbox value="sms">短信通知</NCheckbox>
              <NCheckbox value="email">邮件通知</NCheckbox>
            </NSpace>
          </NCheckboxGroup>
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="assignForm.remark" type="textarea" :rows="2" placeholder="可填写处理要求" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showAssignModal = false">取消</NButton>
          <NButton type="primary" :loading="assignLoading" @click="submitAssign">确认分配</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, h } from 'vue'
import {
  NIcon, NTag, NSpace, NButton, NAvatar,
  useMessage, useDialog, useNotification,
} from 'naive-ui'
import {
  AlertOutlined, FileProtectOutlined, SearchOutlined, ReloadOutlined,
  BellOutlined, UserOutlined, UploadOutlined, CarOutlined,
  CalendarOutlined, EditOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  EyeOutlined, SendOutlined, CheckOutlined, ClockCircleOutlined,
} from '@vicons/antd'
import type { DocumentType, VehicleStatus, SimpleUser } from '~/types'
import dayjs from 'dayjs'

definePageMeta({ layout: 'default' })

interface MissingVehicleItem {
  id: number
  vin: string
  plate_number: string
  brand: string
  model: string
  year: number
  color: string
  status: VehicleStatus
  status_display: string
  missing_count: number
  missing_types: DocumentType[]
  missing_doc_types?: DocumentType[]
  inventory_days: number
  appraiser_info: SimpleUser | null
  appraiser?: SimpleUser | null
  created_at: string
}

interface MissingDocStats {
  total_missing: number
  by_type: Record<DocumentType, number>
}

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const notification = useNotification()

const loading = ref(false)
const loaded = ref(false)
const total = ref(0)
const dataList = ref<MissingVehicleItem[]>([])
const selectedRows = ref<MissingVehicleItem[]>([])
const checkedRowKeys = ref<(string | number)[]>([])

const filters = reactive({
  brand: null as string | null,
  status: null as VehicleStatus | null,
  doc_types: [] as DocumentType[],
  min_days: null as number | null,
  max_days: null as number | null,
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const stats = ref<MissingDocStats>({
  total_missing: 0,
  by_type: { registration_cert: 0, driving_license: 0, insurance: 0, maintenance_record: 0, keys: 0, invoice: 0, other: 0 },
})

const docTypeMap: Record<DocumentType, { label: string; color: string; bg: string }> = {
  registration_cert: { label: '登记证书', color: '#f5222d', bg: '#fff1f0' },
  driving_license: { label: '行驶证', color: '#fa8c16', bg: '#fff7e6' },
  insurance: { label: '保险单', color: '#faad14', bg: '#fffbe6' },
  maintenance_record: { label: '保养记录', color: '#13c2c2', bg: '#e6fffb' },
  keys: { label: '车钥匙', color: '#722ed1', bg: '#f9f0ff' },
  invoice: { label: '购车发票', color: '#eb2f96', bg: '#fff0f6' },
  other: { label: '其他', color: '#8c8c8c', bg: '#f5f5f5' },
}

const categoryOptions = [
  { label: '车辆档案', value: 'vehicle_archive' },
  { label: '检测报告', value: 'inspection' },
  { label: '整备资料', value: 'preparation' },
  { label: '试驾资料', value: 'testdrive' },
  { label: '金融资料', value: 'finance' },
  { label: '其他', value: 'other' },
]

const docStats = computed(() => {
  const order: DocumentType[] = ['registration_cert', 'driving_license', 'insurance', 'maintenance_record', 'keys']
  return order.map(t => ({
    type: t,
    label: docTypeMap[t].label,
    color: docTypeMap[t].color,
    bg: docTypeMap[t].bg,
    count: stats.value.by_type[t] || 0,
  })).slice(0, 4)
})

const brandOptions = [
  { label: '宝马', value: '宝马' },
  { label: '奔驰', value: '奔驰' },
  { label: '奥迪', value: '奥迪' },
  { label: '丰田', value: '丰田' },
  { label: '本田', value: '本田' },
  { label: '大众', value: '大众' },
  { label: '特斯拉', value: '特斯拉' },
  { label: '比亚迪', value: '比亚迪' },
]

const statusOptions = [
  { label: '待评估', value: 'pending_evaluation' },
  { label: '待检测', value: 'pending_inspection' },
  { label: '待整备', value: 'pending_preparation' },
  { label: '待试驾', value: 'pending_testdrive' },
  { label: '待审核', value: 'pending_review' },
  { label: '已上架', value: 'listed' },
]

const docTypeOptions: { label: string; value: DocumentType }[] = Object.entries(docTypeMap).map(([k, v]) => ({
  label: v.label,
  value: k as DocumentType,
}))

const handlerOptions = ref<{ label: string; value: number }[]>([])

async function loadHandlerOptions() {
  try {
    const { $api } = useNuxtApp()
    const users = await $api.get<any, any>('/users/')
    const list = users?.results || users || []
    handlerOptions.value = list
      .filter((u: any) => ['appraiser', 'sales', 'manager'].includes(u.role))
      .map((u: any) => ({
        label: `${u.first_name || ''}${u.last_name || ''}${u.role ? ' (' + ({ appraiser: '评估师', sales: '销售', manager: '店长' } as any)[u.role] + ')' : ''}`,
        value: u.id,
      }))
  } catch (e: any) {
    message.error(e.message || '加载处理人列表失败')
  }
}

const showUploadModal = ref(false)
const showSupplementModal = ref(false)
const showAssignModal = ref(false)
const currentRow = ref<MissingVehicleItem | null>(null)

const uploadLoading = ref(false)
const supplementLoading = ref(false)
const assignLoading = ref(false)

const uploadForm = reactive({
  doc_type: null as DocumentType | null,
  category: 'vehicle_archive' as string,
  title: '',
  description: '',
  file: null as any,
})

const supplementForm = reactive({
  doc_types: [] as DocumentType[],
  remark: '',
})

const assignForm = reactive({
  handler: null as number | null,
  notify_types: ['system'] as string[],
  remark: '',
})

const statusType = (s: string) => {
  const m: Record<string, any> = {
    pending_evaluation: 'default', pending_inspection: 'warning', pending_preparation: 'warning',
    pending_testdrive: 'warning', pending_review: 'error', listed: 'success',
    sold: 'info', off_shelf: 'default', rejected: 'error',
  }
  return m[s] || 'default'
}

const inventoryDaysStyle = (d: number) => {
  if (d >= 30) return { color: '#f5222d', bg: '#fff1f0' }
  if (d >= 15) return { color: '#fa8c16', bg: '#fff7e6' }
  return { color: '#18a058', bg: '#f6ffed' }
}

const columns = [
  {
    title: '车辆信息', key: 'vehicle', width: 220,
    render: (row: MissingVehicleItem) => h('div', { class: 'flex items-center gap-3' }, [
      h('div', { class: 'w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0' }, [
        h(NIcon, { component: CarOutlined, size: 20, style: { color: '#2080f0' } }),
      ]),
      h('div', { class: 'min-w-0' }, [
        h('div', { class: 'font-medium truncate' }, `${row.brand} ${row.model} ${row.year}款`),
        h('div', { class: 'text-xs text-gray-400 mt-0.5 truncate' }, `${row.plate_number} · ${row.vin.slice(-8)}`),
      ]),
    ]),
  },
  {
    title: '阶段状态', key: 'status', width: 110,
    render: (row: MissingVehicleItem) => h(NTag, { size: 'small', type: statusType(row.status), bordered: false }, () => row.status_display || row.status),
  },
  {
    title: '缺失证件', key: 'missing', minWidth: 260,
    render: (row: MissingVehicleItem) => {
      const missingTypes = row.missing_types || row.missing_doc_types || []
      return h('div', null, [
        h('div', { class: 'flex items-center gap-1 mb-1.5' }, [
          h(NIcon, { component: ExclamationCircleOutlined, size: 14, style: { color: '#f5222d' } }),
          h('span', { class: 'text-xs font-medium text-red-600' }, `缺失 ${missingTypes.length} 项`),
        ]),
        h(NSpace, { size: 4, wrap: true }, () =>
          missingTypes.map((t, i) => {
            const cfg = docTypeMap[t] || { label: t, color: '#8c8c8c', bg: '#f5f5f5' }
            return h(NTag, {
              key: i, size: 'small', bordered: false,
              style: { backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` },
            }, () => [
              h(NIcon, { component: AlertOutlined, size: 10, class: 'mr-0.5' }),
              cfg.label,
            ])
          })
        ),
      ])
    },
  },
  {
    title: '库存天数', key: 'inventory_days', width: 110, align: 'center' as const,
    render: (row: MissingVehicleItem) => {
      const s = inventoryDaysStyle(row.inventory_days)
      return h('div', { class: 'flex flex-col items-center' }, [
        h('div', {
          class: 'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg',
          style: { backgroundColor: s.bg, color: s.color },
        }, row.inventory_days),
        h('div', { class: 'text-xs text-gray-400 mt-1' }, '天'),
      ])
    },
  },
  {
    title: '创建时间', key: 'created_at', width: 140,
    render: (row: MissingVehicleItem) => h('div', { class: 'flex items-center gap-1 text-sm text-gray-500' }, [
      h(NIcon, { component: CalendarOutlined, size: 14 }),
      dayjs(row.created_at).format('YYYY-MM-DD'),
    ]),
  },
  {
    title: '负责人', key: 'handler', width: 120,
    render: (row: MissingVehicleItem) => {
      const info = row.appraiser_info || row.appraiser
      return info
        ? h('div', { class: 'flex items-center gap-2' }, [
            h(NAvatar, { round: true, size: 'small', style: 'background: #18a058' }, () => (info.first_name || info.username || 'U').slice(0, 1)),
            h('span', { class: 'text-sm' }, `${info.first_name || ''}${info.last_name || ''}` || info.username),
          ])
        : h(NTag, { size: 'small', type: 'warning', bordered: false }, () => '未分配')
    },
  },
  {
    title: '操作', key: 'actions', width: 220, fixed: 'right' as const,
    render: (row: MissingVehicleItem) => h(NSpace, { size: 4, wrap: true }, () => [
      h(NButton, { size: 'tiny', type: 'primary', ghost, onClick: () => router.push(`/vehicles/${row.id}`) }, () => [
        h(NIcon, { component: EyeOutlined, size: 12, class: 'mr-0.5' }), '详情',
      ]),
      h(NButton, { size: 'tiny', type: 'success', ghost, onClick: () => openUploadModal(row) }, () => [
        h(NIcon, { component: UploadOutlined, size: 12, class: 'mr-0.5' }), '上传补件',
      ]),
      h(NButton, { size: 'tiny', type: 'warning', ghost, onClick: () => openSupplementModal(row) }, () => [
        h(NIcon, { component: CheckOutlined, size: 12, class: 'mr-0.5' }), '标记补充',
      ]),
    ]),
  },
]

function getMissingDocTypeOptions(row: MissingVehicleItem) {
  const types = row.missing_types || row.missing_doc_types || []
  return types.map(t => ({
    label: docTypeMap[t]?.label || t,
    value: t,
  }))
}

function onCheckedRowKeysChange(keys: (string | number)[]) {
  checkedRowKeys.value = keys
  selectedRows.value = dataList.value.filter(r => keys.includes(r.id))
}

function search() {
  pagination.page = 1
  loadData()
}

function resetFilters() {
  filters.brand = null
  filters.status = null
  filters.doc_types = []
  filters.min_days = null
  filters.max_days = null
  pagination.page = 1
  loadData()
}

function openUploadModal(row: MissingVehicleItem) {
  currentRow.value = row
  uploadForm.doc_type = null
  uploadForm.category = 'vehicle_archive'
  uploadForm.title = ''
  uploadForm.description = ''
  uploadForm.file = null
  showUploadModal.value = true
}

function closeUploadModal() {
  showUploadModal.value = false
  currentRow.value = null
  uploadForm.file = null
}

function onUploadFileChange({ file, fileList }: any) {
  if (file && file.file) {
    uploadForm.file = file.file
  } else if (file && fileList && fileList.length > 0) {
    const last = fileList[fileList.length - 1]
    uploadForm.file = last.file || last
  }
}

async function submitUpload() {
  if (!uploadForm.doc_type) {
    message.warning('请选择证件类型')
    return
  }
  if (!uploadForm.title.trim()) {
    message.warning('请输入证件标题')
    return
  }
  if (!uploadForm.file) {
    message.warning('请选择要上传的文件')
    return
  }
  uploadLoading.value = true
  try {
    const { $api } = useNuxtApp()
    const formData = new FormData()
    formData.append('vehicle_id', String(currentRow.value?.id))
    formData.append('document_type', uploadForm.doc_type)
    formData.append('category', uploadForm.category)
    formData.append('title', uploadForm.title)
    if (uploadForm.description) formData.append('description', uploadForm.description)
    formData.append('file', uploadForm.file)
    await $api.upload('/documents/upload/', formData)
    message.success('上传成功')
    closeUploadModal()
    loadData()
  } catch (e: any) {
    message.error(e.message || '上传失败')
  } finally {
    uploadLoading.value = false
  }
}

function openSupplementModal(row: MissingVehicleItem) {
  currentRow.value = row
  supplementForm.doc_types = []
  supplementForm.remark = ''
  showSupplementModal.value = true
}

async function submitSupplement() {
  if (supplementForm.doc_types.length === 0) {
    message.warning('请选择已补充的证件')
    return
  }
  supplementLoading.value = true
  try {
    const { $api } = useNuxtApp()
    await $api.post(`/vehicles/${currentRow.value?.id}/mark-documents-supplemented/`, {
      document_types: supplementForm.doc_types,
      remark: supplementForm.remark,
    })
    message.success('标记成功')
    showSupplementModal.value = false
    loadData()
  } catch (e: any) {
    message.error(e.message || '标记失败')
  } finally {
    supplementLoading.value = false
  }
}

async function batchNotify() {
  if (selectedRows.value.length === 0) return
  dialog.warning({
    title: `确认通知 ${selectedRows.value.length} 位负责人？`,
    content: '将通过系统消息和短信通知各车辆负责人补充缺失资料',
    positiveText: '确认发送',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const { $api } = useNuxtApp()
        await $api.post('/vehicles/batch-notify-missing/', {
          vehicle_ids: selectedRows.value.map(r => r.id),
        })
        notification.success({ title: '通知已发送', content: `已向 ${selectedRows.value.length} 位负责人发送补充资料通知`, duration: 3000 })
        checkedRowKeys.value = []
        selectedRows.value = []
      } catch (e: any) {
        message.error(e.message || '通知发送失败')
      }
    },
  })
}

async function submitAssign() {
  if (!assignForm.handler) {
    message.warning('请选择处理人员')
    return
  }
  assignLoading.value = true
  try {
    const { $api } = useNuxtApp()
    await $api.post('/vehicles/batch-assign/', {
      vehicle_ids: selectedRows.value.map(r => r.id),
      handler_id: assignForm.handler,
      notify_types: assignForm.notify_types,
      remark: assignForm.remark,
    })
    message.success(`已分配 ${selectedRows.value.length} 台车辆`)
    showAssignModal.value = false
    checkedRowKeys.value = []
    selectedRows.value = []
    assignForm.handler = null
    assignForm.notify_types = ['system']
    assignForm.remark = ''
    loadData()
  } catch (e: any) {
    message.error(e.message || '分配失败')
  } finally {
    assignLoading.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const { $api } = useNuxtApp()
    const params: Record<string, any> = {
      page: pagination.page,
      page_size: pagination.pageSize,
    }
    if (filters.brand) params.brand = filters.brand
    if (filters.status) params.status = filters.status
    if (filters.doc_types.length > 0) params.doc_types = filters.doc_types.join(',')
    if (filters.min_days !== null) params.min_days = filters.min_days
    if (filters.max_days !== null) params.max_days = filters.max_days

    const res = await $api.get<any, any>('/vehicles/missing-documents/', params)
    const list = res.results || res.items || res || []
    dataList.value = list
    total.value = res.count || res.total || list.length
    loaded.value = true
    calcStats()
  } catch (e: any) {
    message.error(e.message || '加载失败')
    dataList.value = []
    total.value = 0
    loaded.value = true
  } finally {
    loading.value = false
  }
}

function calcStats() {
  const byType: Record<string, number> = {}
  dataList.value.forEach(v => {
    const types = v.missing_types || v.missing_doc_types || []
    types.forEach(t => {
      byType[t] = (byType[t] || 0) + 1
    })
  })
  stats.value = {
    total_missing: dataList.value.length,
    by_type: {
      registration_cert: byType.registration_cert || 0,
      driving_license: byType.driving_license || 0,
      insurance: byType.insurance || 0,
      maintenance_record: byType.maintenance_record || 0,
      keys: byType.keys || 0,
      invoice: byType.invoice || 0,
      other: byType.other || 0,
    },
  }
}

onMounted(() => {
  loadHandlerOptions()
  loadData()
})
</script>

<style scoped>
.stat-card {
  transition: all 0.25s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.12);
}
</style>
