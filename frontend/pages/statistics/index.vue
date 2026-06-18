<template>
  <div class="page-container">
    <div class="mb-4">
      <h1 class="text-xl font-bold">统计报表</h1>
      <p class="text-gray-500 text-sm mt-1">运营数据分析与人员绩效</p>
    </div>

    <NTabs v-model:value="activeTab" type="line" animated>
      <NTabPane name="overview" tab="总览">
        <template #tab>
          <span class="flex items-center gap-1">
            <NIcon :component="DashboardOutlined" />
            总览
          </span>
        </template>
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
              <div ref="stageChartRef" style="height: 320px" />
            </NCard>
          </NGi>
          <NGi>
            <NCard :bordered="false" size="small" title="近12月趋势">
              <div ref="trendChartRef" style="height: 320px" />
            </NCard>
          </NGi>
        </NGrid>

        <NGrid :cols="2" x-gap="16" y-gap="16">
          <NGi>
            <NCard :bordered="false" size="small" title="资料完成度">
              <div ref="docChartRef" style="height: 320px" />
            </NCard>
          </NGi>
          <NGi>
            <NCard :bordered="false" size="small" title="库存天数分布">
              <div ref="invChartRef" style="height: 320px" />
            </NCard>
          </NGi>
        </NGrid>
      </NTabPane>

      <NTabPane name="staff" tab="人员绩效">
        <template #tab>
          <span class="flex items-center gap-1">
            <NIcon :component="TeamOutlined" />
            人员绩效
          </span>
        </template>

        <NCard :bordered="false" size="small" title="评估师绩效" class="mb-4">
          <NDataTable
            :columns="appraiserColumns"
            :data="staffPerformance.appraisers"
            :pagination="false"
            size="small"
            :bordered="false"
          />
        </NCard>

        <NCard :bordered="false" size="small" title="销售绩效" class="mb-4">
          <NDataTable
            :columns="salesColumns"
            :data="staffPerformance.sales"
            :pagination="false"
            size="small"
            :bordered="false"
          />
        </NCard>

        <NCard :bordered="false" size="small" title="金融/文档绩效">
          <NDataTable
            :columns="financeColumns"
            :data="staffPerformance.finance"
            :pagination="false"
            size="small"
            :bordered="false"
          />
        </NCard>
      </NTabPane>

      <NTabPane name="stage" tab="阶段分析">
        <template #tab>
          <span class="flex items-center gap-1">
            <NIcon :component="BarChartOutlined" />
            阶段分析
          </span>
        </template>

        <NGrid :cols="2" x-gap="16" y-gap="16" class="mb-6">
          <NGi>
            <NCard :bordered="false" size="small" title="各阶段平均停留天数">
              <div ref="avgDaysChartRef" style="height: 360px" />
            </NCard>
          </NGi>
          <NGi>
            <NCard :bordered="false" size="small" title="阶段转化漏斗">
              <div ref="funnelChartRef" style="height: 360px" />
            </NCard>
          </NGi>
        </NGrid>

        <NCard :bordered="false" size="small" title="阶段详情">
          <NDataTable
            :columns="stageDetailColumns"
            :data="stageDetails"
            :pagination="false"
            size="small"
            :bordered="false"
          />
        </NCard>
      </NTabPane>

      <NTabPane name="document" tab="资料完成度">
        <template #tab>
          <span class="flex items-center gap-1">
            <NIcon :component="FileTextOutlined" />
            资料完成度
          </span>
        </template>

        <NGrid :cols="3" x-gap="16" y-gap="16" class="mb-6">
          <NGi v-for="d in docSummaryCards" :key="d.label">
            <NCard :bordered="false" size="small">
              <div class="flex items-center justify-between mb-2">
                <span class="text-gray-500 text-sm">{{ d.label }}</span>
                <NIcon :component="d.icon" :style="{color: d.color}" />
              </div>
              <div class="text-2xl font-bold">{{ d.value }}</div>
              <div class="text-xs text-gray-400 mt-1">{{ d.tip }}</div>
            </NCard>
          </NGi>
        </NGrid>

        <NCard :bordered="false" size="small" title="证件缺失明细表">
          <NDataTable
            :columns="docMissingColumns"
            :data="docMissingList"
            :pagination="docPagination"
            @update:page="(p) => docPage = p"
            size="small"
            :bordered="false"
          />
        </NCard>
      </NTabPane>
    </NTabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch, shallowRef, h } from 'vue'
