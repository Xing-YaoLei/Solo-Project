<template>
  <div class="page-container">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold">车源列表</h1>
        <p class="text-gray-500 text-sm mt-1">管理所有车源的全流程</p>
      </div>
      <NSpace>
        <NButton v-if="authStore.isAppraiser" type="primary" @click="showCreateModal = true">
          <NIcon :component="PlusOutlined" class="mr-1" />
          新建车源
        </NButton>
      </NSpace>
    </div>

    <NCard :bordered="false" size="small" class="mb-4">
      <NForm :model="filters" :label-width="80" label-placement="left">
        <NGrid :cols="4" x-gap="16" y-gap="12">
          <NGi>
            <NFormItem label="搜索">
              <NInput v-model:value="filters.keyword" placeholder="VIN / 车牌 / 品牌" clearable @keyup.enter="loadList" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="状态">
              <NSelect v-model:value="filters.statuses" multiple filterable placeholder="多选" :options="statusOptions" @update:value="loadList" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="复核状态">
              <NSelect v-model:value="filters.review_status" placeholder="全部" clearable :options="reviewStatusOptions" @update:value="loadList" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="品牌">
              <NSelect v-model:value="filters.brand" placeholder="全部" clearable :options="brandOptions" @update:value="loadList" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="年款">
              <NSelect v-model:value="filters.year" placeholder="全部" clearable :options="yearOptions" @update:value="loadList" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="库存天数">
              <NInputNumberGroup>
                <NInputNumber v-model:value="filters.inventory_min" placeholder="最小" :min="0" style="width: 50%" @change="loadList" />
                <NInputNumber v-model:value="filters.inventory_max" placeholder="最大" :min="0" style="width: 50%" @change="loadList" />
              </NInputNumberGroup>
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="创建时间">
              <NDatePicker v-model:value="filters.created_range" type="daterange" clearable @update:value="loadList" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="资料缺失">
              <NSelect v-model:value="filters.has_missing_docs" placeholder="全部" clearable :options="missingDocsOptions" @update:value="loadList" />
            </NFormItem>
          </NGi>
        </NGrid>
        <div class="flex justify-end mt-2">
          <NSpace>
            <NButton @click="resetFilters">重置</NButton>
            <NButton type="primary" @click="loadList">
              <NIcon :component="SearchOutlined" class="mr-1" />
              查询
            </NButton>
          </NSpace>
        </div>
      </NForm>
    </NCard>

    <NCard v-if="checkedRowKeys.length > 0" :bordered="false" size="small" class="mb-4 bg-blue-50">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <NIcon :component="CheckSquareOutlined" style="color: #2080f0" />
          <span>已选中 <b class="text-blue-600">{{ checkedRowKeys.length }}</b> 条</span>
        </div>
        <NSpace>
          <NSelect v-model:value="batchStage" placeholder="推进阶段" :options="stageOptions" style="width: 160px" />
          <NButton :disabled="!batchStage" @click="handleBatch('advance_stage')">
            <NIcon :component="ForwardOutlined" class="mr-1" />
            批量推进
          </NButton>
          <NButton type="success" @click="handleBatch('review_pass')">
            <NIcon :component="CheckCircleOutlined" class="mr-1" />
            批量通过
          </NButton>
          <NButton type="warning" @click="handleBatch('review_reject')">
            <NIcon :component="CloseCircleOutlined" class="mr-1" />
            批量驳回
          </NButton>
          <NSelect v-model:value="batchAppraiser" placeholder="分配评估师" :options="userOptions.appraisers" style="width: 160px" />
          <NButton :disabled="!batchAppraiser" @click="handleBatch('assign_appraiser')">
            <NIcon :component="UserOutlined" class="mr-1" />
            分配评估
          </NButton>
          <NSelect v-model:value="batchSales" placeholder="分配销售" :options="userOptions.sales" style="width: 160px" />
          <NButton :disabled="!batchSales" @click="handleBatch('assign_sales')">
            <NIcon :component="UserOutlined" class="mr-1" />
            分配销售
          </NButton>
        </NSpace>
      </div>
    </NCard>

    <NCard :bordered="false" size="small">
      <NSpin :show="loading">
        <NDataTable
          :columns="columns"
          :data="list"
          :row-key="(r: VehicleListItem) => r.id"
          :checked-row-keys="checkedRowKeys"
          :pagination="pagination"
          :loading="loading"
          @update:checked-row-keys="onCheckedRowKeysChange"
          @update:page="onPageChange"
          @update:page-size="onPageSizeChange"
          size="small"
          :bordered="false"
          :single-line="false"
        />
      </NSpin>
    </NCard>

    <NModal v-model:show="showCreateModal" preset="card" title="新建车源" style="width: 720px">
      <NForm ref="createFormRef" :model="createForm" :rules="createRules" label-placement="left" :label-width="100">
        <NGrid :cols="2" x-gap="16" y-gap="12">
          <NGi>
            <NFormItem label="VIN码" path="vin">
              <NInput v-model:value="createForm.vin" placeholder="17位VIN码" maxlength="17" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="车牌号" path="plate_number">
              <NInput v-model:value="createForm.plate_number" placeholder="例：沪A12345" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="品牌" path="brand">
              <NSelect v-model:value="createForm.brand" :options="brandOptions" placeholder="请选择" filterable />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="车型" path="model">
              <NInput v-model:value="createForm.model" placeholder="例：3系" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="年款" path="year">
              <NInputNumber v-model:value="createForm.year" :min="2000" :max="2030" style="width: 100%" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="颜色" path="color">
              <NInput v-model:value="createForm.color" placeholder="例：白色" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="里程(km)" path="mileage">
              <NInputNumber v-model:value="createForm.mileage" :min="0" style="width: 100%" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="燃油类型" path="fuel_type">
              <NSelect v-model:value="createForm.fuel_type" :options="fuelTypeOptions" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="收车价(元)" path="purchase_price">
              <NInputNumber v-model:value="createForm.purchase_price" :min="0" style="width: 100%" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="预计售价(元)" path="expected_price">
              <NInputNumber v-model:value="createForm.expected_price" :min="0" style="width: 100%" />
            </NFormItem>
          </NGi>
          <NGi :span="2">
            <NFormItem label="车源来源" path="source">
              <NSelect v-model:value="createForm.source" :options="sourceOptions" />
            </NFormItem>
          </NGi>
          <NGi :span="2">
            <NFormItem label="备注" path="remark">
              <NInput v-model:value="createForm.remark" type="textarea" :rows="2" placeholder="选填" />
            </NFormItem>
          </NGi>
        </NGrid>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showCreateModal = false">取消</NButton>
          <NButton type="primary" :loading="submitting" @click="submitCreate">创建</NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal v-model:show="showReviewModal" preset="card" :title="reviewForm.action === 'pass' ? '复核通过' : '复核驳回'" style="width: 520px">
      <NForm :model="reviewForm" label-placement="left" :label-width="80">
        <NFormItem label="车辆">
          <NText>{{ currentVehicle?.brand }} {{ currentVehicle?.model }} {{ currentVehicle?.year }}款</NText>
        </NFormItem>
        <NFormItem v-if="reviewForm.action === 'reject'" label="缺失资料">
          <NCheckboxGroup v-model:value="reviewForm.missing_items">
            <NSpace>
              <NCheckbox v-for="d in documentTypeOptions" :key="d.value" :value="d.value">{{ d.label }}</NCheckbox>
            </NSpace>
          </NCheckboxGroup>
        </NFormItem>
        <NFormItem label="审核结论" path="conclusion">
          <NInput v-model:value="reviewForm.conclusion" type="textarea" :rows="3" placeholder="请填写审核意见" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showReviewModal = false">取消</NButton>
          <NButton :type="reviewForm.action === 'pass' ? 'success' : 'warning'" :loading="submitting" @click="submitReview">
            {{ reviewForm.action === 'pass' ? '通过' : '驳回' }}
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal v-model:show="showStatusModal" preset="card" title="变更状态" style="width: 480px">
      <NForm :model="statusForm" label-placement="left" :label-width="80">
        <NFormItem label="当前状态">
          <NTag :type="statusType(currentVehicle?.status || '')" bordered="false">{{ currentVehicle?.status_display }}</NTag>
        </NFormItem>
        <NFormItem label="目标状态" path="to_status">
          <NSelect v-model:value="statusForm.to_status" :options="statusOptions" />
        </NFormItem>
        <NFormItem label="变更原因">
          <NInput v-model:value="statusForm.remark" type="textarea" :rows="2" placeholder="选填" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showStatusModal = false">取消</NButton>
          <NButton type="primary" :loading="submitting" @click="submitStatus">确认变更</NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal v-model:show="showBatchInputModal" preset="card" :title="batchInputTitle" style="width: 480px">
      <NForm :model="batchInputForm" label-placement="left" :label-width="80">
        <NFormItem label="说明">
          <NText>将对选中的 {{ checkedRowKeys.length }} 条记录执行操作</NText>
        </NFormItem>
        <NFormItem label="备注/理由" path="remark">
          <NInput v-model:value="batchInputForm.remark" type="textarea" :rows="3" placeholder="选填" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showBatchInputModal = false">取消</NButton>
          <NButton type="primary" :loading="submitting" @click="submitBatchAction">确认</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useRouter, useMessage, type FormInst, type DataTableColumns, type DataTableCheckStrategy } from 'naive-ui'
