<template>
  <div class="page-container">
    <div class="mb-4 flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-xl font-bold">库存周转分析</h1>
        <p class="text-gray-500 text-sm mt-1">已售车辆库存周转与毛利分析</p>
      </div>
      <NSpace>
        <NRadioGroup v-model:value="selectedDays" size="small" @update:value="loadData">
          <NSpace>
            <NRadioButton :value="30">近30天</NRadioButton>
            <NRadioButton :value="90">近90天</NRadioButton>
            <NRadioButton :value="180">近180天</NRadioButton>
            <NRadioButton :value="365">近365天</NRadioButton>
          </NSpace>
        </NRadioGroup>
        <NDatePicker v-model:value="customRange" type="daterange" clearable @update:value="loadData" />
        <NButton type="primary" :loading="loading" @click="loadData">
          <NIcon :component="ReloadOutlined" class="mr-1" />
          刷新
        </NButton>
        <NButton @click="handleExport">
          <NIcon :component="DownloadOutlined" class="mr-1" />
          导出
        </NButton>
      </NSpace>
    </div>

    <NGrid :cols="4" x-gap="16" y-gap="16" class="mb-6">
      <NGi>
        <NCard :bordered="false" class="stat-card" size="small">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-500 text-sm">售出台数</span>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center bg-green-50">
              <NIcon :component="CheckCircleOutlined" style="color: #18a058" />
            </div>
          </div>
          <div class="flex items-end gap-2">
            <NNumberAnimation :from="0" :to="turnover?.total_sold || 0" :active="loaded" class="text-2xl font-bold" />
            <span class="text-gray-500 text-sm mb-1">台</span>
          </div>
        </NCard>
      </NGi>
      <NGi>
        <NCard :bordered="false" class="stat-card" size="small">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-500 text-sm">总成本</span>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50">
              <NIcon :component="WalletOutlined" style="color: #2080f0" />
            </div>
          </div>
          <div class="flex items-end gap-2">
            <NNumberAnimation :from="0" :to="(turnover?.total_cost || 0) / 10000" :precision="2" :active="loaded" class="text-2xl font-bold" />
            <span class="text-gray-500 text-sm mb-1">万</span>
          </div>
        </NCard>
      </NGi>
      <NGi>
        <NCard :bordered="false" class="stat-card" size="small">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-500 text-sm">总毛利</span>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-50">
              <NIcon :component="DollarOutlined" style="color: #722ed1" />
            </div>
          </div>
          <div class="flex items-end gap-2">
            <NNumberAnimation :from="0" :to="(turnover?.total_profit || 0) / 10000" :precision="2" :active="loaded" class="text-2xl font-bold text-purple-600" />
            <span class="text-gray-500 text-sm mb-1">万</span>
          </div>
          <div class="text-xs text-gray-400 mt-1">
            单车均利 ¥{{ ((turnover?.avg_profit || 0) / 10000).toFixed(2) }}万
          </div>
        </NCard>
      </NGi>
      <NGi>
        <NCard :bordered="false" class="stat-card" size="small">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-500 text-sm">平均周转天数</span>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center bg-orange-50">
              <NIcon :component="ClockCircleOutlined" style="color: #f59e0b" />
            </div>
          </div>
          <div class="flex items-end gap-2">
            <NNumberAnimation :from="0" :to="turnover?.avg_inventory_days || 0" :precision="1" :active="loaded" class="text-2xl font-bold text-orange-600" />
            <span class="text-gray-500 text-sm mb-1">天</span>
          </div>
          <div class="text-xs text-gray-400 mt-1">
            中位数 {{ turnover?.median_inventory_days || 0 }}天
          </div>
        </NCard>
      </NGi>
      <NGi>
        <NCard :bordered="false" class="stat-card" size="small">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-500 text-sm">最快周转</span>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-50">
              <NIcon :component="RocketOutlined" style="color: #10b981" />
            </div>
          </div>
          <div class="flex items-end gap-2">
            <NNumberAnimation :from="0" :to="turnover?.fastest_days || 0" :active="loaded" class="text-2xl font-bold text-emerald-600" />
            <span class="text-gray-500 text-sm mb-1">天</span>
          </div>
          <div v-if="fastestVehicle" class="text-xs text-gray-400 mt-1 truncate">
            {{ fastestVehicle.brand }} {{ fastestVehicle.model }}
          </div>
        </NCard>
      </NGi>
      <NGi>
        <NCard :bordered="false" class="stat-card" size="small">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-500 text-sm">最慢周转</span>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center bg-red-50">
              <NIcon :component="AlertOutlined" style="color: #ef4444" />
            </div>
          </div>
          <div class="flex items-end gap-2">
            <NNumberAnimation :from="0" :to="turnover?.slowest_days || 0" :active="loaded" class="text-2xl font-bold text-red-600" />
            <span class="text-gray-500 text-sm mb-1">天</span>
          </div>
          <div v-if="slowestVehicle" class="text-xs text-gray-400 mt-1 truncate">
            {{ slowestVehicle.brand }} {{ slowestVehicle.model }}
          </div>
        </NCard>
      </NGi>
      <NGi :span="2">
        <NCard :bordered="false" class="stat-card" size="small">
          <div class="flex items-center justify-between h-full">
            <div>
              <div class="text-gray-500 text-sm mb-2">整体毛利率</div>
              <div class="flex items-end gap-3">
                <NNumberAnimation :from="0" :to="overallMargin" :precision="2" :active="loaded" class="text-3xl font-bold" />
                <span class="text-gray-500 text-lg mb-1">%</span>
              </div>
            </div>
            <div style="width: 140px; height: 80px">
              <div ref="marginGaugeRef" style="width: 140px; height: 80px" />
            </div>
          </div>
        </NCard>
      </NGi>
    </NGrid>

    <NGrid :cols="2" x-gap="16" y-gap="16" class="mb-6">
      <NGi>
        <NCard :bordered="false" size="small" title="周转天数分布">
          <template #header-extra>
            <NText class="text-gray-400 text-xs">直方图</NText>
          </template>
          <div ref="histogramRef" style="height: 320px" />
        </NCard>
      </NGi>
      <NGi>
        <NCard :bordered="false" size="small" title="毛利排名 Top 10">
          <template #header-extra>
            <NText class="text-gray-400 text-xs">按毛利降序</NText>
          </template>
          <div ref="topProfitRef" style="height: 320px" />
        </NCard>
      </NGi>
    </NGrid>

    <NCard :bordered="false" size="small" title="周转明细">
      <template #header-extra>
        <NSpace>
          <NInput v-model:value="detailKeyword" placeholder="搜索品牌/车型/车牌" clearable style="width: 200px" />
          <NSelect v-model:value="profitSort" placeholder="毛利排序" clearable :options="profitSortOptions" style="width: 140px" />
          <NSelect v-model:value="daysSort" placeholder="周转排序" clearable :options="daysSortOptions" style="width: 140px" />
        </NSpace>
      </template>
      <NSpin :show="loading">
        <NDataTable
          :columns="detailColumns"
          :data="filteredDetails"
          :pagination="detailPagination"
          @update:page="(p) => detailPage = p"
          @update:page-size="(s) => { detailPageSize = s; detailPage = 1 }"
          size="small"
          :bordered="false"
          :single-line="false"
        />
      </NSpin>
    </NCard>

    <NDrawer v-model:show="showTraceDrawer" width="640" :native-scrollbar="false">
      <NDrawerContent title="车辆追溯" :native-scrollbar="false">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <NIcon :component="HistoryOutlined" size="18" />
              <span class="text-lg font-medium">车辆追溯</span>
            </div>
          </div>
        </template>
        <div v-if="traceData" class="py-2">
          <NCard :bordered="false" size="small" class="mb-4 bg-gray-50">
            <NSpace vertical size="small">
              <div class="flex items-center gap-4">
                <div class="font-medium text-lg">{{ traceData.vehicle.brand }} {{ traceData.vehicle.model }} {{ traceData.vehicle.year }}款</div>
                <NTag type="info" size="small" bordered="false">VIN: {{ traceData.vehicle.vin.slice(-8) }}</NTag>
              </div>
              <div class="flex items-center gap-4 text-sm text-gray-600">
                <NTag :type="statusType(traceData.vehicle.status)" size="small" bordered="false">{{ traceData.vehicle.status_display }}</NTag>
                <NTag :type="reviewStatusType(traceData.vehicle.review_status)" size="small" bordered="false">{{ traceData.vehicle.review_status_display }}</NTag>
              </div>
              <div class="flex items-center gap-6 text-sm text-gray-500 pt-2 border-t border-gray-200">
                <span>资料数: <b class="text-gray-800">{{ traceData.documents_count }}</b></span>
                <span>复核记录: <b class="text-gray-800">{{ traceData.review_records_count }}</b></span>
                <span>事件数: <b class="text-gray-800">{{ traceData.timeline.length }}</b></span>
              </div>
            </NSpace>
          </NCard>

          <div class="mb-3 font-medium">事件时间线</div>
          <NTimeline>
            <NTimelineItem v-for="(e, i) in traceData.timeline" :key="i" :type="timelineType(e.type)" :title="e.title">
              <template #time>{{ e.time_display }}</template>
              <div class="text-sm text-gray-600">
                <div v-if="e.operator" class="mb-1">操作人：{{ e.operator }}</div>
                <div>{{ e.detail }}</div>
              </div>
            </NTimelineItem>
          </NTimeline>
        </div>
        <NSpin v-else :show="traceLoading" description="加载追溯数据...">
          <div style="min-height: 200px" />
        </NSpin>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="showTraceDrawer = false">关闭</NButton>
            <NButton type="primary" @click="goVehicleDetail">查看完整详情</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch, shallowRef, h } from 'vue'