import { useMessage, type DataTableColumns } from 'naive-ui'
import * as echarts from 'echarts'
import {
  DashboardOutlined, TeamOutlined, BarChartOutlined, FileTextOutlined,
  CarOutlined, ShopOutlined, CheckCircleOutlined, EyeOutlined,
  AlertOutlined, DollarOutlined, RiseOutlined, FileOutlined,
  UserOutlined, TrophyOutlined, WarningOutlined,
} from '@vicons/antd'
import type { OverviewStats } from '~/types'
import dayjs from 'dayjs'

const message = useMessage()
const activeTab = ref('overview')
const loaded = ref(false)
const overview = shallowRef<OverviewStats | null>(null)

const stageChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)
const docChartRef = ref<HTMLElement | null>(null)
const invChartRef = ref<HTMLElement | null>(null)
const avgDaysChartRef = ref<HTMLElement | null>(null)
const funnelChartRef = ref<HTMLElement | null>(null)

let stageChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null
let docChart: echarts.ECharts | null = null
let invChart: echarts.ECharts | null = null
let avgDaysChart: echarts.ECharts | null = null
let funnelChart: echarts.ECharts | null = null

const statCards = computed(() => {
  const o = overview.value
  if (!o) return []
  return [
    { label: '车源总数', value: o.total_vehicles, icon: CarOutlined, color: '#18a058', colorBg: '#e6f7ec' },
    { label: '已上架', value: o.listed_vehicles, icon: ShopOutlined, color: '#2080f0', colorBg: '#e6f2ff' },
    { label: '已售出', value: o.sold_vehicles, icon: CheckCircleOutlined, color: '#722ed1', colorBg: '#f4eafb' },
    { label: '待审核', value: o.pending_review, icon: EyeOutlined, color: '#f59e0b', colorBg: '#fff7e6' },
    { label: '资料缺失', value: o.vehicles_with_missing_docs, icon: AlertOutlined, color: '#eb2f96', colorBg: '#fff0f6' },
    { label: '累计营收', value: o.total_revenue / 10000, precision: 2, icon: DollarOutlined, color: '#13c2c2', colorBg: '#e6fffb', unit: '万' },
    { label: '毛利率', value: o.profit_margin, precision: 2, icon: RiseOutlined, color: '#fa8c16', colorBg: '#fff7e6', unit: '%', tip: `毛利 ¥${(o.profit / 10000).toFixed(2)}万` },
    { label: '平均库存', value: o.avg_inventory_days, precision: 1, icon: BarChartOutlined, color: '#52c41a', colorBg: '#f6ffed', unit: '天' },
  ]
})

const staffPerformance = reactive({
  appraisers: [] as any[],
  sales: [] as any[],
  finance: [] as any[],
})

const appraiserColumns: DataTableColumns = [
  { title: '评估师', key: 'name', width: 120, render: (r: any) => h('span', { class: 'font-medium' }, r.name) },
  { title: '工号', key: 'employee_id', width: 100 },
  { title: '评估数', key: 'total_evaluated', width: 100, align: 'center', render: (r: any) => h('b', {}, r.total_evaluated) },
  { title: '评估均价', key: 'avg_price', width: 120, render: (r: any) => `¥${(r.avg_price / 10000).toFixed(2)}万` },
  { title: '通过数', key: 'passed', width: 100, align: 'center' },
  { title: '通过率', key: 'pass_rate', width: 100, render: (r: any) => `${r.pass_rate}%` },
  { title: '本月评估', key: 'this_month', width: 100, align: 'center' },
]

const salesColumns: DataTableColumns = [
  { title: '销售', key: 'name', width: 120, render: (r: any) => h('span', { class: 'font-medium' }, r.name) },
  { title: '工号', key: 'employee_id', width: 100 },
  { title: '售出数', key: 'sold_count', width: 100, align: 'center', render: (r: any) => h('b', {}, r.sold_count) },
  { title: '总营收', key: 'total_revenue', width: 130, render: (r: any) => `¥${(r.total_revenue / 10000).toFixed(2)}万` },
  { title: '总毛利', key: 'total_profit', width: 130, render: (r: any) => `¥${(r.total_profit / 10000).toFixed(2)}万` },
  { title: '试驾数', key: 'testdrive_count', width: 100, align: 'center' },
  { title: '转化', key: 'conversion_rate', width: 100, render: (r: any) => `${r.conversion_rate}%` },
]

