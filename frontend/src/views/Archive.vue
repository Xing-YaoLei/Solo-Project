<template>
  <div class="archive-page">
    <div class="page-header flex-between mb-20">
      <div>
        <h2 class="page-title">车辆档案</h2>
        <p class="page-desc">全流程车辆档案管理，支持按阶段和库龄筛选</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="handleExport">导出 Excel</el-button>
        <el-button type="primary" :icon="Plus" @click="addVisible = true">新增档案</el-button>
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
              @click="currentStage = idx"
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
        <el-form-item label="价格区间">
          <el-input v-model="filters.priceMin" placeholder="最低" style="width:100px" />
          <span class="sep"> - </span>
          <el-input v-model="filters.priceMax" placeholder="最高" style="width:100px" />
          <span>万元</span>
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
      <el-table :data="filteredArchive" stripe border v-loading="loading">
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
        <el-table-column prop="price" label="售价(万)" width="90" align="right" v-if="!userStore.isExternal">
          <template #default="{ row }">{{ (row.price / 10000).toFixed(2) }}</template>
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
        <el-table-column prop="enterDate" label="入库日期" width="110">
          <template #default="{ row }">{{ dayjs(row.enterDate).format('YY-MM-DD') }}</template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户" width="90" v-if="!userStore.isExternal" />
        <el-table-column prop="operator" label="负责人" width="80" />
        <el-table-column prop="hasAnomaly" label="异常" width="70" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.hasAnomaly" color="#f56c6c"><WarningFilled /></el-icon>
            <span v-else style="color:#67c23a">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link>查看</el-button>
            <el-button type="success" size="small" link>编辑</el-button>
            <el-button type="danger" size="small" link>删除</el-button>
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

    <el-dialog v-model="addVisible" title="新增车辆档案" width="600px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="车牌号"><el-input v-model="form.plateNumber" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="VIN码"><el-input v-model="form.vin" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌"><el-input v-model="form.brand" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="型号"><el-input v-model="form.model" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年款"><el-input v-model="form.year" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="里程(万)"><el-input v-model="form.mileage" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="售价(元)"><el-input v-model="form.price" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-select v-model="form.operator" style="width:100%">
                <el-option label="张三" value="张三" />
                <el-option label="李四" value="李四" />
                <el-option label="王五" value="王五" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">保存</el-button>
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
import { ElMessage } from 'element-plus'
import { STAGE_NAMES } from '@/utils/anomaly'

const userStore = useUserStore()
const loading = ref(false)
const addVisible = ref(false)
const currentStage = ref(null)
const page = ref(1)
const pageSize = ref(20)

const stageColors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
const counts = [320, 280, 235, 198, 165]
const stageList = computed(() =>
  STAGE_NAMES.map((name, i) => ({ name, count: counts[i], color: stageColors[i] }))
)

const filters = reactive({
  age: '',
  priceMin: '',
  priceMax: '',
  keyword: ''
})

const form = reactive({
  plateNumber: '', vin: '', brand: '', model: '', year: '', mileage: '', price: '', operator: ''
})

const rawArchive = ref([])

function generateMock() {
  const brands = ['宝马', '奔驰', '奥迪', '丰田', '本田', '大众', '特斯拉', '比亚迪']
  const models = ['3系', 'C级', 'A4L', '凯美瑞', '雅阁', '帕萨特', 'Model 3', '汉EV']
  const data = []
  for (let i = 0; i < 80; i++) {
    const stageIdx = Math.floor(Math.random() * 5)
    const stockDays = Math.floor(Math.random() * 90 + 1)
    const bIdx = Math.floor(Math.random() * brands.length)
    data.push({
      id: i + 1,
      plateNumber: `京${['A','B','C','D','E','F'][Math.floor(Math.random()*6)]}${Math.floor(Math.random()*90000+10000)}`,
      vin: `LBV${Math.random().toString(36).substring(2,13).toUpperCase()}`,
      brand: brands[bIdx],
      model: models[bIdx],
      year: 2018 + Math.floor(Math.random() * 7),
      mileage: `${(Math.random()*8+1).toFixed(1)}万公里`,
      color: ['黑','白','银','灰','红'][Math.floor(Math.random()*5)],
      price: Math.floor(Math.random() * 300000 + 50000),
      stageIndex: stageIdx,
      stageName: STAGE_NAMES[stageIdx],
      stageColor: stageColors[stageIdx],
      stockDays,
      enterDate: new Date(Date.now() - stockDays * 86400000).toISOString(),
      customerName: stageIdx < 3 ? `客户${i + 1}` : null,
      operator: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)],
      hasAnomaly: stageIdx === 2 && Math.random() < 0.3
    })
  }
  return data
}

onMounted(() => {
  rawArchive.value = generateMock()
})

const filteredArchive = computed(() => {
  let list = rawArchive.value
  if (currentStage.value !== null) list = list.filter(v => v.stageIndex === currentStage.value)
  if (filters.age) {
    const age = parseInt(filters.age)
    if (age === 30) list = list.filter(v => v.stockDays <= 30)
    else if (age === 60) list = list.filter(v => v.stockDays > 30 && v.stockDays <= 60)
    else list = list.filter(v => v.stockDays > 60)
  }
  if (filters.priceMin) list = list.filter(v => v.price >= parseInt(filters.priceMin) * 10000)
  if (filters.priceMax) list = list.filter(v => v.price <= parseInt(filters.priceMax) * 10000)
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(v =>
      v.brand.toLowerCase().includes(kw) ||
      v.plateNumber.toLowerCase().includes(kw) ||
      v.vin.toLowerCase().includes(kw)
    )
  }
  return list
})

function getAgeType(days) {
  if (days <= 30) return 'success'
  if (days <= 60) return 'warning'
  return 'danger'
}

function handleSearch() {
  loading.value = true
  setTimeout(() => { loading.value = false }, 300)
}

function handleAdd() {
  ElMessage.success('档案创建成功')
  addVisible.value = false
}

function handleExport() {
  const data = filteredArchive.value.map(r => ({
    '车牌号': r.plateNumber, 'VIN': r.vin, '品牌': r.brand, '型号': r.model,
    '年款': r.year, '里程': r.mileage, '颜色': r.color,
    '售价(万)': (r.price / 10000).toFixed(2), '阶段': r.stageName,
    '库龄(天)': r.stockDays, '入库日期': dayjs(r.enterDate).format('YYYY-MM-DD'),
    '负责人': r.operator, '有无异常': r.hasAnomaly ? '是' : '否'
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
  .sep { margin: 0 6px; color: #c0c4cc; }
  .pagination-area .el-tag { margin-right: 10px; }
}
</style>
