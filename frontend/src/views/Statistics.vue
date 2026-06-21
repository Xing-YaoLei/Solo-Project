<template>
  <div>
    <div class="page-card" style="margin-bottom:16px;">
      <div class="page-card-body">
        <div class="filter-bar">
          <span style="font-weight:600;color:#1f2937;">统计周期筛选:</span>
          <el-radio-group v-model="quickRange" @change="applyQuickRange">
            <el-radio-button label="this_month">本月</el-radio-button>
            <el-radio-button label="last_month">上月</el-radio-button>
            <el-radio-button label="this_quarter">本季度</el-radio-button>
            <el-radio-button label="this_year">今年</el-radio-button>
            <el-radio-button label="all">全部</el-radio-button>
          </el-radio-group>
          <el-date-picker v-model="dateRange" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss" range-separator="至" @change="onDateChange" />
          <el-button type="primary" @click="loadAll">查询</el-button>
          <el-button @click="resetRange">重置</el-button>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">总任务数</div>
        <div class="stat-value">{{ overview.totalTasks || 0 }}</div>
        <div class="stat-sub">录入总数</div>
      </div>
      <div class="stat-card success">
        <div class="stat-label">正常关闭</div>
        <div class="stat-value">{{ overview.successTasks || 0 }}</div>
        <div class="stat-sub">成功率 {{ totalRate }}%</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-label">资料缺失</div>
        <div class="stat-value">{{ overview.missingTasks || 0 }}</div>
        <div class="stat-sub">异常处理</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-label">升级处理</div>
        <div class="stat-value">{{ overview.escalatedTasks || 0 }}</div>
        <div class="stat-sub">经理介入</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-label">进行中</div>
        <div class="stat-value">{{ overview.activeTasks || 0 }}</div>
        <div class="stat-sub">在处理中</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均库存天数</div>
        <div class="stat-value">{{ invStats.avgDays || 0 }}<span style="font-size:14px;">天</span></div>
        <div class="stat-sub">在库 {{ invStats.totalInStock || 0 }} 台</div>
      </div>
    </div>

    <div class="chart-row">
      <div class="chart-box">
        <div class="chart-title">📊 任务来源分布 (按来源汇总)</div>
        <div ref="srcChart" class="chart-container"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">📈 处理结论分布 (按关闭类型)</div>
        <div ref="clsChart" class="chart-container"></div>
      </div>
    </div>
    <div class="chart-row">
      <div class="chart-box">
        <div class="chart-title">👥 负责人业绩汇总 (按业务员)</div>
        <div ref="salesChart" class="chart-container"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">🏭 库存周转结构</div>
        <div ref="turnChart" class="chart-container"></div>
      </div>
    </div>

    <div class="page-card" style="margin-top:16px;">
      <div class="page-card-header">
        <div class="page-card-title">🧾 来源明细表</div>
      </div>
      <div class="page-card-body">
        <el-table :data="sourceList || []" border>
          <el-table-column label="来源渠道" prop="sourceTypeDesc" width="150" />
          <el-table-column label="任务数" prop="count" width="100" align="right" />
          <el-table-column label="已关闭" prop="closedCount" width="100" align="right" />
          <el-table-column label="成功收购" prop="successCount" width="100" align="right" />
          <el-table-column label="成功率" width="120" align="right">
            <template #default="{ row }">
              <span v-if="row.count">
                {{ ((row.successCount || 0) * 100 / row.count).toFixed(1) }}%
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="占比" align="right">
            <template #default="{ row }">
              <el-progress :percentage="total ? (row.count * 100 / total).toFixed(1) : 0" :stroke-width="10" :show-text="true" />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div class="page-card" style="margin-top:16px;">
      <div class="page-card-header">
        <div class="page-card-title">🧑‍💼 负责人汇总表</div>
      </div>
      <div class="page-card-body">
        <el-table :data="salesList || []" border>
          <el-table-column label="业务员" prop="name" width="120" />
          <el-table-column label="任务总数" prop="total" width="100" align="right" />
          <el-table-column label="成功单数" prop="success" width="100" align="right" />
          <el-table-column label="成功率" width="120" align="right">
            <template #default="{ row }">
              <el-tag :type="row.rate >= 50 ? 'success' : (row.rate >= 30 ? 'warning' : 'danger')" effect="plain">
                {{ row.rate || 0 }}%
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="未成功" width="100" align="right">
            <template #default="{ row }">{{ (row.total || 0) - (row.success || 0) }}</template>
          </el-table-column>
          <el-table-column label="排行" width="80" align="center">
            <template #default="{ $index }">
              <el-tag v-if="$index === 0" type="danger" effect="dark">🥇 TOP1</el-tag>
              <el-tag v-else-if="$index === 1" type="warning" effect="dark">🥈 TOP2</el-tag>
              <el-tag v-else-if="$index === 2" type="success" effect="dark">🥉 TOP3</el-tag>
              <span v-else style="color:#9ca3af;">#{{ $index + 1 }}</span>
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
import { getTaskStatistics, getSourceStats, getSalesStats, getCloseTypeStats, getInventoryTurnoverStats } from '../api'

const dateRange = ref([])
const quickRange = ref('all')
const overview = reactive({})
const invStats = reactive({})
const sourceList = ref([])
const closeList = ref([])
const salesList = ref([])
const srcChart = ref(null)
const clsChart = ref(null)
const salesChart = ref(null)
const turnChart = ref(null)

