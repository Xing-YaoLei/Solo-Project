<template>
  <div class="page-container p-6">
    <NSpin :show="loading">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-xl font-bold">{{ vehicle?.brand }} {{ vehicle?.model }} {{ vehicle?.year }}款</h1>
            <NTag v-if="vehicle" :bordered="false" :type="statusType(vehicle.status)" size="small">
              {{ vehicle.status_display }}
            </NTag>
            <NTag v-if="vehicle" :bordered="false" :type="reviewTagType(vehicle.review_status)" size="small">
              {{ vehicle.review_status_display }}
            </NTag>
          </div>
          <div class="text-gray-500 text-sm flex items-center gap-4 flex-wrap">
            <span>VIN: {{ vehicle?.vin }}</span>
            <span>车牌: {{ vehicle?.plate_number }}</span>
            <span v-if="vehicle?.source">来源: {{ vehicle.source }}</span>
            <span>库存天数: <NTag size="small" type="warning" :bordered="false">{{ vehicle?.inventory_days }}天</NTag></span>
          </div>
        </div>
        <NSpace>
          <NButton v-if="canChangeStatus" type="primary" ghost @click="showChangeStatus = true">
            <NIcon :component="SyncOutlined" class="mr-1" />
            变更状态
          </NButton>
          <NButton v-if="canReview" type="warning" @click="showReviewModal = true">
            <NIcon :component="CheckCircleOutlined" class="mr-1" />
            发起复核
          </NButton>
          <NButton v-if="canEdit" @click="message.info('编辑功能开发中')">
            <NIcon :component="EditOutlined" class="mr-1" />
            编辑
          </NButton>
        </NSpace>
      </div>

      <NGrid :cols="5" x-gap="16" y-gap="16" class="mb-4">
        <NGi :span="4">
          <NTabs v-model:value="activeTab" size="large" animated>
            <NTabPane name="basic" tab="基本信息">
              <BasicInfoPanel :vehicle="vehicle" :trace="trace" :statusLogs="statusLogs" />
            </NTabPane>
            <NTabPane name="inspection" tab="检测报告">
              <InspectionPanel :reports="inspectionReports" />
            </NTabPane>
            <NTabPane name="preparation" tab="整备清单">
              <PreparationPanel :orders="preparationOrders" />
            </NTabPane>
            <NTabPane name="testdrive" tab="试驾记录">
              <TestDrivePanel :records="testDriveRecords" />
            </NTabPane>
            <NTabPane name="documents" tab="附件资料">
              <DocumentsPanel :documents="documents" @refresh="loadDocuments" />
            </NTabPane>
            <NTabPane name="review" tab="复核记录">
              <ReviewPanel :records="reviewRecords" />
            </NTabPane>
          </NTabs>
        </NGi>
        <NGi :span="1">
          <SidePanel :vehicle="vehicle" :trace="trace" />
        </NGi>
      </NGrid>
    </NSpin>

    <NModal v-model:show="showChangeStatus" preset="card" title="变更状态" style="width: 480px">
      <NForm label-placement="left" label-width="80px">
        <NFormItem label="当前状态">
          <NTag :bordered="false" :type="statusType(vehicle?.status || '')">{{ vehicle?.status_display }}</NTag>
        </NFormItem>
        <NFormItem label="目标状态">
          <NSelect v-model:value="newStatus" :options="statusOptions" placeholder="请选择目标状态" />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="statusRemark" type="textarea" :rows="3" placeholder="请输入变更备注" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showChangeStatus = false">取消</NButton>
          <NButton type="primary" @click="submitChangeStatus">确认变更</NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal v-model:show="showReviewModal" preset="card" title="发起复核" style="width: 560px">
      <NForm label-placement="left" label-width="100px">
        <NFormItem label="复核结论" required>
          <NRadioGroup v-model:value="reviewForm.status">
            <NSpace>
              <NRadio value="pass">通过</NRadio>
              <NRadio value="reject">驳回</NRadio>
              <NRadio value="supplemented">补充后通过</NRadio>
            </NSpace>
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="缺失项" v-if="reviewForm.status !== 'pass'">
          <NCheckboxGroup v-model:value="reviewForm.missing_items">
            <NSpace wrap>
              <NCheckbox v-for="t in documentTypeOptions" :key="t.value" :value="t.value">
                {{ t.label }}
              </NCheckbox>
            </NSpace>
          </NCheckboxGroup>
        </NFormItem>
        <NFormItem label="复核意见">
          <NInput v-model:value="reviewForm.comment" type="textarea" :rows="3" placeholder="请输入复核意见" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showReviewModal = false">取消</NButton>
          <NButton type="primary" @click="submitReview">提交复核</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h, defineComponent } from 'vue'
import { useRoute, useMessage, useDialog } from 'naive-ui'
import {
  SyncOutlined, CheckCircleOutlined, EditOutlined, FileTextOutlined,
  CarOutlined, WrenchOutlined, ThunderboltOutlined, FileProtectOutlined,
  AuditOutlined, InfoCircleOutlined, CalendarOutlined, UserOutlined,
  AlertOutlined, CheckOutlined, CloseOutlined, ExclamationCircleOutlined,
  UploadOutlined, EyeOutlined, LockOutlined, UnlockOutlined, MinusOutlined,
  PlusOutlined, DownOutlined, TagOutlined, SafetyCertificateOutlined,
} from '@vicons/antd'
import { useAuthStore } from '~/stores/auth'
import type {
  VehicleDetail, InspectionReport, PreparationOrder, TestDriveRecord,
  VehicleDocument, ReviewRecord, VehicleTrace, StatusChangeLog, DocumentType,
  VehicleStatus, ReviewStatus, TimelineEvent,
} from '~/types'
import dayjs from 'dayjs'

definePageMeta({ layout: 'default' })

const route = useRoute()
const message = useMessage()
const dialog = useDialog()
const authStore = useAuthStore()

const vehicleId = computed(() => Number(route.params.id))
const loading = ref(false)
const activeTab = ref('basic')

const vehicle = ref<VehicleDetail | null>(null)
const inspectionReports = ref<InspectionReport[]>([])
const preparationOrders = ref<PreparationOrder[]>([])
const testDriveRecords = ref<TestDriveRecord[]>([])
const documents = ref<VehicleDocument[]>([])
const reviewRecords = ref<ReviewRecord[]>([])
const trace = ref<VehicleTrace | null>(null)
const statusLogs = ref<StatusChangeLog[]>([])

const showChangeStatus = ref(false)
const newStatus = ref<VehicleStatus | null>(null)
const statusRemark = ref('')

const showReviewModal = ref(false)
const reviewForm = ref({
  status: 'pass' as ReviewStatus,
  missing_items: [] as DocumentType[],
  comment: '',
})

const canEdit = computed(() => authStore.isAppraiser || authStore.isManager)
const canChangeStatus = computed(() => authStore.hasPermission('vehicle:change_status') || authStore.isManager)
const canReview = computed(() => authStore.isManager || authStore.hasPermission('review:create'))

