<template>
  <div class="page-container" style="padding: 16px;">
    <NSpace justify="space-between" align="center" style="margin-bottom: 16px;">
      <NBreadcrumb>
        <NBreadcrumbItem @click="navigateTo('/')">首页</NBreadcrumbItem>
        <NBreadcrumbItem @click="navigateTo('/records')">记录池</NBreadcrumbItem>
        <NBreadcrumbItem>工作台 - {{ currentRecord?.contract_no || '' }}</NBreadcrumbItem>
      </NBreadcrumb>
      <NSpace align="center">
        <NTag :type="statusTagType(currentRecord?.status)" size="large">{{ statusLabel(currentRecord?.status) }}</NTag>
        <NButton v-if="currentRecord?.status === 'pending' || currentRecord?.status === 'exception'" type="primary" @click="handleSubmitReview">提交复核</NButton>
        <NButton v-if="canReview" type="success" @click="showApproveModal = true">通过</NButton>
        <NButton v-if="canReview" type="warning" @click="showRejectModal = true">退回</NButton>
        <NButton v-if="currentRecord?.status === 'completed'" @click="showTagModal = true">添加复盘标签</NButton>
        <NButton v-if="currentRecord?.status === 'completed'" secondary @click="navigateTo('/records/completed')">返回已完成池</NButton>
      </NSpace>
    </NSpace>

    <NSpin :show="recordsStore.loading">
      <div class="workspace-layout" :class="{ 'workspace-rejected': isRejected }">
        <div class="workspace-panel">
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--color-primary);">报价历史</h3>
          <NTimeline>
            <NTimelineItem
              v-for="(q, idx) in recordsStore.quotations"
              :key="q.id"
              :type="idx === 0 ? 'success' : 'default'"
            >
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div class="mono" style="font-size: 18px; font-weight: 600;">¥{{ formatPrice(q.price) }}</div>
                  <NText depth="3" style="font-size: 12px;">{{ formatDate(q.quoted_at) }} · {{ q.quoted_by?.username }}</NText>
                </div>
              </div>
              <NText v-if="q.note" style="font-size: 12px; margin-top: 4px; display: block;">{{ q.note }}</NText>
            </NTimelineItem>
          </NTimeline>
          <NEmpty v-if="recordsStore.quotations.length === 0" description="暂无报价" style="margin-top: 40px;" />
          <NDivider />
          <NButton dashed block :disabled="!canEdit" @click="showQuotationModal = true">新增报价</NButton>
        </div>

        <div class="workspace-panel">
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--color-primary);">过户材料</h3>
          <NForm :model="recordForm" label-placement="left" label-width="100px" :disabled="!canEdit">
            <NFormItem label="合同编号">
              <NInput v-model:value="recordForm.contract_no" />
            </NFormItem>
            <NFormItem label="买方姓名">
              <NInput v-model:value="recordForm.buyer_name" />
            </NFormItem>
            <NFormItem label="买方身份证号">
              <NInput v-model:value="recordForm.buyer_id_no" />
            </NFormItem>
            <NFormItem label="卖方姓名">
              <NInput v-model:value="recordForm.seller_name" />
            </NFormItem>
            <NFormItem label="卖方身份证号">
              <NInput v-model:value="recordForm.seller_id_no" />
            </NFormItem>
            <NFormItem label="过户税费">
              <NInputNumber v-model:value="recordForm.transfer_tax" :min="0" :precision="2" style="width: 100%;" />
            </NFormItem>
            <NFormItem v-if="isCompleted && currentRecord?.review_note" label="复核备注">
              <NInput type="textarea" :value="currentRecord.review_note" readonly />
            </NFormItem>
            <NFormItem v-if="canEdit">
              <NSpace>
                <NButton type="primary" @click="handleSaveRecord">保存</NButton>
                <NButton @click="showExceptionModal = true">标记异常</NButton>
              </NSpace>
            </NFormItem>
          </NForm>

          <NDivider v-if="currentRecord?.exception_items?.length" />

          <div v-if="currentRecord?.exception_items?.length">
            <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--color-danger);">异常项</h4>
            <NSpace>
              <NTag
                v-for="ex in currentRecord.exception_items"
                :key="ex.id"
                :type="ex.status === 'closed' ? 'success' : 'error'"
                size="small"
              >
                {{ missingTypeLabel(ex.missing_type) }} ({{ urgencyLabel(ex.urgency) }})
              </NTag>
            </NSpace>
          </div>

          <NDivider v-if="currentRecord?.review_tags?.length" />

          <div v-if="currentRecord?.review_tags?.length">
            <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">复盘标签</h4>
            <NSpace>
              <NTag v-for="tag in currentRecord.review_tags" :key="tag" type="info" size="small" round>{{ tag }}</NTag>
            </NSpace>
          </div>
        </div>

        <div class="workspace-panel">
          <NCollapse :default-expanded-names="['vehicle', 'finance']">
            <NCollapseItem title="车辆档案" name="vehicle">
              <NForm :model="vehicleForm" label-placement="left" label-width="80px" :disabled="!canEdit" size="small">
                <NFormItem label="品牌"><NInput v-model:value="vehicleForm.brand" /></NFormItem>
                <NFormItem label="型号"><NInput v-model:value="vehicleForm.model" /></NFormItem>
                <NFormItem label="VIN码"><NInput v-model:value="vehicleForm.vin" /></NFormItem>
                <NFormItem label="里程(km)"><NInputNumber v-model:value="vehicleForm.mileage" style="width: 100%;" /></NFormItem>
                <NFormItem label="车况评级">
                  <NSelect v-model:value="vehicleForm.condition_grade" :options="gradeOptions" />
                </NFormItem>
                <NFormItem label="初登日期"><NDatePicker v-model:value="vehicleForm.registration_date" type="date" style="width: 100%;" /></NFormItem>
                <NFormItem label="来源渠道">
                  <NSelect v-model:value="vehicleForm.source_channel" :options="channelOptions" />
                </NFormItem>
                <NFormItem><NButton type="primary" size="small" @click="handleSaveVehicle">保存车辆信息</NButton></NFormItem>
              </NForm>
              <NDivider />
              <h4 style="font-size: 13px; margin-bottom: 8px;">行驶证 / 登记证</h4>
              <NUpload :max="5" accept="image/*,.pdf" :custom-request="(opts: any) => handleFileUpload(opts, 'vehicle_license')">
                <NButton size="small" :disabled="!canEdit">上传证件</NButton>
              </NUpload>
            </NCollapseItem>

            <NCollapseItem title="金融资料" name="finance">
              <NForm :model="financeForm" label-placement="left" label-width="80px" :disabled="!canEdit" size="small">
                <NFormItem label="贷款方案"><NInput v-model:value="financeForm.loan_scheme" /></NFormItem>
                <NFormItem label="首付比例"><NInputNumber v-model:value="financeForm.down_payment_ratio" :min="0" :max="1" :step="0.01" :precision="4" style="width: 100%;" /></NFormItem>
                <NFormItem label="月供金额"><NInputNumber v-model:value="financeForm.monthly_payment" :min="0" :precision="2" style="width: 100%;" /></NFormItem>
                <NFormItem label="贷款月数"><NInputNumber v-model:value="financeForm.months" :min="0" style="width: 100%;" /></NFormItem>
                <NFormItem label="金融机构"><NInput v-model:value="financeForm.institution" /></NFormItem>
                <NFormItem><NButton type="primary" size="small" @click="handleSaveFinance">保存金融信息</NButton></NFormItem>
              </NForm>
              <NDivider />
              <h4 style="font-size: 13px; margin-bottom: 8px;">金融附件</h4>
              <NUpload :max="10" accept="image/*,.pdf" :custom-request="(opts: any) => handleFileUpload(opts, 'finance')">
                <NButton size="small" :disabled="!canEdit">上传附件</NButton>
              </NUpload>
            </NCollapseItem>
          </NCollapse>
        </div>
      </div>
    </NSpin>

    <NModal v-model:show="showQuotationModal" preset="dialog" title="新增报价" positive-text="添加" negative-text="取消" @positive-click="handleAddQuotation">
      <NForm :model="quotationForm" label-placement="left" label-width="80px">
        <NFormItem label="报价金额"><NInputNumber v-model:value="quotationForm.price" :min="0" :precision="2" style="width: 100%;" /></NFormItem>
        <NFormItem label="备注"><NInput v-model:value="quotationForm.note" type="textarea" /></NFormItem>
      </NForm>
    </NModal>

    <NModal v-model:show="showExceptionModal" preset="dialog" title="标记异常" positive-text="标记" negative-text="取消" @positive-click="handleMarkException">
      <NForm :model="exceptionForm" label-placement="left" label-width="80px">
        <NFormItem label="缺失类型">
          <NSelect v-model:value="exceptionForm.missing_type" :options="missingTypeOptions" />
        </NFormItem>
        <NFormItem label="紧急程度">
          <NRadioGroup v-model:value="exceptionForm.urgency">
            <NRadioButton value="low">低</NRadioButton>
            <NRadioButton value="medium">中</NRadioButton>
            <NRadioButton value="high">高</NRadioButton>
          </NRadioGroup>
        </NFormItem>
      </NForm>
    </NModal>

    <NModal v-model:show="showApproveModal" preset="dialog" title="复核通过" positive-text="确认" negative-text="取消" @positive-click="handleApprove">
      <NInput v-model:value="approveNote" type="textarea" placeholder="复核备注（选填）" :rows="3" />
    </NModal>

    <NModal v-model:show="showRejectModal" preset="dialog" title="退回记录" positive-text="确认退回" negative-text="取消" @positive-click="handleReject">
      <NInput v-model:value="rejectNote" type="textarea" placeholder="退回原因（必填）" :rows="3" />
    </NModal>

    <NModal v-model:show="showTagModal" preset="dialog" title="添加复盘标签" positive-text="添加" negative-text="取消" @positive-click="handleAddTag">
      <NInput v-model:value="tagName" placeholder="输入标签名" />
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { UploadCustomRequestOptions } from 'naive-ui'

