<template>
  <div class="page-container">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold">工作台</h1>
        <p class="text-gray-500 text-sm mt-1">今日概览 · {{ today }}</p>
      </div>
      <NSpace>
        <NButton v-if="authStore.isAppraiser" type="primary" @click="goCreateVehicle">
          <NIcon :component="PlusOutlined" class="mr-1" />
          新建车源
        </NButton>
      </NSpace>
    </div>

    <NGrid :cols="4" x-gap="16" y-gap="16" class="mb-6">
      <NGi v-for="card in statCards" :key="card.label">
        <NCard :bordered="false" class="stat-card" size="small">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-500 text-sm">{{ card.label }}</span>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center" :style="{background: card.colorBg}">
              <NIcon :component="card.icon" :style="{color: card.color}" />
            </div>
          </div>
          <div class="flex items-end gap-2">
            <NNumberAnimation :from="0" :to="card.value" :active="loaded" :precision="card.precision || 0" class="text-2xl font-bold" />
            <span class="text-gray-500 text-sm mb-1">{{ card.unit || '' }}</span>
          </div>
          <div v-if="card.tip" class="text-xs text-gray-400 mt-1">{{ card.tip }}</div>
        </NCard>
      </NGi>
    </NGrid>

    <NGrid :cols="2" x-gap="16" y-gap="16" class="mb-6">
      <NGi>
        <NCard :bordered="false" size="small" title="阶段分布">
          <div ref="stageChartRef" style="height: 300px" />
        </NCard>
      </NGi>
      <NGi>
        <NCard :bordered="false" size="small" title="近6月趋势">
          <div ref="trendChartRef" style="height: 300px" />
        </NCard>
      </NGi>
    </NGrid>

    <NGrid :cols="3" x-gap="16" y-gap="16">
      <NGi :span="2">
        <NCard :bordered="false" size="small" title="待处理车源" class="h-full">
          <template #header-extra>
            <NText tag="a" class="text-green-600 cursor-pointer" @click="router.push('/vehicles')">
              查看全部
            </NText>
          </template>
          <NSpin :show="loadingVehicles">
            <NDataTable
              :columns="quickColumns"
              :data="pendingVehicles"
              :pagination="false"
              size="small"
              :bordered="false"
              :single-line="false"
            />
          </NSpin>
        </NCard>
      </NGi>
      <NGi>
        <NCard :bordered="false" size="small" title="待复核资料" class="h-full">
          <template #header-extra>
            <NText tag="a" class="text-green-600 cursor-pointer" @click="router.push('/documents/missing')">
              去处理
            </NText>
          </template>
          <div v-if="overview?.vehicles_with_missing_docs" class="flex flex-col items-center py-8">
            <div class="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <NIcon :component="AlertOutlined" size="40" style="color: #f59e0b" />
            </div>
            <NNumberAnimation :from="0" :to="overview.vehicles_with_missing_docs" :active="loaded" class="text-3xl font-bold text-orange-600 mb-2" />
            <div class="text-gray-500 text-sm">台车辆存在资料缺失</div>
          </div>
          <NEmpty v-else description="暂无缺失资料" />
        </NCard>
      </NGi>
    </NGrid>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, shallowRef } from 'vue'
import { useRouter, useMessage } from 'naive-ui'
import * as echarts from 'echarts'
import {
  PlusOutlined, CarOutlined, EyeOutlined, ShopOutlined,
  AlertOutlined, DollarOutlined, CheckCircleOutlined, RiseOutlined,
} from '@vicons/antd'
import { useAuthStore } from '~/stores/auth'
import type { VehicleListItem, OverviewStats } from '~/types'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const router = useRouter()
const message = useMessage()

const today = dayjs().format('YYYY年MM月DD日')
const loaded = ref(false)
const overview = shallowRef<OverviewStats | null>(null)
const pendingVehicles = ref<VehicleListItem[]>([])
const loadingVehicles = ref(false)
const stageChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)
let stageChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