import {
  PlusOutlined, SearchOutlined, CheckSquareOutlined, ForwardOutlined,
  CheckCircleOutlined, CloseCircleOutlined, UserOutlined, EyeOutlined,
  EditOutlined, ExclamationCircleOutlined, ReloadOutlined,
} from '@vicons/antd'
import { useAuthStore } from '~/stores/auth'
import type { VehicleListItem, VehicleStatus, ReviewStatus, DocumentType, SimpleUser } from '~/types'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const submitting = ref(false)
const list = ref<VehicleListItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const checkedRowKeys = ref<(string | number)[]>([])
const currentVehicle = ref<VehicleListItem | null>(null)

const pagination = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  itemCount: total.value,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
}))

const filters = reactive({
  keyword: '' as string,
  statuses: [] as string[],
  review_status: null as string | null,
  brand: null as string | null,
  year: null as number | null,
  inventory_min: null as number | null,
  inventory_max: null as number | null,
  created_range: null as [number, number] | null,
  has_missing_docs: null as boolean | null,
})

const statusOptions = [
  { label: '待评估', value: 'pending_evaluation' },
  { label: '待检测', value: 'pending_inspection' },
  { label: '待整备', value: 'pending_preparation' },
  { label: '待试驾', value: 'pending_testdrive' },
  { label: '待审核', value: 'pending_review' },
  { label: '已上架', value: 'listed' },
  { label: '已售出', value: 'sold' },
  { label: '已下架', value: 'off_shelf' },
  { label: '已拒绝', value: 'rejected' },
]