const route = useRoute()
const api = useApi()
const recordsStore = useRecordsStore()
const authStore = useAuthStore()
const { message } = useNaiveDiscrete()

const currentRecord = computed(() => recordsStore.currentRecord)
const isCompleted = computed(() => currentRecord.value?.status === 'completed')
const isRejected = computed(() => {
  if (!currentRecord.value) return false
  return currentRecord.value.status === 'pending' && !!currentRecord.value.review_note && !!currentRecord.value.reviewer
})

const canReview = computed(() => {
  return currentRecord.value?.status === 'review' && (authStore.isManager || authStore.isFinance)
})

const canEdit = computed(() => {
  return currentRecord.value && currentRecord.value.status !== 'completed'
})

const recordForm = reactive({
  contract_no: '',
  buyer_name: '',
  buyer_id_no: '',
  seller_name: '',
  seller_id_no: '',
  transfer_tax: 0,
})

const vehicleForm = reactive({
  brand: '',
  model: '',
  vin: '',
  mileage: null as number | null,
  condition_grade: null as string | null,
  registration_date: null as number | null,
  source_channel: '',
})

const financeForm = reactive({
  loan_scheme: '',
  down_payment_ratio: null as number | null,
  monthly_payment: null as number | null,
  months: null as number | null,
  institution: '',
})