import { useRouter, useMessage, type DataTableColumns } from 'naive-ui'
import * as echarts from 'echarts'
import {
  ReloadOutlined, DownloadOutlined, CheckCircleOutlined,
  WalletOutlined, DollarOutlined, ClockCircleOutlined,
  RocketOutlined, AlertOutlined, HistoryOutlined,
  EyeOutlined, SearchOutlined, RiseOutlined, FallOutlined,
} from '@vicons/antd'
import type { InventoryTurnover, InventoryTurnoverItem, VehicleTrace } from '~/types'
import dayjs from 'dayjs'

const router = useRouter()
const message = useMessage()

const selectedDays = ref(90)
const customRange = ref<[number, number] | null>(null)
const loading = ref(false)
const loaded = ref(false)
const turnover = shallowRef<InventoryTurnover | null>(null)

const histogramRef = ref<HTMLElement | null>(null)
const topProfitRef = ref<HTMLElement | null>(null)
const marginGaugeRef = ref<HTMLElement | null>(null)

let histogramChart: echarts.ECharts | null = null
let topProfitChart: echarts.ECharts | null = null
let marginGaugeChart: echarts.ECharts | null = null

const overallMargin = computed(() => {
  const t = turnover.value
  if (!t || !t.total_cost || t.total_cost === 0) return 0
  return Number(((t.total_profit / t.total_cost) * 100).toFixed(2))
})

