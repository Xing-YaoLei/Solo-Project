<template>
  <div class="reports-page">
    <n-card class="filter-card" :bordered="false">
      <n-form :model="filters" inline label-placement="left">
        <n-form-item label="年份">
          <n-select v-model:value="filters.year" :options="yearOptions" style="width: 120px" />
        </n-form-item>
        <n-form-item label="月份">
          <n-select v-model:value="filters.month" :options="monthOptions" style="width: 120px" />
        </n-form-item>
        <n-form-item label="咨询师">
          <n-select
            v-model:value="filters.counselor"
            :options="counselorOptions"
            placeholder="全部"
            clearable
            filterable
            style="width: 180px"
          />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="fetchCompletionRate">
              <template #icon><SearchOutline /></template>
              查询
            </n-button>
            <n-button type="success" @click="handleExport">
              <template #icon><DownloadOutline /></template>
              导出月报
            </n-button>
            <n-button type="primary" ghost @click="handleGenerateReview">
              <template #icon><DocumentTextOutline /></template>
              生成复盘
            </n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </n-card>

    <n-grid :cols="4" :x-gap="16" class="stats-grid">
      <n-grid-item>
        <n-card class="stat-card" :bordered="false">
          <div class="stat-item stat-blue">
            <div class="stat-label">跟进总数</div>
            <div class="stat-value">{{ completionData.total_follow_ups || 0 }}</div>
          </div>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card class="stat-card" :bordered="false">
          <div class="stat-item stat-green">
            <div class="stat-label">已完成数</div>
            <div class="stat-value">{{ completionData.completed_follow_ups || 0 }}</div>
          </div>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card class="stat-card" :bordered="false">
          <div class="stat-item stat-orange">
            <div class="stat-label">完成率</div>
            <div class="stat-value">{{ completionData.completion_rate || 0 }}%</div>
          </div>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card class="stat-card" :bordered="false">
          <div class="stat-item stat-purple">
            <div class="stat-label">续费率</div>
            <div class="stat-value">{{ completionData.renewal_rate || 0 }}%</div>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-grid :cols="2" :x-gap="16" class="charts-grid">
      <n-grid-item>
        <n-card title="状态分布" :bordered="false">
          <div ref="statusChartRef" class="chart-container"></div>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="优先级分布" :bordered="false">
          <div ref="priorityChartRef" class="chart-container"></div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-card title="平均学习进度" :bordered="false" class="progress-card">
      <n-grid :cols="2" :x-gap="20">
        <n-grid-item>
          <div class="progress-stat">
            <div class="progress-label">学员总数</div>
            <div class="progress-value">{{ completionData.total_students || 0 }}</div>
          </div>
        </n-grid-item>
        <n-grid-item>
          <div class="progress-stat">
            <div class="progress-label">平均进度</div>
            <div class="progress-value">{{ completionData.average_student_progress || 0 }}%</div>
          </div>
        </n-grid-item>
      </n-grid>
      <n-progress
        :percentage="completionData.average_student_progress || 0"
        :stroke-width="18"
        :color="{
          '0%': '#f5222d',
          '50%': '#faad14',
          '100%': '#52c41a',
        }"
        indicator-placement="inside"
      />
    </n-card>

    <n-card title="历史复盘记录" :bordered="false">
      <n-data-table
        :columns="reviewColumns"
        :data="reviews"
        :loading="reviewsLoading"
        :pagination="reviewPagination"
        @update:page="handleReviewPageChange"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useMessage } from 'naive-ui'
import { SearchOutline, DownloadOutline, DocumentTextOutline } from '@vicons/ionicons5'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const message = useMessage()

const filters = reactive({
  year: dayjs().year(),
  month: dayjs().month() + 1,
  counselor: null,
})

const completionData = ref<any>({})
const reviews = ref<any[]>([])
const reviewsLoading = ref(false)
const statusChartRef = ref<HTMLElement | null>(null)
const priorityChartRef = ref<HTMLElement | null>(null)

let statusChart: echarts.ECharts | null = null
let priorityChart: echarts.ECharts | null = null

const counselorOptions = ref<any[]>([])

const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  label: `${dayjs().year() - i}年`,
  value: dayjs().year() - i,
}))

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `${i + 1}月`,
  value: i + 1,
}))

const reviewPagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
})

const reviewColumns = [
  { title: '年份', key: 'year', width: 80 },
  { title: '月份', key: 'month', width: 80 },
  { title: '咨询师', key: 'counselor_name', width: 120 },
  { title: '跟进总数', key: 'total_follow_ups', width: 100 },
  { title: '已完成', key: 'completed_follow_ups', width: 100 },
  { title: '完成率(%)', key: 'completion_rate', width: 100 },
  { title: '续费率(%)', key: 'renewal_rate', width: 100 },
  { title: '生成时间', key: 'generated_at', width: 160, render: (row: any) => dayjs(row.generated_at).format('YYYY-MM-DD HH:mm') },
  { title: '操作人', key: 'generated_by_name', width: 100 },
]

