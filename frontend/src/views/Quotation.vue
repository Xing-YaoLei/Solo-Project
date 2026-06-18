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
            <el-option label="有效中" value="valid" />
            <el-option label="已过期" value="expired" />
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
        :data="pagedData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="plateNumber" label="车牌号" width="110" />
        <el-table-column label="车辆信息" min-width="180">
          <template #default="{ row }">
            <div>
              <div class="vehicle-name">{{ row.brand }} {{ row.model }} {{ row.year }}款</div>
              <div class="vin-code" v-if="!userStore.isExternal">VIN: {{ row.vin }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="当前报价" width="120" align="right" v-if="!userStore.isExternal">
          <template #default="{ row }">
            <span class="price current">¥{{ formatPrice(row.currentPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="价格变动" width="110" align="right" v-if="!userStore.isExternal">
          <template #default="{ row }">
            <span :class="getPriceDiffClass(row.priceDiff)">{{ row.priceDiff > 0 ? '+' : '' }}{{ formatPrice(row.priceDiff) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="报价状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="报价次数" width="90" align="center">
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
            <el-button type="primary" size="small" link @click="showHistory(row)">详情</el-button>
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
            <p class="history-note">有效期 {{ item.validDays }} 天</p>
            <div class="history-meta flex-between mt-10">
              <span>操作人: {{ item.operator }}</span>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-if="!currentVehicle || !currentVehicle.history?.length" description="暂无报价历史" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { exportToExcel } from '@/utils/download'
import { Download, Search, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import {
  getQuotationList,
  getQuotationsByCar,
  getQuotationsByUser
} from '@/api/quotation'
import { getAllFunnelVehicles } from '@/api/funnel'

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

const vehicleMap = ref(new Map())
const quotationList = ref([])

const mergedData = computed(() => {
  const carQuotations = new Map()
  quotationList.value.forEach(q => {
    if (!carQuotations.has(q.carId)) carQuotations.set(q.carId, [])
    carQuotations.get(q.carId).push(q)
  })

  const result = []
  carQuotations.forEach((quotes, carId) => {
    const car = vehicleMap.value.get(carId) || {
      plateNumber: `--`,
      brand: '未知',
      model: '车型',
      year: 2020,
      vin: `VIN${carId}`,
      assessorId: null
    }
    const sorted = [...quotes].sort((a, b) => dayjs(b.quotedAt).valueOf() - dayjs(a.quotedAt).valueOf())
    const latest = sorted[0]
    const oldest = sorted[sorted.length - 1]
    const now = dayjs()
    const expireDate = dayjs(latest.quotedAt).add(latest.validDays || 7, 'day')
    const status = expireDate.isBefore(now) ? 'expired' : 'valid'

    const history = sorted.map((q, i) => ({
      price: Number(q.price),
      status: i === 0 ? status : 'history',
      time: q.quotedAt,
      operator: `评估师${q.quotedBy || 1}`,
      validDays: q.validDays || 7,
      note: i === 0 ? '最新报价' : '历史报价'
    }))

    result.push({
      id: carId,
      plateNumber: car.plateNumber,
      vin: car.carVin || car.vin,
      brand: car.brand,
      model: car.model,
      year: car.registerDate ? dayjs(car.registerDate).year() : (car.year || 2020),
      initialPrice: Number(oldest?.price || 0),
      currentPrice: Number(latest?.price || 0),
      priceDiff: Number(latest?.price || 0) - Number(oldest?.price || 0),
      customerName: null,
      status,
      historyCount: sorted.length,
      operator: `评估师${latest?.quotedBy || car.assessorId || 1}`,
      updatedAt: latest?.quotedAt,
      history
    })
  })

  let list = result
  if (filters.brand) list = list.filter(r => r.brand === filters.brand)
  if (filters.status) list = list.filter(r => r.status === filters.status)
  if (filters.dateRange?.length === 2) {
    const [s, e] = filters.dateRange
    list = list.filter(r => dayjs(r.updatedAt).isBetween(dayjs(s), dayjs(e), null, '[]'))
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(r =>
      r.plateNumber?.toLowerCase().includes(kw) ||
      r.vin?.toLowerCase().includes(kw)
    )
  }
  list.sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf())
  return list
})

const pagedData = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  return mergedData.value.slice(start, start + pagination.pageSize)
})

async function loadData() {
  loading.value = true
  try {
    const [quotes, vehicles] = await Promise.all([
      getQuotationList(),
      getAllFunnelVehicles()
    ])
    quotationList.value = Array.isArray(quotes) ? quotes : []
    const list = Array.isArray(vehicles) ? vehicles : []
    const m = new Map()
    list.forEach(v => m.set(v.id || v.carId, v))
    vehicleMap.value = m
    pagination.total = mergedData.value.length
  } catch (e) {
    ElMessage.error('加载报价数据失败：' + (e?.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

function formatPrice(p) {
  if (!p && p !== 0) return '--'
  return (Number(p) / 10000).toFixed(2) + '万'
}

function formatTime(t) {
  if (!t) return ''
  return dayjs(t).format('YYYY-MM-DD HH:mm')
}

function getStatusType(s) {
  const map = {
    valid: 'success',
    expired: 'danger',
    history: 'info'
  }
  return map[s] || 'info'
}

function getStatusLabel(s) {
  const map = {
    valid: '有效中',
    expired: '已过期',
    history: '历史'
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
  pagination.page = 1
  pagination.total = mergedData.value.length
  ElMessage.success('查询完成，共 ' + pagination.total + ' 条记录')
}

function resetFilters() {
  filters.brand = ''
  filters.status = ''
  filters.dateRange = []
  filters.keyword = ''
  pagination.page = 1
  pagination.total = mergedData.value.length
}

function handleExport() {
  const exportData = mergedData.value.map(r => ({
    '车牌号': r.plateNumber,
    '品牌': r.brand,
    '型号': r.model,
    '年款': r.year,
    '初始报价(万)': (r.initialPrice / 10000).toFixed(2),
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