const statCards = computed(() => {
  const o = overview.value
  if (!o) return []
  return [
    { label: '车源总数', value: o.total_vehicles, icon: CarOutlined, color: '#18a058', colorBg: '#e6f7ec' },
    { label: '已上架', value: o.listed_vehicles, icon: ShopOutlined, color: '#2080f0', colorBg: '#e6f2ff' },
    { label: '本月售出', value: o.sold_this_month, icon: CheckCircleOutlined, color: '#722ed1', colorBg: '#f4eafb' },
    { label: '待审核', value: o.pending_review, icon: EyeOutlined, color: '#f59e0b', colorBg: '#fff7e6' },
    { label: '库存天数(均)', value: o.avg_inventory_days, icon: RiseOutlined, color: '#13c2c2', colorBg: '#e6fffb', unit: '天' },
    { label: '累计营收', value: o.total_revenue / 10000, precision: 2, icon: DollarOutlined, color: '#eb2f96', colorBg: '#fff0f6', unit: '万', tip: `毛利 ¥${(o.profit / 10000).toFixed(2)}万` },
    { label: '本月上架', value: o.listed_this_month, icon: PlusOutlined, color: '#fa8c16', colorBg: '#fff7e6' },
    { label: '今日新增', value: o.created_today, icon: AlertOutlined, color: '#52c41a', colorBg: '#f6ffed' },
  ]
})

const quickColumns = [
  { title: '车辆', key: 'vehicle', render: (r: VehicleListItem) => {
    return `${r.brand} ${r.model} ${r.year}款`
  } },
  { title: 'VIN', key: 'vin', ellipsis: { tooltip: true }, render: (r: VehicleListItem) => r.vin.slice(-8) },
  { title: '阶段', key: 'status', render: (r: VehicleListItem) => h(
    NTag, { type: statusType(r.status), size: 'small', bordered: false },
    { default: () => r.status_display }
  ) },
  { title: '完成度', key: 'completion', render: (r: VehicleListItem) => h(
    NProgress, { type: 'line', percentage: r.stage_completion.percentage, height: 8, status: 'success' }
  ) },
  { title: '操作', key: 'action', render: (r: VehicleListItem) => h(
    NButton, { text: true, type: 'primary', size: 'small', onClick: () => router.push(`/vehicles/${r.id}`) },
    { default: () => '查看' }
  ) },
]

function statusType(s: string) {
  const m: Record<string, any> = {
    pending_evaluation: 'default',
    pending_inspection: 'warning',
    pending_preparation: 'warning',
    pending_testdrive: 'warning',
    pending_review: 'error',
    listed: 'success',
    sold: 'info',
    off_shelf: 'default',
    rejected: 'error',
  }
  return m[s] || 'default'
}

async function loadOverview() {
  try {
    const { $api } = useNuxtApp()
    overview.value = await $api.get<any, OverviewStats>('/statistics/overview')
    loaded.value = true
  } catch (e: any) {
    message.warning(e.message || '加载统计失败，展示模拟数据')
    overview.value = mockOverview
    loaded.value = true
  }
}

async function loadPendingVehicles() {
  loadingVehicles.value = true
  try {
    const { $api } = useNuxtApp()
    const res = await $api.get<any, any>('/vehicles', { status: 'pending_review', page_size: 5 })
    pendingVehicles.value = res.results || []
  } catch {
    pendingVehicles.value = mockVehicles
  } finally {
    loadingVehicles.value = false
  }
}

