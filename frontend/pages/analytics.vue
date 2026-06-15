<template>
  <div class="page-container">
    <div class="overview-row">
      <div class="stat-card" style="border-left: 4px solid #1B3A5C;">
        <div class="stat-icon" style="background: rgba(27,58,92,0.1);">
          <span>👥</span>
        </div>
        <div class="stat-info">
          <div class="stat-value" style="color: #1B3A5C;">{{ analyticsStore.overview.total_students }}</div>
          <div class="stat-label">学员总数</div>
        </div>
      </div>
      <div class="stat-card" style="border-left: 4px solid #3498DB;">
        <div class="stat-icon" style="background: rgba(52,152,219,0.1);">
          <span>📦</span>
        </div>
        <div class="stat-info">
          <div class="stat-value" style="color: #3498DB;">{{ analyticsStore.overview.pending_count }}</div>
          <div class="stat-label">待发放数</div>
        </div>
      </div>
      <div class="stat-card" style="border-left: 4px solid #27AE60;">
        <div class="stat-icon" style="background: rgba(39,174,96,0.1);">
          <span>📊</span>
        </div>
        <div class="stat-info">
          <div class="stat-value" style="color: #27AE60;">{{ analyticsStore.overview.completion_rate }}%</div>
          <div class="stat-label">完成率</div>
        </div>
      </div>
      <div class="stat-card" style="border-left: 4px solid #E74C3C;">
        <div class="stat-icon" style="background: rgba(231,76,60,0.1);">
          <span>⚠️</span>
        </div>
        <div class="stat-info">
          <div class="stat-value" style="color: #E74C3C;">{{ analyticsStore.overview.risk_count }}</div>
          <div class="stat-label">风险记录数</div>
        </div>
      </div>
    </div>

    <div class="filter-bar" style="margin-bottom: 20px;">
      <n-select
        v-model:value="periodFilter"
        placeholder="时间周期"
        :options="periodOptions"
        style="width: 140px;"
        @update:value="onPeriodChange"
      />
      <n-select
        v-model:value="courseFilter"
        placeholder="筛选课程"
        clearable
        :options="courseOptions"
        style="width: 200px;"
        @update:value="onCourseChange"
      />
      <n-checkbox v-model:checked="excludeIrrelevant">
        排除无关记录（已结业/已转出）
      </n-checkbox>
      <div style="flex:1;" />
      <n-button @click="refreshData">
        <template #icon>🔄</template>
        刷新
      </n-button>
    </div>

    <div class="charts-row">
      <div class="card-section chart-card">
        <div class="card-section-title">完成率趋势（计划 vs 实际）</div>
        <div class="chart-wrapper">
          <v-chart :option="lineChartOption" autoresize style="height: 320px;" />
        </div>
      </div>
      <div class="card-section chart-card">
        <div class="card-section-title">风险分布</div>
        <div class="chart-wrapper">
          <v-chart :option="pieChartOption" autoresize style="height: 320px;" />
        </div>
      </div>
    </div>

    <div class="card-section" v-if="Object.keys(analyticsStore.riskDistribution.by_course).length > 0">
      <div class="card-section-title">各课程风险分布</div>
      <div class="course-risk-grid">
        <div
          v-for="(dist, courseName) in analyticsStore.riskDistribution.by_course"
          :key="courseName"
          class="course-risk-item"
        >
          <div class="course-risk-name">{{ courseName }}</div>
          <div class="course-risk-bars">
            <div class="risk-bar-row">
              <span class="risk-bar-label" style="color:#E74C3C;">高</span>
              <div class="risk-bar-track">
                <div
                  class="risk-bar-fill"
                  style="background:#E74C3C;"
                  :style="{ width: getBarWidth(dist.high) + '%' }"
                />
              </div>
              <span class="risk-bar-value">{{ dist.high }}</span>
            </div>
            <div class="risk-bar-row">
              <span class="risk-bar-label" style="color:#F39C12;">中</span>
              <div class="risk-bar-track">
                <div
                  class="risk-bar-fill"
                  style="background:#F39C12;"
                  :style="{ width: getBarWidth(dist.medium) + '%' }"
                />
              </div>
              <span class="risk-bar-value">{{ dist.medium }}</span>
            </div>
            <div class="risk-bar-row">
              <span class="risk-bar-label" style="color:#F1C40F;">低</span>
              <div class="risk-bar-track">
                <div
                  class="risk-bar-fill"
                  style="background:#F1C40F;"
                  :style="{ width: getBarWidth(dist.low) + '%' }"
                />
              </div>
              <span class="risk-bar-value">{{ dist.low }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'

use([CanvasRenderer, LineChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const analyticsStore = useAnalyticsStore()

onMounted(async () => {
  await analyticsStore.init()
})

const excludeIrrelevant = ref(true)
const periodFilter = ref<'month' | 'quarter' | 'year'>('month')
const courseFilter = ref<number | null>(null)

const periodOptions = [
  { label: '按月', value: 'month' },
  { label: '按季度', value: 'quarter' },
  { label: '按年', value: 'year' },
]

const courseOptions = computed(() => {
  return Object.keys(analyticsStore.riskDistribution.by_course).map((name, idx) => ({
    label: name,
    value: idx + 1,
  }))
})

function getBarWidth(val: number): number {
  const maxVal = Math.max(
    analyticsStore.riskDistribution.high,
    analyticsStore.riskDistribution.medium,
    analyticsStore.riskDistribution.low,
    1
  )
  return Math.min((val / maxVal) * 100, 100)
}

function onPeriodChange(val: 'month' | 'quarter' | 'year') {
  analyticsStore.setPeriod(val)
  analyticsStore.fetchCompletionTrend()
}

function onCourseChange(val: number | null) {
  analyticsStore.setCourseId(val)
  Promise.all([
    analyticsStore.fetchCompletionTrend(),
    analyticsStore.fetchRiskDistribution(),
  ])
}

async function refreshData() {
  await analyticsStore.init()
  window.$message?.success('数据已刷新')
}

const lineChartOption = computed(() => {
  const trend = analyticsStore.completionTrend
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#E4E7ED',
      borderWidth: 1,
      textStyle: { color: '#2C3E50' },
    },
    legend: {
      data: ['计划发放数', '实际完成率(%)'],
      bottom: 0,
      textStyle: { color: '#7F8C9B' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: trend.labels,
      axisLine: { lineStyle: { color: '#E4E7ED' } },
      axisLabel: { color: '#7F8C9B' },
    },
    yAxis: [
      {
        type: 'value',
        name: '发放数',
        position: 'left',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F0F0F0' } },
        axisLabel: { color: '#7F8C9B' },
      },
      {
        type: 'value',
        name: '完成率(%)',
        position: 'right',
        max: 100,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#7F8C9B', formatter: '{value}%' },
      },
    ],
    series: [
      {
        name: '计划发放数',
        type: 'line',
        yAxisIndex: 0,
        data: trend.planned,
        smooth: true,
        lineStyle: { color: '#1B3A5C', width: 3 },
        itemStyle: { color: '#1B3A5C' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(27,58,92,0.15)' },
              { offset: 1, color: 'rgba(27,58,92,0.01)' },
            ],
          },
        },
      },
      {
        name: '实际完成率(%)',
        type: 'line',
        yAxisIndex: 1,
        data: trend.actual,
        smooth: true,
        lineStyle: { color: '#F28C28', width: 3 },
        itemStyle: { color: '#F28C28' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(242,140,40,0.15)' },
              { offset: 1, color: 'rgba(242,140,40,0.01)' },
            ],
          },
        },
      },
    ],
  }
})