const fastestVehicle = computed(() => {
  const list = turnover.value?.details || []
  if (list.length === 0) return null
  return [...list].sort((a, b) => a.inventory_days - b.inventory_days)[0]
})

const slowestVehicle = computed(() => {
  const list = turnover.value?.details || []
  if (list.length === 0) return null
  return [...list].sort((a, b) => b.inventory_days - a.inventory_days)[0]
})

const detailKeyword = ref('')
const profitSort = ref<string | null>(null)
const daysSort = ref<string | null>(null)
const detailPage = ref(1)
const detailPageSize = ref(20)

const profitSortOptions = [
  { label: '毛利从高到低', value: 'profit_desc' },
  { label: '毛利从低到高', value: 'profit_asc' },
  { label: '毛利率从高到低', value: 'rate_desc' },
]

const daysSortOptions = [
  { label: '周转最快', value: 'days_asc' },
  { label: '周转最慢', value: 'days_desc' },
]

const filteredDetails = computed(() => {
  let list = [...(turnover.value?.details || [])]
  if (detailKeyword.value) {
    const kw = detailKeyword.value.toLowerCase()
    list = list.filter(v =>
      v.brand.toLowerCase().includes(kw) ||
      v.model.toLowerCase().includes(kw) ||
      v.plate_number.toLowerCase().includes(kw) ||
      v.vin.toLowerCase().includes(kw)
    )
  }
  if (profitSort.value === 'profit_desc') list.sort((a, b) => b.profit - a.profit)
  else if (profitSort.value === 'profit_asc') list.sort((a, b) => a.profit - b.profit)
  else if (profitSort.value === 'rate_desc') list.sort((a, b) => b.profit_rate - a.profit_rate)
  if (daysSort.value === 'days_asc') list.sort((a, b) => a.inventory_days - b.inventory_days)
  else if (daysSort.value === 'days_desc') list.sort((a, b) => b.inventory_days - a.inventory_days)
  return list
})

