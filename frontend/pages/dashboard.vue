<template>
  <div class="dashboard-page">
    <n-card class="welcome-card" :bordered="false">
      <div class="welcome-content">
        <div>
          <h2 class="welcome-title">欢迎回来，{{ user?.username }} 👋</h2>
          <p class="welcome-desc">今天是 {{ today }}，祝你工作愉快！</p>
        </div>
      </div>
    </n-card>

    <n-grid :cols="4" :x-gap="16" class="stats-grid">
      <n-grid-item v-for="stat in statsList" :key="stat.key">
        <n-card class="stat-card" :bordered="false" hoverable>
          <div class="stat-item" :class="stat.class">
            <div class="stat-icon">
              <n-icon :size="24"><component :is="stat.icon" /></n-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardStats[stat.key] || 0 }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-grid :cols="2" :x-gap="16" class="content-grid">
      <n-grid-item>
        <n-card title="待跟进任务" :bordered="false" class="task-card">
          <template #extra>
            <n-button text type="primary" size="small" @click="navigateTo('/followups')">
              查看全部
            </n-button>
          </template>
          <n-list v-if="pendingFollowUps.length" hoverable clickable>
            <n-list-item v-for="item in pendingFollowUps" :key="item.id" @click="navigateTo(`/followups/${item.id}`)">
              <template #prefix>
                <n-avatar round size="small" :style="{ backgroundColor: '#1890ff' }">
                  {{ item.student_name?.charAt(0) }}
                </n-avatar>
              </template>
              <div class="task-item">
                <div class="task-title">{{ item.student_name }} - {{ item.course_name }}</div>
                <div class="task-desc">{{ item.reason }}</div>
                <div class="task-meta">
                  <n-tag :type="priorityTagType(item.priority)" size="small">
                    {{ priorityLabel(item.priority) }}
                  </n-tag>
                  <span class="task-date">{{ formatDate(item.next_follow_up_date) }}</span>
                </div>
              </div>
            </n-list-item>
          </n-list>
          <n-empty v-else description="暂无待跟进任务" />
        </n-card>
      </n-grid-item>

      <n-grid-item>
        <n-card title="最新通知" :bordered="false" class="notice-card">
          <template #extra>
            <n-button text type="primary" size="small" @click="showAllNotifications">
              全部通知
            </n-button>
          </template>
          <n-list v-if="notifications.length" hoverable>
            <n-list-item v-for="item in notifications" :key="item.id">
              <template #prefix>
                <n-icon size="20" :color="item.is_read ? '#999' : '#1890ff'">
                  <AlertCircleOutline />
                </n-icon>
              </template>
              <div class="notice-item">
                <div class="notice-title">{{ item.title }}</div>
                <div class="notice-content">{{ item.content }}</div>
                <div class="notice-time">{{ formatDateTime(item.created_at) }}</div>
              </div>
            </n-list-item>
          </n-list>
          <n-empty v-else description="暂无通知" />
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-card title="本月跟进概览" :bordered="false" class="chart-card">
      <div ref="chartRef" class="chart-container"></div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, h } from 'vue'
import { useAuthStore } from '~/stores/auth'
import {
  AlertCircleOutline,
  PeopleOutline,
  CheckmarkCircleOutline,
  AlarmOutline,
  TimeOutline,
} from '@vicons/ionicons5'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const today = computed(() => dayjs().format('YYYY年MM月DD日 dddd'))

const dashboardStats = ref<any>({})
const pendingFollowUps = ref<any[]>([])
const notifications = ref<any[]>([])

const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const statsList = [
  { key: 'total', label: '跟进总数', class: 'stat-blue', icon: PeopleOutline },
  { key: 'pending', label: '待跟进', class: 'stat-warning', icon: AlarmOutline },
  { key: 'in_progress', label: '跟进中', class: 'stat-info', icon: TimeOutline },
  { key: 'renewed', label: '已续费', class: 'stat-success', icon: CheckmarkCircleOutline },
]