const pieChartOption = computed(() => {
  const dist = analyticsStore.riskDistributionList
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#fff',
      borderColor: '#E4E7ED',
      borderWidth: 1,
      textStyle: { color: '#2C3E50' },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#7F8C9B' },
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          color: '#2C3E50',
        },
        labelLine: {
          lineStyle: { color: '#E4E7ED' },
        },
        data: dist.map((item) => {
          const colorMap: Record<string, string> = {
            '高风险': '#E74C3C',
            '中风险': '#F39C12',
            '低风险': '#F1C40F',
          }
          return {
            name: item.name,
            value: item.value,
            itemStyle: { color: colorMap[item.name] || '#999' },
          }
        }),
      },
    ],
  }
})
</script>

<style scoped>
.overview-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.charts-row {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 20px;
}

.chart-card {
  min-height: 400px;
}

.chart-wrapper {
  width: 100%;
}

.course-risk-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.course-risk-item {
  padding: 16px;
  background: var(--color-bg);
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.course-risk-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 12px;
}

.course-risk-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.risk-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.risk-bar-label {
  width: 24px;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.risk-bar-track {
  flex: 1;
  height: 8px;
  background: #E4E7ED;
  border-radius: 4px;
  overflow: hidden;
}

.risk-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.risk-bar-value {
  width: 32px;
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: right;
  flex-shrink: 0;
}
</style>