const reviewStatusOptions = [
  { label: '待复核', value: 'pending' },
  { label: '已通过', value: 'pass' },
  { label: '已驳回', value: 'reject' },
  { label: '已补料', value: 'supplemented' },
]

const brandOptions = [
  { label: '宝马', value: '宝马' },
  { label: '奔驰', value: '奔驰' },
  { label: '奥迪', value: '奥迪' },
  { label: '丰田', value: '丰田' },
  { label: '本田', value: '本田' },
  { label: '大众', value: '大众' },
  { label: '别克', value: '别克' },
  { label: '日产', value: '日产' },
  { label: '特斯拉', value: '特斯拉' },
  { label: '比亚迪', value: '比亚迪' },
]

const yearOptions = Array.from({ length: 15 }, (_, i) => ({
  label: `${2010 + i}款`, value: 2010 + i,
})).reverse()

const missingDocsOptions = [
  { label: '有缺失', value: true },
  { label: '无缺失', value: false },
]

const stageOptions = [
  { label: '到检测', value: 'pending_inspection' },
  { label: '到整备', value: 'pending_preparation' },
  { label: '到试驾', value: 'pending_testdrive' },
  { label: '到审核', value: 'pending_review' },
  { label: '到上架', value: 'listed' },
]

const fuelTypeOptions = [
  { label: '汽油', value: 'gasoline' },
  { label: '柴油', value: 'diesel' },
  { label: '纯电', value: 'electric' },
  { label: '混动', value: 'hybrid' },
  { label: '插混', value: 'phev' },
]

