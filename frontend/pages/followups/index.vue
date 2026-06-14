<template>
  <div class="followups-page">
    <n-card class="stats-card" :bordered="false">
      <n-grid :cols="6" :x-gap="20">
        <n-grid-item v-for="stat in statsList" :key="stat.key">
          <div class="stat-item" :class="stat.class">
            <div class="stat-value">{{ stats[stat.key] || 0 }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </n-grid-item>
      </n-grid>
    </n-card>

    <n-card class="filter-card" :bordered="false" title="筛选条件">
      <n-form :model="filters" inline label-placement="left">
        <n-form-item label="状态">
          <n-select
            v-model:value="filters.status"
            :options="statusOptions"
            placeholder="全部状态"
            clearable
            style="width: 150px"
          />
        </n-form-item>
        <n-form-item label="优先级">
          <n-select
            v-model:value="filters.priority"
            :options="priorityOptions"
            placeholder="全部优先级"
            clearable
            style="width: 150px"
          />
        </n-form-item>
        <n-form-item label="咨询师">
          <n-select
            v-model:value="filters.counselor"
            :options="counselorOptions"
            placeholder="全部咨询师"
            clearable
            filterable
            style="width: 180px"
          />
        </n-form-item>
        <n-form-item label="关键字">
          <n-input
            v-model:value="filters.search"
            placeholder="搜索学员姓名/原因"
            clearable
            style="width: 200px"
          />
        </n-form-item>
        <n-form-item>
          <n-space>
            <n-button type="primary" @click="fetchFollowUps">
              <template #icon><SearchOutline /></template>
              查询
            </n-button>
            <n-button @click="resetFilters">
              <template #icon><RefreshOutline /></template>
              重置
            </n-button>
            <n-button type="success" @click="handleExport">
              <template #icon><DownloadOutline /></template>
              导出
            </n-button>
            <n-button type="primary" ghost @click="handleCheckProgress">
              <template #icon><AlarmOutline /></template>
              检测进度
            </n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </n-card>

    <n-card class="table-card" :bordered="false">
      <template #header>
        <div class="table-header">
          <span>跟进记录列表</span>
          <n-button type="primary" size="small" @click="showCreate = true">
            <template #icon><AddOutline /></template>
            新建跟进
          </n-button>
        </div>
      </template>

      <n-data-table
        :columns="columns"
        :data="followUps"
        :loading="loading"
        :pagination="pagination"
        @update:page="handlePageChange"
        :row-key="(row: any) => row.id"
      />
    </n-card>

    <n-modal v-model:show="showCreate" preset="card" title="新建续费跟进" style="width: 600px">
      <n-form :model="createForm" label-placement="top">
        <n-form-item label="学员">
          <n-select v-model:value="createForm.student" :options="studentOptions" filterable />
        </n-form-item>
        <n-form-item label="优先级">
          <n-select v-model:value="createForm.priority" :options="priorityOptions" />
        </n-form-item>
        <n-form-item label="原因">
          <n-input v-model:value="createForm.reason" type="textarea" :rows="3" />
        </n-form-item>
        <n-form-item label="下次跟进日期">
          <n-date-picker v-model:value="createForm.next_follow_up_date" type="date" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreate = false">取消</n-button>
          <n-button type="primary" @click="handleCreate">创建</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  SearchOutline,
  RefreshOutline,
  DownloadOutline,
  AddOutline,
  EyeOutline,
  AlarmOutline,
} from '@vicons/ionicons5'
import dayjs from 'dayjs'

const router = useRouter()
const message = useMessage()

const loading = ref(false)
const followUps = ref<any[]>([])
const stats = ref<any>({})
const showCreate = ref(false)

const filters = reactive({
  status: null,
  priority: null,
  counselor: null,
  search: '',
  page: 1,
  page_size: 20,
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
})

const statusOptions = [
  { label: '待跟进', value: 'pending' },
  { label: '跟进中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已续费', value: 'renewed' },
  { label: '已关闭', value: 'closed' },
]

const priorityOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' },
]

const statsList = [
  { key: 'total', label: '总数', class: 'stat-total' },
  { key: 'pending', label: '待跟进', class: 'stat-pending' },
  { key: 'in_progress', label: '跟进中', class: 'stat-progress' },
  { key: 'urgent', label: '紧急', class: 'stat-urgent' },
  { key: 'renewed', label: '已续费', class: 'stat-renewed' },
  { key: 'overdue', label: '已逾期', class: 'stat-overdue' },
]

const counselorOptions = ref<any[]>([])
const studentOptions = ref<any[]>([])

const createForm = reactive({
  student: null,
  priority: 'medium',
  reason: '',
  next_follow_up_date: null,
})

const statusTagType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    renewed: 'success',
    closed: 'default',
  }
  return map[status] || 'default'
}

const priorityTagType = (priority: string) => {
  const map: Record<string, string> = {
    low: 'default',
    medium: 'info',
    high: 'warning',
    urgent: 'error',
  }
  return map[priority] || 'default'
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待跟进',
    in_progress: '跟进中',
    completed: '已完成',
    renewed: '已续费',
    closed: '已关闭',
  }
  return map[status] || status
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