const financeColumns: DataTableColumns = [
  { title: '姓名', key: 'name', width: 120, render: (r: any) => h('span', { class: 'font-medium' }, r.name) },
  { title: '工号', key: 'employee_id', width: 100 },
  { title: '上传文档', key: 'uploaded_docs', width: 120, align: 'center', render: (r: any) => h('b', {}, r.uploaded_docs) },
  { title: '已认证', key: 'verified_docs', width: 100, align: 'center' },
  { title: '审核通过率', key: 'verify_rate', width: 120, render: (r: any) => `${r.verify_rate}%` },
  { title: '处理补料', key: 'supplemented', width: 120, align: 'center' },
]

const stageDetails = ref<any[]>([])
const stageDetailColumns: DataTableColumns = [
  { title: '阶段', key: 'stage', width: 120, render: (r: any) => h(NTag, { type: r.tag_type, size: 'small', bordered: false }, { default: () => r.stage }) },
  { title: '当前车源', key: 'current_count', width: 100, align: 'center' },
  { title: '平均停留天数', key: 'avg_days', width: 130, render: (r: any) => h('span', { class: r.avg_days > 15 ? 'text-red-600 font-medium' : '' }, `${r.avg_days}天`) },
  { title: '最长停留', key: 'max_days', width: 100, render: (r: any) => `${r.max_days}天` },
  { title: '最短停留', key: 'min_days', width: 100, render: (r: any) => `${r.min_days}天` },
  { title: '转化率', key: 'conversion', width: 100, render: (r: any) => `${r.conversion}%` },
  { title: '完成度', key: 'completion', width: 180, render: (r: any) => h(NProgress, { percentage: r.completion, height: 8, status: 'success' } as any) },
]

const docPage = ref(1)
const docPageSize = 10
const docMissingTotal = ref(0)
const docMissingList = ref<any[]>([])
const docPagination = computed(() => ({ page: docPage.value, pageSize: docPageSize, itemCount: docMissingTotal.value }))

const docMissingColumns: DataTableColumns = [
  { title: '车辆', key: 'vehicle', width: 200, render: (r: any) => h('div', { class: 'flex flex-col' }, [
    h('span', { class: 'font-medium' }, `${r.brand} ${r.model} ${r.year}款`),
    h('span', { class: 'text-gray-500 text-xs' }, `VIN: ${r.vin.slice(-8)} · ${r.plate_number}`),
  ]) },
  { title: '状态', key: 'status', width: 100, render: (r: any) => h(NTag, { type: r.status === 'pending_review' ? 'warning' : 'default', size: 'small', bordered: false }, { default: () => r.status_display }) },
  { title: '负责人', key: 'owner', width: 100 },
  { title: '库存天数', key: 'inventory_days', width: 100, align: 'center', render: (r: any) => `${r.inventory_days}天` },
  { title: '缺失证件', key: 'missing', width: 280, render: (r: any) => h(NSpace, { size: 4, wrap: true } as any, {
    default: () => r.missing_types.map((t: string) => h(NTag, { type: 'error', size: 'small', bordered: false }, { default: () => docTypeLabel(t) })),
  }) },
  { title: '缺失数量', key: 'missing_count', width: 100, align: 'center', render: (r: any) => h(NBadge, { value: r.missing_count, type: 'error' } as any) },
]

function docTypeLabel(t: string) {
  const m: Record<string, string> = {
    registration_cert: '登记证书',
    driving_license: '行驶证',
    insurance: '交强险',
    maintenance_record: '保养记录',
    keys: '车钥匙',
    invoice: '购车发票',
    other: '其他',
  }
  return m[t] || t
}

