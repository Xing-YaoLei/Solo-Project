<template>
  <div class="page-container">
    <h3 class="page-title">统计报表</h3>

    <div class="filter-bar">
      <el-form inline>
        <el-form-item label="日期范围">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width: 240px" />
        </el-form-item>
        <el-form-item label="维度">
          <el-select v-model="dimension" style="width: 120px">
            <el-option label="按校区" value="campus" />
            <el-option label="按老师" value="teacher" />
            <el-option label="按科目" value="subject" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="handleExport">
            <el-icon><Download /></el-icon>导出报表
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <div class="table-card">
          <div class="card-title">到场率概览</div>
          <el-table :data="rateList" v-loading="rateLoading" size="default">
            <el-table-column :label="dimensionLabel" prop="name" width="120" />
            <el-table-column label="总预约" prop="total" width="80" />
            <el-table-column label="已到场" prop="checkedIn" width="80" />
            <el-table-column label="迟到" prop="late" width="60" />
            <el-table-column label="未到" prop="noShow" width="60" />
            <el-table-column label="到场率" width="100">
              <template #default="{ row }">
                <span class="clickable-number" @click="openDrillDown(row)">
                  {{ row.rate }}%
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="table-card">
          <div class="card-title">预约趋势</div>
          <v-chart :option="trendOption" style="height: 350px" autoresize />
        </div>
      </el-col>
    </el-row>

    <DrillDownTable
      v-model="showDrillDown"
      :title="drillTitle"
      :drill-params="drillParams"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { statisticsApi } from '@/api/statistics'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import DrillDownTable from '@/components/DrillDownTable.vue'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const dateRange = ref([])
const dimension = ref('campus')
const rateLoading = ref(false)
const rateList = ref([])
const trendData = ref({ dates: [], counts: [], rates: [] })
const showDrillDown = ref(false)
const drillTitle = ref('')
const drillParams = ref({})

const dimensionLabel = computed(() => {
  const map = { campus: '校区', teacher: '老师', subject: '科目' }
  return map[dimension.value]
})

const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['预约数', '到场率'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: trendData.value.dates },
  yAxis: [
    { type: 'value', name: '预约数' },
    { type: 'value', name: '到场率(%)', max: 100 }
  ],
  series: [
    { name: '预约数', type: 'line', data: trendData.value.counts, smooth: true, itemStyle: { color: '#2B6CB0' } },
    { name: '到场率', type: 'line', yAxisIndex: 1, data: trendData.value.rates, smooth: true, itemStyle: { color: '#38A169' } }
  ]
}))

onMounted(() => {
  const today = dayjs()
  dateRange.value = [today.subtract(30, 'day').format('YYYY-MM-DD'), today.format('YYYY-MM-DD')]
  loadData()
})

async function loadData() {
  rateLoading.value = true
  try {
    const params = {
      dimension: dimension.value,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1]
    }
    const [rateRes, trendRes] = await Promise.all([
      statisticsApi.getAttendanceRate(params),
      statisticsApi.getTrend(params)
    ])
    rateList.value = rateRes.data || []
    trendData.value = trendRes.data || { dates: [], counts: [], rates: [] }
  } finally {
    rateLoading.value = false
  }
}

function openDrillDown(row) {
  drillTitle.value = `${row.name} - 到场率详情`
  drillParams.value = {
    dimension: dimension.value,
    dimensionValue: row.name,
    startDate: dateRange.value?.[0],
    endDate: dateRange.value?.[1]
  }
  showDrillDown.value = true
}

function handleExport() {
  if (!rateList.value.length) return
  const data = rateList.value.map(r => ({
    [dimensionLabel.value]: r.name,
    总预约: r.total,
    已到场: r.checkedIn,
    迟到: r.late,
    未到: r.noShow,
    到场率: r.rate + '%'
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '到场率统计')
  XLSX.writeFile(wb, '到场率统计报表.xlsx')
}
</script>

<style scoped>
.page-title {
  margin-bottom: 20px;
  font-size: 18px;
}
.card-title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 12px;
}
</style>
