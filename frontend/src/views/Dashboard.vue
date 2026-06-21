<template>
  <div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">总任务数</div>
        <div class="stat-value">{{ stats.taskOverview?.totalTasks || 0 }}</div>
        <div class="stat-sub">累计录入</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-label">进行中任务</div>
        <div class="stat-value">{{ stats.taskOverview?.activeTasks || 0 }}</div>
        <div class="stat-sub">活跃待处理</div>
      </div>
      <div class="stat-card success">
        <div class="stat-label">成功收购</div>
        <div class="stat-value">{{ stats.taskOverview?.successTasks || 0 }}</div>
        <div class="stat-sub">已完成入库</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-label">资料缺失</div>
        <div class="stat-value">{{ stats.taskOverview?.missingTasks || 0 }}</div>
        <div class="stat-sub">待补充材料</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-label">升级处理</div>
        <div class="stat-value">{{ stats.taskOverview?.escalatedTasks || 0 }}</div>
        <div class="stat-sub">需要经理介入</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均库存天数</div>
        <div class="stat-value">{{ stats.inventoryTurnover?.avgDays || 0 }}<span style="font-size:14px;">天</span></div>
        <div class="stat-sub">当前在库 {{ stats.inventoryTurnover?.totalInStock || 0 }} 台</div>
      </div>
    </div>

    <div class="chart-row">
      <div class="chart-box">
        <div class="chart-title">任务来源分布</div>
        <div ref="sourceChart" class="chart-container"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">处理结论分布</div>
        <div ref="closeChart" class="chart-container"></div>
      </div>
    </div>

    <div class="chart-row">
      <div class="chart-box">
        <div class="chart-title">业务员业绩排行</div>
        <div ref="salesChart" class="chart-container"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">库存周转结构</div>
        <div ref="turnoverChart" class="chart-container"></div>
      </div>
    </div>

    <div class="page-card" style="margin-top: 16px;">
      <div class="page-card-header">
        <div class="page-card-title">
          <el-icon style="vertical-align:-2px;margin-right:6px;"><AlarmClock /></el-icon>
          最新任务动态
        </div>
      </div>
      <div class="page-card-body">
        <el-table :data="recentTasks" stripe size="default" @row-click="gotoDetail">
          <el-table-column prop="taskNo" label="任务单号" width="140" />
          <el-table-column label="车辆" width="200">
            <template #default="{ row }">
              {{ row.vehicleBrand || '-' }} {{ row.vehicleSeries || '' }}
              <span v-if="row.plateNo" style="color:#9ca3af;"> ({{ row.plateNo }})</span>
            </template>
          </el-table-column>
          <el-table-column prop="customerName" label="客户" width="100" />
          <el-table-column label="状态" width="140">
            <template #default="{ row }">
              <span :class="['status-tag', `status-${row.taskStatus}`]">{{ row.taskStatusDesc }}</span>
            </template>
          </el-table-column>
          <el-table-column label="负责人" width="220">
            <template #default="{ row }">
              <span style="margin-right:10px;">销:{{ row.salesName || '-' }}</span>
              <span style="margin-right:10px;">评:{{ row.assessorName || '-' }}</span>
              <span>经:{{ row.managerName || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="期望价/最终价" width="180">
            <template #default="{ row }">
              <span style="color:#6b7280;">{{ formatPrice(row.expectedPrice) }}</span>
              <span v-if="row.finalPrice" style="color:#dc2626;margin-left:8px;">{{ formatPrice(row.finalPrice) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="170">
            <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="right">
            <template #default="{ row }">
              <el-button type="primary" link @click.stop="gotoDetail(row)">处理</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getTaskStatistics, getSourceStats, getSalesStats, getCloseTypeStats, getInventoryTurnoverStats, queryTaskPage } from '../api'

const router = useRouter()
const stats = ref({ taskOverview: {}, inventoryTurnover: {} })
const recentTasks = ref([])
const sourceChart = ref(null)
const closeChart = ref(null)
const salesChart = ref(null)
const turnoverChart = ref(null)

const formatPrice = (p) => p ? `¥${Number(p).toLocaleString()}` : '-'
const formatTime = (t) => t ? t.slice(0, 16).replace('T', ' ') : '-'

const gotoDetail = (row) => router.push(`/tasks/${row.id}`)

const renderSourceChart = (list) => {
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']
  const chart = echarts.init(sourceChart.value)
  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    color: colors,
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      label: { formatter: '{b}\n{c}单' },
      data: list.map(i => ({ name: i.sourceTypeDesc || i.sourceType, value: i.count || 0 }))
    }]
  })
}

const renderCloseChart = (list) => {
  const map = { NORMAL: '正常收购', REJECT: '放弃收购', CANCEL: '取消任务' }
  const chart = echarts.init(closeChart.value)
  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    color: ['#10b981', '#6b7280', '#d1d5db'],
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      label: { formatter: '{b}\n{c}单' },
      data: list.map(i => ({ name: map[i.closeType] || i.closeType, value: i.count || 0 }))
    }]
  })
}

const renderSalesChart = (list) => {
  const chart = echarts.init(salesChart.value)
  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, data: ['任务总数', '成功单数', '成功率(%)'] },
    grid: { left: 40, right: 60, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: list.map(i => i.name || '未知') },
    yAxis: [
      { type: 'value', name: '单数' },
      { type: 'value', name: '成功率(%)', max: 100 }
    ],
    series: [
      { name: '任务总数', type: 'bar', data: list.map(i => i.total || 0), itemStyle: { color: '#3b82f6' } },
      { name: '成功单数', type: 'bar', data: list.map(i => i.success || 0), itemStyle: { color: '#10b981' } },
      {
        name: '成功率(%)', type: 'line', yAxisIndex: 1, smooth: true,
        data: list.map(i => i.rate || 0), itemStyle: { color: '#f59e0b' },
        symbol: 'circle', symbolSize: 8
      }
    ]
  })
}

const renderTurnoverChart = (data) => {
  const chart = echarts.init(turnoverChart.value)
  const items = [
    { name: '快周转(≤7天)', value: Number(data.fastTurnover || 0), color: '#10b981' },
    { name: '正常(8-30天)', value: Number(data.normalTurnover || 0), color: '#3b82f6' },
    { name: '滞销(>30天)', value: Number(data.slowTurnover || 0), color: '#ef4444' }
  ]
  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 100, right: 30, top: 20, bottom: 20 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: items.map(i => i.name) },
    series: [{
      type: 'bar',
      data: items.map(i => ({ value: i.value, itemStyle: { color: i.color } })),
      label: { show: true, position: 'right', formatter: '{c}台' },
      barWidth: 30
    }]
  })
}

onMounted(async () => {
  try {
    const [statRes, srcRes, salesRes, closeRes, invRes, taskRes] = await Promise.all([
      getTaskStatistics(),
      getSourceStats(),
      getSalesStats(),
      getCloseTypeStats(),
      getInventoryTurnoverStats(),
      queryTaskPage({ pageNum: 1, pageSize: 8 })
    ])
    stats.value = statRes.data
    recentTasks.value = taskRes.data?.list || []

    await nextTick()
    renderSourceChart(srcRes.data || [])
    renderCloseChart(closeRes.data || [])
    renderSalesChart(salesRes.data || [])
    renderTurnoverChart(invRes.data || {})
  } catch (e) {
    console.error(e)
  }
})
</script>