const quotationForm = reactive({ price: 0, note: '' })
const exceptionForm = reactive({ missing_type: 'buyer_id' as string, urgency: 'medium' as string })

const showQuotationModal = ref(false)
const showExceptionModal = ref(false)
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const showTagModal = ref(false)
const approveNote = ref('')
const rejectNote = ref('')
const tagName = ref('')

const gradeOptions = [
  { label: 'A - 优秀', value: 'A' },
  { label: 'B - 良好', value: 'B' },
  { label: 'C - 一般', value: 'C' },
  { label: 'D - 较差', value: 'D' },
]

const channelOptions = [
  { label: '个人', value: 'personal' },
  { label: '4S店', value: '4s' },
  { label: '拍卖', value: 'auction' },
  { label: '线上平台', value: 'online' },
  { label: '其他', value: 'other' },
]

const missingTypeOptions = [
  { label: '买方身份证', value: 'buyer_id' },
  { label: '卖方身份证', value: 'seller_id' },
  { label: '行驶证', value: 'license' },
  { label: '登记证', value: 'registration' },
  { label: '合同', value: 'contract' },
  { label: '金融资料', value: 'finance' },
  { label: '其他', value: 'other' },
]

function statusTagType(status?: string) {
  const map: Record<string, string> = { pending: 'warning', review: 'info', completed: 'success', exception: 'error' }
  return map[status || ''] || 'default'
}

function statusLabel(status?: string) {
  const map: Record<string, string> = { pending: '待处理', review: '待复核', completed: '已完成', exception: '异常' }
  return map[status || ''] || status || ''
}

function missingTypeLabel(type: string) {
  const map: Record<string, string> = { buyer_id: '买方身份证', seller_id: '卖方身份证', license: '行驶证', registration: '登记证', contract: '合同', finance: '金融资料', other: '其他' }
  return map[type] || type
}