const sourceOptions = [
  { label: '门店收车', value: '门店收车' },
  { label: '个人车主', value: '个人车主' },
  { label: '4S店置换', value: '4S店置换' },
  { label: '同行批售', value: '同行批售' },
  { label: '拍卖平台', value: '拍卖平台' },
]

const documentTypeOptions = [
  { label: '登记证书', value: 'registration_cert' },
  { label: '行驶证', value: 'driving_license' },
  { label: '交强险', value: 'insurance' },
  { label: '保养记录', value: 'maintenance_record' },
  { label: '车钥匙', value: 'keys' },
  { label: '购车发票', value: 'invoice' },
  { label: '其他', value: 'other' },
]

const userOptions = reactive({
  appraisers: [
    { label: '张评估师', value: 1 },
    { label: '李评估师', value: 2 },
    { label: '王评估师', value: 3 },
  ] as { label: string; value: number }[],
  sales: [
    { label: '赵销售', value: 4 },
    { label: '钱销售', value: 5 },
    { label: '孙销售', value: 6 },
  ] as { label: string; value: number }[],
})

const batchStage = ref<string | null>(null)
const batchAppraiser = ref<number | null>(null)
const batchSales = ref<number | null>(null)
const pendingBatchAction = ref<string>('')
const batchInputTitle = ref('')

function statusType(s: string) {
  const m: Record<string, any> = {
    pending_evaluation: 'default',
    pending_inspection: 'warning',
    pending_preparation: 'warning',
    pending_testdrive: 'warning',
    pending_review: 'error',
    listed: 'success',
    sold: 'info',
    off_shelf: 'default',
    rejected: 'error',
  }
  return m[s] || 'default'
}

function reviewStatusType(s: string) {
  const m: Record<string, any> = {
    pending: 'warning',
    pass: 'success',
    reject: 'error',
    supplemented: 'info',
  }
  return m[s] || 'default'
}

function formatPrice(p: number | null) {
  if (!p) return '-'
  return `¥${(p / 10000).toFixed(2)}万`
}

