<template>
  <div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">在库车辆</div>
        <div class="stat-value">{{ stats.totalInStock || 0 }}<span style="font-size:14px;">台</span></div>
        <div class="stat-sub">总库存</div>
      </div>
      <div class="stat-card success">
        <div class="stat-label">快周转 (≤7天)</div>
        <div class="stat-value">{{ stats.fastTurnover || 0 }}<span style="font-size:14px;">台</span></div>
        <div class="stat-sub">{{ pct(stats.fastTurnover) }}</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-label">正常 (8-30天)</div>
        <div class="stat-value">{{ stats.normalTurnover || 0 }}<span style="font-size:14px;">台</span></div>
        <div class="stat-sub">{{ pct(stats.normalTurnover) }}</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-label">滞销 (>30天)</div>
        <div class="stat-value">{{ stats.slowTurnover || 0 }}<span style="font-size:14px;">台</span></div>
        <div class="stat-sub">{{ pct(stats.slowTurnover) }}</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-label">平均库存天数</div>
        <div class="stat-value">{{ stats.avgDays || 0 }}<span style="font-size:14px;">天</span></div>
        <div class="stat-sub">周转时效</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">预期毛利</div>
        <div class="stat-value" style="font-size:22px;">¥{{ formatNum(stats.totalProfit) }}</div>
        <div class="stat-sub">成本: ¥{{ formatNum(stats.totalCost) }}</div>
      </div>
    </div>

    <div class="chart-row">
      <div class="chart-box">
        <div class="chart-title">库存周转分布</div>
        <div ref="pieChart" class="chart-container"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">单车辆库存天数排行 TOP10</div>
        <div ref="barChart" class="chart-container"></div>
      </div>
    </div>

    <div class="page-card">
      <div class="page-card-header">
        <div class="page-card-title">库存车辆明细</div>
        <div class="filter-bar" style="margin:0;">
          <el-date-picker v-model="dateRange" type="daterange" start-placeholder="入库开始" end-placeholder="入库结束"
            value-format="YYYY-MM-DD" range-separator="至" @change="loadData" style="width:340px;" />
          <el-input v-model="keyword" placeholder="搜索品牌/车型/车牌" clearable style="width:240px;" @input="loadData" />
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
      <div class="page-card-body">
        <el-table :data="filteredList" stripe>
          <el-table-column label="库位" prop="warehouseLocation" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.warehouse_location || row.warehouseLocation" size="small" type="info" effect="plain">
                {{ row.warehouse_location || row.warehouseLocation }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="车辆信息" min-width="220">
            <template #default="{ row }">
              <div style="line-height:1.5;">
                <div style="font-weight:600;">{{ row.brand }} {{ row.series }} {{ (row.model || '').slice(0, 12) }}</div>
                <div style="color:#6b7280;font-size:12px;">
                  <span style="margin-right:10px;">{{ row.plate_no || row.plateNo }}</span>
                  <span>{{ row.color }} · {{ row.register_date || row.registerDate }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="库存状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag v-if="getDays(row) > 30" type="danger" effect="dark">滞销</el-tag>
              <el-tag v-else-if="getDays(row) > 7" type="warning">正常</el-tag>
              <el-tag v-else type="success" effect="dark">快周转</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="入库日期" width="120">
            <template #default="{ row }">{{ row.inbound_date || row.inboundDate }}</template>
          </el-table-column>
          <el-table-column label="库存天数" width="110" align="right">
            <template #default="{ row }">
              <span :style="{color: getDays(row) > 30 ? '#dc2626' : (getDays(row) > 7 ? '#d97706' : '#16a34a'), fontWeight:600;}">
                {{ getDays(row) }} 天
              </span>
            </template>
          </el-table-column>
          <el-table-column label="收购价" width="120" align="right">
            <template #default="{ row }">¥{{ formatNum(row.purchase_price || row.purchasePrice) }}</template>
          </el-table-column>
          <el-table-column label="期望售价" width="120" align="right">
            <template #default="{ row }">¥{{ formatNum(row.expected_sale_price || row.expectedSalePrice) }}</template>
          </el-table-column>
          <el-table-column label="预期毛利" width="120" align="right">
            <template #default="{ row }">
              <span style="color:#16a34a;font-weight:600;">¥{{ formatNum(getProfit(row)) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="毛利率" width="100" align="right">
            <template #default="{ row }">
              <span style="color:#10b981;">{{ getMargin(row) }}%</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getInventoryTurnoverStats, getInventoryList } from '../api'

const stats = reactive({})
const inventoryList = ref([])
const keyword = ref('')
const dateRange = ref([])
const pieChart = ref(null)
const barChart = ref(null)

const formatNum = (n) => Number(n || 0).toLocaleString()
const total_ = computed(() => Number(stats.totalInStock || 0))
const pct = (n) => total_.value ? ((Number(n) * 100 / total_.value).toFixed(1) + '%') : '0%'
const getDays = (r) => Number(r.days_in_stock ?? r.daysInStock ?? 0)
const getProfit = (r) => Number(r.expected_sale_price || r.expectedSalePrice || 0) - Number(r.purchase_price || r.purchasePrice || 0)
const getMargin = (r) => {
  const cost = Number(r.purchase_price || r.purchasePrice || 0)
  return cost ? (getProfit(r) * 100 / cost).toFixed(1) : 0
}

const filteredList = computed(() => {
  let list = inventoryList.value || []
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(r => (r.brand || '').toLowerCase().includes(kw)
      || (r.series || '').toLowerCase().includes(kw)
      || (r.model || '').toLowerCase().includes(kw)
      || (r.plate_no || r.plateNo || '').toLowerCase().includes(kw))
  }
  return list
})

const renderPie = (d) => {
  const c = echarts.init(pieChart.value)
  const fast = Number(d.fastTurnover || 0), normal = Number(d.normalTurnover || 0), slow = Number(d.slowTurnover || 0)
  c.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}台 ({d}%)' },
    legend: { bottom: 0 },
    color: ['#10b981', '#3b82f6', '#ef4444'],
    series: [{
      type: 'pie', radius: ['40%', '72%'],
      label: { formatter: '{b}\n{c}台 ({d}%)' },
      data: [
        { name: '快周转 (≤7天)', value: fast },
        { name: '正常 (8-30天)', value: normal },
        { name: '滞销 (>30天)', value: slow }
      ]
    }]
  })
}