const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 60,
  },
  {
    title: '学员姓名',
    key: 'student_name',
    width: 120,
  },
  {
    title: '课程',
    key: 'course_name',
    width: 150,
  },
  {
    title: '咨询师',
    key: 'counselor_name',
    width: 100,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: any) => h('n-tag', { type: statusTagType(row.status) }, () => statusLabel(row.status)),
  },
  {
    title: '优先级',
    key: 'priority',
    width: 80,
    render: (row: any) => h('n-tag', { type: priorityTagType(row.priority) }, () => priorityLabel(row.priority)),
  },
  {
    title: '进度',
    key: 'progress',
    width: 120,
    render: (row: any) => h('n-progress', {
      type: 'line',
      percentage: row.progress || 0,
      size: 'small',
      status: row.progress < 30 ? 'error' : row.progress < 60 ? 'warning' : 'success',
    }),
  },
  {
    title: '原因',
    key: 'reason',
    ellipsis: { tooltip: true },
  },
  {
    title: '下次跟进',
    key: 'next_follow_up_date',
    width: 120,
    render: (row: any) => row.next_follow_up_date
      ? dayjs(row.next_follow_up_date).format('YYYY-MM-DD')
      : '-',
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 160,
    render: (row: any) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    fixed: 'right',
    render: (row: any) => h('n-button', {
      size: 'small',
      type: 'primary',
      quaternary: true,
      onClick: () => router.push(`/followups/${row.id}`),
    }, () => h('n-icon', null, () => h(EyeOutline))),
  },
]

const fetchStats = async () => {
  try {
    const api = useApi()
    const response = await api.get('/followups/follow-ups/dashboard_stats/')
    stats.value = response.data
  } catch (e) {
    console.error('获取统计失败', e)
  }
}

const fetchFollowUps = async () => {
  loading.value = true
  try {
    const api = useApi()
    const params: any = {
      page: filters.page,
      page_size: filters.page_size,
    }
    if (filters.status) params.status = filters.status
    if (filters.priority) params.priority = filters.priority
    if (filters.counselor) params.counselor = filters.counselor
    if (filters.search) params.search = filters.search

    const response = await api.get('/followups/follow-ups/', { params })
    followUps.value = response.data.results
    pagination.itemCount = response.data.count
    pagination.page = response.data.page
    pagination.pageSize = response.data.page_size || 20
  } catch (e) {
    message.error('获取跟进记录失败')
  } finally {
    loading.value = false
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

const fetchStudents = async () => {
  try {
    const api = useApi()
    const response = await api.get('/users/users/?role=student')
    studentOptions.value = response.data.results?.map((u: any) => ({
      label: u.username,
      value: u.id,
    })) || []
  } catch (e) {
    console.error('获取学员列表失败', e)
  }
}

const handlePageChange = (page: number) => {
  filters.page = page
  pagination.page = page
  fetchFollowUps()
}

const resetFilters = () => {
  filters.status = null
  filters.priority = null
  filters.counselor = null
  filters.search = ''
  filters.page = 1
  fetchFollowUps()
}

const handleExport = async () => {
  try {
    const api = useApi()
    const filterParams: any = {}
    if (filters.status) filterParams.status = filters.status
    if (filters.priority) filterParams.priority = filters.priority
    if (filters.counselor) filterParams.counselor = filters.counselor
    if (filters.search) filterParams.search = filters.search

    const response = await api.post('/reports/monthly-reviews/export_follow_ups/', {
      filters: filterParams,
    }, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const disposition = response.headers['content-disposition']
    const filename = disposition?.match(/filename="?([^"]+)"?/)?.[1] || '续费跟进记录.xlsx'
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

const handleCheckProgress = async () => {
  try {
    const api = useApi()
    const response = await api.post('/followups/follow-ups/check_progress_and_create_reminders/')
    message.success(`检测完成，新增 ${response.data.created} 条提醒`)
    fetchStats()
    fetchFollowUps()
  } catch (e) {
    message.error('检测失败')
  }
}

const handleCreate = async () => {
  if (!createForm.student) {
    message.warning('请选择学员')
    return
  }
  try {
    const api = useApi()
    await api.post('/followups/follow-ups/', {
      student: createForm.student,
      priority: createForm.priority,
      reason: createForm.reason,
      next_follow_up_date: createForm.next_follow_up_date,
    })
    message.success('创建成功')
    showCreate.value = false
    createForm.student = null
    createForm.priority = 'medium'
    createForm.reason = ''
    createForm.next_follow_up_date = null
    fetchFollowUps()
    fetchStats()
  } catch (e) {
    message.error('创建失败')
  }
}

onMounted(() => {
  fetchStats()
  fetchFollowUps()
  fetchCounselors()
  fetchStudents()
})
</script>

<style scoped>
.followups-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-card :deep(.n-card__content) {
  padding: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  background: #fafafa;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-total .stat-value {
  color: #1890ff;
}

.stat-pending .stat-value {
  color: #faad14;
}

.stat-progress .stat-value {
  color: #1890ff;
}

.stat-urgent .stat-value {
  color: #f5222d;
}

.stat-renewed .stat-value {
  color: #52c41a;
}

.stat-overdue .stat-value {
  color: #fa541c;
}

.filter-card :deep(.n-card__content) {
  padding: 16px 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