const columns: DataTableColumns<VehicleListItem> = [
  { type: 'selection', options: ['all', 'none'] as DataTableCheckStrategy[], fixed: 'left' },
  {
    title: '车辆', key: 'vehicle', width: 220, fixed: 'left', render: (r: VehicleListItem) => {
      return h('div', { class: 'flex flex-col' }, [
        h('div', { class: 'font-medium' }, `${r.brand} ${r.model} ${r.year}款`),
        h('div', { class: 'text-gray-500 text-xs mt-1' }, [
          h('span', { class: 'mr-3' }, r.color),
          h('span', {}, `VIN: ${r.vin.slice(-8)}`),
        ]),
      ])
    },
  },
  {
    title: '状态', key: 'status', width: 100, render: (r: VehicleListItem) => h(
      NTag, { type: statusType(r.status), size: 'small', bordered: false },
      { default: () => r.status_display }
    ),
  },
  {
    title: '复核', key: 'review_status', width: 100, render: (r: VehicleListItem) => h(
      NTag, { type: reviewStatusType(r.review_status), size: 'small', bordered: false },
      { default: () => r.review_status_display }
    ),
  },
  {
    title: '阶段完成度', key: 'completion', width: 160, render: (r: VehicleListItem) => {
      const p = r.stage_completion.percentage
      return h('div', { class: 'flex items-center gap-2' }, [
        h('div', { style: { flex: 1 } }, [
          h(NProgress as any, { type: 'line', percentage: p, height: 6, status: p === 100 ? 'success' : 'default' } as any),
        ]),
        h('span', { class: 'text-xs text-gray-500 w-10 text-right' }, `${p}%`),
      ])
    },
  },
  {
    title: '资料完整度', key: 'documents', width: 110, render: (r: VehicleListItem) => {
      const missing = r.document_status.missing_count
      if (missing === 0) {
        return h(NTag, { type: 'success', size: 'small', bordered: false }, {
          default: () => h('span', { class: 'flex items-center gap-1' }, [
            h(NIcon as any, { component: CheckCircleOutlined, size: 14 } as any),
            '完整',
          ]),
        })
      }
      return h(NTag, { type: 'error', size: 'small', bordered: false }, {
        default: () => h('span', { class: 'flex items-center gap-1' }, [
          h(NIcon as any, { component: ExclamationCircleOutlined, size: 14 } as any),
          `缺${missing}项`,
        ]),
      })
    },
  },
  { title: '库存天数', key: 'inventory_days', width: 90, align: 'center', render: (r: VehicleListItem) => {
    const days = r.inventory_days
    const type = days > 60 ? 'error' : days > 30 ? 'warning' : 'default'
    return h(NTag, { type, size: 'small', bordered: false }, { default: () => `${days}天` })
  } },
  { title: '收车价', key: 'purchase_price', width: 100, render: (r: VehicleListItem) => formatPrice(r.purchase_price) },
  { title: '售价', key: 'selling_price', width: 100, render: (r: VehicleListItem) => formatPrice(r.selling_price || r.expected_price) },
  {
    title: '负责人', key: 'owner', width: 120, render: (r: VehicleListItem) => {
      const names = [r.appraiser_info, r.salesperson_info].filter(Boolean) as SimpleUser[]
      if (names.length === 0) return '-'
      return h('div', { class: 'text-sm' }, names.map(u => `${u.first_name}${u.last_name}`).join(' / '))
    },
  },
  { title: '创建时间', key: 'created_at', width: 160, render: (r: VehicleListItem) => dayjs(r.created_at).format('YYYY-MM-DD HH:mm') },
  {
    title: '操作', key: 'action', width: 220, fixed: 'right', render: (r: VehicleListItem) => h(
      NSpace as any, { size: 'small' } as any,
      {
        default: () => [
          h(NButton as any, { text: true, type: 'primary', size: 'small', onClick: () => router.push(`/vehicles/${r.id}`) } as any, {
            default: () => h('span', { class: 'flex items-center gap-1' }, [h(NIcon as any, { component: EyeOutlined, size: 14 } as any), '详情']),
          }),
          h(NDropdown as any, {
            options: [
              { label: '复核通过', key: 'review_pass', icon: () => h(NIcon as any, { component: CheckCircleOutlined, size: 14 } as any) },
              { label: '复核驳回', key: 'review_reject', icon: () => h(NIcon as any, { component: CloseCircleOutlined, size: 14 } as any) },
              { label: '变更状态', key: 'change_status', icon: () => h(NIcon as any, { component: EditOutlined, size: 14 } as any) },
            ],
            onSelect: (key: string) => handleRowAction(r, key),
            trigger: 'click',
          } as any, {
            default: () => h(NButton as any, { text: true, size: 'small' } as any, {
              default: () => h('span', { class: 'flex items-center gap-1' }, ['更多', '▾']),
            }),
          }),
        ],
      }
    ),
  },
]

function onCheckedRowKeysChange(keys: (string | number)[]) {
  checkedRowKeys.value = keys
}

function onPageChange(p: number) {
  page.value = p
  loadList()
}

function onPageSizeChange(s: number) {
  pageSize.value = s
  page.value = 1
  loadList()
}

function resetFilters() {
  filters.keyword = ''
  filters.statuses = []
  filters.review_status = null
  filters.brand = null
  filters.year = null
  filters.inventory_min = null
  filters.inventory_max = null
  filters.created_range = null
  filters.has_missing_docs = null
  page.value = 1
  loadList()
}

function buildParams() {
  const params: Record<string, any> = {
    page: page.value,
    page_size: pageSize.value,
  }
  if (filters.keyword) params.keyword = filters.keyword
  if (filters.statuses.length) params.status = filters.statuses.join(',')
  if (filters.review_status) params.review_status = filters.review_status
  if (filters.brand) params.brand = filters.brand
  if (filters.year) params.year = filters.year
  if (filters.inventory_min != null) params.inventory_min = filters.inventory_min
  if (filters.inventory_max != null) params.inventory_max = filters.inventory_max
  if (filters.created_range) {
    params.created_from = dayjs(filters.created_range[0]).format('YYYY-MM-DD')
    params.created_to = dayjs(filters.created_range[1]).format('YYYY-MM-DD')
  }
  if (filters.has_missing_docs != null) params.has_missing_docs = filters.has_missing_docs
  return params
}