const docSummaryCards = computed(() => [
  { label: '资料完整车辆', value: overview.value ? overview.value.total_vehicles - overview.value.vehicles_with_missing_docs : 0, icon: FileOutlined, color: '#18a058', tip: '所有证件齐全' },
  { label: '存在缺失车辆', value: overview.value?.vehicles_with_missing_docs || 0, icon: WarningOutlined, color: '#f5222d', tip: '需要补充资料' },
  { label: '本月补料完成', value: 15, icon: CheckCircleOutlined, color: '#2080f0', tip: '已补充并通过复核' },
])

async function loadOverview() {
  try {
    const { $api } = useNuxtApp()
    overview.value = await $api.get<any, OverviewStats>('/statistics/overview')
    loaded.value = true
  } catch (e: any) {
    overview.value = mockOverview
    loaded.value = true
  }
}

async function loadStaff() {
  try {
    const { $api } = useNuxtApp()
    const res = await $api.get<any, any>('/statistics/staff-performance')
    staffPerformance.appraisers = res.appraisers || []
    staffPerformance.sales = res.sales || []
    staffPerformance.finance = res.finance || []
  } catch {
    staffPerformance.appraisers = mockAppraisers
    staffPerformance.sales = mockSales
    staffPerformance.finance = mockFinance
  }
}

async function loadStageDetails() {
  try {
    const { $api } = useNuxtApp()
    const res = await $api.get<any, any>('/statistics/stage-distribution')
    stageDetails.value = res.details || mockStageDetails
  } catch {
    stageDetails.value = mockStageDetails
  }
}

async function loadDocMissing() {
  try {
    const { $api } = useNuxtApp()
    const res = await $api.get<any, any>('/statistics/document-completion', { page: docPage.value, page_size: docPageSize })
    docMissingList.value = res.missing_details || mockDocMissing
    docMissingTotal.value = res.total || 35
  } catch {
    docMissingList.value = mockDocMissing
    docMissingTotal.value = 35
  }
}