const detailPagination = computed(() => ({
  page: detailPage.value,
  pageSize: detailPageSize.value,
  itemCount: filteredDetails.value.length,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
}))

const detailColumns: DataTableColumns<InventoryTurnoverItem> = [
  {
    title: '车辆', key: 'vehicle', width: 240, render: (r: InventoryTurnoverItem) => h('div', { class: 'flex flex-col' }, [
      h('span', { class: 'font-medium' }, `${r.brand} ${r.model} ${r.year}款`),
      h('span', { class: 'text-gray-500 text-xs mt-1' }, `VIN: ${r.vin.slice(-8)} · ${r.plate_number}`),
    ]),
  },
  {
    title: '收车价', key: 'purchase_price', width: 110, align: 'right',
    render: (r: InventoryTurnoverItem) => `¥${(r.purchase_price / 10000).toFixed(2)}万`,
  },
  {
    title: '售价', key: 'selling_price', width: 110, align: 'right',
    render: (r: InventoryTurnoverItem) => `¥${(r.selling_price / 10000).toFixed(2)}万`,
  },
  {
    title: '毛利', key: 'profit', width: 110, align: 'right', render: (r: InventoryTurnoverItem) => h(
      NText, { type: r.profit >= 0 ? 'success' : 'error', strong: true } as any,
      { default: () => `¥${(r.profit / 10000).toFixed(2)}万` }
    ),
  },
  {
    title: '毛利率', key: 'profit_rate', width: 100, align: 'right', render: (r: InventoryTurnoverItem) => {
      const rate = r.profit_rate.toFixed(2)
      return h(NTag, { type: r.profit_rate >= 15 ? 'success' : r.profit_rate >= 10 ? 'warning' : 'error', size: 'small', bordered: false } as any, {
        default: () => `${rate}%`,
      })
    },
  },
  {
    title: '库存天数', key: 'inventory_days', width: 110, align: 'center', render: (r: InventoryTurnoverItem) => {
      const days = r.inventory_days
      return h(NTag, {
        type: days <= 15 ? 'success' : days <= 30 ? 'warning' : 'error',
        size: 'small', bordered: false,
      } as any, { default: () => `${days}天` })
    },
  },
  {
    title: '创建日期', key: 'created_at', width: 120,
    render: (r: InventoryTurnoverItem) => dayjs(r.created_at).format('YYYY-MM-DD'),
  },
  {
    title: '售出日期', key: 'sold_at', width: 120,
    render: (r: InventoryTurnoverItem) => dayjs(r.sold_at).format('YYYY-MM-DD'),
  },
  { title: '销售负责人', key: 'salesperson', width: 110 },
  {
    title: '操作', key: 'action', width: 160, fixed: 'right', render: (r: InventoryTurnoverItem) => h(
      NSpace as any, { size: 'small' } as any,
      {
        default: () => [
          h(NButton as any, { text: true, type: 'primary', size: 'small', onClick: () => router.push(`/vehicles/${r.id}`) } as any, {
            default: () => h('span', { class: 'flex items-center gap-1' }, [h(NIcon as any, { component: EyeOutlined, size: 14 } as any), '详情']),
          }),
          h(NButton as any, { text: true, size: 'small', onClick: () => openTrace(r.id) } as any, {
            default: () => h('span', { class: 'flex items-center gap-1' }, [h(NIcon as any, { component: HistoryOutlined, size: 14 } as any), '追溯']),
          }),
        ],
      }
    ),
  },
]

const showTraceDrawer = ref(false)
const traceLoading = ref(false)
const traceData = shallowRef<VehicleTrace | null>(null)
const currentTraceVehicleId = ref<number | null>(null)

async function openTrace(vehicleId: number) {
  currentTraceVehicleId.value = vehicleId
  showTraceDrawer.value = true
  traceData.value = null
  traceLoading.value = true
  try {
    const { $api } = useNuxtApp()
    traceData.value = await $api.get<any, VehicleTrace>('/statistics/vehicle-trace', { vehicle_id: vehicleId })
  } catch (e: any) {
    traceData.value = mockTrace(vehicleId)
  } finally {
    traceLoading.value = false
  }
}