const statusLabelMap: Record<string, string> = {
  pending: '待跟进',
  in_progress: '跟进中',
  completed: '已完成',
  renewed: '已续费',
  closed: '已关闭',
}

const priorityLabelMap: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
}

const fetchCompletionRate = async () => {
  try {
    const api = useApi()
    const params: any = {
      year: filters.year,
      month: filters.month,
    }
    if (filters.counselor) {
      params.counselor = filters.counselor
    }
    const response = await api.get('/reports/monthly-reviews/completion_rate/', { params })
    completionData.value = response.data
    await nextTick()
    renderStatusChart()
    renderPriorityChart()
  } catch (e) {
    message.error('获取完成率失败')
  }
}

const fetchCounselors = async () => {
  try {
    const api = useApi()
    const response = await api.get('/users/users/?role=counselor')
    counselorOptions.value = response.data.results?.map((u: any) => ({
      label: u.username,
      value: u.id,
    })) || []
  } catch (e) {
    console.error('获取咨询师列表失败', e)
  }
}

const fetchReviews = async () => {
  reviewsLoading.value = true
  try {
    const api = useApi()
    const response = await api.get('/reports/monthly-reviews/', {
      params: {
        page: reviewPagination.page,
        page_size: reviewPagination.pageSize,
      },
    })
    reviews.value = response.data.results
    reviewPagination.itemCount = response.data.count
  } catch (e) {
    message.error('获取复盘记录失败')
  } finally {
    reviewsLoading.value = false
  }
}

const renderStatusChart = () => {
  if (!statusChartRef.value) return
  if (!statusChart) {
    statusChart = echarts.init(statusChartRef.value)
  }

  const data = completionData.value.status_breakdown || []
  const chartData = data.map((item: any) => ({
    name: statusLabelMap[item.status] || item.status,
    value: item.count,
  }))

  statusChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: chartData,
        color: ['#faad14', '#1890ff', '#52c41a', '#73d13d', '#8c8c8c'],
      },
    ],
  })
}

const renderPriorityChart = () => {
  if (!priorityChartRef.value) return
  if (!priorityChart) {
    priorityChart = echarts.init(priorityChartRef.value)
  }

  const data = completionData.value.priority_breakdown || []
  const chartData = data.map((item: any) => ({
    name: priorityLabelMap[item.priority] || item.priority,
    value: item.count,
  }))

  priorityChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: chartData,
        color: ['#52c41a', '#1890ff', '#faad14', '#f5222d'],
      },
    ],
  })
}

const handleExport = async () => {
  try {
    const api = useApi()
    const response = await api.post('/reports/monthly-reviews/export_monthly_report/', {
      year: filters.year,
      month: filters.month,
      counselor: filters.counselor,
    }, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const disposition = response.headers['content-disposition']
    const filename = disposition?.match(/filename="?([^"]+)"?/)?.[1] || '月度复盘报告.xlsx'
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    message.success('导出成功')
  } catch (e) {
    message.error('导出失败')
  }
}

const handleGenerateReview = async () => {
  try {
    const api = useApi()
    await api.post('/reports/monthly-reviews/generate_monthly_review/', {
      year: filters.year,
      month: filters.month,
      counselor: filters.counselor,
    })
    message.success('复盘生成成功')
    fetchReviews()
  } catch (e) {
    message.error('生成失败')
  }
}

const handleReviewPageChange = (page: number) => {
  reviewPagination.page = page
  fetchReviews()
}

const handleResize = () => {
  statusChart?.resize()
  priorityChart?.resize()
}

onMounted(() => {
  fetchCounselors()
  fetchCompletionRate()
  fetchReviews()
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
.reports-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card :deep(.n-card__content) {
  padding: 16px 20px;
}

.stats-grid {
  margin-top: 0;
}

.stat-card {
  padding: 8px;
}

.stat-item {
  text-align: center;
  padding: 8px 0;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
}

.stat-blue .stat-value {
  color: #1890ff;
}

.stat-green .stat-value {
  color: #52c41a;
}

.stat-orange .stat-value {
  color: #fa8c16;
}

.stat-purple .stat-value {
  color: #722ed1;
}

.charts-grid {
  margin-top: 0;
}

.chart-container {
  height: 280px;
  width: 100%;
}

.progress-card {
  padding: 20px;
}

.progress-stat {
  text-align: center;
  padding: 16px 0;
}

.progress-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 6px;
}

.progress-value {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
}
</style>