const statusType = (s: string) => {
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

const reviewTagType = (s: string) => {
  const m: Record<string, any> = {
    pending: 'warning',
    pass: 'success',
    reject: 'error',
    supplemented: 'info',
  }
  return m[s] || 'default'
}

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

const documentTypeOptions = [
  { label: '登记证书', value: 'registration_cert' },
  { label: '行驶证', value: 'driving_license' },
  { label: '保险单', value: 'insurance' },
  { label: '保养记录', value: 'maintenance_record' },
  { label: '车钥匙', value: 'keys' },
  { label: '购车发票', value: 'invoice' },
  { label: '其他', value: 'other' },
]

async function loadVehicle() {
  loading.value = true
  try {
    const { $api } = useNuxtApp()
    vehicle.value = await $api.get<any, VehicleDetail>(`/vehicles/${vehicleId.value}/`)
  } catch (e: any) {
    message.warning(e.message || '加载详情失败，展示模拟数据')
    vehicle.value = mockVehicle()
  } finally {
    loading.value = false
  }
}

async function loadInspections() {
  try {
    const { $api } = useNuxtApp()
    const res = await $api.get<any, any>('/inspections/', { vehicle: vehicleId.value })
    inspectionReports.value = res.results || res || []
  } catch {
    inspectionReports.value = [mockInspection()]
  }
}

async function loadPreparations() {
  try {
    const { $api } = useNuxtApp()
    const res = await $api.get<any, any>('/preparations/', { vehicle: vehicleId.value })
    preparationOrders.value = res.results || res || []
  } catch {
    preparationOrders.value = [mockPreparation()]
  }
}

async function loadTestDrives() {
  try {
    const { $api } = useNuxtApp()
    const res = await $api.get<any, any>('/testdrives/', { vehicle: vehicleId.value })
    testDriveRecords.value = res.results || res || []
  } catch {
    testDriveRecords.value = [mockTestDrive()]
  }
}

async function loadDocuments() {
  try {
    const { $api } = useNuxtApp()
    const res = await $api.get<any, any>('/documents/', { vehicle: vehicleId.value })
    documents.value = res.results || res || []
  } catch {
    documents.value = mockDocuments()
  }
}

async function loadReviewRecords() {
  try {
    const { $api } = useNuxtApp()
    const res = await $api.get<any, any>(`/vehicles/${vehicleId.value}/review-records`)
    reviewRecords.value = res.results || res || []
  } catch {
    reviewRecords.value = mockReviewRecords()
  }
}

async function loadTrace() {
  try {
    const { $api } = useNuxtApp()
    trace.value = await $api.get<any, VehicleTrace>('/statistics/vehicle-trace', { vehicle_id: vehicleId.value })
  } catch {
    trace.value = mockTrace()
  }
}

async function submitChangeStatus() {
  if (!newStatus.value) {
    message.warning('请选择目标状态')
    return
  }
  try {
    const { $api } = useNuxtApp()
    await $api.post(`/vehicles/${vehicleId.value}/change-status/`, {
      status: newStatus.value,
      remark: statusRemark.value,
    })
    message.success('状态变更成功')
    showChangeStatus.value = false
    newStatus.value = null
    statusRemark.value = ''
    await loadVehicle()
  } catch (e: any) {
    message.error(e.message || '状态变更失败')
  }
}

async function submitReview() {
  try {
    const { $api } = useNuxtApp()
    await $api.post(`/vehicles/${vehicleId.value}/review/`, reviewForm.value)
    message.success('复核提交成功')
    showReviewModal.value = false
    reviewForm.value = { status: 'pass', missing_items: [], comment: '' }
    await Promise.all([loadVehicle(), loadReviewRecords()])
  } catch (e: any) {
    message.error(e.message || '复核提交失败')
  }
}

function mockVehicle(): VehicleDetail {
  return {
    id: vehicleId.value,
    vin: 'LVGBH42K890123456',
    plate_number: '沪A·12345',
    brand: '宝马',
    model: '3系',
    year: 2022,
    color: '矿石白',
    mileage: 28650,
    fuel_type: '汽油',
    status: 'pending_review',
    status_display: '待审核',
    review_status: 'pending',
    review_status_display: '待复核',
    purchase_price: 238000,
    expected_price: 268000,
    selling_price: null,
    appraiser: 1,
    appraiser_info: { id: 1, username: 'zhang_san', first_name: '张', last_name: '三', role_display: '评估师' },
    salesperson: 2,
    salesperson_info: { id: 2, username: 'li_si', first_name: '李', last_name: '四', role_display: '销售' },
    document_status: { complete: false, missing_count: 2, missing_types: ['registration_cert', 'keys'] },
    stage_completion: { total: 4, done: 3, percentage: 75, stages: { evaluation: true, inspection: true, preparation: true, testdrive: false } },
    inventory_days: 18,
    source: '个人车主',
    created_at: dayjs().subtract(18, 'day').toISOString(),
    updated_at: dayjs().subtract(1, 'day').toISOString(),
    listed_at: null,
    sold_at: null,
    displacement: '2.0T',
    transmission: '手自一体',
    first_register_date: '2022-03-15',
    owner_name: '王小明',
    owner_phone: '138****6789',
    description: '车况良好，无重大事故，定期4S店保养',
    remark: '车主急售，价格可小刀',
    created_by: 1,
  }
}

function mockInspection(): InspectionReport {
  return {
    id: 1,
    vehicle: vehicleId.value,
    report_no: 'JC20240615001',
    inspector: 3,
    inspector_info: { id: 3, username: 'wang_wu', first_name: '王', last_name: '五', role_display: '检测师' },
    status: 'completed',
    status_display: '已完成',
    mileage: 28650,
    overall_rating: 'good',
    overall_rating_display: '良好',
    has_accident: false,
    has_water_damage: false,
    has_fire_damage: false,
    has_structural_damage: false,
    general_condition: '整体车况良好，外观有轻微划痕',
    issues: '前保险杠有轻微划痕，左后轮胎磨损较严重',
    suggestions: '建议更换左后轮胎，补漆前保险杠',
    verified: true,
    verified_by: 1,
    verified_at: dayjs().subtract(15, 'day').toISOString(),
    inspection_date: dayjs().subtract(16, 'day').format('YYYY-MM-DD'),
    items: [
      { id: 1, report: 1, item: 'engine', item_display: '发动机舱', rating: 'excellent', rating_display: '优秀', description: '发动机运行平稳，无渗漏', photos: [], created_at: '' },
      { id: 2, report: 1, item: 'chassis', item_display: '底盘系统', rating: 'good', rating_display: '良好', description: '底盘无异响，悬挂正常', photos: [], created_at: '' },
      { id: 3, report: 1, item: 'transmission', item_display: '变速箱', rating: 'excellent', rating_display: '优秀', description: '换挡顺畅，无顿挫感', photos: [], created_at: '' },
      { id: 4, report: 1, item: 'brake', item_display: '制动系统', rating: 'good', rating_display: '良好', description: '制动灵敏，刹车片剩余60%', photos: [], created_at: '' },
      { id: 5, report: 1, item: 'electrical', item_display: '电气系统', rating: 'excellent', rating_display: '优秀', description: '各项电器功能正常', photos: [], created_at: '' },
      { id: 6, report: 1, item: 'exterior', item_display: '外观漆面', rating: 'average', rating_display: '一般', description: '前保险杠有划痕，需补漆', photos: [], created_at: '' },
      { id: 7, report: 1, item: 'interior', item_display: '内饰', rating: 'good', rating_display: '良好', description: '内饰整洁，座椅无磨损', photos: [], created_at: '' },
      { id: 8, report: 1, item: 'tire', item_display: '轮胎轮毂', rating: 'average', rating_display: '一般', description: '左后轮胎磨损较严重', photos: [], created_at: '' },
    ],
    items_summary: { total: 8, excellent: 3, good: 3, average: 2, poor: 0 },
  }
}

function mockPreparation(): PreparationOrder {
  return {
    id: 1,
    vehicle: vehicleId.value,
    order_no: 'ZB20240616001',
    status: 'in_progress',
    status_display: '进行中',
    handler: 4,
    handler_info: { id: 4, username: 'zhao_liu', first_name: '赵', last_name: '六', role_display: '整备师' },
    estimated_cost: 5800,
    actual_cost: 4200,
    start_date: dayjs().subtract(14, 'day').format('YYYY-MM-DD'),
    end_date: null,
    remark: '部分配件等待到货',
    verified: false,
    verified_by: null,
    verified_at: null,
    items: [
      { id: 1, order: 1, category: 'exterior', category_display: '外观修复', name: '前保险杠补漆', description: '前保险杠左侧划痕修复', estimated_cost: 800, actual_cost: 750, is_done: true, done_at: dayjs().subtract(12, 'day').toISOString(), photos: [] },
      { id: 2, order: 1, category: 'exterior', category_display: '外观修复', name: '左后翼子板抛光', description: '轻微划痕抛光处理', estimated_cost: 300, actual_cost: 280, is_done: true, done_at: dayjs().subtract(12, 'day').toISOString(), photos: [] },
      { id: 3, order: 1, category: 'mechanical', category_display: '机械维修', name: '更换左后轮胎', description: '米其林轮胎 225/45 R18', estimated_cost: 1500, actual_cost: 1450, is_done: true, done_at: dayjs().subtract(10, 'day').toISOString(), photos: [] },
      { id: 4, order: 1, category: 'maintenance', category_display: '保养维护', name: '全面保养', description: '机油三滤更换+全车检查', estimated_cost: 1200, actual_cost: 1150, is_done: true, done_at: dayjs().subtract(8, 'day').toISOString(), photos: [] },
      { id: 5, order: 1, category: 'accessories', category_display: '内饰清洁', name: '内饰深度清洁', description: '座椅、地毯、顶棚清洗', estimated_cost: 600, actual_cost: 570, is_done: false, done_at: null, photos: [] },
      { id: 6, order: 1, category: 'glass', category_display: '玻璃修复', name: '前挡玻璃镀膜', description: '防雨防眩光镀膜', estimated_cost: 800, actual_cost: 0, is_done: false, done_at: null, photos: [] },
    ],
    total_estimated: 5800,
    total_actual: 4200,
    done_count: 4,
    total_count: 6,
  }
}

function mockTestDrive(): TestDriveRecord {
  return {
    id: 1,
    vehicle: vehicleId.value,
    record_no: 'SJ20240620001',
    salesperson: 2,
    salesperson_info: { id: 2, username: 'li_si', first_name: '李', last_name: '四', role_display: '销售' },
    customer_name: '陈先生',
    customer_phone: '139****1234',
    customer_id_card: '310***********1234',
    license_number: '310001********1234',
    status: 'scheduled',
    status_display: '已预约',
    scheduled_at: dayjs().add(2, 'day').toISOString(),
    start_mileage: null,
    end_mileage: null,
    start_time: null,
    end_time: null,
    route: '门店 -> 滨江大道 -> 陆家嘴环路 -> 门店 (约15km)',
    feedback: '',
    brake_feeling: '',
    shift_feeling: '',
    ride_comfort: '',
    noise_level: '',
    handling: '',
    abnormal_noise: '',
    other_issues: '',
    purchase_intent: '',
    purchase_intent_display: '',
    expected_price: null,
    remark: '客户周末有空',
    verified: false,
    verified_by: null,
    verified_at: null,
    testdrive_distance: null,
    testdrive_duration: null,
  }
}

function mockDocuments(): VehicleDocument[] {
  return [
    { id: 1, vehicle: vehicleId.value, document_type: 'driving_license', category: 'vehicle_cert', category_display: '车辆证件', source: 'owner', source_display: '车主提供', title: '行驶证正副本', description: '有效期至2026年3月', file_path: '/docs/driving_license.pdf', file_name: '行驶证.pdf', file_size: 1024000, file_size_display: '1.0MB', content_type: 'application/pdf', file_url: '', uploaded_by: 1, uploaded_by_info: { id: 1, username: 'zhang_san', first_name: '张', last_name: '三', role_display: '评估师' }, is_verified: true, verified_by: 1, verified_at: dayjs().subtract(17, 'day').toISOString(), verification_note: '证件真实有效', expire_date: '2026-03-15', process_history: [{ action: '上传', operator: '张三', operator_id: 1, note: '车主现场提供', timestamp: dayjs().subtract(17, 'day').toISOString() }, { action: '核验', operator: '管理员', operator_id: 1, note: '与原件一致', timestamp: dayjs().subtract(17, 'day').toISOString() }], close_conclusion: '', is_closed: false, closed_by: null, closed_at: null, created_at: dayjs().subtract(17, 'day').toISOString(), updated_at: dayjs().subtract(17, 'day').toISOString() },
    { id: 2, vehicle: vehicleId.value, document_type: 'insurance', category: 'vehicle_cert', category_display: '车辆证件', source: 'owner', source_display: '车主提供', title: '交强险保单', description: '人保，2025年3月到期', file_path: '/docs/insurance.pdf', file_name: '交强险保单.pdf', file_size: 512000, file_size_display: '500KB', content_type: 'application/pdf', file_url: '', uploaded_by: 1, uploaded_by_info: { id: 1, username: 'zhang_san', first_name: '张', last_name: '三', role_display: '评估师' }, is_verified: true, verified_by: 1, verified_at: dayjs().subtract(17, 'day').toISOString(), verification_note: '', expire_date: '2025-03-15', process_history: [], close_conclusion: '', is_closed: false, closed_by: null, closed_at: null, created_at: dayjs().subtract(17, 'day').toISOString(), updated_at: dayjs().subtract(17, 'day').toISOString() },
    { id: 3, vehicle: vehicleId.value, document_type: 'maintenance_record', category: 'maintenance', category_display: '保养维修', source: '4s', source_display: '4S店查询', title: '4S店保养记录', description: '2022-2024年完整保养记录', file_path: '/docs/maintenance.pdf', file_name: '保养记录.pdf', file_size: 2048000, file_size_display: '2.0MB', content_type: 'application/pdf', file_url: '', uploaded_by: 3, uploaded_by_info: { id: 3, username: 'wang_wu', first_name: '王', last_name: '五', role_display: '检测师' }, is_verified: true, verified_by: 1, verified_at: dayjs().subtract(15, 'day').toISOString(), verification_note: '', expire_date: null, process_history: [], close_conclusion: '', is_closed: false, closed_by: null, closed_at: null, created_at: dayjs().subtract(16, 'day').toISOString(), updated_at: dayjs().subtract(16, 'day').toISOString() },
    { id: 4, vehicle: vehicleId.value, document_type: 'registration_cert', category: 'vehicle_cert', category_display: '车辆证件', source: 'missing', source_display: '缺失待补', title: '机动车登记证书', description: '绿本，车主称在银行抵押中', file_path: '', file_name: '', file_size: 0, file_size_display: '', content_type: '', file_url: '', uploaded_by: null, uploaded_by_info: null, is_verified: false, verified_by: null, verified_at: null, verification_note: '', expire_date: null, process_history: [{ action: '标记缺失', operator: '张三', operator_id: 1, note: '车主反馈在银行抵押，预计下周三取出', timestamp: dayjs().subtract(10, 'day').toISOString() }], close_conclusion: '', is_closed: false, closed_by: null, closed_at: null, created_at: dayjs().subtract(17, 'day').toISOString(), updated_at: dayjs().subtract(10, 'day').toISOString() },
    { id: 5, vehicle: vehicleId.value, document_type: 'keys', category: 'accessories', category_display: '随车物品', source: 'missing', source_display: '缺失待补', title: '备用钥匙', description: '车主只提供了一把钥匙', file_path: '', file_name: '', file_size: 0, file_size_display: '', content_type: '', file_url: '', uploaded_by: null, uploaded_by_info: null, is_verified: false, verified_by: null, verified_at: null, verification_note: '', expire_date: null, process_history: [{ action: '标记缺失', operator: '张三', operator_id: 1, note: '车主回家寻找备用钥匙', timestamp: dayjs().subtract(5, 'day').toISOString() }], close_conclusion: '', is_closed: false, closed_by: null, closed_at: null, created_at: dayjs().subtract(17, 'day').toISOString(), updated_at: dayjs().subtract(5, 'day').toISOString() },
    { id: 6, vehicle: vehicleId.value, document_type: 'invoice', category: 'transaction', category_display: '交易凭证', source: 'pending', source_display: '待生成', title: '收购付款凭证', description: '财务待处理', file_path: '', file_name: '', file_size: 0, file_size_display: '', content_type: '', file_url: '', uploaded_by: null, uploaded_by_info: null, is_verified: false, verified_by: null, verified_at: null, verification_note: '', expire_date: null, process_history: [], close_conclusion: '', is_closed: false, closed_by: null, closed_at: null, created_at: dayjs().subtract(17, 'day').toISOString(), updated_at: dayjs().subtract(17, 'day').toISOString() },
  ]
}

function mockReviewRecords(): ReviewRecord[] {
  return [
    {
      id: 1, vehicle: vehicleId.value, reviewer: 1, reviewer_info: { id: 1, username: 'admin', first_name: '系', last_name: '统', role_display: '管理员' },
      status: 'pass', status_display: '通过',
      comment: '车辆基础资料完整，评估合理',
      missing_items: [], conclusion: '同意进入下一阶段',
      created_at: dayjs().subtract(16, 'day').toISOString(),
    },
    {
      id: 2, vehicle: vehicleId.value, reviewer: 1, reviewer_info: { id: 1, username: 'admin', first_name: '系', last_name: '统', role_display: '管理员' },
      status: 'supplemented', status_display: '补充后通过',
      comment: '缺少登记证书和备用钥匙，其余资料完整',
      missing_items: ['registration_cert', 'keys'],
      conclusion: '资料补齐后即可上架',
      created_at: dayjs().subtract(2, 'day').toISOString(),
    },
  ]
}

function mockTrace(): VehicleTrace {
  return {
    vehicle: {
      id: vehicleId.value, vin: 'LVGBH42K890123456', brand: '宝马', model: '3系', year: 2022,
      status: 'pending_review', status_display: '待审核',
      review_status: 'pending', review_status_display: '待复核',
    },
    timeline: [
      { type: 'create', time: dayjs().subtract(18, 'day').format('YYYY-MM-DD HH:mm'), time_display: '18天前', title: '创建车源档案', operator: '张三', detail: '录入车辆基本信息' },
      { type: 'status', time: dayjs().subtract(17, 'day').format('YYYY-MM-DD HH:mm'), time_display: '17天前', title: '状态变更：待评估 → 待检测', operator: '张三', detail: '评估完成，进入检测环节' },
      { type: 'inspection', time: dayjs().subtract(16, 'day').format('YYYY-MM-DD HH:mm'), time_display: '16天前', title: '检测报告完成', operator: '王五', detail: '综合评级：良好' },
      { type: 'status', time: dayjs().subtract(16, 'day').format('YYYY-MM-DD HH:mm'), time_display: '16天前', title: '状态变更：待检测 → 待整备', operator: '系统', detail: '检测完成，自动流转' },
      { type: 'preparation', time: dayjs().subtract(14, 'day').format('YYYY-MM-DD HH:mm'), time_display: '14天前', title: '开始整备', operator: '赵六', detail: '共6项整备任务' },
      { type: 'status', time: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm'), time_display: '10天前', title: '状态变更：待整备 → 待试驾', operator: '系统', detail: '整备进度超50%' },
      { type: 'document', time: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm'), time_display: '5天前', title: '资料缺失标记', operator: '张三', detail: '备用钥匙缺失' },
    ],
    documents_count: 6,
    review_records_count: 2,
  }
}

const BasicInfoPanel = defineComponent({
  name: 'BasicInfoPanel',
  props: { vehicle: { type: Object as () => VehicleDetail | null, default: null }, trace: { type: Object as () => VehicleTrace | null, default: null }, statusLogs: { type: Array as () => StatusChangeLog[], default: () => [] } },
  setup(props) {
    const stageItems = [
      { key: 'evaluation', label: '评估', icon: FileTextOutlined },
      { key: 'inspection', label: '检测', icon: SafetyCertificateOutlined },
      { key: 'preparation', label: '整备', icon: WrenchOutlined },
      { key: 'testdrive', label: '试驾', icon: ThunderboltOutlined },
    ]
    const statusTimeline = computed(() => {
      const events = props.trace?.timeline?.filter(e => e.type === 'status' || e.type === 'create') || []
      return events.slice().reverse().map(e => ({
        type: 'success' as const,
        title: e.title,
        content: `${e.operator} · ${e.time_display}`,
        meta: e.detail,
      }))
    })
    return () => h('div', { class: 'space-y-4' }, [
      h(NCard, { title: '阶段进度', size: 'small', bordered: false }, () => [
        h('div', { class: 'px-4 py-2' }, [
          h(NProgress, { type: 'line', percentage: props.vehicle?.stage_completion?.percentage || 0, height: 12, status: 'success', indicatorPlacement: 'inside' }, () => `${props.vehicle?.stage_completion?.done || 0}/${props.vehicle?.stage_completion?.total || 0} 已完成`),
          h(NSteps, { current: (props.vehicle?.stage_completion?.done || 0), size: 'small', status: 'process', class: 'mt-6' }, () =>
            stageItems.map((s, i) => h(NStep, {
              key: s.key,
              status: props.vehicle?.stage_completion?.stages?.[s.key as keyof typeof props.vehicle.stage_completion.stages] ? 'finish' : (i < (props.vehicle?.stage_completion?.done || 0) ? 'finish' : (i === (props.vehicle?.stage_completion?.done || 0) ? 'process' : 'wait')),
              title: s.label,
            }, {
              icon: () => h(NIcon, { size: 18, component: s.icon }),
            }))
          ),
        ]),
      ]),
      h(NGrid, { cols: 2, xGap: 16 }, () => [
        h(NGi, () => h(NCard, { title: '车辆信息', size: 'small', bordered: false }, () =>
          h(NDescriptions, { labelPlacement: 'left', column: 1, size: 'small' }, () => [
            h(NDescriptionsItem, { label: 'VIN码' }, () => props.vehicle?.vin || '-'),
            h(NDescriptionsItem, { label: '车牌号' }, () => props.vehicle?.plate_number || '-'),
            h(NDescriptionsItem, { label: '品牌车系' }, () => `${props.vehicle?.brand || '-'} ${props.vehicle?.model || ''}`),
            h(NDescriptionsItem, { label: '年款颜色' }, () => `${props.vehicle?.year || '-'}款 ${props.vehicle?.color || ''}`),
            h(NDescriptionsItem, { label: '排量变速箱' }, () => `${props.vehicle?.displacement || '-'} / ${props.vehicle?.transmission || ''}`),
            h(NDescriptionsItem, { label: '里程燃料' }, () => `${(props.vehicle?.mileage || 0).toLocaleString()}km / ${props.vehicle?.fuel_type || ''}`),
            h(NDescriptionsItem, { label: '首次上牌' }, () => props.vehicle?.first_register_date || '-'),
            h(NDescriptionsItem, { label: '车主信息' }, () => `${props.vehicle?.owner_name || '-'} ${props.vehicle?.owner_phone || ''}`),
          ])
        )),
        h(NGi, () => h(NCard, { title: '价格信息', size: 'small', bordered: false }, () =>
          h(NDescriptions, { labelPlacement: 'left', column: 1, size: 'small' }, () => [
            h(NDescriptionsItem, { label: '收购价格' }, () => props.vehicle?.purchase_price ? `¥${props.vehicle.purchase_price.toLocaleString()}` : '-'),
            h(NDescriptionsItem, { label: '期望售价' }, () => props.vehicle?.expected_price ? `¥${props.vehicle.expected_price.toLocaleString()}` : '-'),
            h(NDescriptionsItem, { label: '实际售价' }, () => props.vehicle?.selling_price ? `¥${props.vehicle.selling_price.toLocaleString()}` : '-'),
            h(NDescriptionsItem, { label: '评估师' }, () => props.vehicle?.appraiser_info ? `${props.vehicle.appraiser_info.first_name}${props.vehicle.appraiser_info.last_name}` : '-'),
            h(NDescriptionsItem, { label: '销售顾问' }, () => props.vehicle?.salesperson_info ? `${props.vehicle.salesperson_info.first_name}${props.vehicle.salesperson_info.last_name}` : '-'),
            h(NDescriptionsItem, { label: '创建时间' }, () => dayjs(props.vehicle?.created_at).format('YYYY-MM-DD HH:mm')),
            h(NDescriptionsItem, { label: '上架时间' }, () => props.vehicle?.listed_at ? dayjs(props.vehicle.listed_at).format('YYYY-MM-DD') : '-'),
            h(NDescriptionsItem, { label: '售出时间' }, () => props.vehicle?.sold_at ? dayjs(props.vehicle.sold_at).format('YYYY-MM-DD') : '-'),
          ])
        )),
      ]),
      h(NCard, { title: '车辆描述', size: 'small', bordered: false }, () => [
        h(NDescriptions, { labelPlacement: 'left', column: 1, size: 'small' }, () => [
          h(NDescriptionsItem, { label: '车况描述' }, () => props.vehicle?.description || '-'),
          h(NDescriptionsItem, { label: '备注' }, () => props.vehicle?.remark || '-'),
        ]),
      ]),
      h(NCard, { title: '状态流转时间线', size: 'small', bordered: false }, () =>
        h(NTimeline, { size: 'medium' }, () =>
          statusTimeline.value.map((e, i) => h(NTimelineItem, {
            key: i, type: e.type, title: e.title, time: e.content,
          }, () => e.meta || ''))
        )
      ),
    ])
  },
})

const InspectionPanel = defineComponent({
  name: 'InspectionPanel',
  props: { reports: { type: Array as () => InspectionReport[], default: () => [] } },
  setup(props) {
    const ratingTagType = (r: string) => {
      const m: Record<string, any> = { excellent: 'success', good: 'info', average: 'warning', poor: 'error' }
      return m[r] || 'default'
    }
    return () => h('div', { class: 'space-y-4' },
      props.reports.length === 0
        ? [h(NEmpty, { description: '暂无检测报告' })]
        : props.reports.map((report, idx) => h('div', { key: idx }, [
          h(NCard, { title: `检测报告 #${report.report_no}`, size: 'small', bordered: false }, () => [
            h(NSpace, { class: 'mb-4', wrap: true, justify: 'space-between' }, () => [
              h(NDescriptions, { labelPlacement: 'left', column: 4, size: 'small' }, () => [
                h(NDescriptionsItem, { label: '检测师' }, () => report.inspector_info ? `${report.inspector_info.first_name}${report.inspector_info.last_name}` : '-'),
                h(NDescriptionsItem, { label: '检测日期' }, () => report.inspection_date),
                h(NDescriptionsItem, { label: '检测里程' }, () => report.mileage ? `${report.mileage.toLocaleString()}km` : '-'),
                h(NDescriptionsItem, { label: '报告状态' }, () => h(NTag, { size: 'small', type: report.status === 'completed' ? 'success' : 'warning', bordered: false }, () => report.status_display)),
              ]),
            ]),
            h(NGrid, { cols: 5, xGap: 12, class: 'mb-4' }, () => [
              h(NGi, () => h(NCard, { size: 'small', bordered: false, class: 'text-center bg-gradient-to-br from-green-50 to-green-100' }, () => [
                h('div', { class: 'text-2xl font-bold text-green-600' }, report.overall_rating_display),
                h('div', { class: 'text-xs text-gray-500 mt-1' }, '综合评级'),
              ])),
              h(NGi, () => h(NCard, { size: 'small', bordered: false, class: 'text-center' }, () => [
                h(NSpace, { vertical: true, size: 4, align: 'center' }, () => [
                  report.has_accident
                    ? h(NTag, { size: 'small', type: 'error' }, () => [h(NIcon, { component: AlertOutlined, class: 'mr-1', size: 12 }), '事故车'])
                    : h(NTag, { size: 'small', type: 'success' }, () => [h(NIcon, { component: CheckOutlined, class: 'mr-1', size: 12 }), '无事故']),
                  h('span', { class: 'text-xs text-gray-500' }, '事故检测'),
                ]),
              ])),
              h(NGi, () => h(NCard, { size: 'small', bordered: false, class: 'text-center' }, () => [
                h(NSpace, { vertical: true, size: 4, align: 'center' }, () => [
                  report.has_water_damage
                    ? h(NTag, { size: 'small', type: 'error' }, () => [h(NIcon, { component: AlertOutlined, class: 'mr-1', size: 12 }), '泡水车'])
                    : h(NTag, { size: 'small', type: 'success' }, () => [h(NIcon, { component: CheckOutlined, class: 'mr-1', size: 12 }), '无泡水']),
                  h('span', { class: 'text-xs text-gray-500' }, '泡水检测'),
                ]),
              ])),
              h(NGi, () => h(NCard, { size: 'small', bordered: false, class: 'text-center' }, () => [
                h(NSpace, { vertical: true, size: 4, align: 'center' }, () => [
                  report.has_fire_damage
                    ? h(NTag, { size: 'small', type: 'error' }, () => [h(NIcon, { component: AlertOutlined, class: 'mr-1', size: 12 }), '火烧车'])
                    : h(NTag, { size: 'small', type: 'success' }, () => [h(NIcon, { component: CheckOutlined, class: 'mr-1', size: 12 }), '无火烧']),
                  h('span', { class: 'text-xs text-gray-500' }, '火烧检测'),
                ]),
              ])),
              h(NGi, () => h(NCard, { size: 'small', bordered: false, class: 'text-center' }, () => [
                h(NSpace, { vertical: true, size: 4, align: 'center' }, () => [
                  report.has_structural_damage
                    ? h(NTag, { size: 'small', type: 'error' }, () => [h(NIcon, { component: AlertOutlined, class: 'mr-1', size: 12 }), '结构损伤'])
                    : h(NTag, { size: 'small', type: 'success' }, () => [h(NIcon, { component: CheckOutlined, class: 'mr-1', size: 12 }), '结构完好']),
                  h('span', { class: 'text-xs text-gray-500' }, '结构检测'),
                ]),
              ])),
            ]),
            h(NDescriptions, { labelPlacement: 'left', column: 1, size: 'small', class: 'mb-4' }, () => [
              h(NDescriptionsItem, { label: '总体情况' }, () => report.general_condition || '-'),
              h(NDescriptionsItem, { label: '存在问题' }, () => report.issues || '-'),
              h(NDescriptionsItem, { label: '处理建议' }, () => report.suggestions || '-'),
            ]),
          ]),
          h(NCard, { title: '检测明细', size: 'small', bordered: false, class: 'mt-4' }, () => [
            h(NDataTable, {
              columns: [
                { title: '检测项', key: 'item_display', width: 120 },
                { title: '评级', key: 'rating', width: 100, render: (row: any) => h(NTag, { size: 'small', type: ratingTagType(row.rating), bordered: false }, () => row.rating_display) },
                { title: '描述', key: 'description' },
              ],
              data: report.items,
              bordered: false,
              size: 'small',
              pagination: false,
            }),
          ]),
        ]))
    )
  },
})

const PreparationPanel = defineComponent({
  name: 'PreparationPanel',
  props: { orders: { type: Array as () => PreparationOrder[], default: () => [] } },
  setup(props) {
    return () => h('div', { class: 'space-y-4' },
      props.orders.length === 0
        ? [h(NEmpty, { description: '暂无整备记录' })]
        : props.orders.map((order, idx) => h('div', { key: idx }, [
          h(NCard, { title: `整备单 #${order.order_no}`, size: 'small', bordered: false }, () => [
            h(NSpace, { wrap: true, justify: 'space-between', class: 'mb-4' }, () => [
              h(NSpace, { wrap: true }, () => [
                h(NTag, { size: 'small', type: order.status === 'completed' ? 'success' : order.status === 'in_progress' ? 'warning' : 'default', bordered: false }, () => order.status_display),
                h(NTag, { size: 'small', type: 'info', bordered: false }, () => `进度 ${order.done_count}/${order.total_count}`),
              ]),
              h(NSpace, { size: 24 }, () => [
                h(NStatistic, { label: '预估费用', value: order.total_estimated, prefix: () => h(NIcon, { component: TagOutlined }) }),
                h(NStatistic, { label: '实际费用', value: order.total_actual, valueStyle: { color: '#f59e0b' }, prefix: () => h(NIcon, { component: TagOutlined }) }),
                h(NStatistic, { label: '已节省', value: Math.max(0, order.total_estimated - order.total_actual), valueStyle: { color: '#18a058' }, prefix: () => h(NIcon, { component: PlusOutlined }) }),
              ]),
            ]),
            h(NDescriptions, { labelPlacement: 'left', column: 4, size: 'small', class: 'mb-4' }, () => [
              h(NDescriptionsItem, { label: '负责人' }, () => order.handler_info ? `${order.handler_info.first_name}${order.handler_info.last_name}` : '-'),
              h(NDescriptionsItem, { label: '开始日期' }, () => order.start_date || '-'),
              h(NDescriptionsItem, { label: '完成日期' }, () => order.end_date || '-'),
              h(NDescriptionsItem, { label: '核验状态' }, () => h(NTag, { size: 'small', type: order.verified ? 'success' : 'warning', bordered: false }, () => order.verified ? '已核验' : '待核验')),
            ]),
            h(NProgress, { type: 'line', percentage: Math.round((order.done_count / order.total_count) * 100), height: 8, status: order.done_count === order.total_count ? 'success' : 'process' }),
            order.remark ? h(NAffix, { offsetTop: 0 }, () => {}) || h('div', { class: 'mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600' }, `备注: ${order.remark}`) : null,
          ]),
          h(NCard, { title: '整备项目明细', size: 'small', bordered: false, class: 'mt-4' }, () => [
            h(NDataTable, {
              columns: [
                { title: '分类', key: 'category_display', width: 100, render: (row: any) => h(NTag, { size: 'small', type: 'info', bordered: false }, () => row.category_display) },
                { title: '项目名称', key: 'name', width: 160 },
                { title: '描述', key: 'description' },
                { title: '预估', key: 'estimated_cost', width: 90, align: 'right', render: (row: any) => `¥${row.estimated_cost.toLocaleString()}` },
                { title: '实际', key: 'actual_cost', width: 90, align: 'right', render: (row: any) => row.actual_cost > 0 ? `¥${row.actual_cost.toLocaleString()}` : '-' },
                { title: '状态', key: 'is_done', width: 90, render: (row: any) => row.is_done ? h(NSpace, { size: 4, align: 'center' }, () => [h(NIcon, { component: CheckOutlined, size: 14, style: { color: '#18a058' } }), '已完成']) : h(NSpace, { size: 4, align: 'center' }, () => [h(NIcon, { component: MinusOutlined, size: 14, style: { color: '#f59e0b' } }), '进行中']) },
              ],
              data: order.items,
              bordered: false,
              size: 'small',
              pagination: false,
            }),
          ]),
        ]))
    )
  },
})

const TestDrivePanel = defineComponent({
  name: 'TestDrivePanel',
  props: { records: { type: Array as () => TestDriveRecord[], default: () => [] } },
  setup(props) {
    const intentTagType = (s: string) => {
      const m: Record<string, any> = { high: 'success', medium: 'warning', low: 'default', none: 'error' }
      return m[s] || 'default'
    }
    const feelColumns = (record: TestDriveRecord) => [
      { label: '刹车感受', value: record.brake_feeling || '-' },
      { label: '换挡感受', value: record.shift_feeling || '-' },
      { label: '乘坐舒适度', value: record.ride_comfort || '-' },
      { label: '噪音水平', value: record.noise_level || '-' },
      { label: '操控体验', value: record.handling || '-' },
      { label: '异响情况', value: record.abnormal_noise || '-' },
    ]
    return () => h('div', { class: 'space-y-4' },
      props.records.length === 0
        ? [h(NEmpty, { description: '暂无试驾记录' })]
        : props.records.map((record, idx) => h(NCard, { key: idx, title: `试驾记录 #${record.record_no}`, size: 'small', bordered: false }, () => [
          h(NGrid, { cols: 2, xGap: 16 }, () => [
            h(NGi, () => h(NCard, { title: '客户信息', size: 'small', bordered: false, class: 'bg-blue-50/50' }, () =>
              h(NDescriptions, { labelPlacement: 'left', column: 1, size: 'small' }, () => [
                h(NDescriptionsItem, { label: '客户姓名' }, () => record.customer_name),
                h(NDescriptionsItem, { label: '联系电话' }, () => record.customer_phone),
                h(NDescriptionsItem, { label: '身份证号' }, () => record.customer_id_card),
                h(NDescriptionsItem, { label: '驾驶证号' }, () => record.license_number),
                h(NDescriptionsItem, { label: '销售顾问' }, () => record.salesperson_info ? `${record.salesperson_info.first_name}${record.salesperson_info.last_name}` : '-'),
                h(NDescriptionsItem, { label: '预约时间' }, () => dayjs(record.scheduled_at).format('YYYY-MM-DD HH:mm')),
              ])
            )),
            h(NGi, () => h(NCard, { title: '试驾概要', size: 'small', bordered: false, class: 'bg-green-50/50' }, () =>
              h(NDescriptions, { labelPlacement: 'left', column: 1, size: 'small' }, () => [
                h(NDescriptionsItem, { label: '试驾状态' }, () => h(NTag, { size: 'small', type: record.status === 'completed' ? 'success' : record.status === 'cancelled' ? 'error' : 'warning', bordered: false }, () => record.status_display)),
                h(NDescriptionsItem, { label: '试驾时长' }, () => record.testdrive_duration ? `${record.testdrive_duration}分钟` : '-'),
                h(NDescriptionsItem, { label: '试驾里程' }, () => record.testdrive_distance ? `${record.testdrive_distance}km` : '-'),
                h(NDescriptionsItem, { label: '意向评级' }, () => record.purchase_intent ? h(NTag, { size: 'small', type: intentTagType(record.purchase_intent), bordered: false }, () => record.purchase_intent_display) : '-'),
                h(NDescriptionsItem, { label: '客户出价' }, () => record.expected_price ? `¥${record.expected_price.toLocaleString()}` : '-'),
                h(NDescriptionsItem, { label: '核验状态' }, () => h(NTag, { size: 'small', type: record.verified ? 'success' : 'warning', bordered: false }, () => record.verified ? '已核验' : '待核验')),
              ])
            )),
          ]),
          h(NCard, { title: '试驾路线与反馈', size: 'small', bordered: false, class: 'mt-4' }, () => [
            h(NDescriptions, { labelPlacement: 'left', column: 1, size: 'small', class: 'mb-4' }, () => [
              h(NDescriptionsItem, { label: '试驾路线' }, () => record.route || '-'),
              h(NDescriptionsItem, { label: '起始里程' }, () => record.start_mileage ? `${record.start_mileage.toLocaleString()}km` : '-'),
              h(NDescriptionsItem, { label: '结束里程' }, () => record.end_mileage ? `${record.end_mileage.toLocaleString()}km` : '-'),
              h(NDescriptionsItem, { label: '客户反馈' }, () => record.feedback || '-'),
              h(NDescriptionsItem, { label: '其他问题' }, () => record.other_issues || '-'),
              h(NDescriptionsItem, { label: '备注' }, () => record.remark || '-'),
            ]),
          ]),
          h(NCard, { title: '试驾体验', size: 'small', bordered: false, class: 'mt-4' }, () => [
            h(NDataTable, {
              columns: [
                { title: '体验项', key: 'label', width: 120 },
                { title: '评价', key: 'value' },
              ],
              data: feelColumns(record),
              bordered: false,
              size: 'small',
              pagination: false,
            }),
          ]),
        ]))
    )
  },
})

const DocumentsPanel = defineComponent({
  name: 'DocumentsPanel',
  props: { documents: { type: Array as () => VehicleDocument[], default: () => [] } },
  emits: ['refresh'],
  setup(props, { emit }) {
    const message = useMessage()
    const dialog = useDialog()
    const showUploadModal = ref(false)
    const uploadDocType = ref<DocumentType>('other')
    const uploadTitle = ref('')

    const groupedDocs = computed(() => {
      const groups: Record<string, VehicleDocument[]> = {}
      props.documents.forEach(d => {
        const cat = d.category_display || '其他'
        if (!groups[cat]) groups[cat] = []
        groups[cat].push(d)
      })
      return groups
    })

    const sourceTagType = (s: string) => {
      const m: Record<string, any> = { owner: 'success', '4s': 'info', missing: 'error', pending: 'warning', finance: 'warning' }
      return m[s] || 'default'
    }

    async function handleVerify(doc: VehicleDocument) {
      try {
        const { $api } = useNuxtApp()
        await $api.post(`/documents/${doc.id}/verify/`)
        message.success('核验成功')
        emit('refresh')
      } catch (e: any) {
        message.error(e.message || '核验失败')
      }
    }

    async function handleClose(doc: VehicleDocument) {
      dialog.warning({
        title: '确认关闭该文件？',
        content: '关闭后该文件将标记为归档状态',
        positiveText: '确认关闭',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            const { $api } = useNuxtApp()
            await $api.post(`/documents/${doc.id}/close/`)
            message.success('已关闭')
            emit('refresh')
          } catch (e: any) {
            message.error(e.message || '操作失败')
          }
        },
      })
    }

    function handleView(doc: VehicleDocument) {
      if (doc.file_url) {
        window.open(doc.file_url, '_blank')
      } else {
        message.info('文件预览暂不可用')
      }
    }

    async function submitUpload() {
      if (!uploadTitle.value.trim()) {
        message.warning('请输入文件标题')
        return
      }
      try {
        message.success('上传功能演示成功')
        showUploadModal.value = false
        uploadDocType.value = 'other'
        uploadTitle.value = ''
        emit('refresh')
      } catch (e: any) {
        message.error(e.message || '上传失败')
      }
    }

    const docTypeOptions = [
      { label: '登记证书', value: 'registration_cert' },
      { label: '行驶证', value: 'driving_license' },
      { label: '保险单', value: 'insurance' },
      { label: '保养记录', value: 'maintenance_record' },
      { label: '车钥匙', value: 'keys' },
      { label: '购车发票', value: 'invoice' },
      { label: '其他', value: 'other' },
    ]

    return () => h('div', { class: 'space-y-4' }, [
      h(NSpace, { class: 'mb-4', justify: 'end' }, () => [
        h(NButton, { type: 'primary', onClick: () => showUploadModal.value = true }, () => [h(NIcon, { component: UploadOutlined, class: 'mr-1' }), '上传资料']),
      ]),
      props.documents.length === 0
        ? h(NEmpty, { description: '暂无附件资料' })
        : Object.entries(groupedDocs.value).map(([category, docs]) => h(NCard, { key: category, title: category, size: 'small', bordered: false }, () =>
          h(NGrid, { cols: 2, xGap: 12, yGap: 12 }, () =>
            docs.map((doc) => h(NGi, { key: doc.id }, () =>
              h(NCard, { size: 'small', class: `doc-card ${doc.is_closed ? 'opacity-60' : ''} hover:shadow-md transition-shadow`, hoverable: false }, () => [
                h('div', { class: 'flex items-start justify-between mb-2' }, [
                  h('div', { class: 'flex items-center gap-2 flex-1 min-w-0' }, [
                    h(NIcon, { component: FileProtectOutlined, size: 22, style: { color: doc.is_verified ? '#18a058' : doc.source === 'missing' ? '#f5222d' : '#2080f0' } }),
                    h('div', { class: 'flex-1 min-w-0' }, [
                      h('div', { class: 'font-semibold truncate' }, doc.title || '(未命名)'),
                      h(NSpace, { size: 6, wrap: true, class: 'mt-1' }, () => [
                        h(NTag, { size: 'small', type: sourceTagType(doc.source), bordered: false }, () => doc.source_display),
                        doc.is_verified ? h(NTag, { size: 'small', type: 'success', bordered: false }, () => [h(NIcon, { component: CheckCircleOutlined, size: 12, class: 'mr-0.5' }), '已核验']) : doc.source === 'missing' ? h(NTag, { size: 'small', type: 'error', bordered: false }, () => [h(NIcon, { component: ExclamationCircleOutlined, size: 12, class: 'mr-0.5' }), '待补充']) : h(NTag, { size: 'small', type: 'warning', bordered: false }, () => '待核验'),
                        doc.is_closed ? h(NTag, { size: 'small', type: 'default', bordered: false }, () => '已关闭') : null,
                        doc.file_size_display ? h(NTag, { size: 'small', bordered: false, type: 'info' }, () => doc.file_size_display) : null,
                      ]),
                    ]),
                  ]),
                ]),
                doc.description ? h('div', { class: 'text-xs text-gray-500 mb-2 line-clamp-2' }, doc.description) : null,
                doc.expire_date ? h('div', { class: 'text-xs text-gray-400 mb-3' }, `有效期至: ${doc.expire_date}`) : null,
                doc.uploaded_by_info ? h('div', { class: 'text-xs text-gray-400 mb-3' }, `上传: ${doc.uploaded_by_info.first_name}${doc.uploaded_by_info.last_name} · ${dayjs(doc.created_at).format('MM-DD HH:mm')}`) : null,
                h(NSpace, { size: 6, wrap: true }, () => [
                  doc.file_url || doc.file_path
                    ? h(NButton, { size: 'tiny', type: 'primary', ghost, onClick: () => handleView(doc) }, () => [h(NIcon, { component: EyeOutlined, size: 14, class: 'mr-0.5' }), '查看'])
                    : null,
                  !doc.is_verified && doc.source !== 'missing'
                    ? h(NButton, { size: 'tiny', type: 'success', ghost, onClick: () => handleVerify(doc) }, () => [h(NIcon, { component: UnlockOutlined, size: 14, class: 'mr-0.5' }), '核验'])
                    : null,
                  !doc.is_closed
                    ? h(NButton, { size: 'tiny', type: 'default', ghost, onClick: () => handleClose(doc) }, () => [h(NIcon, { component: LockOutlined, size: 14, class: 'mr-0.5' }), '关闭'])
                    : null,
                ]),
                doc.process_history && doc.process_history.length > 0
                  ? h(NCollapse, { class: 'mt-3' }, () => [
                    h(NCollapseItem, { title: '处理过程', name: `history-${doc.id}` }, () =>
                      h(NTimeline, { size: 'small' }, () =>
                        doc.process_history!.map((p, pi) => h(NTimelineItem, {
                          key: pi, title: `${p.action} · ${p.operator}`, time: dayjs(p.timestamp).format('MM-DD HH:mm'),
                        }, () => p.note || ''))
                      )
                    ),
                  ])
                  : null,
                doc.close_conclusion
                  ? h('div', { class: 'mt-3 p-2 bg-gray-50 rounded text-xs' }, `关闭结论: ${doc.close_conclusion}`)
                  : null,
              ])
            ))
          )
        )),
      h(NModal, { 'show:modelValue': showUploadModal.value, 'onUpdate:show': (v: boolean) => showUploadModal.value = v, preset: 'card', title: '上传资料', style: 'width: 480px' }, () => [
        h(NForm, { 'label-placement': 'left', 'label-width': '100px' }, () => [
          h(NFormItem, { label: '资料类型', required: true }, () =>
            h(NSelect, { 'value:modelValue': uploadDocType.value, 'onUpdate:value': (v: DocumentType) => uploadDocType.value = v, options: docTypeOptions, placeholder: '请选择资料类型' })
          ),
          h(NFormItem, { label: '文件标题', required: true }, () =>
            h(NInput, { 'value:modelValue': uploadTitle.value, 'onUpdate:value': (v: string) => uploadTitle.value = v, placeholder: '请输入文件标题' })
          ),
          h(NFormItem, { label: '选择文件' }, () =>
            h(NUpload, { 'max': 1, accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', 'on-before-upload': () => { message.success('文件选择成功（演示）'); return false } }, () =>
              h(NButton, null, () => [h(NIcon, { component: UploadOutlined, class: 'mr-1' }), '点击选择文件'])
            )
          ),
        ]),
        {
          footer: () => h(NSpace, { justify: 'end' }, () => [
            h(NButton, { onClick: () => { showUploadModal.value = false; uploadDocType.value = 'other'; uploadTitle.value = '' } }, () => '取消'),
            h(NButton, { type: 'primary', onClick: submitUpload }, () => '提交'),
          ]),
        },
      ]),
    ])
  },
})

const ReviewPanel = defineComponent({
  name: 'ReviewPanel',
  props: { records: { type: Array as () => ReviewRecord[], default: () => [] } },
  setup(props) {
    const docTypeLabel = (t: DocumentType) => {
      const m: Record<string, string> = { registration_cert: '登记证书', driving_license: '行驶证', insurance: '保险单', maintenance_record: '保养记录', keys: '车钥匙', invoice: '购车发票', other: '其他' }
      return m[t] || t
    }
    return () => h('div', { class: 'space-y-4' },
      props.records.length === 0
        ? [h(NEmpty, { description: '暂无复核记录' })]
        : [h(NTimeline, { size: 'large' }, () =>
          props.records.slice().reverse().map((r) => h(NTimelineItem, {
            key: r.id,
            type: r.status === 'pass' ? 'success' : r.status === 'reject' ? 'error' : r.status === 'supplemented' ? 'warning' : 'default',
            title: `复核#${r.id} · ${r.status_display}`,
            time: dayjs(r.created_at).format('YYYY-MM-DD HH:mm'),
          }, () => [
            h(NCard, { size: 'small', bordered: false, class: 'mt-2' }, () => [
              h(NSpace, { vertical: true, size: 12, class: 'w-full' }, () => [
                h('div', { class: 'flex items-center gap-2' }, [
                  h(NAvatar, { round: true, size: 'small', style: 'background: #18a058' }, () => r.reviewer_info?.first_name?.[0] || r.reviewer_info?.username?.[0] || 'R'),
                  h('span', { class: 'font-medium' }, r.reviewer_info ? `${r.reviewer_info.first_name}${r.reviewer_info.last_name}` : '未知审核人'),
                  h(NTag, { size: 'small', type: r.status === 'pass' ? 'success' : r.status === 'reject' ? 'error' : r.status === 'supplemented' ? 'warning' : 'default', bordered: false }, () => r.status_display),
                ]),
                h(NDescriptions, { labelPlacement: 'left', column: 1, size: 'small' }, () => [
                  h(NDescriptionsItem, { label: '复核结论' }, () => r.conclusion || '-'),
                  h(NDescriptionsItem, { label: '复核意见' }, () => r.comment || '-'),
                ]),
                r.missing_items && r.missing_items.length > 0
                  ? h('div', null, [
                    h('div', { class: 'text-xs text-gray-500 mb-2' }, '缺失项:'),
                    h(NSpace, { size: 6, wrap: true }, () =>
                      r.missing_items!.map((m, mi) => h(NTag, { key: mi, size: 'small', type: 'error', bordered: false }, () => [
                        h(NIcon, { component: ExclamationCircleOutlined, size: 12, class: 'mr-0.5' }), docTypeLabel(m),
                      ]))
                    ),
                  ])
                  : null,
              ]),
            ]),
          ]))
        )]
    )
  },
})

const SidePanel = defineComponent({
  name: 'SidePanel',
  props: { vehicle: { type: Object as () => VehicleDetail | null, default: null }, trace: { type: Object as () => VehicleTrace | null, default: null } },
  setup(props) {
    const docTypeLabel = (t: DocumentType) => {
      const m: Record<string, string> = { registration_cert: '登记证书', driving_license: '行驶证', insurance: '保险单', maintenance_record: '保养记录', keys: '车钥匙', invoice: '购车发票', other: '其他' }
      return m[t] || t
    }
    return () => h('div', { class: 'space-y-4 sticky top-4' }, [
      h(NCard, { size: 'small', bordered: false, title: '资料概况' }, () => [
        h(NSpace, { vertical: true, size: 12, class: 'w-full' }, () => [
          h('div', { class: 'flex items-center justify-between' }, [
            h('span', { class: 'text-sm text-gray-500' }, '资料总数'),
            h(NTag, { type: 'info', bordered: false }, () => `${props.trace?.documents_count || 0}份`),
          ]),
          h('div', { class: 'flex items-center justify-between' }, [
            h('span', { class: 'text-sm text-gray-500' }, '复核次数'),
            h(NTag, { type: 'warning', bordered: false }, () => `${props.trace?.review_records_count || 0}次`),
          ]),
          h('div', { class: 'flex items-center justify-between' }, [
            h('span', { class: 'text-sm text-gray-500' }, '资料完整'),
            props.vehicle?.document_status?.complete
              ? h(NTag, { type: 'success', bordered: false }, () => [h(NIcon, { component: CheckOutlined, size: 12, class: 'mr-0.5' }), '完整'])
              : h(NTag, { type: 'error', bordered: false }, () => [h(NIcon, { component: AlertOutlined, size: 12, class: 'mr-0.5' }), `缺${props.vehicle?.document_status?.missing_count || 0}项`]),
          ]),
          props.vehicle?.document_status?.missing_types && props.vehicle.document_status.missing_types.length > 0
            ? h('div', null, [
              h('div', { class: 'text-xs text-gray-400 mb-2' }, '缺失证件:'),
              h(NSpace, { size: 4, wrap: true }, () =>
                props.vehicle!.document_status.missing_types.map((m, i) => h(NTag, { key: i, size: 'small', type: 'error', bordered: false }, () => docTypeLabel(m)))
              ),
            ])
            : null,
        ]),
      ]),
      h(NCard, { size: 'small', bordered: false, title: '操作追溯' }, () => [
        h(NTimeline, { size: 'small' }, () =>
          (props.trace?.timeline || []).slice().reverse().slice(0, 6).map((e, i) => h(NTimelineItem, {
            key: i,
            type: e.type === 'review' ? 'success' : e.type === 'document' ? 'warning' : 'info',
            title: e.title,
            time: e.time_display,
          }, () => e.detail || ''))
        ),
      ]),
      h(NCard, { size: 'small', bordered: false, title: '材料来源' }, () =>
        h('div', { class: 'text-sm' }, [
          props.vehicle?.source
            ? h('div', { class: 'flex items-center gap-2 mb-2' }, [
              h(NIcon, { component: InfoCircleOutlined, size: 14, style: { color: '#2080f0' } }),
              h('span', null, props.vehicle.source),
            ])
            : h('span', { class: 'text-gray-400' }, '暂无来源信息'),
        ])
      ),
    ])
  },
})

onMounted(() => {
  Promise.all([
    loadVehicle(),
    loadInspections(),
    loadPreparations(),
    loadTestDrives(),
    loadDocuments(),
    loadReviewRecords(),
    loadTrace(),
  ])
})
</script>

<style scoped>
.doc-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
}
.doc-card:hover {
  border-color: #18a058;
  box-shadow: 0 4px 12px rgba(24, 160, 88, 0.1);
}
:deep(.n-collapse-item .n-collapse-item__header) {
  padding: 4px 0;
  font-size: 12px;
  color: #6b7280;
}
</style>