function goVehicleDetail() {
  if (currentTraceVehicleId.value) {
    router.push(`/vehicles/${currentTraceVehicleId.value}`)
  }
}

function timelineType(t: string) {
  const m: Record<string, any> = {
    create: 'info', status: 'warning', inspection: 'default',
    preparation: 'warning', testdrive: 'success', review: 'success', document: 'info',
  }
  return m[t] || 'default'
}

function statusType(s: string) {
  const m: Record<string, any> = {
    pending_evaluation: 'default', pending_inspection: 'warning', pending_preparation: 'warning',
    pending_testdrive: 'warning', pending_review: 'error', listed: 'success',
    sold: 'info', off_shelf: 'default', rejected: 'error',
  }
  return m[s] || 'default'
}

function reviewStatusType(s: string) {
  const m: Record<string, any> = {
    pending: 'warning', pass: 'success', reject: 'error', supplemented: 'info',
  }
  return m[s] || 'default'
}

function buildParams() {
  const params: Record<string, any> = {}
  if (customRange.value && customRange.value.length === 2) {
    params.start_date = dayjs(customRange.value[0]).format('YYYY-MM-DD')
    params.end_date = dayjs(customRange.value[1]).format('YYYY-MM-DD')
  } else {
    params.days = selectedDays.value
  }
  return params
}

async function loadData() {
  loading.value = true
  try {
    const { $api } = useNuxtApp()
    turnover.value = await $api.get<any, InventoryTurnover>('/statistics/inventory-turnover', buildParams())
    loaded.value = true
  } catch (e: any) {
    turnover.value = mockTurnover(selectedDays.value)
    loaded.value = true
  } finally {
    loading.value = false
  }
  await nextTick()
  renderCharts()
}

function renderCharts() {
  const details = turnover.value?.details || []

  if (histogramRef.value) {
    if (histogramChart) histogramChart.dispose()
    histogramChart = echarts.init(histogramRef.value)
    const buckets = [
      { range: '0-7天', min: 0, max: 7, count: 0 },
      { range: '8-15天', min: 8, max: 15, count: 0 },
      { range: '16-30天', min: 16, max: 30, count: 0 },
      { range: '31-45天', min: 31, max: 45, count: 0 },
      { range: '46-60天', min: 46, max: 60, count: 0 },
      { range: '61-90天', min: 61, max: 90, count: 0 },
      { range: '90天+', min: 91, max: 9999, count: 0 },
    ]
    details.forEach(d => {
      for (const b of buckets) {
        if (d.inventory_days >= b.min && d.inventory_days <= b.max) {
          b.count++
          break
        }
      }
    })
    histogramChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: any) => `${p[0].axisValue}: ${p[0].value}台` },
      grid: { left: 50, right: 20, top: 20, bottom: 40 },
      xAxis: { type: 'category', data: buckets.map(b => b.range), axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', name: '台数' },
      series: [{
        type: 'bar',
        data: buckets.map((b, i) => ({
          value: b.count,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: ['#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#dc2626'][i],
          },
        })),
        barWidth: 40,
        label: { show: true, position: 'top', fontSize: 11, formatter: '{c}' },
      }],
    })
  }

  if (topProfitRef.value) {
    if (topProfitChart) topProfitChart.dispose()
    topProfitChart = echarts.init(topProfitRef.value)
    const top10 = [...details].sort((a, b) => b.profit - a.profit).slice(0, 10).reverse()
    topProfitChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (p: any) => {
          const item = top10[p[0].dataIndex]
          return `${item.brand} ${item.model} ${item.year}款<br/>毛利: ¥${(item.profit / 10000).toFixed(2)}万 (${item.profit_rate.toFixed(1)}%)`
        },
      },
      grid: { left: 120, right: 50, top: 20, bottom: 30 },
      xAxis: { type: 'value', name: '万元', axisLabel: { formatter: (v: any) => `${(v / 10000).toFixed(0)}` } },
      yAxis: {
        type: 'category',
        data: top10.map(d => `${d.brand} ${d.model}`),
        axisLabel: { fontSize: 11 },
      },
      series: [{
        type: 'bar',
        data: top10.map((d, i) => ({
          value: d.profit,
          itemStyle: {
            borderRadius: [0, 6, 6, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'][i % 5] },
              { offset: 1, color: ['#06b6d4', '#10b981', '#84cc16', '#eab308', '#f97316'][i % 5] },
            ]),
          },
        })),
        barWidth: 16,
        label: { show: true, position: 'right', fontSize: 11, formatter: (p: any) => `¥${(p.value / 10000).toFixed(2)}万` },
      }],
    })
  }

  if (marginGaugeRef.value) {
    if (marginGaugeChart) marginGaugeChart.dispose()
    marginGaugeChart = echarts.init(marginGaugeRef.value)
    const margin = Math.min(100, Math.max(0, overallMargin.value))
    marginGaugeChart.setOption({
      series: [{
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 30,
        radius: '100%',
        center: ['50%', '85%'],
        progress: { show: true, width: 12, itemStyle: { color: margin >= 15 ? '#22c55e' : margin >= 10 ? '#f59e0b' : '#ef4444' } },
        axisLine: { lineStyle: { width: 12, color: [[1, '#f3f4f6']] } },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        title: { show: false },
        detail: { show: false },
        data: [{ value: margin }],
      }],
    })
  }
}

