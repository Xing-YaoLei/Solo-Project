<template>
  <div class="quotation-page">
    <div class="page-header flex-between mb-20">
      <div>
        <h2 class="page-title">报价历史视图</h2>
        <p class="page-desc">查看所有车辆的报价记录和历史变更</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="handleExport">导出 Excel</el-button>
      </div>
    </div>

    <el-card class="card-shadow filter-card mb-20">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="品牌">
          <el-select v-model="filters.brand" placeholder="全部品牌" clearable style="width: 140px">
            <el-option v-for="b in brandList" :key="b" :label="b" :value="b" />
          </el-select>
        </el-form-item>
        <el-form-item label="报价状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="初评" value="initial" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="已议价" value="negotiated" />
            <el-option label="已成交" value="closed" />
            <el-option label="已放弃" value="abandoned" />
          </el-select>
        </el-form-item>
        <el-form-item label="报价时间">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item label="搜索">
          <el-input v-model="filters.keyword" placeholder="车牌号/VIN" style="width: 200px">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="RefreshLeft" @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-shadow">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="plateNumber" label="车牌号" width="110" />
        <el-table-column prop="vehicleInfo" label="车辆信息" min-width="180">
          <template #default="{ row }">
            <div>
              <div class="vehicle-name">{{ row.brand }} {{ row.model }} {{ row.year }}款</div>
              <div class="vin-code" v-if="!userStore.isExternal">VIN: {{ row.vin }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="initialPrice" label="初评价格" width="120" align="right" v-if="!userStore.isExternal">
          <template #default="{ row }">
            <span class="price">¥{{ formatPrice(row.initialPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="currentPrice" label="当前报价" width="120" align="right" v-if="!userStore.isExternal">
          <template #default="{ row }">
            <span class="price current">¥{{ formatPrice(row.currentPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="priceDiff" label="价格变动" width="110" align="right" v-if="!userStore.isExternal">
          <template #default="{ row }">
            <span :class="getPriceDiffClass(row.priceDiff)">{{ row.priceDiff > 0 ? '+' : '' }}{{ formatPrice(row.priceDiff) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户" width="100" v-if="!userStore.isExternal">
          <template #default="{ row }">
            {{ row.customerName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="historyCount" label="报价次数" width="90" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="showHistory(row)">{{ row.historyCount }}次</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="负责人" width="90" />
        <el-table-column prop="updatedAt" label="更新时间" width="170">
          <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link>详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-area mt-20">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </el-card>

    <el-dialog v-model="historyVisible" title="报价历史记录" width="640px">
      <el-timeline v-if="currentVehicle">
        <el-timeline-item
          v-for="(item, idx) in currentVehicle.history"
          :key="idx"
          :timestamp="formatTime(item.time)"
          :type="idx === 0 ? 'primary' : ''"
          :hollow="idx === 0"
        >
          <el-card shadow="never" class="history-card">
            <div class="history-header flex-between">
              <el-tag :type="getStatusType(item.status)" size="small" effect="light">
                {{ getStatusLabel(item.status) }}
              </el-tag>
              <span v-if="!userStore.isExternal" class="history-price">
                ¥{{ formatPrice(item.price) }}
              </span>
            </div>
            <p class="history-note">{{ item.note || '无备注' }}</p>
            <div class="history-meta flex-between mt-10">
              <span>操作人: {{ item.operator }}</span>
              <span v-if="!userStore.isExternal && item.customerName">客户: {{ item.customerName }}</span>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { exportToExcel } from '@/utils/download'
import { Download, Search, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const userStore = useUserStore()

const loading = ref(false)
const historyVisible = ref(false)
const currentVehicle = ref(null)

const filters = reactive({
  brand: '',
  status: '',
  dateRange: [],
  keyword: ''
})

const brandList = ['宝马', '奔驰', '奥迪', '丰田', '本田', '大众', '特斯拉', '比亚迪']

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref([])

function generateMockData() {
  const statuses = ['initial', 'confirmed', 'negotiated', 'closed', 'abandoned']
  const operators = ['张三', '李四', '王五', '赵六']
  const data = []
  for (let i = 0; i < 35; i++) {
    const brandIdx = Math.floor(Math.random() * brandList.length)
    const initial = Math.floor(Math.random() * 300000 + 50000)
    const current = initial + Math.floor(Math.random() * 40000 - 20000)
    data.push({
      id: i + 1,
      plateNumber: `京${['A','B','C','D','E','F'][Math.floor(Math.random()*6)]}${Math.floor(Math.random()*90000+10000)}`,
      vin: `LBV${Math.random().toString(36).substring(2,13).toUpperCase()}`,
      brand: brandList[brandIdx],
      model: ['3系','C级','A4L','凯美瑞','雅阁','帕萨特','Model 3','汉EV'][brandIdx],
      year: 2018 + Math.floor(Math.random() * 7),
      initialPrice: initial,
      currentPrice: current,
      priceDiff: current - initial,
      customerName: `客户${i + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      historyCount: Math.floor(Math.random() * 5 + 1),
      operator: operators[Math.floor(Math.random() * operators.length)],
      updatedAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString()
    })
  }
  data.forEach(d => {
    d.history = []
    for (let i = 0; i < d.historyCount; i++) {
      d.history.push({
        price: Math.floor(Math.random() * 300000 + 50000),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        time: new Date(Date.now() - i * 86400000).toISOString(),
        operator: operators[Math.floor(Math.random() * operators.length)],
        customerName: i < 2 ? d.customerName : null,
        note: ['初次评估定价', '客户议价调整', '市场行情更新', '检测后调整价格', '最终成交价格'][i % 5]
      })
    }
  })
  return data
}

onMounted(() => {
  tableData.value = generateMockData()
  pagination.total = tableData.value.length
})

function formatPrice(p) {
  if (!p) return '--'
  return (p / 10000).toFixed(2) + '万'
}

function formatTime(t) {
  if (!t) return ''
  return dayjs(t).format('YYYY-MM-DD HH:mm')
}

function getStatusType(s) {
  const map = {
    initial: 'info',
    confirmed: 'primary',
    negotiated: 'warning',
    closed: 'success',
    abandoned: 'danger'
  }
  return map[s] || 'info'
}

function getStatusLabel(s) {
  const map = {
    initial: '初评',
    confirmed: '已确认',
    negotiated: '已议价',
    closed: '已成交',
    abandoned: '已放弃'
  }
  return map[s] || s
}

function getPriceDiffClass(diff) {
  if (diff > 0) return 'diff-up'
  if (diff < 0) return 'diff-down'
  return ''
}

function showHistory(row) {
  currentVehicle.value = row
  historyVisible.value = true
}

function handleSearch() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('查询完成')
  }, 500)
}

function resetFilters() {
  filters.brand = ''
  filters.status = ''
  filters.dateRange = []
  filters.keyword = ''
}

function handleExport() {
  const exportData = tableData.value.map(r => ({
    '车牌号': r.plateNumber,
    '品牌': r.brand,
    '型号': r.model,
    '年款': r.year,
    '初评价格(万)': (r.initialPrice / 10000).toFixed(2),
    '当前报价(万)': (r.currentPrice / 10000).toFixed(2),
    '价格变动(万)': (r.priceDiff / 10000).toFixed(2),
    '状态': getStatusLabel(r.status),
    '报价次数': r.historyCount,
    '负责人': r.operator,
    '更新时间': formatTime(r.updatedAt)
  }))
  exportToExcel(exportData, '报价历史记录', '报价历史', true)
  ElMessage.success('导出成功')
}
</script>

<style lang="scss" scoped>
.quotation-page {
  .page-title {
    margin: 0 0 4px;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
  }
  .page-desc {
    margin: 0;
    font-size: 13px;
    color: #909399;
  }
  .header-actions { display: flex; gap: 10px; }
  .filter-form { margin: 0; }

  .vehicle-name { font-weight: 500; color: #303133; }
  .vin-code { font-size: 11px; color: #909399; margin-top: 2px; }

  .price { font-weight: 600; &.current { color: #f56c6c; } }
  .diff-up { color: #67c23a; font-weight: 500; }
  .diff-down { color: #f56c6c; font-weight: 500; }

  .pagination-area { display: flex; justify-content: flex-end; }

  .history-card {
    :deep(.el-card__body) { padding: 12px 16px; }
    .history-header { margin-bottom: 8px; }
    .history-price { font-weight: 600; color: #f56c6c; font-size: 16px; }
    .history-note { margin: 0; font-size: 13px; color: #606266; }
    .history-meta { font-size: 12px; color: #909399; }
  }
}
</style>