const renderBar = (list) => {
  const sorted = [...list].sort((a, b) => getDays(b) - getDays(a)).slice(0, 10)
  const c = echarts.init(barChart.value)
  c.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 120, right: 40, top: 20, bottom: 20 },
    xAxis: { type: 'value', name: '天' },
    yAxis: {
      type: 'category',
      data: sorted.map(r => (r.brand || '') + ' ' + (r.series || '') + ' ' + (r.plate_no || r.plateNo || '')).map(s => s.length > 14 ? s.slice(0, 14) + '..' : s).reverse()
    },
    series: [{
      type: 'bar',
      barWidth: 18,
      label: { show: true, position: 'right', formatter: '{c}天' },
      data: sorted.map(r => ({
        value: getDays(r),
        itemStyle: { color: getDays(r) > 30 ? '#ef4444' : (getDays(r) > 7 ? '#f59e0b' : '#10b981') }
      })).reverse()
    }]
  })
}

const reset = () => { keyword.value = ''; dateRange.value = []; loadData() }

const loadData = async () => {
  const p = { startDate: dateRange.value?.[0], endDate: dateRange.value?.[1] }
  const [s, inv] = await Promise.all([getInventoryTurnoverStats(), getInventoryList(p)])
  Object.assign(stats, s.data || {})
  inventoryList.value = inv.data || []
  await nextTick()
  renderPie(stats)
  renderBar(inventoryList.value)
}

onMounted(loadData)
</script>