function handleExport() {
  const rows = filteredDetails.value
  const headers = ['车辆', 'VIN', '车牌', '收车价', '售价', '毛利', '毛利率', '库存天数', '创建日期', '售出日期', '销售']
  const csv = [
    headers.join(','),
    ...rows.map(r => [
      `${r.brand} ${r.model} ${r.year}款`,
      r.vin,
      r.plate_number,
      r.purchase_price,
      r.selling_price,
      r.profit,
      `${r.profit_rate}%`,
      r.inventory_days,
      dayjs(r.created_at).format('YYYY-MM-DD'),
      dayjs(r.sold_at).format('YYYY-MM-DD'),
      r.salesperson,
    ].join(',')),
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `库存周转_${dayjs().format('YYYYMMDD')}_${customRange.value ? '自定义' : selectedDays.value + '天'}.csv`
  a.click()
  URL.revokeObjectURL(url)
  message.success('导出成功')
}

function mockTurnover(days: number): InventoryTurnover {
  const count = Math.min(60, Math.floor(days * 0.35))
  const brands = ['宝马', '奔驰', '奥迪', '丰田', '本田', '大众', '别克', '日产', '特斯拉', '比亚迪']
  const models = ['3系', 'C级', 'A4L', '凯美瑞', '雅阁', '帕萨特', '君威', '天籁', 'Model 3', '汉']
  const sales = ['赵销售', '钱销售', '孙销售', '周销售']
  const details: InventoryTurnoverItem[] = Array.from({ length: count }, (_, i) => {
    const purchase = 150000 + Math.floor(Math.random() * 250000)
    const profitRate = 5 + Math.random() * 25
    const profit = Math.floor(purchase * profitRate / 100)
    const selling = purchase + profit
    const invDays = 3 + Math.floor(Math.random() * 120)
    const soldAt = dayjs().subtract(Math.floor(Math.random() * days), 'day')
    const createdAt = soldAt.subtract(invDays, 'day')
    return {
      id: i + 1,
      vin: `LVGBH${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      brand: brands[i % brands.length],
      model: models[i % models.length],
      year: 2018 + (i % 6),
      plate_number: `沪${String.fromCharCode(65 + (i % 26))}·${10000 + i}`,
      purchase_price: purchase,
      selling_price: selling,
      profit,
      profit_rate: Number(profitRate.toFixed(2)),
      inventory_days: invDays,
      created_at: createdAt.toISOString(),
      sold_at: soldAt.toISOString(),
      salesperson: sales[i % sales.length],
    }
  })

  const totalCost = details.reduce((s, d) => s + d.purchase_price, 0)
  const totalProfit = details.reduce((s, d) => s + d.profit, 0)
  const allDays = details.map(d => d.inventory_days).sort((a, b) => a - b)
  const median = allDays.length ? (allDays.length % 2 === 1
    ? allDays[Math.floor(allDays.length / 2)]
    : (allDays[allDays.length / 2 - 1] + allDays[allDays.length / 2]) / 2) : 0

  return {
    period_days: days,
    total_sold: count,
    total_cost: totalCost,
    total_profit: totalProfit,
    avg_profit: count ? Math.floor(totalProfit / count) : 0,
    avg_inventory_days: count ? Number((allDays.reduce((s, d) => s + d, 0) / count).toFixed(1)) : 0,
    median_inventory_days: median,
    fastest_days: allDays.length ? allDays[0] : 0,
    slowest_days: allDays.length ? allDays[allDays.length - 1] : 0,
    details,
  }
}

function mockTrace(vehicleId: number): VehicleTrace {
  const now = dayjs()
  const baseTime = now.subtract(45, 'day')
  return {
    vehicle: {
      id: vehicleId,
      vin: `LVGBH42K${89000000 + vehicleId}`,
      brand: '宝马',
      model: '3系',
      year: 2022,
      status: 'sold',
      status_display: '已售出',
      review_status: 'pass',
      review_status_display: '已通过',
    },
    documents_count: 8,
    review_records_count: 2,
    timeline: [
      { type: 'create', time: baseTime.toISOString(), time_display: baseTime.format('MM-DD HH:mm'), title: '创建车源', operator: '张评估师', detail: '录入车辆基础信息' },
      { type: 'status', time: baseTime.add(1, 'day').toISOString(), time_display: baseTime.add(1, 'day').format('MM-DD HH:mm'), title: '状态变更', operator: '张评估师', detail: '待评估 → 待检测' },
      { type: 'inspection', time: baseTime.add(3, 'day').toISOString(), time_display: baseTime.add(3, 'day').format('MM-DD HH:mm'), title: '检测报告', operator: '李检测员', detail: '完成检测，车况优良，无重大事故' },
      { type: 'status', time: baseTime.add(4, 'day').toISOString(), time_display: baseTime.add(4, 'day').format('MM-DD HH:mm'), title: '状态变更', operator: '系统', detail: '待检测 → 待整备' },
      { type: 'preparation', time: baseTime.add(10, 'day').toISOString(), time_display: baseTime.add(10, 'day').format('MM-DD HH:mm'), title: '整备完成', operator: '王整备', detail: '完成保养、美容、轮胎更换' },
      { type: 'document', time: baseTime.add(11, 'day').toISOString(), time_display: baseTime.add(11, 'day').format('MM-DD HH:mm'), title: '资料上传', operator: '吴金融', detail: '上传登记证书、行驶证、交强险' },
      { type: 'status', time: baseTime.add(12, 'day').toISOString(), time_display: baseTime.add(12, 'day').format('MM-DD HH:mm'), title: '状态变更', operator: '系统', detail: '待整备 → 待试驾' },
      { type: 'testdrive', time: baseTime.add(15, 'day').toISOString(), time_display: baseTime.add(15, 'day').format('MM-DD HH:mm'), title: '试驾完成', operator: '赵销售', detail: '客户陈先生试驾，购买意向高' },
      { type: 'status', time: baseTime.add(16, 'day').toISOString(), time_display: baseTime.add(16, 'day').format('MM-DD HH:mm'), title: '状态变更', operator: '系统', detail: '待试驾 → 待审核' },
      { type: 'review', time: baseTime.add(17, 'day').toISOString(), time_display: baseTime.add(17, 'day').format('MM-DD HH:mm'), title: '复核通过', operator: '经理', detail: '资料齐全，车况良好，同意上架' },
      { type: 'status', time: baseTime.add(18, 'day').toISOString(), time_display: baseTime.add(18, 'day').format('MM-DD HH:mm'), title: '状态变更', operator: '系统', detail: '待审核 → 已上架' },
      { type: 'testdrive', time: baseTime.add(25, 'day').toISOString(), time_display: baseTime.add(25, 'day').format('MM-DD HH:mm'), title: '试驾成交', operator: '赵销售', detail: '客户刘先生签约成交，成交价26.8万元' },
      { type: 'status', time: baseTime.add(28, 'day').toISOString(), time_display: baseTime.add(28, 'day').format('MM-DD HH:mm'), title: '状态变更', operator: '系统', detail: '已上架 → 已售出' },
    ],
  }
}

watch([detailKeyword, profitSort, daysSort], () => {
  detailPage.value = 1
})

onMounted(() => {
  loadData()
  window.addEventListener('resize', () => {
    histogramChart?.resize()
    topProfitChart?.resize()
    marginGaugeChart?.resize()
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
