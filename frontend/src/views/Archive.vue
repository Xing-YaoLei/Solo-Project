<template>
  <div class="archive-page">
    <div class="page-header flex-between mb-20">
      <div>
        <h2 class="page-title">车辆档案</h2>
        <p class="page-desc">全流程车辆档案管理，支持按阶段和库龄筛选</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="handleExport">导出 Excel</el-button>
        <el-button type="primary" :icon="Plus" @click="openAddDialog">新增档案</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="mb-20">
      <el-col :span="24">
        <el-card class="card-shadow">
          <div class="stage-tabs">
            <div
              v-for="(s, idx) in stageList"
              :key="idx"
              class="stage-tab"
              :class="{ active: currentStage === idx }"
              @click="handleStageClick(idx)"
            >
              <div class="stage-count" :style="{ color: s.color }">{{ s.count }}</div>
              <div class="stage-name">{{ s.name }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="card-shadow filter-card mb-20">
      <el-form :inline="true" :model="filters">
        <el-form-item label="库龄">
          <el-select v-model="filters.age" placeholder="全部" clearable style="width:160px">
            <el-option label="30天以内" value="30" />
            <el-option label="30-60天" value="60" />
            <el-option label="60天以上(呆滞)" value="999" />
          </el-select>
        </el-form-item>
        <el-form-item label="完整度">
          <el-select v-model="filters.complete" placeholder="全部" clearable style="width:140px">
            <el-option label="完整档案" value="complete" />
            <el-option label="待补充" value="incomplete" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input v-model="filters.keyword" placeholder="品牌/车牌/VIN" style="width:220px">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-shadow">
      <el-table :data="pagedData" stripe border v-loading="loading">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="plateNumber" label="车牌号" width="100" fixed />
        <el-table-column label="车辆信息" min-width="170" fixed>
          <template #default="{ row }">
            <div class="vehicle-name">{{ row.brand }} {{ row.model }} {{ row.year }}款</div>
            <div class="vin-code">{{ row.vin }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="mileage" label="里程" width="90" />
        <el-table-column prop="color" label="颜色" width="70" />
        <el-table-column label="完整度" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isComplete ? 'success' : 'warning'" effect="plain" size="small">
              {{ row.isComplete ? '已完整' : '待补充' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stageName" label="当前阶段" width="100">
          <template #default="{ row }">
            <el-tag :color="row.stageColor" effect="light" size="small">{{ row.stageName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stockDays" label="库龄(天)" width="90" align="right">
          <template #default="{ row }">
            <el-tag :type="getAgeType(row.stockDays)" size="small" effect="plain">{{ row.stockDays }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="savedAt" label="更新时间" width="160">
          <template #default="{ row }">{{ row.savedAt ? formatTime(row.savedAt) : '--' }}</template>
        </el-table-column>
        <el-table-column prop="operator" label="负责人" width="80" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewArchive(row)">查看</el-button>
            <el-button type="success" size="small" link @click="editArchive(row)">编辑</el-button>
            <el-button type="danger" size="small" link @click="delArchive(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-area mt-20 flex-between">
        <div>
          <el-tag type="info">共 {{ filteredArchive.length }} 条</el-tag>
        </div>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredArchive.length"
          layout="sizes, prev, pager, next"
          background
          small
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="680px">
      <el-form :model="form" label-width="100px" ref="formRef">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="车牌号">
              <el-input v-model="form.plateNumber" :disabled="mode === 'view'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="VIN码">
              <el-input v-model="form.vin" :disabled="mode === 'view'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌">
              <el-input v-model="form.brand" :disabled="mode === 'view'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="型号">
              <el-input v-model="form.model" :disabled="mode === 'view'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年款">
              <el-input v-model="form.year" :disabled="mode === 'view'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="里程(万)">
              <el-input v-model="form.mileage" :disabled="mode === 'view'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="颜色">
              <el-input v-model="form.color" :disabled="mode === 'view'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-select v-model="form.operator" style="width:100%" :disabled="mode === 'view'">
                <el-option label="评估师1" value="评估师1" />
                <el-option label="评估师2" value="评估师2" />
                <el-option label="评估师3" value="评估师3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">档案详情</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="车况等级">
              <el-radio-group v-model="archiveForm.condition" :disabled="mode === 'view'">
                <el-radio value="优秀">优秀</el-radio>
                <el-radio value="良好">良好</el-radio>
                <el-radio value="一般">一般</el-radio>
                <el-radio value="较差">较差</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内饰等级">
              <el-radio-group v-model="archiveForm.interior" :disabled="mode === 'view'">
                <el-radio value="9成新">9成新</el-radio>
                <el-radio value="8成新">8成新</el-radio>
                <el-radio value="7成新及以下">7成新及以下</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="事故历史">
              <el-input
                v-model="archiveForm.accidentHistory"
                type="textarea"
                :rows="2"
                :disabled="mode === 'view'"
                placeholder="描述是否有事故、事故部位等"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="保养记录">
              <el-input
                v-model="archiveForm.maintenanceRecords"
                type="textarea"
                :rows="2"
                :disabled="mode === 'view'"
                placeholder="4S店保养、保养次数等"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="漆面情况">
              <el-input v-model="archiveForm.paint" :disabled="mode === 'view'" placeholder="原车漆、补漆部位等" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="轮胎磨损">
              <el-input v-model="archiveForm.tireWear" :disabled="mode === 'view'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发动机状态">
              <el-input v-model="archiveForm.engineStatus" :disabled="mode === 'view'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="变速箱状态">
              <el-input v-model="archiveForm.gearboxStatus" :disabled="mode === 'view'" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="档案完整">
          <el-switch v-model="form.isComplete" :disabled="mode === 'view'" />
          <span class="form-tip">关闭表示待补充资料</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button v-if="mode === 'view'" @click="dialogVisible = false">关闭</el-button>
        <template v-else>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave" :loading="submitting">保存</el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { exportToExcel } from '@/utils/download'
import dayjs from 'dayjs'
import { Download, Plus, Search, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { STAGE_NAMES } from '@/utils/anomaly'
import {
  getArchiveList,
  getArchiveByCar,
  saveArchiveByCar,
  deleteArchive
} from '@/api/archive'
import { getAllFunnelVehicles } from '@/api/funnel'

const userStore = useUserStore()
const loading = ref(false)
const dialogVisible = ref(false)
const mode = ref('add')
const submitting = ref(false)
const currentStage = ref(null)
const page = ref(1)
const pageSize = ref(20)

const stageColors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
const stageList = computed(() => {
  const counts = [0, 0, 0, 0, 0]
  rawArchive.value.forEach(r => {
    if (r.stageIndex != null && r.stageIndex >= 0 && r.stageIndex < 5) {
      counts[r.stageIndex]++
    }
  })
  return STAGE_NAMES.map((name, i) => ({ name, count: counts[i], color: stageColors[i] }))
})

const filters = reactive({
  age: '',
  complete: '',
  keyword: ''
})

const formRef = ref(null)
const form = reactive({
  id: null,
  carId: null,
  plateNumber: '',
  vin: '',
  brand: '',
  model: '',
  year: '',
  mileage: '',
  color: '',
  operator: '',
  isComplete: false
})

const archiveForm = reactive({
  condition: '良好',
  accidentHistory: '',
  maintenanceRecords: '',
  interior: '8成新',
  paint: '',
  tireWear: '正常',
  engineStatus: '良好',
  gearboxStatus: '正常'
})

const dialogTitle = computed(() => ({
  add: '新增车辆档案',
  edit: '编辑车辆档案',
  view: '查看车辆档案'
}[mode.value] || '车辆档案'))

const vehicleMap = ref(new Map())
const rawArchive = ref([])

const mergedArchive = computed(() => {
  const archiveByCar = new Map()
  rawArchive.value.forEach(a => {
    archiveByCar.set(a.carId, a)
  })

  const result = []
  vehicleMap.value.forEach((car, carId) => {
    const archive = archiveByCar.get(carId)
    const ad = archive?.archiveData || {}
    const stageIdx = car.stageIndex != null ? car.stageIndex : 0
    const stockDays = car.daysInStage != null ? car.daysInStage : Math.floor(Math.random() * 60 + 1)

    result.push({
      id: archive?.id || null,
      carId: carId,
      plateNumber: car.plateNumber,
      vin: car.vin,
      brand: car.brand,
      model: car.model,
      year: car.year,
      mileage: car.mileage || `${(Math.random() * 8 + 0.5).toFixed(1)}万公里`,
      color: car.color || ['黑', '白', '银', '灰', '红'][Math.floor(Math.random() * 5)],
      isComplete: !!archive?.isComplete,
      archiveData: ad,
      stageIndex: stageIdx,
      stageName: STAGE_NAMES[stageIdx],
      stageColor: stageColors[stageIdx],
      stockDays,
      savedAt: archive?.savedAt || null,
      operator: car.operator || '未分配',
      hasAnomaly: !!car.hasAnomaly
    })
  })
  return result
})

const filteredArchive = computed(() => {
  let list = mergedArchive.value
  if (currentStage.value !== null) list = list.filter(v => v.stageIndex === currentStage.value)
  if (filters.age) {
    const age = parseInt(filters.age)
    if (age === 30) list = list.filter(v => v.stockDays <= 30)
    else if (age === 60) list = list.filter(v => v.stockDays > 30 && v.stockDays <= 60)
    else list = list.filter(v => v.stockDays > 60)
  }
  if (filters.complete) {
    list = list.filter(v => filters.complete === 'complete' ? v.isComplete : !v.isComplete)
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(v =>
      v.brand?.toLowerCase().includes(kw) ||
      v.plateNumber?.toLowerCase().includes(kw) ||
      v.vin?.toLowerCase().includes(kw)
    )
  }
  return list
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredArchive.value.slice(start, start + pageSize.value)
})

async function loadData() {
  loading.value = true
  try {
    const [archives, vehicles] = await Promise.all([
      getArchiveList(),
      getAllFunnelVehicles()
    ])
    rawArchive.value = Array.isArray(archives) ? archives : []
    const list = Array.isArray(vehicles) ? vehicles : []
    const m = new Map()
    list.forEach(v => m.set(v.id || v.carId, v))
    vehicleMap.value = m
  } catch (e) {
    ElMessage.error('加载车辆档案失败：' + (e?.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

function resetForm() {
  Object.assign(form, {
    id: null, carId: null, plateNumber: '', vin: '', brand: '', model: '',
    year: '', mileage: '', color: '', operator: '', isComplete: false
  })
  Object.assign(archiveForm, {
    condition: '良好', accidentHistory: '', maintenanceRecords: '',
    interior: '8成新', paint: '', tireWear: '正常',
    engineStatus: '良好', gearboxStatus: '正常'
  })
}

function openAddDialog() {
  resetForm()
  mode.value = 'add'
  dialogVisible.value = true
}

function viewArchive(row) {
  fillForm(row)
  mode.value = 'view'
  dialogVisible.value = true
}

function editArchive(row) {
  fillForm(row)
  mode.value = 'edit'
  dialogVisible.value = true
}

function fillForm(row) {
  resetForm()
  Object.assign(form, {
    id: row.id,
    carId: row.carId,
    plateNumber: row.plateNumber,
    vin: row.vin,
    brand: row.brand,
    model: row.model,
    year: row.year,
    mileage: String(row.mileage || '').replace('万公里', ''),
    color: row.color,
    operator: row.operator,
    isComplete: row.isComplete
  })
  if (row.archiveData) {
    Object.assign(archiveForm, row.archiveData)
  }
}

async function handleSave() {
  if (!form.carId && !form.plateNumber) {
    ElMessage.warning('请选择或填写车辆信息')
    return
  }
  submitting.value = true
  try {
    const archiveData = { ...archiveForm }
    let targetCarId = form.carId
    if (!targetCarId) {
      for (const [id, car] of vehicleMap.value.entries()) {
        if (car.plateNumber === form.plateNumber || car.vin === form.vin) {
          targetCarId = id
          break
        }
      }
    }
    if (!targetCarId) {
      ElMessage.warning('未找到匹配的车辆，无法创建档案')
      return
    }
    const saved = await saveArchiveByCar(targetCarId, {
      archiveData,
      isComplete: form.isComplete
    })
    ElMessage.success('档案保存成功')
    dialogVisible.value = false
    await loadData()
  } catch (e) {
    ElMessage.error('保存失败：' + (e?.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

async function delArchive(row) {
  if (!row.id) {
    ElMessage.warning('该车辆尚未创建档案')
    return
  }
  ElMessageBox.confirm(`确认删除 ${row.plateNumber} 的车辆档案？`, '删除确认', { type: 'error' })
    .then(async () => {
      try {
        await deleteArchive(row.id)
        ElMessage.success('删除成功')
        await loadData()
      } catch (e) {
        ElMessage.error('删除失败：' + (e?.message || '未知错误'))
      }
    }).catch(() => {})
}

function handleStageClick(idx) {
  currentStage.value = currentStage.value === idx ? null : idx
  page.value = 1
}

function getAgeType(days) {
  if (days <= 30) return 'success'
  if (days <= 60) return 'warning'
  return 'danger'
}

function handleSearch() {
  loading.value = true
  setTimeout(() => { loading.value = false }, 200)
}

function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : ''
}

function handleExport() {
  const data = filteredArchive.value.map(r => ({
    '车牌号': r.plateNumber, 'VIN': r.vin, '品牌': r.brand, '型号': r.model,
    '年款': r.year, '里程': r.mileage, '颜色': r.color,
    '档案完整度': r.isComplete ? '完整' : '待补充',
    '阶段': r.stageName,
    '库龄(天)': r.stockDays,
    '更新时间': formatTime(r.savedAt),
    '负责人': r.operator,
    '车况等级': r.archiveData?.condition || '--',
    '事故历史': r.archiveData?.accidentHistory || '--'
  }))
  exportToExcel(data, '车辆档案清单', '车辆档案', true)
  ElMessage.success('导出成功')
}
</script>

<style lang="scss" scoped>
.archive-page {
  .page-title { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #303133; }
  .page-desc { margin: 0; font-size: 13px; color: #909399; }
  .header-actions { display: flex; gap: 10px; }
  .stage-tabs { display: flex; gap: 8px; }
  .stage-tab {
    flex: 1;
    padding: 16px;
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
    background: #fafbfc;
    &:hover { border-color: #dcdfe6; }
    &.active { background: #ecf5ff; border-color: #409eff; }
    .stage-count { font-size: 26px; font-weight: 700; }
    .stage-name { font-size: 13px; color: #606266; margin-top: 4px; }
  }
  .vehicle-name { font-weight: 500; }
  .vin-code { font-size: 11px; color: #909399; margin-top: 2px; }
  .pagination-area .el-tag { margin-right: 10px; }
  .form-tip { margin-left: 8px; font-size: 12px; color: #909399; }
}
</style>