const priorityTagType = (priority: string) => {
  const map: Record<string, string> = {
    low: 'default',
    medium: 'info',
    high: 'warning',
    urgent: 'error',
  }
  return map[priority] || 'default'
}

const priorityLabel = (priority: string) => {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  }
  return map[priority] || priority
}

const formatDate = (date: any) => {
  if (!date) return '暂无'
  return dayjs(date).format('YYYY-MM-DD')
}

const formatDateTime = (date: any) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const navigateTo = (path: string) => {
  navigateTo(path)
}

const showAllNotifications = () => {
  // TODO: 打开通知抽屉
}

const fetchDashboardStats = async () => {
  try {
    const api = useApi()
    const response = await api.get('/followups/follow-ups/dashboard_stats/')
    dashboardStats.value = response.data
  } catch (e) {
    console.error('获取统计失败', e)
  }
}

const fetchPendingFollowUps = async () => {
  try {
    const api = useApi()
    const response = await api.get('/followups/follow-ups/', {
      params: {
        status: 'pending',
        page_size: 5,
        ordering: 'priority',
      },
    })
    pendingFollowUps.value = response.data.results || []
  } catch (e) {
    console.error('获取待跟进任务失败', e)
  }
}

const fetchNotifications = async () => {
  try {
    const api = useApi()
    const response = await api.get('/notifications/notifications/', {
      params: { page_size: 5 },
    })
    notifications.value = response.data.results || []
  } catch (e) {
    console.error('获取通知失败', e)
  }
}

const renderChart = async () => {
  await nextTick()
  if (!chartRef.value) return

  if (!chart) {
    chart = echarts.init(chartRef.value)
  }

  const days = Array.from({ length: 30 }, (_, i) => dayjs().subtract(29 - i, 'day').format('MM-DD'))
  const mockData = days.map(() => Math.floor(Math.random() * 20) + 5)

  chart.setOption({
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: days,
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '新增跟进',
        type: 'line',
        smooth: true,
        data: mockData,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
          ]),
        },
        lineStyle: {
          color: '#1890ff',
          width: 2,
        },
        itemStyle: {
          color: '#1890ff',
        },
      },
    ],
  })
}

const handleResize = () => {
  chart?.resize()
}

onMounted(() => {
  fetchDashboardStats()
  fetchPendingFollowUps()
  fetchNotifications()
  renderChart()
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.welcome-card :deep(.n-card__content) {
  padding: 24px;
}

.welcome-content {
  color: #fff;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #fff;
}

.welcome-desc {
  font-size: 14px;
  opacity: 0.9;
  color: #fff;
}

.stats-grid {
  margin-top: 0;
}

.stat-card :deep(.n-card__content) {
  padding: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-blue .stat-icon {
  background: linear-gradient(135deg, #1890ff, #096dd9);
}

.stat-warning .stat-icon {
  background: linear-gradient(135deg, #faad14, #d48806);
}

.stat-info .stat-icon {
  background: linear-gradient(135deg, #13c2c2, #08979c);
}

.stat-success .stat-icon {
  background: linear-gradient(135deg, #52c41a, #389e0d);
}

.stat-info-text {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-blue .stat-value {
  color: #1890ff;
}

.stat-warning .stat-value {
  color: #faad14;
}

.stat-info .stat-value {
  color: #13c2c2;
}

.stat-success .stat-value {
  color: #52c41a;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
}

.content-grid {
  margin-top: 0;
}

.task-item,
.notice-item {
  flex: 1;
}

.task-title,
.notice-title {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.task-desc,
.notice-content {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-date {
  font-size: 12px;
  color: #bfbfbf;
}

.notice-time {
  font-size: 11px;
  color: #bfbfbf;
}

.chart-card {
  margin-top: 0;
}

.chart-container {
  height: 300px;
  width: 100%;
}
</style>