async function loadAllCharts() {
  let stageData: any[] = []
  let trendData: any[] = []
  let docData: any = null

  try {
    const { $api } = useNuxtApp()
    const [stages, trend, doc] = await Promise.all([
      $api.get<any, any>('/statistics/stage-distribution'),
      $api.get<any, any[]>('/statistics/trend-data', { months: 12 }),
      $api.get<any, any>('/statistics/document-completion'),
    ])
    stageData = stages.vehicle_stages || []
    trendData = trend || []
    docData = doc
  } catch {
    stageData = mockStageDistribution
    trendData = mockTrend
    docData = mockDocData
  }

  await nextTick()

  if (stageChartRef.value) {
    stageChart = echarts.init(stageChartRef.value)
    stageChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 50, right: 20, top: 20, bottom: 40 },
      xAxis: { type: 'category', data: stageData.map(d => d.label), axisLabel: { fontSize: 11, interval: 0, rotate: 0 } },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: stageData.map(d => d.count),
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: (p: any) => {
            const colors = ['#9ca3af', '#f59e0b', '#f59e0b', '#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#9ca3af', '#ef4444']
            return colors[p.dataIndex % colors.length]
          },
        },
        barWidth: 28,
        label: { show: true, position: 'top', fontSize: 11 },
      }],
    })
  }

  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['新增', '上架', '售出'], right: 10, top: 0 },
      grid: { left: 50, right: 30, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: trendData.map(d => d.month), boundaryGap: false },
      yAxis: { type: 'value' },
      series: [
        { name: '新增', type: 'line', smooth: true, data: trendData.map(d => d.created), itemStyle: { color: '#2080f0' }, areaStyle: { opacity: 0.1 } },
        { name: '上架', type: 'line', smooth: true, data: trendData.map(d => d.listed), itemStyle: { color: '#18a058' }, areaStyle: { opacity: 0.1 } },
        { name: '售出', type: 'line', smooth: true, data: trendData.map(d => d.sold), itemStyle: { color: '#f59e0b' }, areaStyle: { opacity: 0.1 } },
      ],
    })
  }

  if (docChartRef.value) {
    docChart = echarts.init(docChartRef.value)
    const complete = docData?.complete || 58
    const missing = docData?.missing || 12
    const total = complete + missing
    docChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 5, left: 'center' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: [
          { value: complete, name: '资料完整', itemStyle: { color: '#22c55e' } },
          { value: missing, name: '资料缺失', itemStyle: { color: '#ef4444' } },
        ],
      }],
      graphic: [{
        type: 'text', left: 'center', top: '42%',
        style: { text: `${total}`, fontSize: 24, fontWeight: 'bold', fill: '#333' },
      }, {
        type: 'text', left: 'center', top: '55%',
        style: { text: '车辆总数', fontSize: 12, fill: '#999' },
      }],
    })
  }

  if (invChartRef.value) {
    invChart = echarts.init(invChartRef.value)
    invChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 50, right: 20, top: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: ['0-7天', '8-15天', '16-30天', '31-60天', '61-90天', '90天+'],
        axisLabel: { fontSize: 11 },
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: [12, 18, 22, 15, 8, 5],
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: (p: any) => {
            const colors = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#dc2626']
            return colors[p.dataIndex]
          },
        },
        barWidth: 36,
        label: { show: true, position: 'top', fontSize: 11 },
      }],
    })
  }

  if (avgDaysChartRef.value) {
    avgDaysChart = echarts.init(avgDaysChartRef.value)
    avgDaysChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 80, right: 30, top: 30, bottom: 30 },
      xAxis: { type: 'value', name: '天数' },
      yAxis: {
        type: 'category',
        data: ['已售出', '已上架', '待审核', '待试驾', '待整备', '待检测', '待评估'].reverse(),
      },
      series: [{
        type: 'bar',
        data: [3, 8, 5, 7, 12, 6, 2].reverse(),
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: (p: any) => {
            const v = p.value
            return v > 10 ? '#ef4444' : v > 7 ? '#f97316' : '#22c55e'
          },
        },
        barWidth: 20,
        label: { show: true, position: 'right', formatter: '{c}天' },
      }],
    })
  }

  if (funnelChartRef.value) {
    funnelChart = echarts.init(funnelChartRef.value)
    funnelChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}' },
      legend: { show: false },
      series: [{
        type: 'funnel',
        left: '10%',
        top: 20,
        bottom: 20,
        width: '80%',
        min: 0,
        max: 100,
        sort: 'descending',
        gap: 3,
        label: { show: true, position: 'inside', formatter: '{b}\n{c}' },
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        data: [
          { value: 100, name: '录入车源', itemStyle: { color: '#3b82f6' } },
          { value: 85, name: '完成评估', itemStyle: { color: '#8b5cf6' } },
          { value: 78, name: '通过检测', itemStyle: { color: '#06b6d4' } },
          { value: 70, name: '整备完成', itemStyle: { color: '#10b981' } },
          { value: 65, name: '试驾完成', itemStyle: { color: '#84cc16' } },
          { value: 58, name: '审核通过', itemStyle: { color: '#eab308' } },
          { value: 42, name: '成功售出', itemStyle: { color: '#f97316' } },
        ],
      }],
    })
  }
}

const mockOverview: OverviewStats = {
  total_vehicles: 86, listed_vehicles: 42, sold_vehicles: 28, pending_review: 8,
  vehicles_with_missing_docs: 11, total_cost: 5820000, total_revenue: 6895000,
  profit: 1075000, profit_margin: 18.47, avg_inventory_days: 23.5,
  sold_this_month: 9, listed_this_month: 15, created_today: 3,
}

const mockStageDistribution = [
  { status: 'pending_evaluation', label: '待评估', count: 5 },
  { status: 'pending_inspection', label: '待检测', count: 8 },
  { status: 'pending_preparation', label: '待整备', count: 6 },
  { status: 'pending_testdrive', label: '待试驾', count: 10 },
  { status: 'pending_review', label: '待审核', count: 8 },
  { status: 'listed', label: '已上架', count: 42 },
  { status: 'sold', label: '已售出', count: 28 },
  { status: 'off_shelf', label: '已下架', count: 3 },
  { status: 'rejected', label: '已拒绝', count: 2 },
]

const mockTrend = Array.from({ length: 12 }, (_, i) => {
  const d = dayjs().subtract(11 - i, 'month')
  return { month: d.format('YYYY-MM'), created: 8 + i, listed: 6 + Math.floor(i * 1.2), sold: 4 + Math.floor(i * 0.9), revenue: 40 + i * 8 }
})

const mockDocData = { complete: 58, missing: 12 }