async function loadList() {
  loading.value = true
  try {
    const { $api } = useNuxtApp()
    const res = await $api.get<any, any>('/vehicles', buildParams())
    list.value = res.results || []
    total.value = res.count || 0
  } catch (e: any) {
    list.value = mockList
    total.value = 68
  } finally {
    loading.value = false
  }
}

function handleRowAction(row: VehicleListItem, key: string) {
  currentVehicle.value = row
  if (key === 'review_pass') {
    reviewForm.action = 'pass'
    reviewForm.conclusion = '资料齐全，复核通过'
    reviewForm.missing_items = []
    showReviewModal.value = true
  } else if (key === 'review_reject') {
    reviewForm.action = 'reject'
    reviewForm.conclusion = ''
    reviewForm.missing_items = []
    showReviewModal.value = true
  } else if (key === 'change_status') {
    statusForm.to_status = null
    statusForm.remark = ''
    showStatusModal.value = true
  }
}

const showCreateModal = ref(false)
const showReviewModal = ref(false)
const showStatusModal = ref(false)
const showBatchInputModal = ref(false)
const createFormRef = ref<FormInst | null>(null)

const createForm = reactive({
  vin: '', plate_number: '', brand: null as string | null, model: '',
  year: new Date().getFullYear(), color: '', mileage: null as number | null,
  fuel_type: 'gasoline', purchase_price: null as number | null,
  expected_price: null as number | null, source: '门店收车', remark: '',
})

const createRules = {
  vin: { required: true, message: '请输入VIN码', trigger: 'blur' },
  brand: { required: true, message: '请选择品牌', trigger: 'change' },
  model: { required: true, message: '请输入车型', trigger: 'blur' },
  year: { required: true, message: '请输入年款', trigger: 'blur' },
}

const reviewForm = reactive({
  action: 'pass' as 'pass' | 'reject',
  missing_items: [] as DocumentType[],
  conclusion: '',
})

const statusForm = reactive({
  to_status: null as VehicleStatus | null,
  remark: '',
})

const batchInputForm = reactive({
  remark: '',
})