function urgencyLabel(urgency: string) {
  const map: Record<string, string> = { high: '紧急', medium: '中等', low: '低' }
  return map[urgency] || urgency
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('zh-CN').format(price)
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function syncFormFromRecord() {
  if (currentRecord.value) {
    Object.assign(recordForm, {
      contract_no: currentRecord.value.contract_no,
      buyer_name: currentRecord.value.buyer_name,
      buyer_id_no: currentRecord.value.buyer_id_no,
      seller_name: currentRecord.value.seller_name,
      seller_id_no: currentRecord.value.seller_id_no,
      transfer_tax: currentRecord.value.transfer_tax,
    })
  }
  if (recordsStore.vehicleProfile) {
    Object.assign(vehicleForm, {
      brand: recordsStore.vehicleProfile.brand || '',
      model: recordsStore.vehicleProfile.model || '',
      vin: recordsStore.vehicleProfile.vin || '',
      mileage: recordsStore.vehicleProfile.mileage ?? null,
      condition_grade: recordsStore.vehicleProfile.condition_grade ?? null,
      registration_date: recordsStore.vehicleProfile.registration_date ? new Date(recordsStore.vehicleProfile.registration_date).getTime() : null,
      source_channel: recordsStore.vehicleProfile.source_channel || '',
    })
  }
  if (recordsStore.financeDoc) {
    Object.assign(financeForm, {
      loan_scheme: recordsStore.financeDoc.loan_scheme || '',
      down_payment_ratio: recordsStore.financeDoc.down_payment_ratio ?? null,
      monthly_payment: recordsStore.financeDoc.monthly_payment ?? null,
      months: recordsStore.financeDoc.months ?? null,
      institution: recordsStore.financeDoc.institution || '',
    })
  }
}

async function loadRecord() {
  const id = route.params.id as string
  await recordsStore.fetchRecord(id)
  syncFormFromRecord()
}

async function handleSaveRecord() {
  try {
    await recordsStore.updateRecord(currentRecord.value!.id, { ...recordForm })
    message.success('保存成功')
  } catch { message.error('保存失败') }
}

async function handleSaveVehicle() {
  try {
    const data = { ...vehicleForm } as any
    Object.keys(data).forEach(key => {
      if (data[key] === null) data[key] = undefined
    })
    await recordsStore.updateVehicleProfile(currentRecord.value!.id, data)
    message.success('车辆信息已保存')
  } catch { message.error('保存失败') }
}

async function handleSaveFinance() {
  try {
    const data = { ...financeForm } as any
    Object.keys(data).forEach(key => {
      if (data[key] === null) data[key] = undefined
    })
    await recordsStore.updateFinanceDoc(currentRecord.value!.id, data)
    message.success('金融信息已保存')
  } catch { message.error('保存失败') }
}

async function handleAddQuotation() {
  try {
    await recordsStore.addQuotation(currentRecord.value!.id, { record_id: currentRecord.value!.id, ...quotationForm })
    quotationForm.price = 0
    quotationForm.note = ''
    message.success('报价已添加')
  } catch { message.error('添加失败') }
}

async function handleSubmitReview() {
  try {
    await recordsStore.submitForReview(currentRecord.value!.id)
    message.success('已提交复核')
  } catch { message.error('提交失败') }
}

async function handleApprove() {
  try {
    await recordsStore.approveReview(currentRecord.value!.id, approveNote.value)
    showApproveModal.value = false
    approveNote.value = ''
    message.success('复核通过')
    await loadRecord()
  } catch { message.error('操作失败') }
}

async function handleReject() {
  if (!rejectNote.value.trim()) {
    message.warning('退回必须填写原因')
    return false
  }
  try {
    await recordsStore.rejectReview(currentRecord.value!.id, rejectNote.value)
    showRejectModal.value = false
    rejectNote.value = ''
    message.success('已退回')
    await loadRecord()
  } catch { message.error('操作失败') }
  return false
}

async function handleMarkException() {
  try {
    await api.post(`/transfer-records/${currentRecord.value!.id}/mark_exception/`, exceptionForm)
    message.success('异常已标记')
    await loadRecord()
  } catch { message.error('标记失败') }
}

async function handleAddTag() {
  try {
    await recordsStore.addReviewTag(currentRecord.value!.id, tagName.value)
    tagName.value = ''
    message.success('标签已添加')
    await loadRecord()
  } catch { message.error('添加失败') }
}

async function handleFileUpload(options: UploadCustomRequestOptions, relatedType: string) {
  const formData = new FormData()
  formData.append('file', options.file.file as File)
  formData.append('related_obj_id', currentRecord.value!.id)
  formData.append('related_obj_type', relatedType)
  try {
    await api.upload(`/file-uploads/`, formData)
    message.success('文件上传成功')
  } catch { message.error('上传失败') }
}

onMounted(loadRecord)
</script>

<style scoped>
.workspace-rejected {
  border: 2px solid #F97316;
  border-radius: 8px;
  padding: 4px;
}
</style>