const mockAppraisers = [
  { name: '张评估师', employee_id: 'AP001', total_evaluated: 156, avg_price: 235000, passed: 142, pass_rate: 91, this_month: 18 },
  { name: '李评估师', employee_id: 'AP002', total_evaluated: 128, avg_price: 218000, passed: 115, pass_rate: 90, this_month: 14 },
  { name: '王评估师', employee_id: 'AP003', total_evaluated: 98, avg_price: 242000, passed: 89, pass_rate: 91, this_month: 11 },
]

const mockSales = [
  { name: '赵销售', employee_id: 'SL001', sold_count: 42, total_revenue: 9856000, total_profit: 1752000, testdrive_count: 128, conversion_rate: 33 },
  { name: '钱销售', employee_id: 'SL002', sold_count: 35, total_revenue: 8120000, total_profit: 1428000, testdrive_count: 96, conversion_rate: 36 },
  { name: '孙销售', employee_id: 'SL003', sold_count: 28, total_revenue: 6580000, total_profit: 1186000, testdrive_count: 85, conversion_rate: 33 },
  { name: '周销售', employee_id: 'SL004', sold_count: 22, total_revenue: 5120000, total_profit: 926000, testdrive_count: 68, conversion_rate: 32 },
]

const mockFinance = [
  { name: '吴金融', employee_id: 'FN001', uploaded_docs: 326, verified_docs: 312, verify_rate: 96, supplemented: 45 },
  { name: '郑金融', employee_id: 'FN002', uploaded_docs: 258, verified_docs: 245, verify_rate: 95, supplemented: 38 },
]

const mockStageDetails = [
  { stage: '待评估', tag_type: 'default', current_count: 5, avg_days: 2, max_days: 7, min_days: 1, conversion: 95, completion: 60 },
  { stage: '待检测', tag_type: 'warning', current_count: 8, avg_days: 6, max_days: 14, min_days: 2, conversion: 92, completion: 72 },
  { stage: '待整备', tag_type: 'warning', current_count: 6, avg_days: 12, max_days: 28, min_days: 3, conversion: 88, completion: 65 },
  { stage: '待试驾', tag_type: 'warning', current_count: 10, avg_days: 7, max_days: 18, min_days: 1, conversion: 85, completion: 78 },
  { stage: '待审核', tag_type: 'error', current_count: 8, avg_days: 5, max_days: 12, min_days: 1, conversion: 90, completion: 82 },
  { stage: '已上架', tag_type: 'success', current_count: 42, avg_days: 8, max_days: 45, min_days: 1, conversion: 65, completion: 88 },
  { stage: '已售出', tag_type: 'info', current_count: 28, avg_days: 3, max_days: 15, min_days: 1, conversion: 100, completion: 100 },
]

const mockDocMissing = Array.from({ length: 10 }, (_, i) => {
  const missingCount = (i % 3) + 1
  const allTypes = ['registration_cert', 'driving_license', 'insurance', 'maintenance_record', 'keys', 'invoice', 'other']
  return {
    id: i + 1,
    vin: `LVGBH42K${89012345 + i}`,
    plate_number: `沪A·${12345 + i}`,
    brand: ['宝马', '奔驰', '奥迪', '丰田', '本田'][i % 5],
    model: ['3系', 'C级', 'A4L', '凯美瑞', '雅阁'][i % 5],
    year: 2020 + (i % 4),
    status: i % 2 === 0 ? 'pending_review' : 'listed',
    status_display: i % 2 === 0 ? '待审核' : '已上架',
    owner: ['张评估师', '赵销售'][i % 2],
    inventory_days: 10 + i * 3,
    missing_count: missingCount,
    missing_types: allTypes.slice(0, missingCount),
  }
})

watch(activeTab, (t) => {
  if (t === 'staff') loadStaff()
  if (t === 'stage') loadStageDetails()
  if (t === 'document') loadDocMissing()
})

onMounted(() => {
  loadOverview()
  loadAllCharts()
  window.addEventListener('resize', () => {
    stageChart?.resize()
    trendChart?.resize()
    docChart?.resize()
    invChart?.resize()
    avgDaysChart?.resize()
    funnelChart?.resize()
  })
})
</script>

<style scoped>
.page-container {
  padding: 16px;
}
.stat-card {
  transition: all .25s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.12);
}
</style>
