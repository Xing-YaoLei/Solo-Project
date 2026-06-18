<template>
  <div class="finance-page">
    <div class="page-header flex-between mb-20">
      <div>
        <h2 class="page-title">金融资料管理</h2>
        <p class="page-desc">管理车辆金融审批资料和贷款申请</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="handleExport">导出</el-button>
        <el-button type="primary" :icon="Upload" @click="uploadVisible = true">批量上传资料</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="mb-20">
      <el-col :span="6">
        <el-card class="stat-card card-shadow" shadow="hover">
          <div class="stat-content">
            <div class="stat-label">待补充资料</div>
            <div class="stat-value" style="color:#e6a23c">{{ stats.pending }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow" shadow="hover">
          <div class="stat-content">
            <div class="stat-label">资料完整</div>
            <div class="stat-value" style="color:#67c23a">{{ stats.complete }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow" shadow="hover">
          <div class="stat-content">
            <div class="stat-label">资料总数</div>
            <div class="stat-value" style="color:#409eff">{{ stats.total }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow" shadow="hover">
          <div class="stat-content">
            <div class="stat-label">缺失资料数</div>
            <div class="stat-value" style="color:#f56c6c">{{ stats.missingDocs }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="card-shadow">
      <div class="table-header flex-between mb-20">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="全部资料" name="all" />
          <el-tab-pane label="待补充" name="pending" />
          <el-tab-pane label="已完整" name="complete" />
          <el-tab-pane label="资料缺失" name="missing" />
        </el-tabs>
        <el-input v-model="searchKw" placeholder="搜索车牌号/VIN" style="width: 220px" size="default">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>

      <el-table :data="filteredData" v-loading="loading" stripe border>
        <el-table-column prop="plateNumber" label="车牌号" width="110" />
        <el-table-column label="车辆信息" min-width="180">
          <template #default="{ row }">
            <div>
              <div class="vehicle-name">{{ row.brand }} {{ row.model }} {{ row.year }}款</div>
              <div class="vin-code">VIN: {{ row.vin }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="资料清单" min-width="320">
          <template #default="{ row }">
            <div class="doc-tags">
              <el-tag
                v-for="doc in row.documents"
                :key="doc.name"
                :type="doc.uploaded ? 'success' : 'danger'"
                size="small"
                effect="plain"
                class="doc-tag"
              >
                <el-icon><component :is="doc.uploaded ? CircleCheck : WarningFilled" /></el-icon>
                {{ doc.name }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="资料完整度" width="110" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="row.completePercent"
              :color="row.completePercent === 100 ? '#67c23a' : row.completePercent >= 50 ? '#e6a23c' : '#f56c6c'"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastUpload" label="最近上传" width="160">
          <template #default="{ row }">{{ row.lastUpload ? formatTime(row.lastUpload) : '--' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button
              size="small"
              link
              type="warning"
              v-if="row.status !== 'complete'"
              @click="uploadVisible = true; currentCar = row"
            >补资料</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="uploadVisible" title="上传金融资料" width="560px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="选择车辆">
          <el-select v-model="uploadForm.vehicleId" placeholder="请选择车辆" style="width:100%" filterable>
            <el-option
              v-for="v in carOptions"
              :key="v.id"
              :label="`${v.plateNumber} - ${v.brand}${v.model}`"
              :value="v.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="资料类型">
          <el-checkbox-group v-model="uploadForm.docTypes">
            <el-checkbox
              v-for="t in docTypeOptions"
              :key="t.value"
              :label="t.value"
            >{{ t.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="上传文件">
          <el-upload
            action="#"
            multiple
            :auto-upload="false"
            drag
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖拽文件到此或 <em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">支持 PDF/JPG/PNG，单个文件不超过 10MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUploadSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { exportToExcel } from '@/utils/download'
import dayjs from 'dayjs'
import {
  Download, Upload, UploadFilled, Search, CircleCheck, WarningFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getFinanceList,
  getMissingCars,
  createFinance,
  updateFinance
} from '@/api/finance'
import { getAllFunnelVehicles } from '@/api/funnel'

const loading = ref(false)
const activeTab = ref('all')
const searchKw = ref('')
const uploadVisible = ref(false)
const currentCar = ref(null)

const docTypeOptions = [
  { value: 'ID_CARD', label: '身份证' },
  { value: 'DRIVING_LICENSE', label: '驾驶证' },
  { value: 'REGISTRATION_CERT', label: '车辆登记证' },
  { value: 'INSURANCE', label: '保险单' },
  { value: 'BANK_STATEMENT', label: '银行流水' },
  { value: 'OTHER', label: '其他资料' }
]

const stats = reactive({
  pending: 0,
  complete: 0,
  total: 0,
  missingDocs: 0
})

const uploadForm = reactive({
  vehicleId: '',
  docTypes: []
})

const vehicleMap = ref(new Map())
const carOptions = computed(() => Array.from(vehicleMap.value.values()))
const rawDocs = ref([])

const mergedData = computed(() => {
  const carDocs = new Map()
  rawDocs.value.forEach(d => {
    if (!carDocs.has(d.carId)) {
      carDocs.set(d.carId, [])
    }
    carDocs.get(d.carId).push(d)
  })

  const result = []
  carDocs.forEach((docs, carId) => {
    const car = vehicleMap.value.get(carId) || {
      plateNumber: `--${carId}`,
      brand: '未知',
      model: '车型',
      year: 2020,
      carVin: `VIN${carId}`
    }
    const docMap = new Map()
    docTypeOptions.forEach(t => docMap.set(t.value, {
      name: t.label,
      value: t.value,
      uploaded: false
    }))
    let lastUpload = null
    docs.forEach(d => {
      const opt = docMap.get(d.docType)
      if (opt) {
        opt.uploaded = !d.isMissing
        if (d.uploadedAt) {
          if (!lastUpload || dayjs(d.uploadedAt).isAfter(dayjs(lastUpload))) {
            lastUpload = d.uploadedAt
          }
        }
      }
    })
    const documents = Array.from(docMap.values())
    const uploadedCount = documents.filter(d => d.uploaded).length
    const completePercent = Math.round(uploadedCount / documents.length * 100)
    const missingCount = documents.length - uploadedCount
    const status = missingCount === 0 ? 'complete' : missingCount >= 3 ? 'missing' : 'pending'

    result.push({
      id: carId,
      plateNumber: car.plateNumber,
      vin: car.carVin || car.vin,
      brand: car.brand,
      model: car.model,
      year: car.registerDate ? dayjs(car.registerDate).year() : (car.year || 2020),
      documents,
      completePercent,
      missingCount,
      status,
      lastUpload
    })
  })

  stats.total = result.length
  stats.pending = result.filter(r => r.status === 'pending').length
  stats.complete = result.filter(r => r.status === 'complete').length
  stats.missingDocs = result.reduce((s, r) => s + r.missingCount, 0)
  return result.sort((a, b) => a.completePercent - b.completePercent)
})

const filteredData = computed(() => {
  let data = mergedData.value
  if (activeTab.value !== 'all') {
    if (activeTab.value === 'missing') {
      data = data.filter(d => d.status === 'missing')
    } else {
      data = data.filter(d => d.status === activeTab.value)
    }
  }
  if (searchKw.value) {
    const kw = searchKw.value.toLowerCase()
    data = data.filter(d =>
      d.plateNumber?.toLowerCase().includes(kw) ||
      d.vin?.toLowerCase().includes(kw) ||
      d.brand?.toLowerCase().includes(kw)
    )
  }
  return data
})

async function loadData() {
  loading.value = true
  try {
    const [docs, vehicles] = await Promise.all([
      getFinanceList(),
      getAllFunnelVehicles()
    ])
    rawDocs.value = Array.isArray(docs) ? docs : []
    const list = Array.isArray(vehicles) ? vehicles : []
    const m = new Map()
    list.forEach(v => m.set(v.id || v.carId, v))
    vehicleMap.value = m
  } catch (e) {
    ElMessage.error('加载金融资料失败：' + (e?.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

function statusType(s) {
  return { pending: 'warning', complete: 'success', missing: 'danger' }[s] || 'info'
}
function statusLabel(s) {
  return { pending: '待补充', complete: '已完整', missing: '缺失较多' }[s] || s
}

function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : ''
}

function handleTabChange() {}

function viewDetail(row) {
  ElMessage.info(`查看 ${row.plateNumber} 的金融资料详情：${row.completePercent}% 完整`)
}

async function handleUploadSubmit() {
  if (!uploadForm.vehicleId) {
    ElMessage.warning('请选择车辆')
    return
  }
  if (!uploadForm.docTypes || uploadForm.docTypes.length === 0) {
    ElMessage.warning('请至少选择一种资料类型')
    return
  }
  loading.value = true
  try {
    const now = dayjs().format()
    const results = await Promise.allSettled(
      uploadForm.docTypes.map(dt => createFinance({
        carId: Number(uploadForm.vehicleId),
        docType: dt,
        isMissing: false,
        uploadedAt: now
      }))
    )
    const successCount = results.filter(r => r.status === 'fulfilled').length
    ElMessage.success(`成功提交 ${successCount} 项资料`)
    uploadVisible.value = false
    uploadForm.vehicleId = ''
    uploadForm.docTypes = []
    await loadData()
  } catch (e) {
    ElMessage.error('提交失败：' + (e?.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

function handleExport() {
  const exportData = filteredData.value.map(r => ({
    '车牌号': r.plateNumber,
    'VIN': r.vin,
    '品牌': r.brand,
    '型号': r.model,
    '资料完整度': `${r.completePercent}%`,
    '状态': statusLabel(r.status),
    '缺失资料': r.documents.filter(d => !d.uploaded).map(d => d.name).join(',') || '无',
    '最近上传': formatTime(r.lastUpload)
  }))
  exportToExcel(exportData, '金融资料清单', '金融资料')
  ElMessage.success('导出成功')
}
</script>

<style lang="scss" scoped>
.finance-page {
  .page-title { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #303133; }
  .page-desc { margin: 0; font-size: 13px; color: #909399; }
  .header-actions { display: flex; gap: 10px; }
  .stat-card :deep(.el-card__body) { padding: 16px 20px; }
  .stat-label { font-size: 13px; color: #909399; margin-bottom: 6px; }
  .stat-value { font-size: 28px; font-weight: 700; }
  .table-header { align-items: flex-start; }
  .vehicle-name { font-weight: 500; }
  .vin-code { font-size: 11px; color: #909399; margin-top: 2px; }
  .doc-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .doc-tag { display: inline-flex; align-items: center; gap: 2px; }
}
</style>