const total = computed(() => sourceList.value.reduce((s, i) => s + (Number(i.count) || 0), 0))
const totalRate = computed(() => {
  const t = Number(overview.totalTasks || 0)
  const s = Number(overview.successTasks || 0)
  return t ? ((s * 100 / t)).toFixed(1) : 0
})

const applyQuickRange = (v) => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  let s, e = fmt(now)
  if (v === 'this_month') { s = fmt(new Date(now.getFullYear(), now.getMonth(), 1)) }
  else if (v === 'last_month') {
    s = fmt(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    e = fmt(new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59))
  } else if (v === 'this_quarter') {
    const qm = Math.floor(now.getMonth() / 3) * 3
    s = fmt(new Date(now.getFullYear(), qm, 1))
  } else if (v === 'this_year') {
    s = fmt(new Date(now.getFullYear(), 0, 1))
  } else { dateRange.value = []; return }
  dateRange.value = [s, e]
}

const resetRange = () => { quickRange.value = 'all'; dateRange.value = []; loadAll() }
const onDateChange = () => { quickRange.value = 'custom' }

const params = computed(() => ({
  startTime: dateRange.value?.[0] || undefined,
  endTime: dateRange.value?.[1] || undefined
}))

const renderSrc = (list) => {
  const c = echarts.init(srcChart.value)
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']
  c.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, data: ['任务数', '成功收购'] },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: list.map(i => i.sourceTypeDesc || i.sourceType) },
    yAxis: { type: 'value' },
    series: [
      { name: '任务数', type: 'bar', barWidth: 30, data: list.map(i => Number(i.count) || 0), itemStyle: { color: colors[0] } },
      { name: '成功收购', type: 'bar', barWidth: 30, data: list.map(i => Number(i.successCount) || 0), itemStyle: { color: colors[2] } }
    ]
  })
}

const renderCls = (list) => {
  const c = echarts.init(clsChart.value)
  const mp = { NORMAL: '正常收购', REJECT: '放弃收购', CANCEL: '取消任务' }
  c.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    color: ['#10b981', '#ef4444', '#9ca3af'],
    series: [{
      type: 'pie', radius: ['35%', '65%'],
      label: { formatter: '{b}\n{c}单 ({d}%)' },
      data: list.map(i => ({ name: mp[i.closeType] || i.closeType, value: Number(i.count) || 0 }))
    }]
  })
}

const renderSales = (list) => {
  const c = echarts.init(salesChart.value)
  c.setOption({
    tooltip: { trigger: 'axis' },
    legend: { top: 0, data: ['任务总数', '成功单数'] },
    grid: { left: 50, right: 30, top: 40, bottom: 40 },
    dataset: {
      dimensions: ['name', '任务总数', '成功单数'],
      source: list.map(i => [i.name, Number(i.total) || 0, Number(i.success) || 0])
    },
    xAxis: { type: 'category' },
    yAxis: { type: 'value' },
    series: [
      { type: 'bar', stack: 'total', itemStyle: { color: '#3b82f6' }, label: { show: true, position: 'top' } },
      { type: 'bar', stack: 'total', itemStyle: { color: '#10b981' } }
    ]
  })
}

const renderTurn = (d) => {
  const c = echarts.init(turnChart.value)
  const fast = Number(d.fastTurnover || 0), normal = Number(d.normalTurnover || 0), slow = Number(d.slowTurnover || 0)
  c.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}台 ({d}%)' },
    title: { text: `在库合计: ${fast + normal + slow}台`, left: 'center', top: 10, textStyle: { fontSize: 14, color: '#374151' } },
    series: [{
      type: 'sunburst',
      radius: [0, '90%'],
      center: ['50%', '55%'],
      data: [
        {
          name: '库存周转', children: [
            { name: `快周转 ≤7天\n${fast}台`, value: fast, itemStyle: { color: '#10b981' } },
            { name: `正常 8-30天\n${normal}台`, value: normal, itemStyle: { color: '#3b82f6' } },
            { name: `滞销 >30天\n${slow}台`, value: slow, itemStyle: { color: '#ef4444' } }
          ]
        }
      ],
      label: { minAngle: 5, fontSize: 11 }
    }]
  })
}

let charts = []
const resizeAll = () => charts.forEach(c => c && c.resize())

const loadAll = async () => {
  const p = params.value
  const [s, src, sales, cls, inv] = await Promise.all([
    getTaskStatistics(p), getSourceStats(p), getSalesStats(p), getCloseTypeStats(p), getInventoryTurnoverStats()
  ])
  Object.assign(overview, s.data?.taskOverview || {})
  Object.assign(invStats, s.data?.inventoryTurnover || {})
  sourceList.value = src.data || []
  closeList.value = cls.data || []
  salesList.value = sales.data || []
  Object.assign(invStats, inv.data || {})

  await nextTick()
  charts.forEach(c => c && c.dispose())
  charts = []
  renderSrc(sourceList.value); charts.push(echarts.getInstanceByDom(srcChart.value))
  renderCls(closeList.value); charts.push(echarts.getInstanceByDom(clsChart.value))
  renderSales(salesList.value); charts.push(echarts.getInstanceByDom(salesChart.value))
  renderTurn(invStats); charts.push(echarts.getInstanceByDom(turnChart.value))
}

onMounted(() => {
  loadAll()
  window.addEventListener('resize', resizeAll)
})
</script>