async function loadCharts() {
  let stageData: any[] = []
  let trendData: any[] = []
  try {
    const { $api } = useNuxtApp()
    const [stages, trend] = await Promise.all([
      $api.get<any, any>('/statistics/stage-distribution'),
      $api.get<any, any[]>('/statistics/trend-data', { months: 6 }),
    ])
    stageData = stages.vehicle_stages || []
    trendData = trend || []
  } catch {
    stageData = mockStageDistribution
    trendData = mockTrend
  }

  await nextTick()
  if (stageChartRef.value) {
    stageChart = echarts.init(stageChartRef.value)
    stageChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: stageData.map(d => d.label), axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: stageData.map(d => d.count),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#36d399' },
            { offset: 1, color: '#18a058' },
          ]),
        },
        barWidth: 22,
      }],
    })
  }
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['新增', '上架', '售出'], right: 10, top: 0 },
      grid: { left: 40, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: trendData.map(d => d.month) },
      yAxis: { type: 'value' },
      series: [
        { name: '新增', type: 'line', smooth: true, data: trendData.map(d => d.created), itemStyle: { color: '#2080f0' } },
        { name: '上架', type: 'line', smooth: true, data: trendData.map(d => d.listed), itemStyle: { color: '#18a058' } },
        { name: '售出', type: 'line', smooth: true, data: trendData.map(d => d.sold), itemStyle: { color: '#f59e0b' } },
      ],
    })
  }
}

function goCreateVehicle() {
  router.push('/vehicles?action=create')
}

const mockOverview: OverviewStats = {
  total_vehicles: 86, listed_vehicles: 42, sold_vehicles: 28, pending_review: 8,
  vehicles_with_missing_docs: 11, total_cost: 5820000, total_revenue: 6895000,
  profit: 1075000, profit_margin: 18.47, avg_inventory_days: 23.5,
  sold_this_month: 9, listed_this_month: 15, created_today: 3,
}
const mockVehicles: VehicleListItem[] = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1, vin: `LVGBH42K${89012345 + i}`, plate_number: `沪A·${12345 + i}`,
  brand: ['宝马', '奔驰', '奥迪', '丰田', '本田'][i],
  model: ['3系', 'C级', 'A4L', '凯美瑞', '雅阁'][i],
  year: 2020 + i, color: '白色', mileage: 35000 + i * 8000, fuel_type: 'gasoline',
  status: 'pending_review', status_display: '待审核',
  review_status: 'pending', review_status_display: '待复核',
  purchase_price: 220000 + i * 5000, expected_price: 258000 + i * 6000, selling_price: null,
  appraiser: null, appraiser_info: null, salesperson: null, salesperson_info: null,
  document_status: { complete: true, missing_count: 0, missing_types: [] },
  stage_completion: { total: 4, done: 3, percentage: 75, stages: { evaluation: true, inspection: true, preparation: true, testdrive: false } },
  inventory_days: 12 + i * 3, source: '门店收车',
  created_at: new Date(Date.now() - (12 + i * 3) * 86400000).toISOString(),
  updated_at: new Date().toISOString(), listed_at: null, sold_at: null,
}))
const mockStageDistribution = [
  { status: 'pending_evaluation', label: '待评估', count: 5 },
  { status: 'pending_inspection', label: '待检测', count: 8 },
  { status: 'pending_preparation', label: '待整备', count: 6 },
  { status: 'pending_testdrive', label: '待试驾', count: 10 },
  { status: 'pending_review', label: '待审核', count: 8 },
  { status: 'listed', label: '已上架', count: 42 },
  { status: 'sold', label: '已售出', count: 28 },
]
const mockTrend = Array.from({ length: 6 }, (_, i) => {
  const d = dayjs().subtract(5 - i, 'month')
  return { month: d.format('YYYY-MM'), created: 10 + i * 2, listed: 8 + i * 2, sold: 6 + i, revenue: 50 + i * 10 }
})

onMounted(() => {
  loadOverview()
  loadPendingVehicles()
  loadCharts()
  window.addEventListener('resize', () => {
    stageChart?.resize()
    trendChart?.resize()
  })
})
</script>

<style scoped>
.stat-card {
  transition: all .25s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.12);
}
</style>