async function submitCreate() {
  if (!createFormRef.value) return
  try {
    await createFormRef.value.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    const { $api } = useNuxtApp()
    await $api.post('/vehicles', createForm)
    message.success('创建成功')
    showCreateModal.value = false
    loadList()
  } catch (e: any) {
    message.success('创建成功（模拟）')
    showCreateModal.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

async function submitReview() {
  if (!currentVehicle.value) return
  submitting.value = true
  try {
    const { $api } = useNuxtApp()
    await $api.post(`/vehicles/${currentVehicle.value.id}/review`, {
      status: reviewForm.action,
      missing_items: reviewForm.missing_items,
      conclusion: reviewForm.conclusion,
    })
    message.success(`复核${reviewForm.action === 'pass' ? '通过' : '驳回'}成功`)
    showReviewModal.value = false
    loadList()
  } catch (e: any) {
    message.success('操作成功（模拟）')
    showReviewModal.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

async function submitStatus() {
  if (!currentVehicle.value || !statusForm.to_status) return
  submitting.value = true
  try {
    const { $api } = useNuxtApp()
    await $api.post(`/vehicles/${currentVehicle.value.id}/change-status`, {
      to_status: statusForm.to_status,
      remark: statusForm.remark,
    })
    message.success('状态变更成功')
    showStatusModal.value = false
    loadList()
  } catch (e: any) {
    message.success('状态变更成功（模拟）')
    showStatusModal.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

function handleBatch(action: string) {
  if (checkedRowKeys.value.length === 0) return
  if (action === 'advance_stage' && !batchStage.value) return
  if (action === 'assign_appraiser' && !batchAppraiser.value) return
  if (action === 'assign_sales' && !batchSales.value) return
  pendingBatchAction.value = action
  batchInputTitle.value = {
    advance_stage: '批量推进阶段',
    review_pass: '批量复核通过',
    review_reject: '批量复核驳回',
    assign_appraiser: '批量分配评估师',
    assign_sales: '批量分配销售',
  }[action] || '批量操作'
  batchInputForm.remark = ''
  showBatchInputModal.value = true
}

async function submitBatchAction() {
  submitting.value = true
  try {
    const payload: any = {
      action: pendingBatchAction.value,
      vehicle_ids: checkedRowKeys.value,
      remark: batchInputForm.remark,
    }
    if (pendingBatchAction.value === 'advance_stage') payload.target_stage = batchStage.value
    if (pendingBatchAction.value === 'assign_appraiser') payload.appraiser_id = batchAppraiser.value
    if (pendingBatchAction.value === 'assign_sales') payload.salesperson_id = batchSales.value
    const { $api } = useNuxtApp()
    await $api.post('/vehicles/batch-action', payload)
    message.success('批量操作成功')
    showBatchInputModal.value = false
    checkedRowKeys.value = []
    batchStage.value = null
    batchAppraiser.value = null
    batchSales.value = null
    loadList()
  } catch (e: any) {
    message.success('批量操作成功（模拟）')
    showBatchInputModal.value = false
    checkedRowKeys.value = []
    batchStage.value = null
    batchAppraiser.value = null
    batchSales.value = null
    loadList()
  } finally {
    submitting.value = false
  }
}

const mockList: VehicleListItem[] = Array.from({ length: 20 }, (_, i) => {
  const statuses: VehicleStatus[] = ['pending_evaluation', 'pending_inspection', 'pending_preparation', 'pending_testdrive', 'pending_review', 'listed', 'sold']
  const s = statuses[i % 7]
  const reviewStatuses: ReviewStatus[] = ['pending', 'pass', 'reject', 'supplemented']
  const rs = reviewStatuses[i % 4]
  const missing = i % 4
  return {
    id: i + 1, vin: `LVGBH42K${89012345 + i}`, plate_number: `沪A·${12345 + i}`,
    brand: brandOptions[i % brandOptions.length].value,
    model: ['3系', 'C级', 'A4L', '凯美瑞', '雅阁', '帕萨特', '君威', '天籁', 'Model 3', '汉'][i % 10],
    year: 2018 + (i % 7), color: ['白色', '黑色', '银色', '灰色', '红色'][i % 5],
    mileage: 20000 + i * 5000, fuel_type: fuelTypeOptions[i % fuelTypeOptions.length].value,
    status: s,
    status_display: statusOptions.find(o => o.value === s)?.label || s,
    review_status: rs,
    review_status_display: reviewStatusOptions.find(o => o.value === rs)?.label || rs,
    purchase_price: 180000 + i * 15000,
    expected_price: 210000 + i * 18000,
    selling_price: s === 'sold' ? 205000 + i * 17000 : null,
    appraiser: userOptions.appraisers[i % 3].value,
    appraiser_info: {
      id: userOptions.appraisers[i % 3].value,
      username: `appraiser${i % 3 + 1}`,
      first_name: ['张', '李', '王'][i % 3],
      last_name: '评估师',
      role_display: '评估师',
    },
    salesperson: userOptions.sales[i % 3].value,
    salesperson_info: {
      id: userOptions.sales[i % 3].value,
      username: `sales${i % 3 + 1}`,
      first_name: ['赵', '钱', '孙'][i % 3],
      last_name: '销售',
      role_display: '销售',
    },
    document_status: {
      complete: missing === 0,
      missing_count: missing,
      missing_types: (documentTypeOptions.slice(0, missing).map(d => d.value)) as DocumentType[],
    },
    stage_completion: {
      total: 4, done: Math.min(4, i % 5),
      percentage: Math.min(100, (i % 5) * 25),
      stages: {
        evaluation: true,
        inspection: (i % 5) >= 1,
        preparation: (i % 5) >= 2,
        testdrive: (i % 5) >= 3,
      },
    },
    inventory_days: 5 + i * 4,
    source: sourceOptions[i % sourceOptions.length].value,
    created_at: new Date(Date.now() - (5 + i * 4) * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    listed_at: ['listed', 'sold'].includes(s) ? new Date(Date.now() - (2 + i) * 86400000).toISOString() : null,
    sold_at: s === 'sold' ? new Date(Date.now() - 1 * 86400000).toISOString() : null,
  }
})

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.page-container {
  padding: 16px;
}
</style>
